import React, { useState, useEffect } from "react";
import { Cloud, Droplets, Wind, Thermometer, RefreshCw, CheckCircle2, AlertTriangle, ExternalLink, ShieldCheck, Sun, Compass } from "lucide-react";

export default function LiveWeatherManagement() {
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCheckTime, setLastCheckTime] = useState<string>("");
  const [roadWarning, setRoadWarning] = useState<string>(() => {
    return localStorage.getItem("mocchau_operator_weather_road_warning") || "Cung đèo Dốc Cun & Thung Khe có sương mù ẩm nhẹ sáng sớm, các bác tài chú ý bật đèn sương và giữ khoảng cách an toàn.";
  });
  const [isSavingWarning, setIsSavingWarning] = useState(false);

  const fetchLiveWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/weather?location=moc-chau-center");
      if (!res.ok) throw new Error(`Máy chủ trả về mã: ${res.status}`);
      const data = await res.json();
      setWeatherData(data);
      setLastCheckTime(new Date().toLocaleTimeString("vi-VN"));
    } catch (e: any) {
      setError(e.message || "Không kết nối được nguồn dự báo Open-Meteo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveWeather();
  }, []);

  const handleSaveWarning = () => {
    setIsSavingWarning(true);
    try {
      localStorage.setItem("mocchau_operator_weather_road_warning", roadWarning);
    } catch {}
    setTimeout(() => setIsSavingWarning(false), 500);
  };

  const current = weatherData?.current;

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-950 via-[#1b4332] to-emerald-950 p-6 rounded-3xl text-white shadow-xl border border-emerald-900/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Nguồn dự báo mô hình: Open-Meteo</span>
          </div>
          <h3 className="text-xl font-black mt-2">Giám Sát Dự Báo Thời Tiết Mộc Châu</h3>
          <p className="text-xs text-stone-300 font-sans mt-0.5">
            Các chỉ số được lấy từ mô hình dự báo Open-Meteo tại tọa độ trung tâm Mộc Châu. Đây không phải quan trắc thực địa; nhiệt độ có thể chênh lệch so với các trang dự báo khác.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLiveWeather}
            disabled={loading}
            className="px-4 py-2 bg-white text-stone-900 rounded-xl text-xs font-bold hover:bg-stone-100 transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-700" : ""}`} />
            <span>{loading ? "Đang cập nhật..." : "Lấy dự báo mới"}</span>
          </button>

          <a
            href="https://dubaothoitiet.edu.vn/son-la/moc-chau"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
            title="Mở trang dự báo khác để đối chiếu"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {weatherData?.success && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-950 leading-relaxed">
          <strong>Thời điểm số liệu mô hình:</strong> {typeof weatherData.current?.time==='string' ? weatherData.current.time.replace('T',' ') : 'Chưa rõ'} (UTC+7).
          {" "}Truy xuất lúc {lastCheckTime||'—'}. Tọa độ và độ cao có thể làm dự báo chênh lệch so với nguồn đối chiếu.
          <a className="underline ml-2 font-bold" href="https://open-meteo.com/en/docs" target="_blank" rel="noopener noreferrer">Tài liệu Open-Meteo</a>
        </div>
      )}
      {/* Live metric cards */}
      {current && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs text-center">
            <Thermometer className="w-4 h-4 text-emerald-700 mx-auto mb-1" />
            <span className="text-[10px] text-stone-400 font-bold uppercase block">Nhiệt độ mô hình</span>
            <span className="text-2xl font-black text-stone-900 font-mono mt-1 block">{current.temperature}°C</span>
            <span className="text-[10px] text-stone-500 font-sans">Cảm giác: {current.apparentTemperature}°C</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs text-center">
            <Droplets className="w-4 h-4 text-cyan-600 mx-auto mb-1" />
            <span className="text-[10px] text-stone-400 font-bold uppercase block">Độ ẩm</span>
            <span className="text-2xl font-black text-stone-900 font-mono mt-1 block">{current.humidity}%</span>
            <span className="text-[10px] text-stone-500 font-sans">Điểm sương: {typeof current.dewPoint === 'number' ? `${current.dewPoint}°C` : 'Chưa có dữ liệu'}</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs text-center">
            <Wind className="w-4 h-4 text-teal-600 mx-auto mb-1" />
            <span className="text-[10px] text-stone-400 font-bold uppercase block">Tốc độ gió</span>
            <span className="text-xl font-black text-stone-900 font-mono mt-1 block">{current.windSpeedText || `${current.windSpeed} km/h`}</span>
            <span className="text-[10px] text-stone-500 font-sans">Gió ước tính từ mô hình</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs text-center">
            <Cloud className="w-4 h-4 text-amber-600 mx-auto mb-1" />
            <span className="text-[10px] text-stone-400 font-bold uppercase block">Lượng mưa mô hình</span>
            <span className="text-2xl font-black text-amber-700 font-mono mt-1 block">{current.precipitation} mm</span>
            <span className="text-[10px] text-stone-500 font-sans">Trạng thái: {current.conditionText}</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs text-center">
            <Sun className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <span className="text-[10px] text-stone-400 font-bold uppercase block">Chỉ số UV</span>
            <span className="text-2xl font-black text-stone-900 font-mono mt-1 block">{current.uvIndex ?? '—'}</span>
            <span className="text-[10px] text-stone-500 font-sans">Chỉ số từ mô hình</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs text-center">
            <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
            <span className="text-[10px] text-stone-400 font-bold uppercase block">Giờ đồng bộ</span>
            <span className="text-lg font-black text-emerald-800 font-mono mt-1 block">{lastCheckTime || "--:--"}</span>
            <span className="text-[10px] text-emerald-600 font-sans font-bold">● Kết nối nguồn mô hình</span>
          </div>
        </div>
      )}

      {/* Emergency Road Weather Warning Broadcast for Drivers and Passengers */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <h4 className="font-black text-stone-900 text-sm">
            Thông Báo Thời Tiết & Cảnh Báo An Toàn Cung Đường Đèo
          </h4>
        </div>
        <p className="text-xs text-stone-500 font-sans">
          Nội dung cảnh báo này sẽ hiển thị trực tiếp cho tài xế QT Limousine và khách hàng trên website khi có sương mù dày đặc hoặc mưa trơn trượt trên đèo Thung Khe / Dốc Cun.
        </p>

        <textarea
          rows={3}
          value={roadWarning}
          onChange={e => setRoadWarning(e.target.value)}
          placeholder="Nhập thông tin cảnh báo đường đèo..."
          className="w-full px-4 py-3 bg-amber-50/50 border border-amber-200 rounded-2xl text-xs font-medium text-stone-800 focus:outline-none focus:border-amber-400"
        />

        <div className="flex justify-end">
          <button
            onClick={handleSaveWarning}
            disabled={isSavingWarning}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isSavingWarning ? "Đang lưu cảnh báo..." : "Cập Nhật Cảnh Báo An Toàn"}
          </button>
        </div>
      </div>
    </div>
  );
}
