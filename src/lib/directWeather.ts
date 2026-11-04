import {
  MOC_CHAU_LOCATIONS, WMO_WEATHER_MAP, generateTravelAdvice,
  formatDayOfWeek, formatDateDM, type WeatherData, type MocChauLocation
} from './weatherService';

/**
 * Fetch real model-based weather directly in the browser. This bypasses
 * deployment-specific Vercel /api/weather errors and requires no API key.
 * Never substitute made-up measurements for missing upstream readings.
 */
const MEMORY_CACHE = new Map<string, {expiresAt:number, value:WeatherData}>();
const directSourceUrl = 'https://open-meteo.com/en/docs';

const requiredNumber = (value: unknown, name:string): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error('Nguồn khí tượng chưa trả đủ dữ liệu: ' + name);
  }
  return value;
};
const maybeNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

async function directOpenMeteo(loc:MocChauLocation):Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(loc.lat),
    longitude: String(loc.lon),
    timezone: 'Asia/Ho_Chi_Minh',
    forecast_days: '7',
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,dew_point_2m',
    hourly: 'temperature_2m,precipitation_probability,weather_code,uv_index',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,sunrise,sunset,uv_index_max'
  });
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(), 12000);
  let result: any;
  try {
    const response = await fetch('https://api.open-meteo.com/v1/forecast?' + params.toString(), {
      signal: controller.signal, cache: 'no-store'
    });
    if(!response.ok)throw new Error('Open-Meteo HTTP ' + response.status);
    result = await response.json();
  } finally {
    clearTimeout(timer);
  }

  const current = result?.current;
  const daily = result?.daily;
  const hourly = result?.hourly;
  if(!current || !Array.isArray(daily?.time) || !daily.time.length ||
     !Array.isArray(hourly?.time) || !hourly.time.length) {
    throw new Error('Nguồn khí tượng không trả đủ dữ liệu hiện tại và dự báo.');
  }

  const rawTemp = requiredNumber(current.temperature_2m, 'nhiệt độ');
  const apparent = requiredNumber(current.apparent_temperature, 'cảm giác nhiệt');
  const humidity = requiredNumber(current.relative_humidity_2m, 'độ ẩm');
  const windSpeed = requiredNumber(current.wind_speed_10m, 'tốc độ gió');
  const rain = requiredNumber(current.precipitation, 'lượng mưa');
  const code = requiredNumber(current.weather_code, 'trạng thái trời');
  if(rawTemp < -70 || rawTemp > 65 || humidity < 0 || humidity > 100 || rain < 0 || windSpeed < 0) {
    throw new Error('Dữ liệu thời tiết nhận được không hợp lệ.');
  }
  const wmo = WMO_WEATHER_MAP[code] || {text:'Mã thời tiết chưa xác định',icon:'Cloud',isRain:false};
  const hourlyTimes: string[] = hourly.time;
  const currentHour = String(current.time || '').slice(0,13);
  let start = hourlyTimes.findIndex(t=>t.slice(0,13)>=currentHour);
  if(start<0)start=0;
  const hourlyForecast = hourlyTimes.slice(start,start+12).flatMap((time,i)=>{
    const index = start+i;
    const temp = maybeNumber(hourly.temperature_2m?.[index]);
    const chance = maybeNumber(hourly.precipitation_probability?.[index]);
    if(temp===undefined || chance===undefined)return [];
    const weatherCode = maybeNumber(hourly.weather_code?.[index]);
    const condition = weatherCode===undefined ? undefined : WMO_WEATHER_MAP[weatherCode];
    return [{
      time, hourLabel:time.slice(11,16), temperature:Math.round(temp),
      precipitationProbability:Math.round(chance),
      weatherCode, conditionText:condition?.text||'Chưa xác định',
      icon:condition?.icon||'Cloud'
    }];
  });

  const dailyForecast = daily.time.slice(0,7).flatMap((date:string,i:number)=>{
    const low = maybeNumber(daily.temperature_2m_min?.[i]);
    const high = maybeNumber(daily.temperature_2m_max?.[i]);
    if(low===undefined || high===undefined)return [];
    const weatherCode = maybeNumber(daily.weather_code?.[i]);
    const condition = weatherCode===undefined ? undefined : WMO_WEATHER_MAP[weatherCode];
    const chance = maybeNumber(daily.precipitation_probability_max?.[i]);
    return [{
      date, dayLabel:formatDayOfWeek(date,i===0), dateLabel:formatDateDM(date),
      tempMin:Math.round(low),tempMax:Math.round(high),
      ...(chance!==undefined?{precipitationProbabilityMax:Math.round(chance)}:{}),
      weatherCode, conditionText:condition?.text||'Chưa xác định',
      icon:condition?.icon||'Cloud',isRain:condition?.isRain||false
    }];
  });
  if(!dailyForecast.length || !hourlyForecast.length) {
    throw new Error('Nguồn khí tượng chưa trả đủ dự báo theo giờ/ngày.');
  }

  const rainProbability = maybeNumber(daily.precipitation_probability_max?.[0]);
  const hourUV = maybeNumber(hourly.uv_index?.[start]);
  const dewPoint = maybeNumber(current.dew_point_2m);
  const localTime = new Date().toLocaleTimeString('vi-VN',{
    timeZone:'Asia/Ho_Chi_Minh',hour:'2-digit',minute:'2-digit'
  });
  const resultWeather:WeatherData = {
    success:true,location:loc,fetchedAt:new Date().toISOString(),
    updatedAtTimeOnly:localTime,cached:false,
    source:'Open-Meteo • dự báo mô hình cho ' + loc.shortName,
    sourceUrl:directSourceUrl,
    current:{
      time:String(current.time||new Date().toISOString()),
      temperature:Math.round(rawTemp),apparentTemperature:Math.round(apparent),
      humidity:Math.round(humidity),windSpeed:Math.round(windSpeed),
      precipitation:rain,weatherCode:code,conditionText:wmo.text,
      icon:wmo.icon,isRain:wmo.isRain,
      rainProbabilityToday:rainProbability===undefined ? 0 : Math.round(rainProbability),
      ...(hourUV===undefined?{}:{uvIndex:hourUV}),
      ...(dewPoint===undefined?{}:{dewPoint:Math.round(dewPoint)}),
      ...(typeof daily.sunrise?.[0]==='string'?{sunrise:daily.sunrise[0].slice(11,16)}:{}),
      ...(typeof daily.sunset?.[0]==='string'?{sunset:daily.sunset[0].slice(11,16)}:{})
    },
    hourly:hourlyForecast,daily:dailyForecast,
    travelAdvice:generateTravelAdvice(Math.round(rawTemp),Math.round(apparent),
      rainProbability===undefined?0:rainProbability,wmo.isRain,code)
  };
  return resultWeather;
}

export async function fetchActualMocChauWeather(locationId:string, force=false):Promise<WeatherData> {
  const loc=MOC_CHAU_LOCATIONS.find(l=>l.id===locationId)||MOC_CHAU_LOCATIONS[0];
  const cached=MEMORY_CACHE.get(loc.id);
  if(!force && cached && Date.now()<cached.expiresAt)
    return {...cached.value,cached:true};

  // Direct browser API first. /api/weather is kept as secondary fallback
  // for browsers where an external weather API is unavailable.
  let primaryError = '';
  try {
    const live=await directOpenMeteo(loc);
    MEMORY_CACHE.set(loc.id,{value:live,expiresAt:Date.now()+10*60*1000});
    return live;
  } catch(e:any) {
    primaryError = e?.message || 'Không kết nối được nguồn khí tượng trực tiếp';
    console.warn('[Weather] Direct weather source unavailable:', primaryError);
  }

  try {
    const controller = new AbortController();
    const timeout=setTimeout(()=>controller.abort(),9000);
    let response:Response;
    try {
      response=await fetch('/api/weather?location='+encodeURIComponent(loc.id),{
        signal:controller.signal,cache:'no-store'
      });
    } finally {
      clearTimeout(timeout);
    }
    if(!response.ok)throw new Error('API HTTP '+response.status);
    const data:WeatherData=await response.json();
    if(!data?.success ||
       !Number.isFinite(data.current?.temperature) ||
       !Number.isFinite(data.current?.humidity) ||
       !Array.isArray(data.daily)) {
      throw new Error('API không trả dữ liệu thời tiết hợp lệ');
    }
    MEMORY_CACHE.set(loc.id,{value:data,expiresAt:Date.now()+10*60*1000});
    return data;
  } catch(e:any){
    throw new Error('Không lấy được dữ liệu thời tiết từ Open-Meteo hoặc máy chủ. '+
      'Vui lòng thử lại khi kết nối ổn định.');
  }
}
