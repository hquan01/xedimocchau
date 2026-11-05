import React, { useState } from "react";
import { Layers, Sparkles, CheckCircle2, AlertCircle, RefreshCw, MessageSquare, Send, BookOpen, Plus, Trash2, Edit2 } from "lucide-react";

export interface AIKnowledgeItem {
  id: string;
  topic: string;
  question: string;
  answer: string;
  category: "TRANSPORT" | "WEATHER" | "FOOD" | "ACCOMMODATION" | "DESTINATION";
  priority: number;
}

const DEFAULT_FAQ: AIKnowledgeItem[] = [
  {
    id: "faq-01",
    topic: "Vé xe QT Limousine",
    question: "Giá vé xe QT Limousine Hà Nội - Mộc Châu bao nhiêu?",
    answer: "Giá vé từ 300.000đ - 350.000đ/ghế tùy vị trí ghế thường hay ghế VIP massage trung tâm. Đón trả tận nơi tại nội thành Hà Nội và tận cửa homestay Mộc Châu. Hotline đặt vé: 0971.050.324.",
    category: "TRANSPORT",
    priority: 1
  },
  {
    id: "faq-02",
    topic: "Mùa hoa mận",
    question: "Mùa hoa mận Mộc Châu nở vào tháng mấy và ở đâu đẹp nhất?",
    answer: "Hoa mận Mộc Châu nở rộ nhất vào Tháng 1 - Tháng 2 hàng năm. Điểm ngắm hoa đẹp nhất là Thung lũng mận Nà Ka và Thung lũng Mu Náu, Ba Phách. Thời điểm chụp ảnh lung linh nhất là 8h00 - 10h00 sáng khi nắng mai chiếu qua sương mỏng.",
    category: "DESTINATION",
    priority: 2
  },
  {
    id: "faq-03",
    topic: "Thời tiết & Trang phục",
    question: "Đi Mộc Châu mùa này cần chuẩn bị quần áo gì?",
    answer: "Mộc Châu nằm trên cao nguyên độ cao hơn 1.050m nên ban ngày mát mẻ nhưng chiều tối và sáng sớm nhiệt độ hạ nhanh (thường se lạnh 16-20°C). Bạn nên mang theo áo khoác ấm mỏng, khăn choàng và giày thể thao có độ bám tốt để leo đồi mận.",
    category: "WEATHER",
    priority: 3
  },
  {
    id: "faq-04",
    topic: "Đặc sản Mộc Châu",
    question: "Đến Mộc Châu nên ăn món gì ngon?",
    answer: "Top đặc sản không thể bỏ qua: Bê chao nóng giòn chấm tương gừng, Lẩu cá hồi/Cá tầm măng cay, Lẩu gà đồi lá é, Cá suối chiên giòn và sữa chua nếp cẩm Mộc Châu.",
    category: "FOOD",
    priority: 4
  }
];

export default function AIAssistantManagement() {
  const [faqs, setFaqs] = useState<AIKnowledgeItem[]>(() => {
    try {
      const saved = localStorage.getItem("mocchau_operator_ai_faqs");
      return saved ? JSON.parse(saved) : DEFAULT_FAQ;
    } catch {
      return DEFAULT_FAQ;
    }
  });

  const [testQuery, setTestQuery] = useState("Thời tiết Mộc Châu hôm nay thế nào?");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [apiStatus, setApiStatus] = useState<"ready" | "fallback">("ready");
  const [isAddingFaq, setIsAddingFaq] = useState(false);

  // New FAQ Form
  const [newTopic, setNewTopic] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newCategory, setNewCategory] = useState<AIKnowledgeItem["category"]>("TRANSPORT");

  const handleTestChat = async () => {
    if (!testQuery.trim()) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: testQuery.trim() })
      });
      const data = await res.json();
      if (data && data.reply) {
        setTestResult(data.reply);
        setApiStatus("ready");
      } else {
        setTestResult("Không nhận được phản hồi từ AI.");
      }
    } catch (e: any) {
      setTestResult("Lỗi kết nối API: " + e.message);
      setApiStatus("fallback");
    } finally {
      setIsTesting(false);
    }
  };

  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    const item: AIKnowledgeItem = {
      id: `faq_${Date.now()}`,
      topic: newTopic.trim() || "Chung",
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
      category: newCategory,
      priority: faqs.length + 1
    };
    const updated = [item, ...faqs];
    try {
      const { saveCollectionItemsToFirebase } = await import("../../lib/firebaseUtils");
      await saveCollectionItemsToFirebase("ai_faqs", updated);
      setFaqs(updated);
      setIsAddingFaq(false);
      setNewTopic("");
      setNewQuestion("");
      setNewAnswer("");
    } catch (err: any) {
      alert("Chưa thể lưu tri thức AI lên máy chủ: " + (err?.message || "Lỗi kết nối"));
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (confirm("Xóa tri thức AI này khỏi kho tri thức?")) {
      const updated = faqs.filter(f => f.id !== id);
      try {
        const { saveCollectionItemsToFirebase } = await import("../../lib/firebaseUtils");
        await saveCollectionItemsToFirebase("ai_faqs", updated);
        setFaqs(updated);
      } catch (err: any) {
        alert("Chưa thể xóa tri thức AI trên máy chủ: " + (err?.message || "Lỗi kết nối"));
      }
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Overview status box */}
      <div className="bg-gradient-to-r from-stone-900 via-teal-950 to-emerald-950 p-6 rounded-3xl text-white shadow-xl border border-emerald-900/60 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Mô hình: Gemini 2.5 Flash • Server-Side Proxy</span>
            </div>
            <h3 className="text-xl font-black mt-2">Bảng Điều Khiển Trợ Lý Du Lịch Ảo AI</h3>
            <p className="text-xs text-stone-300 font-sans max-w-xl">
              Hệ thống trả lời tự động cho du khách về lịch trình, xe QT Limousine, thời tiết live từ dubaothoitiet.edu.vn, khách sạn và ẩm thực.
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-white/10 p-3.5 rounded-2xl border border-white/15">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-xs font-sans">
              <span className="text-stone-300 block">Trạng thái kết nối</span>
              <strong className="text-white font-mono">Hoạt động ổn định (Active)</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive AI Prompt Tester */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
        <h4 className="font-black text-stone-900 text-sm flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-emerald-700" />
          <span>Kiểm Tra Thử Trả Lời Của Trợ Lý AI (Live Sandbox)</span>
        </h4>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={testQuery}
            onChange={e => setTestQuery(e.target.value)}
            placeholder="Nhập câu hỏi thử nghiệm của khách du lịch..."
            className="flex-1 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-600"
          />
          <button
            onClick={handleTestChat}
            disabled={isTesting}
            className="px-5 py-2.5 bg-[#1b4332] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>{isTesting ? "Đang truy xuất..." : "Gửi thử câu hỏi"}</span>
          </button>
        </div>

        {testResult && (
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl text-xs text-stone-800 font-sans space-y-2">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
              Phản hồi từ mô hình AI:
            </span>
            <p className="whitespace-pre-line leading-relaxed">{testResult}</p>
          </div>
        )}
      </div>

      {/* FAQ Knowledge Base for Mộc Châu */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <h4 className="font-black text-stone-900 text-sm flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-emerald-700" />
              <span>Kho Tri Thức & Câu Hỏi Thường Gặp (FAQ Knowledge Base)</span>
            </h4>
            <p className="text-xs text-stone-500 font-sans mt-0.5">
              Các câu hỏi và câu trả lời chuẩn xác được nạp vào bộ não của trợ lý AI để trả lời nhất quán cho du khách.
            </p>
          </div>

          <button
            onClick={() => setIsAddingFaq(!isAddingFaq)}
            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAddingFaq ? "Đóng biểu mẫu" : "Thêm tri thức mới"}</span>
          </button>
        </div>

        {/* Add Form */}
        {isAddingFaq && (
          <form onSubmit={handleAddFaq} className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Chủ đề</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Xe Limousine đón trả"
                  value={newTopic}
                  onChange={e => setNewTopic(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Phân loại</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl"
                >
                  <option value="TRANSPORT">Vận chuyển xe QT Limousine</option>
                  <option value="WEATHER">Thời tiết & Trang phục</option>
                  <option value="FOOD">Ẩm thực & Đặc sản</option>
                  <option value="ACCOMMODATION">Homestay & Khách sạn</option>
                  <option value="DESTINATION">Địa điểm & Mùa hoa</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Câu hỏi mẫu của khách</label>
              <input
                type="text"
                required
                placeholder="Khách thường hỏi câu gì? (Ví dụ: Xe Limousine có đón tận nhà tại Hà Nội không?)"
                value={newQuestion}
                onChange={e => setNewQuestion(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Câu trả lời chuẩn của hệ thống</label>
              <textarea
                rows={3}
                required
                placeholder="Câu trả lời chi tiết và chính xác..."
                value={newAnswer}
                onChange={e => setNewAnswer(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingFaq(false)}
                className="px-4 py-2 border border-stone-200 rounded-xl font-bold text-stone-600 hover:bg-stone-100"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#1b4332] text-white font-bold rounded-xl hover:bg-emerald-800"
              >
                Lưu Tri Thức Mới
              </button>
            </div>
          </form>
        )}

        {/* List of Knowledge items */}
        <div className="space-y-3">
          {faqs.map(faq => (
            <div key={faq.id} className="p-4 rounded-2xl border border-stone-100 bg-stone-50/50 hover:bg-stone-50 transition-colors">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                    {faq.topic} • {faq.category}
                  </span>
                  <h5 className="font-bold text-stone-900 text-xs sm:text-sm mt-1.5">{faq.question}</h5>
                </div>
                <button
                  onClick={() => handleDeleteFaq(faq.id)}
                  className="p-1 text-stone-400 hover:text-red-600 rounded-lg cursor-pointer"
                  title="Xóa tri thức"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-stone-600 mt-2 font-sans leading-relaxed pl-2 border-l-2 border-emerald-500">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
