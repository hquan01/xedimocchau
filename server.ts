import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = 3000;

// Middleware for parsing JSON JSON and urlencoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Google Gen AI
let aiClient: GoogleGenAI | null = null;

function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. AI features might fail.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// API endpoint for AI Moc Chau Itinerary Planner
app.post("/api/chat-itinerary", async (req, res) => {
  try {
    const { duration, style, budget, groupType, notes } = req.body;

    const ai = getAiClient();
    if (!process.env.GEMINI_API_KEY) {
      // Graceful fallback with template mock if API key is missing
      return res.json({
        success: true,
        itinerary: `### Lịch trình Mầm Đá Mộc Châu Gợi Ý (Bản Demo do thiếu API Key)
\n**Thời lượng:** ${duration || "3 ngày 2 đêm"} | **Phong cách:** ${style || "Nghỉ dưỡng"} | **Ngân sách:** ${budget || "Tầm trung"} | **Nhóm:** ${groupType || "Cặp đôi"}
\nDo hệ thống đang trong chế độ chạy thử nghiệm (Chưa kết nối API Key), chúng tôi xin gửi ý tưởng lịch trình chung:
\n* **Ngày 1:** Hà Nội - Mộc Châu - Đồi Chè Trái Tim - Thưởng thức Bê Chao.
* **Ngày 2:** Khám phá Thác Dải Yếm - Cầu kính Bạch Long (Cầu kính đi bộ dài nhất thế giới) - Bản Áng.
* **Ngày 3:** Chợ phiên Mộc Châu - Mua đặc sản bánh sữa, hồng sấy - Trở về Hà Nội.
\n*Vui lòng cung cấp khóa API trong Settings > Secrets để kích hoạt trải nghiệm trí tuệ nhân tạo hoàn hảo nhất!*`
      });
    }

    const systemInstruction = `Bạn là một chuyên gia bản địa am hiểu sâu sắc về du lịch Mộc Châu, Sơn La, Việt Nam. 
Hãy đóng vai Đại sứ Du lịch của hệ thống Xe Đi Mộc Châu, viết lịch trình chi tiết bằng tiếng Việt, giọng điệu chuyên nghiệp, đầy nhiệt huyết, giàu chất thẩm mỹ, chăm sóc khách hàng chu đáo.
Gợi ý chi tiết từng bữa ăn, chỗ ở, phương tiện di chuyển (xe Limousine từ Hà Nội) và các điểm tham quan phù hợp nhất với yêu cầu của người dùng.

Thông tin về các địa điểm nổi tiếng ở Mộc Châu để bạn lồng ghép hợp lý:
- Đồi chè Trái Tim (bản Ôn): Đẹp nhất vào buổi sáng sớm, nên thuê trang phục dân tộc chụp ảnh.
- Thung lũng mận Nà Ka: Mùa hoa mận nở (tháng 12 - tháng 1), mùa quả chín (tháng 4 - tháng 5).
- Thác Dải Yếm & Cầu kính Tình Yêu.
- Cầu kính Bạch Long (xã Mường Sang): Cầu kính đi bộ dài nhất thế giới, giá vé khoảng 550.000đ-650.000đ.
- Rừng thông bản Áng: Hồ nước trong vắt, cắm trại, đạp xe đạp đôi, vườn dâu tây Chimi.
- Đỉnh Pha Luông: Dành cho dân phượt, leo núi mạo hiểm.
- Happy Land Mộc Châu: Vườn hoa đa sắc màu rộng lớn, các trò chơi mạo hiểm nhẹ.
- Ẩm thực Mộc Châu: Bê Chao (thịt bê non chao dầu nóng hổi ròn rụm), cá suối nướng, trâu gác bếp, cải mèo xào, sữa bò tươi Mộc Châu, hồng giòn, mận hậu.

Hãy tạo cấu trúc lịch trình chất lượng cao sử dụng Markdown. Sử dụng các emoji phù hợp để làm lịch trình sống động. Bao gồm ước lượng chi phí cho từng hạng mục để người dùng dễ theo dõi.`;

    const prompt = `Hãy lập kế hoạch lịch trình chi tiết cho chuyến đi Mộc Châu với các thông số sau:
- Thời gian: ${duration || "2 ngày 1 đêm"}
- Phong cách du lịch: ${style || "Kết hợp check-in và nghỉ dưỡng"}
- Ngân sách dự kiến: ${budget || "Tầm trung"}
- Đối tượng đi cùng: ${groupType || "Nhóm bạn/Gia đình"}
- Yêu cầu đặc biệt/Lưu ý thêm: ${notes || "Không có yêu cầu đặc biệt"}

Vui lòng chia sẻ lịch trình theo từng ngày, nêu rõ thời gian khởi hành bằng xe Limousine từ Hà Nội (khoảng 4-5 tiếng đi xe dọc quốc lộ 6), các điểm dừng nghỉ dọc đường, điểm chụp ảnh check-in tuyệt đẹp, các quán ăn ngon nổi tiếng của người bản xứ và lời khuyên chuẩn bị trang phục, thời tiết Mộc Châu.`;

    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
        tools: [{ googleSearch: {} }]
      }
    });

    console.log("[AI Planner] Generation successful");
    const text = result.text;
    if (!text) {
      console.error("[AI Planner] No text in response", JSON.stringify(result));
      throw new Error("Mô hình không trả về nội dung (có thể do bộ lọc an toàn hoặc giới hạn kĩ thuật).");
    }

    res.json({
      success: true,
      itinerary: text,
      groundingMetadata: result.candidates?.[0]?.groundingMetadata
    });

  } catch (error: any) {
    console.error("Error in AI itinerary planner:", error);
    
    let message = "Có lỗi xảy ra khi gọi trợ lý ảo. Vui lòng thử lại sau.";
    let status = 500;

    if (error.status === 429 || error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED")) {
      message = "Hệ thống đang đạt giới hạn lượt yêu cầu (Quota Limit). Quý khách vui lòng đợi khoảng 60 giây và nhấn 'Thiết Kế Tour' lần nữa để thử lại.";
      status = 429;
    }

    res.status(status).json({
      success: false,
      message,
      error: error.message
    });
  }
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

startServer();
