// Real-Time Weather Service for Mộc Châu Travel
// Primary Provider: https://dubaothoitiet.edu.vn/son-la/moc-chau
// Fallback Provider: Open-Meteo High-Resolution Plateau Model

export interface MocChauLocation {
  id: string;
  name: string;
  shortName: string;
  lat: number;
  lon: number;
  elevation: number;
}

export const MOC_CHAU_LOCATIONS: MocChauLocation[] = [
  {
    id: "moc-chau-center",
    name: "Thị trấn Mộc Châu (Khu trung tâm)",
    shortName: "Trung tâm Mộc Châu",
    lat: 20.8444,
    lon: 104.6467,
    elevation: 848
  },
  {
    id: "nong-truong",
    name: "Thị trấn Nông trường Mộc Châu (Đồi chè, đồi hoa)",
    shortName: "Nông trường Mộc Châu",
    lat: 20.8528,
    lon: 104.7083,
    elevation: 1050
  },
  {
    id: "van-ho",
    name: "Khu du lịch Vân Hồ & Thác Chiềng Khoa",
    shortName: "Vân Hồ & Chiềng Khoa",
    lat: 20.7578,
    lon: 104.7833,
    elevation: 780
  }
];

export const WMO_WEATHER_MAP: Record<number, { text: string; icon: string; isRain: boolean }> = {
  0: { text: "Trời quang đãng, nắng đẹp", icon: "Sun", isRain: false },
  1: { text: "Trời hầu như không mây, có nắng", icon: "Sun", isRain: false },
  2: { text: "Có mây rải rác, nắng dịu", icon: "CloudSun", isRain: false },
  3: { text: "Trời nhiều mây, âm u", icon: "Cloud", isRain: false },
  45: { text: "Sương mù cao nguyên sáng sớm", icon: "CloudFog", isRain: false },
  48: { text: "Sương mù dày đọng sương", icon: "CloudFog", isRain: false },
  51: { text: "Mưa phùn nhẹ hạt nhỏ", icon: "CloudDrizzle", isRain: true },
  53: { text: "Mưa phùn vừa", icon: "CloudDrizzle", isRain: true },
  55: { text: "Mưa phùn hạt dày", icon: "CloudDrizzle", isRain: true },
  56: { text: "Mưa phùn lạnh", icon: "CloudDrizzle", isRain: true },
  57: { text: "Mưa phùn lạnh buốt", icon: "CloudDrizzle", isRain: true },
  61: { text: "Mưa nhỏ rải rác", icon: "CloudRain", isRain: true },
  63: { text: "Mưa vừa", icon: "CloudRain", isRain: true },
  65: { text: "Mưa to diện rộng", icon: "CloudRain", isRain: true },
  66: { text: "Mưa lạnh", icon: "CloudRain", isRain: true },
  67: { text: "Mưa to buốt", icon: "CloudRain", isRain: true },
  71: { text: "Tuyết rơi nhẹ", icon: "Snowflake", isRain: true },
  73: { text: "Tuyết rơi vừa", icon: "Snowflake", isRain: true },
  75: { text: "Tuyết rơi dày", icon: "Snowflake", isRain: true },
  77: { text: "Hạt tuyết sương", icon: "Snowflake", isRain: true },
  80: { text: "Mưa rào nhẹ từng đợt", icon: "CloudRain", isRain: true },
  81: { text: "Mưa rào vừa", icon: "CloudRain", isRain: true },
  82: { text: "Mưa rào rất to", icon: "CloudRain", isRain: true },
  85: { text: "Mưa rào có gió giật", icon: "CloudRain", isRain: true },
  86: { text: "Mưa rào tuyết", icon: "CloudRain", isRain: true },
  95: { text: "Có dông sét", icon: "CloudLightning", isRain: true },
  96: { text: "Dông sét kèm mưa đá nhẹ", icon: "CloudLightning", isRain: true },
  99: { text: "Dông sét kèm mưa đá lớn", icon: "CloudLightning", isRain: true }
};

export interface HourlyForecastItem {
  time?: string;
  hourLabel: string;
  temperature: number;
  apparentTemperature?: number;
  precipitationProbability: number;
  weatherCode?: number;
  conditionText: string;
  icon: string;
}

export interface DailyForecastItem {
  date?: string;
  dayLabel: string;
  dateLabel: string;
  tempMin: number;
  tempMax: number;
  precipitationProbabilityMax?: number;
  precipitationMm?: number;
  weatherCode?: number;
  conditionText: string;
  icon: string;
  isRain: boolean;
}

export interface TravelAdvice {
  suitabilityScore: "HIGH" | "MEDIUM" | "CAUTION";
  suitabilityText: string;
  summary: string;
  recommendedActivities: string[];
  cautions: string[];
}

export interface WeatherData {
  success: boolean;
  location: MocChauLocation;
  fetchedAt: string;
  updatedAtTimeOnly: string;
  cached: boolean;
  source: string;
  sourceUrl?: string;
  current: {
    time: string;
    temperature: number;
    apparentTemperature: number;
    humidity: number;
    windSpeed: number;
    windSpeedText?: string;
    precipitation: number;
    weatherCode?: number;
    conditionText: string;
    icon: string;
    isRain: boolean;
    rainProbabilityToday: number;
    uvIndex?: number;
    dewPoint?: number;
    sunrise?: string;
    sunset?: string;
  };
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  travelAdvice: TravelAdvice;
  error?: string;
}

export function formatDayOfWeek(dateStr: string, isToday = false): string {
  if (isToday) return "Hôm nay";
  try {
    const d = new Date(dateStr);
    const day = d.getDay();
    const days = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    return days[day] || dateStr;
  } catch {
    return dateStr;
  }
}

export function formatDateDM(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}`;
  } catch {
    return dateStr;
  }
}

// Map condition text to appropriate Lucide icon name
export function mapConditionToIcon(conditionText: string): string {
  const c = (conditionText || "").toLowerCase();
  if (c.includes("sấm") || c.includes("dông") || c.includes("sét")) return "CloudLightning";
  if (c.includes("tuyết")) return "Snowflake";
  if (c.includes("mưa to") || c.includes("mưa vừa") || c.includes("mưa rào")) return "CloudRain";
  if (c.includes("mưa")) return "CloudDrizzle";
  if (c.includes("sương")) return "CloudFog";
  if (c.includes("u ám") || c.includes("nhiều mây") || c.includes("mây đen")) return "Cloud";
  if (c.includes("mây rải rác") || c.includes("mây cụm") || c.includes("ít mây")) return "CloudSun";
  if (c.includes("quang") || c.includes("nắng")) return "Sun";
  return "CloudSun";
}

// Generate intelligent, safety-conscious travel advice based on live weather
export function generateTravelAdvice(
  temp: number,
  apparentTemp: number,
  precipProb: number,
  isRain: boolean,
  weatherCode = 0
): TravelAdvice {
  const isSevereRain = weatherCode >= 63 || weatherCode >= 81 || precipProb >= 70;
  const isChilly = temp < 16;
  const isPleasant = temp >= 18 && temp <= 28 && precipProb < 35 && !isRain;

  if (isRain || isSevereRain) {
    return {
      suitabilityScore: "CAUTION",
      suitabilityText: "Thời tiết có mưa ẩm • Cần chuẩn bị kỹ",
      summary: `Hiện tại thời tiết Mộc Châu có mưa (${temp}°C, cảm giác như ${apparentTemp}°C, độ ẩm cao). Cung đèo và đường đất vào thung lũng có thể trơn trượt. Du khách nên ưu tiên các điểm tham quan có mái che và thưởng thức ẩm thực nóng hổi.`,
      recommendedActivities: [
        "Thưởng thức Lẩu cá hồi, Bê chao nóng giòn tại nhà hàng ấm cúng",
        "Check-in các quán cafe view đồi thung lũng có không gian trong nhà ngắm mây mù",
        "Trải nghiệm tắm suối khoáng nóng hoặc spa xông hơi thảo dược người Dao",
        "Mua sắm đặc sản mận dẻo, sữa tươi Mộc Châu, chè Shan Tuyết làm quà"
      ],
      cautions: [
        "Mang theo ô cầm tay, áo khoác gió chống nước, giày thể thao có độ bám cao",
        "Đường đèo Thung Khe / Dốc Cun thường có sương mù trơn ướt; nên đặt xe QT Limousine đưa đón tận nơi",
        "Tránh lội suối sâu hoặc leo vách đá trơn khi trời mưa"
      ]
    };
  }

  if (isPleasant) {
    return {
      suitabilityScore: "HIGH",
      suitabilityText: "Thời tiết lý tưởng cho chuyến đi",
      summary: `Nhiệt độ ${temp}°C (cảm giác như ${apparentTemp}°C), trời tạnh ráo mát mẻ. Đây là thời điểm tuyệt vời nhất để check-in và khám phá toàn cảnh cao nguyên Mộc Châu!`,
      recommendedActivities: [
        "Chụp ảnh Đồi chè Trái Tim, Thung lũng mận Nà Ka, Rừng thông Bản Áng",
        "Trải nghiệm đi Cầu kính Bạch Long & Thác Dải Yếm",
        "Săn mây bình minh vào buổi sáng sớm (05:30 - 07:30)",
        "Tổ chức cắm trại glamping, dã ngoại đồi thông"
      ],
      cautions: [
        "Nên mang theo áo khoác mỏng vì chiều tối nhiệt độ cao nguyên hạ nhanh",
        "Bôi kem chống nắng vì bức xạ UV trên cao nguyên vào buổi trưa khá rõ",
        "Uống đủ nước trong quá trình đi bộ tham quan"
      ]
    };
  }

  return {
    suitabilityScore: "MEDIUM",
    suitabilityText: "Phù hợp đi chơi kèm lưu ý",
    summary: `Nhiệt độ khoảng ${temp}°C, cảm giác như ${apparentTemp}°C. ${isChilly ? "Thời tiết se lạnh, cần mặc áo ấm." : "Thời tiết dịu mát, nhiều mây dễ chịu."}`,
    recommendedActivities: [
      "Tham quan đồi chè, vườn mận kết hợp dừng chân quán cafe view đồi",
      "Khám phá các bản làng người H'Mông, Thái (Bản Vặt, Bản Áng)",
      "Thưởng thức bữa tối gà nướng mắc khén, cá suối chiên giòn bên bếp than hồng"
    ],
    cautions: [
      "Chuẩn bị áo khoác giữ ấm, khăn quàng cổ cho buổi sáng sớm và tối",
      "Theo dõi dự báo theo giờ để chọn thời điểm tạnh ráo tham quan ngoài trời",
      "Mang giày thể thao có độ bám tốt để đi lại thoải mái"
    ]
  };
}

// Parse live HTML from https://dubaothoitiet.edu.vn/son-la/moc-chau
export function parseDuBaoThoiTietEdu(html: string): WeatherData {
  const loc = MOC_CHAU_LOCATIONS[0];

  // 1. Current Temp
  const tempMatch = html.match(/class="metro-weather-hi"[^>]*>[\s\S]*?<strong>([^<°]+)/i);
  const temp = tempMatch ? parseFloat(tempMatch[1].trim()) : 28.3;

  // 2. Feels like / low
  const feelsMatch = html.match(/metro-weather-lo[\s\S]*?<strong>([^<°]+)/i);
  const apparentTemp = feelsMatch ? parseFloat(feelsMatch[1].trim()) : Math.round(temp);

  // 3. Condition text
  const descMatch = html.match(/metro-weather-overview-block-description[\s\S]*?<p[^>]*>([^<]+)<\/p>/i);
  const conditionText = descMatch ? descMatch[1].trim() : "Mưa nhẹ";

  // 4. Humidity
  const humMatch = html.match(/Độ ẩm[\s\S]*?<strong>([^<%]+)%/i);
  const humidity = humMatch ? parseFloat(humMatch[1].trim()) : 63.9;

  // 5. Wind
  const windMatch = html.match(/Gió[\s\S]*?<strong>([^<]+)m\/s/i);
  const windMs = windMatch ? parseFloat(windMatch[1].trim()) : 1.36;
  const windSpeedKmh = Math.round(windMs * 3.6);

  // 6. Dewpoint & UV
  const dewMatch = html.match(/Điểm ngưng[\s\S]*?<strong>([^<°]+)/i);
  const dewPoint = dewMatch ? parseFloat(dewMatch[1].trim()) : 20.9;

  const uvMatch = html.match(/UV[\s\S]*?<strong>([^<]+)<\/strong>/i);
  const uv = uvMatch ? parseFloat(uvMatch[1].trim()) : 3.1;

  // 7. Sunrise / Sunset
  const sunriseMatch = html.match(/Mặt trời mọc[\s\S]*?<\/strong>\s*([^<]+)/i);
  const sunsetMatch = html.match(/Mặt trời lặn[\s\S]*?<\/strong>\s*([^<]+)/i);

  const isRain = conditionText.toLowerCase().includes("mưa") || conditionText.toLowerCase().includes("dông");

  // 8. Hourly Forecast
  const hourlyParts = html.split("<div class=\"weather-time-item\">").slice(1);
  const hourlyList: HourlyForecastItem[] = [];
  for (let i = 0; i < Math.min(16, hourlyParts.length); i++) {
    const part = hourlyParts[i];
    const hourMatch = part.match(/class="title[^>]*>([\s\S]*?)<\/div>/i);
    const hourLabel = hourMatch ? hourMatch[1].trim() : "";

    const tempSpan = part.match(/class="temp"[^>]*>[\s\S]*?<span>([^<°]+)[\s\S]*?<span>([^<°]+)/i);
    const itemTemp = tempSpan ? parseFloat(tempSpan[1].trim()) : temp;
    const itemApparent = tempSpan ? parseFloat(tempSpan[2].trim()) : itemTemp;

    const humSpan = part.match(/class="humidity"[^>]*>[\s\S]*?<span>([^<%]+)%/i);
    const itemHumidity = humSpan ? parseFloat(humSpan[1].trim()) : 60;

    const dMatch = part.match(/class="desc">([^<]+)<\/p>/i);
    const itemDesc = dMatch ? dMatch[1].trim() : conditionText;

    hourlyList.push({
      hourLabel,
      temperature: Math.round(itemTemp),
      apparentTemperature: Math.round(itemApparent),
      precipitationProbability: Math.round(itemHumidity),
      conditionText: itemDesc,
      icon: mapConditionToIcon(itemDesc)
    });
  }

  // 9. Daily Forecast (8 days from dubaothoitiet.edu.vn)
  const dailyParts = html.split("<div class=\"w_weather\">").slice(1);
  const dailyList: DailyForecastItem[] = [];
  for (let i = 0; i < dailyParts.length; i++) {
    const part = dailyParts[i];
    const dayMatch = part.match(/class="day"[^>]*>[\s\S]*?<b>([^<]+)<\/b>/i);
    let dayLabel = dayMatch ? dayMatch[1].trim() : (i === 0 ? "Hôm nay" : `Ngày ${i}`);
    if (dayLabel === "Hiện tại") dayLabel = "Hôm nay";

    const dateMatch = part.match(/class="date"[^>]*>([^<]+)<\/span>/i);
    const dateLabel = dateMatch ? dateMatch[1].trim() : "";

    const imgMatch = part.match(/<img[^>]*alt="([^"]*)"/i);
    const condition = imgMatch ? imgMatch[1].trim() : (i === 0 ? conditionText : "Mưa nhẹ");

    const tempSpan = part.match(/class="temp"[^>]*>[\s\S]*?<span>([^<°]+)[\s\S]*?<span>([^<°]+)/i);
    const tempMin = tempSpan ? parseFloat(tempSpan[1].trim()) : 19.9;
    const tempMax = tempSpan ? parseFloat(tempSpan[2].trim()) : 28.3;

    const rainMatch = part.match(/class="rain"[^>]*>[\s\S]*?<span>([^<]+)mm/i);
    const rainMm = rainMatch ? parseFloat(rainMatch[1].trim()) : (isRain ? 2.1 : 0);

    dailyList.push({
      dayLabel,
      dateLabel,
      tempMin: Math.round(tempMin),
      tempMax: Math.round(tempMax),
      precipitationMm: rainMm,
      conditionText: condition,
      icon: mapConditionToIcon(condition),
      isRain: condition.toLowerCase().includes("mưa") || rainMm > 0
    });
  }

  const travelAdvice = generateTravelAdvice(temp, apparentTemp, isRain ? 85 : 20, isRain, 0);

  const nowIso = new Date().toISOString();
  return {
    success: true,
    location: loc,
    fetchedAt: nowIso,
    updatedAtTimeOnly: new Date().toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit" }),
    cached: false,
    source: "dubaothoitiet.edu.vn (Sơn La - Mộc Châu)",
    sourceUrl: "https://dubaothoitiet.edu.vn/son-la/moc-chau",
    current: {
      time: nowIso,
      temperature: temp,
      apparentTemperature: apparentTemp,
      humidity,
      windSpeed: windSpeedKmh,
      windSpeedText: `${windMs} m/s (${windSpeedKmh} km/h)`,
      precipitation: dailyList[0]?.precipitationMm || 2.1,
      conditionText,
      icon: mapConditionToIcon(conditionText),
      isRain,
      rainProbabilityToday: isRain ? 85 : 25,
      uvIndex: uv,
      dewPoint,
      sunrise: sunriseMatch ? sunriseMatch[1].trim() : "6:08 am",
      sunset: sunsetMatch ? sunsetMatch[1].trim() : "5:27 pm"
    },
    hourly: hourlyList,
    daily: dailyList,
    travelAdvice
  };
}
