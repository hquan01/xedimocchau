import express from "express";
import { phoneAuthRouter } from "./src/server/phoneAuthRoutes";
import { growthMetricsRouter } from "./src/server/growthMetricsRoutes";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { 
  MOC_CHAU_LOCATIONS, 
  WMO_WEATHER_MAP, 
  generateTravelAdvice, 
  formatDayOfWeek, 
  formatDateDM,
  type WeatherData,
} from "./src/lib/weatherService";

// Load environment variables
dotenv.config();

// In-memory weather cache (10 minutes TTL)
interface CachedWeatherEntry {
  data: WeatherData;
  expiresAt: number;
}
const weatherCache = new Map<string, CachedWeatherEntry>();

async function getMocChauWeather(locationId = "moc-chau-center"): Promise<WeatherData> {
  const loc = MOC_CHAU_LOCATIONS.find(l => l.id === locationId) || MOC_CHAU_LOCATIONS[0];
  const now = Date.now();
  const cached = weatherCache.get(loc.id);

  if (cached && now < cached.expiresAt) {
    return { ...cached.data, cached: true };
  }

  // Open-Meteo provides real weather-model values without scraping external HTML.
  // The old HTML parser supplied hard-coded temperatures when markup changed,
  // and the HTML fetch could stall serverless requests.
  // High-resolution weather-model data from Open-Meteo
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,cloud_cover,wind_speed_10m&hourly=temperature_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,uv_index_max&timezone=Asia%2FHo_Chi_Minh`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    let data: any;
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": "MocChauTravel/1.0 (info@xedimocchau.com)" }
      });
      if (!response.ok) throw new Error(`Open-Meteo returned HTTP ${response.status}`);
      data = await response.json();
    } finally {
      clearTimeout(timeout);
    }
    const current = data.current || {};
    const daily = data.daily || {};
    const hourly = data.hourly || {};
    if (typeof current.temperature_2m !== "number" || !Number.isFinite(current.temperature_2m)
      || typeof current.apparent_temperature !== "number"
      || typeof current.relative_humidity_2m !== "number"
      || typeof current.wind_speed_10m !== "number"
      || typeof current.precipitation !== "number"
      || typeof current.weather_code !== "number"
      || !Array.isArray(hourly.time) || !Array.isArray(hourly.temperature_2m)
      || !Array.isArray(daily.time) || !Array.isArray(daily.temperature_2m_min)
      || !Array.isArray(daily.temperature_2m_max)) {
      throw new Error("Weather provider returned incomplete measurements");
    }

    const temp = Math.round(current.temperature_2m);
    const apparentTemp = Math.round(current.apparent_temperature);
    const humidity = Math.round(current.relative_humidity_2m);
    const windSpeed = Math.round(current.wind_speed_10m);
    const precipitation = current.precipitation;
    const weatherCode = current.weather_code;
    const wmo = WMO_WEATHER_MAP[weatherCode] || { text: "Có mây", icon: "Cloud", isRain: false };
    const rainProbabilityToday = daily.precipitation_probability_max?.[0];
    if (!Number.isFinite(rainProbabilityToday)) {
      throw new Error("Weather provider did not supply rain probability");
    }

    // Parse Hourly (next 12 slots)
    const hourlyList: any[] = [];
    if (Array.isArray(hourly.time) && Array.isArray(hourly.temperature_2m)) {
      const currentIsoHour = (current.time || new Date().toISOString()).slice(0, 13);
      let startIndex = hourly.time.findIndex((t: string) => t.startsWith(currentIsoHour));
      if (startIndex === -1) startIndex = 0;

      for (let i = startIndex; i < Math.min(startIndex + 12, hourly.time.length); i++) {
        if (!Number.isFinite(hourly.temperature_2m[i]) ||
            !Number.isFinite(hourly.precipitation_probability?.[i])) continue;
        const timeStr = hourly.time[i];
        const hCode = hourly.weather_code?.[i];
        const hWmo = WMO_WEATHER_MAP[hCode] || { text: "Có mây", icon: "Cloud", isRain: false };
        const hourOnly = timeStr.includes("T") ? timeStr.split("T")[1].slice(0, 5) : timeStr.slice(11, 16);

        hourlyList.push({
          time: timeStr,
          hourLabel: hourOnly,
          temperature: Math.round(hourly.temperature_2m[i]),
          precipitationProbability: hourly.precipitation_probability[i],
          weatherCode: hCode,
          conditionText: hWmo.text,
          icon: hWmo.icon
        });
      }
    }

    // Parse Daily (next 7 days)
    const dailyList: any[] = [];
    if (Array.isArray(daily.time)) {
      for (let i = 0; i < Math.min(7, daily.time.length); i++) {
        if (!Number.isFinite(daily.temperature_2m_min?.[i]) ||
            !Number.isFinite(daily.temperature_2m_max?.[i])) continue;
        const dateStr = daily.time[i];
        const dCode = daily.weather_code?.[i];
        const dWmo = WMO_WEATHER_MAP[dCode] || { text: "Có mây", icon: "Cloud", isRain: false };

        dailyList.push({
          date: dateStr,
          dayLabel: formatDayOfWeek(dateStr, i === 0),
          dateLabel: formatDateDM(dateStr),
          tempMin: Math.round(daily.temperature_2m_min[i]),
          tempMax: Math.round(daily.temperature_2m_max[i]),
          precipitationProbabilityMax: daily.precipitation_probability_max?.[i],
          weatherCode: dCode,
          conditionText: dWmo.text,
          icon: dWmo.icon,
          isRain: dWmo.isRain || (daily.precipitation_probability_max?.[i] > 50)
        });
      }
    }

    const travelAdvice = generateTravelAdvice(temp, apparentTemp, rainProbabilityToday, wmo.isRain, weatherCode);
    const nowIso = new Date().toISOString();
    const result: WeatherData = {
      success: true,
      location: loc,
      fetchedAt: nowIso,
      updatedAtTimeOnly: new Date().toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit" }),
      cached: false,
      source: `Open-Meteo • dự báo mô hình (${loc.shortName} - ${loc.lat}°B, ${loc.lon}°Đ)`,
      sourceUrl: "https://open-meteo.com/en/docs",
      current: {
        time: current.time || nowIso,
        temperature: temp,
        apparentTemperature: apparentTemp,
        humidity,
        windSpeed,
        precipitation,
        weatherCode,
        conditionText: wmo.text,
        icon: wmo.icon,
        isRain: wmo.isRain,
        rainProbabilityToday
      },
      hourly: hourlyList,
      daily: dailyList,
      travelAdvice
    };

    weatherCache.set(loc.id, {
      data: result,
      expiresAt: now + 15 * 60 * 1000 // 15 mins
    });

    return result;
  } catch (err: any) {
    console.error(`[Weather] Error fetching Open-Meteo for ${loc.id}:`, err?.message || err);
    if (cached) {
      return {
        ...cached.data,
        cached: true,
        error: "Dữ liệu lưu tạm (Đang kết nối lại trạm khí tượng)"
      };
    }
    return {
      success: false,
      location: loc,
      fetchedAt: new Date().toISOString(),
      updatedAtTimeOnly: "--:--",
      cached: false,
      source: "Open-Meteo (không kết nối được)",
      current: {
        time: new Date().toISOString(),
        temperature: null as any,
        apparentTemperature: null as any,
        humidity: null as any,
        windSpeed: null as any,
        precipitation: null as any,
        weatherCode: 2,
        conditionText: "Chưa thể kết nối trạm thời tiết trực tuyến",
        icon: "Cloud",
        isRain: false,
        rainProbabilityToday: null as any
      },
      hourly: [],
      daily: [],
      travelAdvice: {
        suitabilityScore: "MEDIUM",
        suitabilityText: "Thời tiết cao nguyên",
        summary: "Không thể lấy dữ liệu thời tiết trực tiếp từ trạm Open-Meteo lúc này. Quý khách vui lòng thử lại sau giây lát.",
        recommendedActivities: ["Thưởng thức ẩm thực Mộc Châu trong không gian ấm cúng"],
        cautions: ["Vui lòng kiểm tra lại kết nối mạng"]
      },
      error: "Chưa thể kết nối trạm Open-Meteo. Vui lòng bấm thử lại."
    };
  }
}

// The cache is warmed on demand, not while importing a serverless function.

// Initialize Express app
const app = express();
const PORT = 3000;

// Middleware for parsing JSON JSON and urlencoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Phone/password alias authentication, isolated from public legacy bookings.
app.use("/api/auth", phoneAuthRouter);
// Server-validated content counters; never fake engagement in the browser.
app.use("/api/content", growthMetricsRouter);

// Initialize Google Gen AI
let aiClient: GoogleGenAI | null = null;
const KNOWN_SUSPENDED_KEYS = new Set([
  "AIzaSyBc1uWwhDDAfdHsldrlyVZqL_9VCpi7l8U"
]);
let isGeminiAvailable = true;

function canUseGemini(): boolean {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey || KNOWN_SUSPENDED_KEYS.has(apiKey) || !isGeminiAvailable) {
    return false;
  }
  return true;
}

function getAiClient() {
  if (!aiClient) {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Built-in intelligent travel intent analyzer for Mộc Châu Travel
function analyzeMocChauIntentLocally(message: string) {
  const text = (message || "").toLowerCase();
  const intents: string[] = [];

  if (/thời tiết|trời|mưa|nắng|lạnh|nhiệt độ|sương mù|săn mây|mặc gì|áo ấm|thoi tiet|lanh|mua/.test(text)) {
    intents.push("WEATHER");
  }
  if (/hoa|mận|hoa mận|đào|cải|cải trắng|dã quỳ|hoa ban|tam giác mạch|mùa hoa|mua hoa|nở/.test(text)) {
    intents.push("FLOWER_SEASON");
  }
  if (/homestay|khách sạn|khach san|resort|nghỉ dưỡng|phòng|lều|glamping|bungalow|ở đâu|chỗ ở|cho o|nha nghi|nhà nghỉ/.test(text)) {
    intents.push("ACCOMMODATION");
  }
  if (/ăn|quán|quán ăn|nhà hàng|nha hang|ẩm thực|đặc sản|dac san|bê chao|be chao|cá suối|lợn bản|gà đồi|sữa chua|chè/.test(text)) {
    intents.push("FOOD");
  }
  if (/xe|limousine|dcar|xe khách|xe khach|vé|ve xe|đón|di chuyển|di chuyen|thuê xe|thue xe|taxi|đưa đón|chuyến|gio chay|giờ chạy/.test(text)) {
    intents.push("TRANSPORT");
  }
  if (/điểm|tham quan|chơi gì|choi gi|check-in|checkin|thác|cầu kính|bạch long|đồi chè|rừng thông|bản áng|pha luông|hang kia|vân hồ|dia diem|địa điểm/.test(text)) {
    intents.push("DESTINATION");
  }
  if (/lịch trình|lich trinh|kế hoạch|ke hoach|tour|mấy ngày|may ngay|2 ngày|3 ngày|1 ngày|4 ngày|kinh nghiệm/.test(text)) {
    intents.push("ITINERARY");
  }
  if (/giá|gia|bao nhiêu|chi phí|chi phi|ngân sách|ngan sach|vé vào cổng|tiết kiệm|tiet kiem|combo/.test(text)) {
    intents.push("BUDGET");
  }
  if (/cộng đồng|cong dong|zalo|nhóm|nhom|hỏi đáp|hoi dap|review|kinh nghiệm|chia sẻ/.test(text)) {
    intents.push("COMMUNITY");
  }
  if (/hotline|số điện thoại|so dien thoai|liên hệ|lien he|cứu hộ|hỗ trợ|tu van|tư vấn/.test(text)) {
    intents.push("SUPPORT");
  }

  if (intents.length === 0) {
    intents.push("GENERAL", "DESTINATION", "TRANSPORT");
  }

  const extractedParams: { partySize?: string; budget?: string; dates?: string; location?: string } = {};

  const partyMatch = text.match(/(\d+)\s*(người|bạn|khách|ghế|vé)/i) || text.match(/(cặp đôi|gia đình|đoàn|1 mình|một mình|2 người|4 người)/i);
  if (partyMatch) {
    extractedParams.partySize = partyMatch[0];
  }

  const datesMatch = text.match(/(ngày mai|cuối tuần|thứ [2-7]|chủ nhật|tháng \d+|hôm nay|2 ngày 1 đêm|3 ngày 2 đêm|tết)/i);
  if (datesMatch) {
    extractedParams.dates = datesMatch[0];
  }

  const budgetMatch = text.match(/(tiết kiệm|giá rẻ|tầm trung|cao cấp|\d+\s*(triệu|k|nghìn|tr))/i);
  if (budgetMatch) {
    extractedParams.budget = budgetMatch[0];
  }

  const locMatch = text.match(/(hà nội|mộc châu|nà ka|bản áng|bạch long|thác dải yếm|vân hồ|đồi chè)/i);
  if (locMatch) {
    extractedParams.location = locMatch[0].split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  const replyParts: string[] = [];
  replyParts.push(`Chào bạn! Với câu hỏi "${message}", Trợ lý Mộc Châu Travel đã tổng hợp thông tin chi tiết và phù hợp nhất dành cho bạn:`);

  if (intents.includes("WEATHER")) {
    const cachedWeather = weatherCache.get("moc-chau-center")?.data?.current;
    if (cachedWeather) {
      replyParts.push(`🌤️ **Dự báo thời tiết Mộc Châu từ mô hình Open-Meteo (không phải quan trắc thực địa):** Nhiệt độ hiện tại ${cachedWeather.temperature}°C (Cảm giác như ${cachedWeather.apparentTemperature}°C), ${cachedWeather.conditionText.toLowerCase()}, độ ẩm ${cachedWeather.humidity}%, ${cachedWeather.windSpeedText ? `gió ${cachedWeather.windSpeedText}` : `gió ${cachedWeather.windSpeed} km/h`}, lượng mưa ${cachedWeather.precipitation ?? 0} mm${cachedWeather.uvIndex ? `, chỉ số UV ${cachedWeather.uvIndex}` : ''}. ${cachedWeather.isRain ? "Trời đang có mưa ẩm, bạn nên mang theo ô/áo mưa và chú ý đường đèo trơn trượt." : "Thời tiết khá thuận lợi, bạn nên mang áo khoác mỏng vì chiều tối và đêm nhiệt độ vùng cao nguyên giảm nhanh."}`);
    } else {
      replyParts.push(`🌤️ **Dự báo Mộc Châu:** Website dùng mô hình Open-Meteo theo tọa độ đã chọn, không đo tại trạm. Hãy mở mục 'Thời tiết' để xem mốc dự báo và đối chiếu các nguồn khác.`);
    }
  }

  if (intents.includes("FLOWER_SEASON")) {
    replyParts.push(`🌸 **Mùa hoa rực rỡ:** Thung lũng mận Nà Ka và Mu Náu đang vào mùa hoa mận trắng muốt tuyệt đẹp như tuyết. Tại Rừng thông Bản Áng có cánh đồng hoa cải trắng bạt ngàn. Thời điểm chụp ảnh lung linh nhất là khoảng 8h00 - 10h00 sáng khi nắng ban mai rọi xuống triền đồi.`);
  }

  if (intents.includes("ACCOMMODATION")) {
    replyParts.push(`🏡 **Lưu trú gợi ý:** Tùy sở thích bạn có thể chọn Homestay view thung lũng (Bơ House, Fairy House, Nhà Ta Homestay) mộc mạc ấm cúng, hoặc Khách sạn - Resort cao cấp (Mộc Châu Island, Mường Thanh Luxury, Thảo Nguyên Resort) đầy đủ tiện nghi, bể bơi nước nóng.`);
  }

  if (intents.includes("FOOD")) {
    replyParts.push(`🍲 **Ẩm thực đặc sản:** Đừng bỏ lỡ món Bê chao nóng giòn chấm tương gừng, Cá suối chiên giòn, Cá hồi/Cá tầm tươi sống tại Vườn Đào, Lẩu gà đồi lá é và cơm lam thơm dẻo. Tráng miệng có sữa chua nếp cẩm Mộc Châu nức tiếng.`);
  }

  if (intents.includes("DESTINATION")) {
    replyParts.push(`📍 **Điểm tham quan nổi bật:** Cầu kính Bạch Long (kỷ lục thế giới), Thác Dải Yếm, Đồi chè Trái Tim xanh ngắt, Rừng thông Bản Áng lãng mạn và Thung lũng mận Nà Ka bạt ngàn.`);
  }

  if (intents.includes("TRANSPORT")) {
    replyParts.push(`🚐 **Di chuyển cùng QT Limousine VIP:** Tuyến Hà Nội ⇌ Mộc Châu đón trả tận nơi nội thành Hà Nội, trả tận homestay/khách sạn Mộc Châu. Xe DCar VIP 9 - 11 chỗ hiện đại, ghế massage, wifi, nước uống miễn phí chỉ từ 300.000đ/ghế.`);
  }

  if (intents.includes("ITINERARY")) {
    replyParts.push(`🗺️ **Gợi ý lịch trình 2N1Đ chuẩn:**\n• Ngày 1: Xe Limousine đón sáng tại Hà Nội -> Đến Mộc Châu ăn trưa Bê chao -> Chiều check-in Đồi chè Trái Tim & Rừng thông Bản Áng -> Tối thưởng thức lẩu gà đồi.\n• Ngày 2: Sáng sớm săn mây Thung lũng Nà Ka -> Check-in Cầu kính Bạch Long & Thác Dải Yếm -> Chiều lên xe QT Limousine về lại Hà Nội.`);
  }

  if (intents.includes("COMMUNITY")) {
    replyParts.push(`💬 **Cộng đồng hỏi đáp:** Bạn có thể tham gia các Nhóm Zalo Du lịch Mộc Châu chính thức của chúng tôi tại trang /cong-dong để kết nối với người bản địa và hỏi đáp kinh nghiệm 24/7.`);
  }

  replyParts.push(`👉 Bạn có thể xem ngay các dịch vụ hoặc danh mục chi tiết bên dưới. Cần hỗ trợ trực tiếp nhanh chóng, hãy gọi Hotline QT Limousine: 0971.050.324!`);

  return {
    intents,
    extractedParams,
    replyText: replyParts.join("\n\n")
  };
}

// Built-in intelligent itinerary generator
function generateMocChauItineraryLocally(params: {
  departure?: string;
  partySize?: number;
  budgetType?: string;
  budgetAmount?: number;
  departureDate?: string;
  isDateUnknown?: boolean;
  duration?: string;
  styles?: string[] | string;
  transport?: string;
  notes?: string;
  // Legacy support fallback params
  style?: string;
  budget?: string;
  groupType?: string;
}) {
  const departure = params.departure || "Hà Nội";
  const partySize = params.partySize || 2;
  const budgetType = params.budgetType || "per_person";
  const budgetAmount = params.budgetAmount || 2500000;
  const departureDate = params.isDateUnknown ? "Chưa xác định ngày" : (params.departureDate || "Sớm nhất có thể");
  const duration = params.duration || "2 ngày 1 đêm";
  const styles = Array.isArray(params.styles) ? params.styles.join(", ") : (params.styles || params.style || "Khám phá & Check-in");
  const transport = params.transport || "Limousine";
  const notes = params.notes ? `\n*Lưu ý cá nhân: ${params.notes}*` : "";
  const groupType = params.groupType || `${partySize} khách`;

  let budgetDesc = "";
  if (budgetType === "unknown") {
    budgetDesc = "Chưa xác định — Nhờ AI tư vấn linh hoạt";
  } else if (budgetType === "total") {
    const formattedTotal = Number(budgetAmount).toLocaleString("vi-VN");
    const perPerson = Math.round(Number(budgetAmount) / Math.max(1, partySize)).toLocaleString("vi-VN");
    budgetDesc = `Tổng đoàn: ${formattedTotal} đ (~${perPerson} đ / người cho ${partySize} khách)`;
  } else {
    const formattedPerPerson = Number(budgetAmount).toLocaleString("vi-VN");
    const total = (Number(budgetAmount) * partySize).toLocaleString("vi-VN");
    budgetDesc = `Mỗi người: ${formattedPerPerson} đ (Tổng đoàn ${partySize} khách: ${total} đ)`;
  }

  let transportAdvice = "";
  const depLower = departure.toLowerCase();
  if (depLower.includes("hà nội") || depLower.includes("ha noi")) {
    transportAdvice = `- **Tuyến xuất phát:** Từ ${departure}, xe **QT Limousine VIP** đón trả tận nơi nội thành Hà Nội, chạy thẳng cao tốc đến Mộc Châu (~3.5 - 4 giờ).`;
  } else if (depLower.includes("tp.hcm") || depLower.includes("hồ chí minh") || depLower.includes("sài gòn") || depLower.includes("đà nẵng") || depLower.includes("cần thơ")) {
    transportAdvice = `- **Tuyến xuất phát:** Từ ${departure}, quý khách di chuyển bằng máy bay đến sân bay Nội Bài (Hà Nội). Xe **QT Limousine VIP** sẽ đón quý khách trực tiếp tại sân bay Nội Bài hoặc điểm hẹn Hà Nội để đưa lên Mộc Châu an toàn, êm ái.`;
  } else {
    transportAdvice = `- **Tuyến xuất phát:** Từ ${departure}, quý khách có thể đón xe khách/xe limousine kết nối đến Hà Nội, sau đó chuyển sang **QT Limousine VIP** tuyến Hà Nội ⇌ Mộc Châu để tận hưởng dịch vụ đưa đón tận cửa homestay Mộc Châu.`;
  }

  return `### 🌸 LỊCH TRÌNH DU LỊCH MỘC CHÂU ĐỈNH CAO: ${duration.toUpperCase()}
**Điểm xuất phát:** ${departure} | **Đoàn:** ${partySize} khách | **Ngày đi:** ${departureDate}
**Ngân sách:** ${budgetDesc}
**Phong cách:** ${styles} | **Phương tiện:** ${transport}${notes}

---

#### 🚐 HƯỚNG DẪN DI CHUYỂN & VẬN CHUYỂN
${transportAdvice}
- **Tiện ích QT Limousine:** Ghế massage thương gia, wifi tốc độ cao, nước suối và khăn lạnh miễn phí. Giá vé niêm yết: 300.000đ - 350.000đ/ghế.
${partySize > 9 ? `*Lưu ý đoàn đông (${partySize} khách):* Đoàn trên 9 người sẽ được nhà xe bố trí xe Limousine 16 chỗ hoặc xe riêng nguyên chuyến để đảm bảo sự gắn kết và thoải mái tuyệt đối.` : ""}

---

#### 📅 LỊCH TRÌNH GỢI Ý CHI TIẾT (${duration})
- **Ngày 1: Khởi hành & Chinh phục cao nguyên Mộc Châu**
  - **Sáng:** Khởi hành theo lộ trình đã chọn. Thưởng thức cảnh quan đèo núi Tây Bắc hùng vĩ.
  - **Trưa:** Dừng chân tại thị trấn Mộc Châu, thưởng thức đặc sản trứ danh: **Bê chao Mộc Châu**, cá suối chiên giòn, rau cải mèo xào tỏi.
  - **Chiều:** Khám phá tọa độ check-in nổi bật theo sở thích (${styles}): **Đồi chè Trái Tim**, **Thung lũng mận Nà Ka** hoặc **Rừng thông Bản Áng**.
  - **Tối:** Thưởng thức bữa tối ấm cúng với Lẩu gà đồi lá é hoặc thịt nướng mắc khén. Tản bộ dạo phố đêm, thưởng thức sữa chua nếp cẩm.

- **Ngày 2: Trải nghiệm văn hóa & Săn mây cao nguyên**
  - **Sáng:** Đón bình minh se lạnh 16°C, hít thở không khí trong lành. Ăn sáng bún cá hồi hoặc phở bản. Săn mây và chụp ảnh tại các thung lũng hoa.
  - **Trưa:** Ghé thăm **Cầu kính Bạch Long** hoặc **Thác Dải Yếm**. Dùng bữa trưa cá tầm/cá hồi tươi ngon.
  - **Chiều:** Mua sắm đặc sản làm quà chính hiệu (mận sấy dẻo, sữa tươi, chè Shan Tuyết, trâu gác bếp) trước khi lên xe khởi hành về lại điểm xuất phát.

---

#### 💰 ĐÁNH GIÁ & TƯ VẤN NGÂN SÁCH
- **Hạn mức ngân sách:** ${budgetDesc}
- **Khuyến nghị tài chính:** Với mức ngân sách này, hệ thống đề xuất phân bổ tối ưu cho di chuyển (~30%), lưu trú homestay/khách sạn (${partySize <= 2 ? 'homestay view đồi chè' : 'phòng gia đình ấm cúng'}) (~35%), và ăn uống - tham quan (~35%).
- Đội ngũ điều hành QT Limousine sẵn sàng hỗ trợ điều chỉnh lịch trình theo yêu cầu riêng của quý khách 24/7.`;
}

// Built-in intelligent conversational advisor
function generateMocChauChatReplyLocally(message: string, _history?: Array<{ role: string; text: string }>) {
  const text = (message || "").toLowerCase();

  if (/giá vé|bao nhiêu|bảng giá|đặt xe|limousine|chuyến|mấy giờ/.test(text)) {
    return "Giá vé xe QT Limousine VIP tuyến Hà Nội ⇌ Mộc Châu là 300.000đ - 350.000đ/ghế tuỳ vị trí ghế massage. Xe khởi hành liên tục từ 06h30 đến 18h30 hàng ngày, đón trả tận nơi nội thành Hà Nội và tận cửa homestay Mộc Châu. Bạn có thể nhấn 'Đặt xe Limousine' ở thanh menu hoặc gọi hotline 0971.050.324 để giữ chỗ nhé!";
  }

  if (/thời tiết|mưa|nắng|lạnh|mặc gì|nhiệt độ/.test(text)) {
    const cached = weatherCache.get("moc-chau-center")?.data?.current;
    if (cached) {
      return `Dự báo mô hình Open-Meteo tại Mộc Châu (không phải số đo quan trắc): Nhiệt độ hiện tại ${cached.temperature}°C (Cảm giác như ${cached.apparentTemperature}°C), ${cached.conditionText.toLowerCase()}, độ ẩm ${cached.humidity}%, ${cached.windSpeedText ? `gió ${cached.windSpeedText}` : `gió ${cached.windSpeed} km/h`}, lượng mưa ${cached.precipitation ?? 0} mm${cached.uvIndex ? `, UV ${cached.uvIndex}` : ''}. ${cached.isRain ? "Thời tiết đang có mưa ẩm, bạn nên mang theo ô dù, áo khoác ấm và chú ý an toàn cung đường đèo." : "Thời tiết khá thuận lợi để dạo chơi đồi chè, thác Dải Yếm và các thung lũng hoa mận bạn nhé!"}`;
    }
    return "Website xedimocchau.com sử dụng dự báo từ mô hình Open-Meteo theo vị trí Mộc Châu. Đây không phải quan trắc thực địa; bạn có thể mở mục 'Thời tiết' để xem mốc giờ dự báo, nguồn và đối chiếu với trang khác.";
  }

  if (/hoa|mận|mùa hoa|đào|cải/.test(text)) {
    return "Mộc Châu có các mùa hoa mận, hoa đào và hoa cải theo thời điểm trong năm. Tôi chưa có dữ liệu xác minh tình trạng hoa đang nở hôm nay, nên bạn hãy xem cập nhật mùa hoa có nguồn trên website hoặc hỏi người địa phương trước khi đi.";
  }

  if (/ăn|quán|nhà hàng|đặc sản|bê chao|cá suối/.test(text)) {
    return "Đến Mộc Châu bạn nhất định phải thử: Bê chao nóng hổi (quán 64, quán 70, Nam Mèo), Cá suối chiên giòn, Cá hồi/Cá tầm Vườn Đào, Lẩu gà đồi lá é và sữa chua nếp cẩm. Các quán ăn đều sạch sẽ và phục vụ rất chu đáo!";
  }

  if (/homestay|khách sạn|resort|ở đâu/.test(text)) {
    return "Một số homestay được du khách yêu thích nhất tại Mộc Châu: Nhà Ta Homestay, Bơ House, Fairy House, Mộc Châu Retreat... Nếu muốn tiện nghi resort thì có Mộc Châu Island hoặc Mường Thanh Luxury Mộc Châu bạn nhé!";
  }

  return `Cảm ơn bạn đã hỏi về Mộc Châu Travel! Về câu hỏi "${message}": Mộc Châu luôn sẵn sàng chào đón bạn với thiên nhiên trong lành, các mùa hoa tuyệt đẹp, ẩm thực Tây Bắc hấp dẫn và dịch vụ xe QT Limousine VIP đón trả tận nơi. Bạn cần tư vấn thêm về lịch trình, homestay hay đặt xe, đừng ngại để lại tin nhắn hoặc gọi hotline 0971.050.324 nhé!`;
}

// Catch-all for API to debug 405/404
app.all("/api/*", (req, res, next) => {
  console.log(`[API Debug] ${req.method} ${req.url}`);
  next();
});

// API Test route
app.get("/api/test", (req, res) => {
  res.json({ status: "ok", message: "API is working" });
});

// Real-Time Open-Meteo Weather API route for Mộc Châu
app.get("/api/weather", async (req, res) => {
  const locationId = (req.query.location as string) || "moc-chau-center";
  try {
    const data = await getMocChauWeather(locationId);
    res.json(data);
  } catch (err: any) {
    console.error("[Weather API] Error handling /api/weather:", err);
    res.status(500).json({ success: false, error: "Lỗi kết nối trạm thời tiết." });
  }
});

// API endpoint for AI Moc Chau Itinerary Planner
app.post("/api/generate-itinerary", async (req, res) => {
  const { departure, partySize, budgetType, budgetAmount, departureDate, isDateUnknown, duration, styles, transport, notes, style, budget, groupType } = req.body;
  console.log(`[AI Planner] Generating itinerary for:`, { departure, partySize, budgetType, budgetAmount, duration, styles, transport });

  if (!canUseGemini()) {
    console.log("[AI Planner] Serving itinerary via Moc Chau Travel itinerary engine");
    return res.json({
      success: true,
      itinerary: generateMocChauItineraryLocally({ departure, partySize, budgetType, budgetAmount, departureDate, isDateUnknown, duration, styles, transport, notes, style, budget, groupType })
    });
  }

  try {
    const ai = getAiClient();
    const modelName = "gemini-2.5-flash";

    const systemInstruction = `Bạn là chuyên gia du lịch am hiểu nhất về Mộc Châu Travel. 
Đóng vai Trợ lý Du lịch thông minh, viết lịch trình bằng tiếng Việt thân thiện, mến khách, chuyên nghiệp.
Kết hợp các địa danh: Đồi chè Trái Tim, Thung lũng Nà Ka, Thác Dải Yếm, Cầu kính Bạch Long, Rừng thông bản Áng...
Gợi ý dịch vụ xe QT Limousine VIP đón trả tận nơi để di chuyển an toàn và thoải mái. Tôn trọng chính xác điểm xuất phát, số lượng khách và ngân sách khách hàng đã nhập.`;

    const stylesStr = Array.isArray(styles) ? styles.join(", ") : (styles || style || "Khám phá");
    const prompt = `Lập lịch trình chi tiết đi Mộc Châu:
- Điểm xuất phát: ${departure || "Hà Nội"}
- Số lượng khách: ${partySize || 2} khách
- Ngân sách: ${budgetType === 'unknown' ? 'Chưa xác định' : `${budgetAmount || 2500000} đ (${budgetType === 'total' ? 'Tổng đoàn' : 'Mỗi người'})`}
- Ngày đi: ${isDateUnknown ? 'Chưa xác định' : (departureDate || 'Sớm nhất')}
- Thời gian: ${duration || "2 ngày 1 đêm"}
- Phong cách sở thích: ${stylesStr}
- Phương tiện: ${transport || "Limousine"}
- Lưu ý riêng: ${notes || "Không có"}
Vui lòng trình bày bằng Markdown, sử dụng emoji sinh động.`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: systemInstruction,
        maxOutputTokens: 2000,
      }
    });

    return res.json({
      success: true,
      itinerary: response.text || generateMocChauItineraryLocally({ departure, partySize, budgetType, budgetAmount, departureDate, isDateUnknown, duration, styles, transport, notes, style, budget, groupType })
    });
  } catch (error: any) {
    if (error?.message?.includes("suspended") || error?.message?.includes("PERMISSION_DENIED") || error?.status === 403) {
      isGeminiAvailable = false;
    }
    console.log("[AI Planner] Gemini fallback activated:", error?.message ? error.message.slice(0, 100) : "fallback");
    return res.json({
      success: true,
      itinerary: generateMocChauItineraryLocally({ departure, partySize, budgetType, budgetAmount, departureDate, isDateUnknown, duration, styles, transport, notes, style, budget, groupType })
    });
  }
});

// API endpoint for Floating AI Chat Advisor
app.post("/api/ai/chat", async (req, res) => {
  const { message, history } = req.body;
  const userMsg = typeof message === "string" ? message.trim() : "";
  console.log(`[AI Chat] Received query: "${userMsg}"`);

  if (!canUseGemini()) {
    console.log("[AI Chat] Serving response via Moc Chau Travel conversational engine");
    return res.json({
      success: true,
      reply: generateMocChauChatReplyLocally(userMsg, history)
    });
  }

  try {
    const ai = getAiClient();
    const modelName = "gemini-2.5-flash";

    const systemInstruction = `Bạn là Trợ lý Du lịch ảo chuyên nghiệp của 'Mộc Châu Travel' & 'QT Limousine'.
Bạn am hiểu tường tận về Mộc Châu:
- Các mùa hoa: Mùa hoa mận (Tháng 1-2), hoa cải trắng, dã quỳ, mận chín (tháng 4-5).
- Thời tiết, homestay, đặc sản (Bê chao, cá suối, cải mèo).
- Dịch vụ xe QT Limousine VIP Hà Nội - Mộc Châu đón trả tận nơi (giá 300k/ghế).
Hãy trả lời ngắn gọn, thân thiện, hữu ích bằng tiếng Việt và khéo léo gợi ý đặt xe Limousine khi phù hợp.`;

    const contents = [];
    if (history && Array.isArray(history)) {
      for (const h of history) {
        if (h.role && h.text) {
          contents.push({ role: h.role, parts: [{ text: h.text }] });
        }
      }
    }
    contents.push({ role: "user", parts: [{ text: userMsg }] });

    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        maxOutputTokens: 1000,
      }
    });

    return res.json({
      success: true,
      reply: response.text || generateMocChauChatReplyLocally(userMsg, history)
    });
  } catch (error: any) {
    if (error?.message?.includes("suspended") || error?.message?.includes("PERMISSION_DENIED") || error?.status === 403) {
      isGeminiAvailable = false;
    }
    console.log("[AI Chat] Gemini fallback activated:", error?.message ? error.message.slice(0, 100) : "fallback");
    return res.json({
      success: true,
      reply: generateMocChauChatReplyLocally(userMsg, history)
    });
  }
});

// API endpoint for Multi-Intent AI Advisor Analysis
app.post("/api/ai/intent", async (req, res) => {
  const { message } = req.body;
  const userQuery = typeof message === "string" ? message.trim() : "";
  console.log(`[AI Intent] Processing question analysis: "${userQuery}"`);

  if (!canUseGemini()) {
    console.log("[AI Intent] Serving response via Moc Chau Travel intelligence engine");
    return res.json({
      success: true,
      ...analyzeMocChauIntentLocally(userQuery)
    });
  }

  try {
    const ai = getAiClient();
    const modelName = "gemini-2.5-flash";

    const systemInstruction = `Bạn là Trợ lý Du lịch thông minh của Mộc Châu Travel (đồng hành cùng QT Limousine). 
Phân tích câu hỏi của khách thành JSON gồm:
- intents: mảng các ý định từ danh sách: ["WEATHER", "FOOD", "ACCOMMODATION", "TRANSPORT", "ITINERARY", "DESTINATION", "FLOWER_SEASON", "BUDGET", "COMMUNITY", "SUPPORT", "GENERAL"]
- extractedParams: đối tượng chứa số người (partySize), ngân sách (budget), ngày đi (dates), địa điểm (location) nếu có trong câu hỏi.
- replyText: câu trả lời tư vấn chi tiết, thân thiện, chính xác bằng tiếng Việt.`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: "user", parts: [{ text: userQuery }] }],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intents: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            extractedParams: {
              type: Type.OBJECT,
              properties: {
                partySize: { type: Type.STRING },
                budget: { type: Type.STRING },
                dates: { type: Type.STRING },
                location: { type: Type.STRING }
              }
            },
            replyText: { type: Type.STRING }
          },
          required: ["intents", "replyText"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      success: true,
      intents: parsed.intents && parsed.intents.length > 0 ? parsed.intents : ["GENERAL"],
      extractedParams: parsed.extractedParams || {},
      replyText: parsed.replyText || "Mộc Châu Travel luôn sẵn lòng đồng hành cùng bạn!"
    });
  } catch (error: any) {
    if (error?.message?.includes("suspended") || error?.message?.includes("PERMISSION_DENIED") || error?.status === 403) {
      isGeminiAvailable = false;
    }
    console.log("[AI Intent] Gemini fallback activated:", error?.message ? error.message.slice(0, 100) : "fallback");
    return res.json({
      success: true,
      ...analyzeMocChauIntentLocally(userQuery)
    });
  }
});

// Natural prompt parser for AI itinerary planner
function parseNaturalItineraryPromptLocally(prompt: string) {
  const text = (prompt || "").toLowerCase();
  
  let departure = "Hà Nội";
  const provinces = ["thanh hóa", "thanh hoa", "tp.hcm", "hồ chí minh", "sài gòn", "hải phòng", "quảng ninh", "bắc ninh", "nghệ an", "đà nẵng", "hà nội", "hà nam", "ninh bình", "hải dương", "hưng yên", "vĩnh phúc", "thái nguyên"];
  for (const prov of provinces) {
    if (text.includes(prov)) {
      if (prov.includes("thanh hoa")) departure = "Thanh Hóa";
      else if (prov.includes("hồ chí minh") || prov.includes("tp.hcm") || prov.includes("sài gòn")) departure = "TP. Hồ Chí Minh";
      else if (prov.includes("hải phòng")) departure = "Hải Phòng";
      else if (prov.includes("quảng ninh")) departure = "Quảng Ninh";
      else if (prov.includes("bắc ninh")) departure = "Bắc Ninh";
      else if (prov.includes("nghệ an")) departure = "Nghệ An";
      else if (prov.includes("đà nẵng")) departure = "Đà Nẵng";
      else if (prov.includes("hà nội")) departure = "Hà Nội";
      else {
        departure = prov.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      }
      break;
    }
  }

  let partySize = 2;
  const partyMatch = text.match(/(\d+)\s*(người|bạn|khách|thành viên|đoàn)/i);
  if (partyMatch && partyMatch[1]) {
    const num = parseInt(partyMatch[1], 10);
    if (!isNaN(num) && num > 0) partySize = num;
  }

  let duration = "2 ngày 1 đêm";
  if (/1 ngày|trong ngày|khứ hồi trong ngày/.test(text)) duration = "1 ngày khứ hồi";
  else if (/3 ngày|3n2đ/.test(text)) duration = "3 ngày 2 đêm";
  else if (/4 ngày|4n3đ/.test(text)) duration = "4 ngày 3 đêm";
  else if (/5 ngày|5n4đ/.test(text)) duration = "5 ngày 4 đêm";
  else if (/2 ngày|2n1đ/.test(text)) duration = "2 ngày 1 đêm";

  let budgetAmount = 2500000;
  let budgetType: "per_person" | "total" = "per_person";
  
  const trieuMatch = text.match(/(\d+([.,]\d+)?)\s*(triệu|tr|củ)/i);
  const kMatch = text.match(/(\d+)\s*(k|nghìn)/i);
  
  if (trieuMatch && trieuMatch[1]) {
    const num = parseFloat(trieuMatch[1].replace(",", "."));
    if (!isNaN(num)) {
      budgetAmount = num * 1000000;
    }
  } else if (kMatch && kMatch[1]) {
    const num = parseInt(kMatch[1], 10);
    if (!isNaN(num)) {
      budgetAmount = num * 1000;
    }
  }

  if (/tổng|cả đoàn|trọn gói|tổng tiền/.test(text)) {
    budgetType = "total";
  } else {
    budgetType = "per_person";
  }

  const styles: string[] = [];
  if (/săn mây|mây/.test(text)) styles.push("Khám phá thiên nhiên & Săn mây");
  if (/sống ảo|check[- ]in|chụp ảnh|hoa/.test(text)) styles.push("Sống ảo check-in (Đồi chè, thung lũng hoa, cầu kính)");
  if (/nghỉ dưỡng|thư thái|homestay|resort/.test(text)) styles.push("Nghỉ dưỡng ẩm thực thư thái (Homestay, đặc sản bản địa)");
  if (/văn hóa|dân tộc|thái|mông/.test(text)) styles.push("Văn hóa dân tộc Thái & H'Mông");
  if (/phượt|mạo hiểm|pha luông|đèo/.test(text)) styles.push("Phượt mạo hiểm (Đỉnh Pha Luông, cung đường đèo)");
  
  if (styles.length === 0) {
    styles.push("Sống ảo check-in (Đồi chè, thung lũng hoa, cầu kính)");
  }

  return {
    departure,
    partySize,
    duration,
    budgetAmount,
    budgetType,
    styles,
    notes: prompt
  };
}

app.post("/api/ai/parse-prompt", async (req, res) => {
  const { prompt } = req.body;
  const userPrompt = typeof prompt === "string" ? prompt.trim() : "";
  console.log(`[AI Parse Prompt] Parsing natural prompt: "${userPrompt}"`);

  if (!canUseGemini()) {
    return res.json({
      success: true,
      params: parseNaturalItineraryPromptLocally(userPrompt)
    });
  }

  try {
    const ai = getAiClient();
    const modelName = "gemini-2.5-flash";

    const systemInstruction = `Bạn là Trợ lý phân tích yêu cầu du lịch Mộc Châu Travel. Hãy đọc câu mô tả tự nhiên của khách và trích xuất JSON gồm:
- departure: string (tên tỉnh/thành phố xuất phát, mặc định "Hà Nội")
- partySize: number (số lượng khách, mặc định 2)
- duration: string ("1 ngày khứ hồi", "2 ngày 1 đêm", "3 ngày 2 đêm", "4 ngày 3 đêm", v.v.)
- budgetAmount: number (số tiền VNĐ dạng số, ví dụ 8 triệu = 8000000)
- budgetType: "per_person" hoặc "total"
- styles: array of strings (chọn từ các sở thích: "Sống ảo check-in (Đồi chè, thung lũng hoa, cầu kính)", "Nghỉ dưỡng ẩm thực thư thái (Homestay, đặc sản bản địa)", "Văn hóa dân tộc Thái & H'Mông", "Khám phá thiên nhiên & Săn mây", "Phượt mạo hiểm (Đỉnh Pha Luông, cung đường đèo)")
- notes: string (ghi chú gốc)`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            departure: { type: Type.STRING },
            partySize: { type: Type.NUMBER },
            duration: { type: Type.STRING },
            budgetAmount: { type: Type.NUMBER },
            budgetType: { type: Type.STRING },
            styles: { type: Type.ARRAY, items: { type: Type.STRING } },
            notes: { type: Type.STRING }
          },
          required: ["departure", "partySize", "duration", "budgetAmount", "budgetType", "styles"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      success: true,
      params: {
        departure: parsed.departure || "Hà Nội",
        partySize: Number(parsed.partySize) || 2,
        duration: parsed.duration || "2 ngày 1 đêm",
        budgetAmount: Number(parsed.budgetAmount) || 2500000,
        budgetType: parsed.budgetType === 'total' ? 'total' : 'per_person',
        styles: Array.isArray(parsed.styles) && parsed.styles.length > 0 ? parsed.styles : ["Sống ảo check-in (Đồi chè, thung lũng hoa, cầu kính)"],
        notes: userPrompt
      }
    });
  } catch (err) {
    console.log("[AI Parse Prompt] Fallback to local parser");
    return res.json({
      success: true,
      params: parseNaturalItineraryPromptLocally(userPrompt)
    });
  }
});

// Automated SEO Sitemap & Robots.txt for top search engine indexing
app.get("/sitemap.xml", (req, res) => {
  res.header('Content-Type', 'application/xml');
  const baseUrl = "https://xedimocchau.com";
  const routes = [
    "",
    "/limousine",
    "/combo",
    "/shared",
    "/private",
    "/guide",
    "/explore",
    "/homestay",
    "/nha-hang",
    "/dia-diem",
    "/thoi-tiet",
    "/mua-hoa",
    "/lich-trinh",
    "/dac-san",
    "/trai-nghiem",
    "/cong-dong",
    "/di-chuyen",
    "/chi-phi",
    "/ho-tro-247"
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(r => `  <url>
    <loc>${baseUrl}${r}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${r === "" ? "1.0" : "0.8"}</priority>
  </url>`).join("\n")}
</urlset>`;
  res.send(xml);
});

app.get("/robots.txt", (req, res) => {
  res.header('Content-Type', 'text/plain');
  res.send(`User-agent: *
Allow: /
Sitemap: https://xedimocchau.com/sitemap.xml`);
});

// Serve frontend build static files and setup Vite configuration in development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Xe Di Moc Chau Server] Running on http://localhost:${PORT}`);
  });
}

// Vercel invokes Express as a serverless function; never open a listening port there.
if (process.env.VERCEL !== "1") {
  startServer();
}

export default app;
