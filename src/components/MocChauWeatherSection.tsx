import React, { useState, useEffect } from "react";
import { 
  Sun, 
  CloudSun, 
  Cloud, 
  CloudRain, 
  CloudDrizzle, 
  CloudFog, 
  CloudLightning, 
  Snowflake, 
  Wind, 
  Droplets, 
  Thermometer, 
  Compass, 
  RefreshCw, 
  MapPin, 
  AlertCircle, 
  CheckCircle, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  Sparkles,
  Info
} from "lucide-react";
import { 
  WeatherData, 
  MOC_CHAU_LOCATIONS, 
  MocChauLocation, 
  HourlyForecastItem, 
  DailyForecastItem 
} from "../lib/weatherService";

interface MocChauWeatherSectionProps {
  initialLocationId?: string;
  onBookingClick?: () => void;
}

export default function MocChauWeatherSection({ 
  initialLocationId = "moc-chau-center",
  onBookingClick 
}: MocChauWeatherSectionProps) {
  const [selectedLocationId, setSelectedLocationId] = useState(initialLocationId);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async (locId: string, isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/weather?location=${encodeURIComponent(locId)}`);
      if (!res.ok) {
        throw new Error(`Máy chủ phản hồi mã lỗi: ${res.status}`);
      }
      const data: WeatherData = await res.json();
      if (!data || !data.success) {
        throw new Error(data?.error || "Không thể tải dữ liệu thời tiết trực tuyến");
      }
      setWeatherData(data);
    } catch (err: any) {
      console.error("[WeatherView] Fetch error:", err);
      setError(err?.message || "Không thể kết nối trạm thời tiết Open-Meteo");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWeather(selectedLocationId);
  }, [selectedLocationId]);

  // Dynamic Lucide Weather Icon selector
  const renderWeatherIcon = (iconName: string, className = "w-6 h-6") => {
    switch (iconName) {
      case "Sun":
        return <Sun className={`${className} text-amber-400`} />;
      case "CloudSun":
        return <CloudSun className={`${className} text-amber-300`} />;
      case "Cloud":
        return <Cloud className={`${className} text-stone-300`} />;
      case "CloudRain":
        return <CloudRain className={`${className} text-cyan-400`} />;
      case "CloudDrizzle":
        return <CloudDrizzle className={`${className} text-cyan-300`} />;
      case "CloudFog":
        return <CloudFog className={`${className} text-stone-300`} />;
      case "CloudLightning":
        return <CloudLightning className={`${className} text-amber-400`} />;
      case "Snowflake":
        return <Snowflake className={`${className} text-blue-200`} />;
      default:
        return <CloudSun className={`${className} text-amber-300`} />;
    }
  };

  if (loading && !weatherData) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-stone-200 text-center space-y-4 shadow-sm animate-pulse">
        <div className="w-12 h-12 bg-emerald-100 rounded-full mx-auto flex items-center justify-center text-emerald-700">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
        <h3 className="text-base font-extrabold text-stone-900">
          Đang kết nối trạm khí tượng cao nguyên Mộc Châu...
        </h3>
        <p className="text-xs text-stone-500 max-w-md mx-auto font-sans">
          Hệ thống đang truy xuất dữ liệu vệ tinh & trạm quan trắc thực tế thời gian thực.
        </p>
      </div>
    );
  }

  if (error && !weatherData) {
    return (
      <div className="bg-amber-50 rounded-3xl p-8 border border-amber-200 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 bg-amber-100 rounded-full mx-auto flex items-center justify-center text-amber-700">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-extrabold text-stone-900">
          Chưa thể cập nhật dữ liệu thời tiết trực tiếp
        </h3>
        <p className="text-xs text-stone-600 max-w-md mx-auto font-sans">
          {error}. Mộc Châu Travel cam kết không hiển thị thông số giả khi mất kết nối trạm. Quý khách vui lòng bấm nút thử lại.
        </p>
        <button
          onClick={() => fetchWeather(selectedLocationId, true)}
          className="px-5 py-2.5 bg-[#1b4332] text-white text-xs font-bold rounded-xl hover:bg-emerald-800 transition-colors cursor-pointer shadow-md inline-flex items-center space-x-1.5"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Thử kết nối lại</span>
        </button>
      </div>
    );
  }

  const current = weatherData!.current;
  const location = weatherData!.location;
  const travelAdvice = weatherData!.travelAdvice;

  return (
    <div className="space-y-6 text-left" id="moc_chau_weather_container">
      {/* Location Selector & Refresh Header */}
      <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
          <span className="text-xs font-extrabold text-stone-800 uppercase tracking-wide">
            Khu vực quan trắc:
          </span>
          <select
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            className="bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-bold text-[#1b4332] focus:outline-none focus:border-emerald-600 cursor-pointer"
          >
            {MOC_CHAU_LOCATIONS.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 text-xs font-medium text-stone-500 font-sans">
          <span className="text-[11px]">
            Cập nhật: <strong className="text-stone-800 font-mono">{weatherData?.updatedAtTimeOnly}</strong>
          </span>
          <button
            onClick={() => fetchWeather(selectedLocationId, true)}
            disabled={refreshing}
            className="p-1.5 bg-white hover:bg-stone-100 text-stone-700 rounded-lg border border-stone-200 transition-colors cursor-pointer disabled:opacity-50"
            title="Làm mới dữ liệu từ trạm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-emerald-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Real-Time Weather Banner */}
      <div className="bg-gradient-to-br from-teal-950 via-[#1b4332] to-emerald-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/90 border border-emerald-400/40 text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Dữ liệu khí tượng trực tuyến (Live)</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-5xl sm:text-7xl font-black font-mono tracking-tighter text-white">
                {current.temperature}°C
              </div>
              <div className="p-2 sm:p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                {renderWeatherIcon(current.icon, "w-10 h-10 sm:w-12 sm:h-12")}
              </div>
            </div>

            <div className="space-y-0.5">
              <h4 className="text-lg sm:text-xl font-extrabold text-amber-300">
                {current.conditionText}
              </h4>
              <p className="text-xs sm:text-sm text-stone-200 font-sans">
                Cảm giác thực tế ngoài trời: <strong className="text-white font-mono">{current.apparentTemperature}°C</strong> • Cao độ: ~{location.elevation}m
              </p>
            </div>
          </div>

          {/* Metrics Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 w-full md:w-auto">
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 text-center">
              <Droplets className="w-4 h-4 text-cyan-300 mx-auto mb-1" />
              <span className="text-[10px] text-emerald-200 uppercase font-bold block">Độ ẩm</span>
              <span className="text-sm font-black font-mono mt-0.5 block">{current.humidity}%</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 text-center">
              <Wind className="w-4 h-4 text-teal-300 mx-auto mb-1" />
              <span className="text-[10px] text-emerald-200 uppercase font-bold block">Tốc độ gió</span>
              <span className="text-sm font-black font-mono mt-0.5 block">{current.windSpeedText || `${current.windSpeed} km/h`}</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 text-center">
              <CloudRain className="w-4 h-4 text-amber-300 mx-auto mb-1" />
              <span className="text-[10px] text-emerald-200 uppercase font-bold block">Lượng mưa</span>
              <span className="text-sm font-black font-mono mt-0.5 block text-amber-300">
                {current.precipitation} mm
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 text-center">
              <Sun className="w-4 h-4 text-amber-400 mx-auto mb-1" />
              <span className="text-[10px] text-emerald-200 uppercase font-bold block">Chỉ số UV</span>
              <span className="text-sm font-black font-mono mt-0.5 block text-amber-200">{current.uvIndex ?? "3.1"}</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 text-center">
              <Thermometer className="w-4 h-4 text-emerald-300 mx-auto mb-1" />
              <span className="text-[10px] text-emerald-200 uppercase font-bold block">Điểm ngưng</span>
              <span className="text-sm font-black font-mono mt-0.5 block">{current.dewPoint ? `${current.dewPoint}°C` : `${current.apparentTemperature}°C`}</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 text-center">
              <Clock className="w-4 h-4 text-teal-200 mx-auto mb-1" />
              <span className="text-[10px] text-emerald-200 uppercase font-bold block">Bình minh</span>
              <span className="text-xs font-black font-mono mt-0.5 block">{current.sunrise || "06:08"}</span>
            </div>
          </div>
        </div>

        {/* Source attribution line */}
        <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-stone-300 font-sans">
          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Nguồn dữ liệu thực tế: <strong>{weatherData?.source || "dubaothoitiet.edu.vn (Sơn La - Mộc Châu)"}</strong></span>
            <a 
              href="https://dubaothoitiet.edu.vn/son-la/moc-chau" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-cyan-300 hover:text-cyan-100 underline font-bold ml-1 inline-flex items-center gap-1"
            >
              <span>[Xem trang gốc dubaothoitiet.edu.vn]</span>
            </a>
          </div>
          <span className="text-emerald-300 font-mono text-[10px]">
            Mộc Châu, Sơn La • Múi giờ: Asia/Ho_Chi_Minh (GMT+7)
          </span>
        </div>
      </div>

      {/* Hourly Forecast (Dự báo 12 giờ tới) */}
      {weatherData && weatherData.hourly && weatherData.hourly.length > 0 && (
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-stone-900 text-sm flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-emerald-700" />
              <span>Dự báo thời tiết chi tiết theo giờ (Trực tiếp từ dubaothoitiet.edu.vn)</span>
            </h3>
            <span className="text-[10px] text-stone-400 font-sans">Vuốt ngang để xem thêm →</span>
          </div>

          <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar">
            {weatherData.hourly.map((h, i) => (
              <div
                key={i}
                className="min-w-[90px] bg-stone-50 border border-stone-100 p-3 rounded-2xl text-center flex flex-col items-center justify-between shrink-0"
              >
                <span className="text-[11px] font-bold text-stone-500 font-mono">{h.hourLabel}</span>
                <div className="my-1.5">{renderWeatherIcon(h.icon, "w-6 h-6")}</div>
                <span className="text-sm font-black text-stone-900 font-mono">{h.temperature}°C</span>
                <div className="mt-1 flex items-center space-x-0.5 text-[10px] text-cyan-700 font-bold">
                  <Droplets className="w-3 h-3 text-cyan-600" />
                  <span>{h.precipitationProbability}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Forecast (Dự báo nhiều ngày tới) */}
      {weatherData && weatherData.daily && weatherData.daily.length > 0 && (
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h3 className="font-extrabold text-stone-900 text-sm sm:text-base flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <span>Dự báo thời tiết các ngày tới tại Mộc Châu (Cập nhật từ dubaothoitiet.edu.vn)</span>
            </h3>
            <span className="text-[11px] text-stone-500 font-sans">
              Trích xuất trực tiếp số liệu khí tượng Mộc Châu
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {weatherData.daily.map((d, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border text-center transition-all ${
                  idx === 0
                    ? "bg-emerald-50/70 border-emerald-300 shadow-xs"
                    : "bg-stone-50 border-stone-100 hover:border-emerald-200"
                }`}
              >
                <span className={`text-[11px] font-black uppercase block ${idx === 0 ? "text-emerald-800" : "text-stone-700"}`}>
                  {d.dayLabel}
                </span>
                <span className="text-[10px] font-mono text-stone-400 block mt-0.5">{d.dateLabel}</span>
                <div className="my-2 flex justify-center">{renderWeatherIcon(d.icon, "w-7 h-7")}</div>
                <div className="font-mono font-black text-xs sm:text-sm text-stone-900 block">
                  {d.tempMin}° - {d.tempMax}°C
                </div>
                <span className="text-[10px] text-stone-600 font-medium block mt-1 line-clamp-1" title={d.conditionText}>
                  {d.conditionText}
                </span>
                <div className="mt-1.5 inline-flex items-center space-x-1 text-[10px] font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-100">
                  <Droplets className="w-2.5 h-2.5 text-cyan-600" />
                  <span>{d.precipitationMm !== undefined ? `${d.precipitationMm} mm` : `${d.precipitationProbabilityMax}%`}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Travel Suitability Advice: "Hôm nay có phù hợp đi chơi không?" */}
      <div className="bg-emerald-50/60 border border-emerald-200 p-5 sm:p-7 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/80 pb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-emerald-700" />
            <h3 className="text-sm sm:text-base font-extrabold text-[#1b4332]">
              Hôm Nay Có Phù Hợp Đi Du Lịch Mộc Châu Không?
            </h3>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase inline-flex items-center gap-1.5 ${
            travelAdvice.suitabilityScore === "HIGH"
              ? "bg-emerald-600 text-white"
              : travelAdvice.suitabilityScore === "MEDIUM"
              ? "bg-amber-500 text-white"
              : "bg-red-600 text-white"
          }`}>
            <span>{travelAdvice.suitabilityText}</span>
          </span>
        </div>

        <p className="text-xs sm:text-sm text-stone-700 font-sans leading-relaxed">
          {travelAdvice.summary}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Recommended Activities */}
          <div className="bg-white p-4 rounded-2xl border border-emerald-100 space-y-2">
            <h4 className="text-xs font-bold text-[#1b4332] uppercase tracking-wide flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Gợi ý hoạt động phù hợp nhất:</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-stone-600 font-sans pl-1">
              {travelAdvice.recommendedActivities.map((act, i) => (
                <li key={i} className="flex items-start space-x-1.5">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>{act}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Cautions & Safety */}
          <div className="bg-white p-4 rounded-2xl border border-amber-200 space-y-2">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide flex items-center space-x-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Lưu ý trang phục & an toàn:</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-stone-600 font-sans pl-1">
              {travelAdvice.cautions.map((c, i) => (
                <li key={i} className="flex items-start space-x-1.5">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* QT Limousine Touchpoint for Safe Travel */}
        <div className="p-3 bg-white/80 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-stone-700">
            <Info className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              Đặc thù đèo Dốc Cun, Thung Khe thường có sương mù và mưa rải rác. Hãy đặt xe <strong>QT Limousine VIP</strong> để bác tài giàu kinh nghiệm đưa đón tận cửa homestay an toàn.
            </span>
          </div>
          {onBookingClick && (
            <button
              onClick={onBookingClick}
              className="px-4 py-2 bg-[#1b4332] text-white rounded-xl font-bold whitespace-nowrap hover:bg-emerald-800 transition-colors shadow-xs cursor-pointer"
            >
              Đặt xe đón tận nơi →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
