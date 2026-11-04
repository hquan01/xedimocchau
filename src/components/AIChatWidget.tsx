import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Sparkles, Car, Calendar, Compass } from "lucide-react";

interface Message {
  role: "user" | "model";
  text: string;
}

interface AIChatWidgetProps {
  onOpenLimousine?: () => void;
  onOpenAIPlanner?: () => void;
  hideLauncher?: boolean;
}

export default function AIChatWidget({ onOpenLimousine, onOpenAIPlanner, hideLauncher = false }: AIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      text: "Xin chào! Tôi là Trợ lý AI Mộc Châu Travel. Bạn cần tôi tư vấn về thời tiết mùa hoa mận, lịch trình du lịch 2 ngày 1 đêm hay đặt vé xe QT Limousine không?"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(()=>{const open=()=>setIsOpen(true);window.addEventListener('mocchau:open-ai',open);return()=>window.removeEventListener('mocchau:open-ai',open)},[]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    const newMessages: Message[] = [...messages, { role: "user", text: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const history = newMessages.slice(0, -1).map(m => ({
        role: m.role,
        text: m.text
      }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, history })
      });
      const data = await res.json();

      if (data.success && data.reply) {
        setMessages([...newMessages, { role: "model", text: data.reply }]);
      } else {
        setMessages([
          ...newMessages,
          { role: "model", text: "Xin lỗi bạn, trợ lý AI đang bận chút. Bạn có thể gọi hotline 0971.050.324 để được hỗ trợ nhanh nhé!" }
        ]);
      }
    } catch (err) {
      console.error("AI Chat error:", err);
      setMessages([
        ...newMessages,
        { role: "model", text: "Có lỗi kết nối xảy ra. Vui lòng thử lại sau giây lát." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (text: string) => {
    setInput(text);
  };

  return (
    <div className="fixed bottom-22 right-3.5 sm:bottom-8 sm:right-8 z-45 font-sans print:hidden">
      {!isOpen ? (hideLauncher ? null : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-[#1b4332] hover:bg-emerald-800 text-white p-3 sm:p-4 rounded-full shadow-2xl flex items-center gap-2.5 transition-all duration-300 hover:scale-105 group border-2 border-emerald-400/30 cursor-pointer min-h-[44px] min-w-[44px]"
          title="Trợ lý AI Mộc Châu Travel"
          aria-label="Mở Trợ lý AI Mộc Châu"
          id="floating_ai_assistant_btn"
        >
          <div className="relative flex items-center justify-center">
            <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-[#1b4332]"></span>
          </div>
          <span className="font-extrabold text-xs sm:text-sm tracking-wide hidden sm:inline pr-1">
            Trợ lý AI Mộc Châu
          </span>
        </button>
      )) : (
        <div className="fixed inset-x-2 bottom-16 sm:inset-auto sm:right-6 sm:bottom-8 w-auto sm:w-[400px] h-[78vh] sm:h-[520px] max-w-full bg-white rounded-3xl shadow-2xl flex flex-col border border-stone-200 overflow-hidden animate-scale-up z-[120]">
          {/* Header */}
          <div className="bg-[#1b4332] text-white p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-amber-400/20 flex items-center justify-center border border-amber-400/30">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm tracking-tight">Trợ lý AI Mộc Châu Travel</h3>
                <p className="text-[11px] text-emerald-200 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Sẵn sàng tư vấn 24/7
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-stone-300 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Action Suggestions */}
          <div className="bg-stone-50 px-3 py-2 border-b border-stone-200 flex gap-1.5 overflow-x-auto text-[11px] shrink-0 no-scrollbar">
            <button
              onClick={() => handleQuickPrompt("Thời tiết và mùa hoa mận Mộc Châu tháng này thế nào?")}
              className="bg-white hover:bg-emerald-50 text-stone-700 px-2.5 py-1 rounded-full border border-stone-200 whitespace-nowrap shadow-xs transition-colors"
            >
              🌸 Mùa hoa & Thời tiết
            </button>
            <button
              onClick={() => handleQuickPrompt("Gợi ý lịch trình du lịch Mộc Châu 2 ngày 1 đêm")}
              className="bg-white hover:bg-emerald-50 text-stone-700 px-2.5 py-1 rounded-full border border-stone-200 whitespace-nowrap shadow-xs transition-colors"
            >
              🗺️ Lịch trình 2N1Đ
            </button>
            <button
              onClick={() => {
                if (onOpenLimousine) onOpenLimousine();
                setIsOpen(false);
              }}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold px-2.5 py-1 rounded-full border border-emerald-300 whitespace-nowrap shadow-xs transition-colors flex items-center gap-1"
            >
              <Car className="w-3 h-3 text-emerald-700" /> Đặt xe Limousine
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-stone-50/50">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "model" && (
                  <div className="w-7 h-7 rounded-full bg-[#1b4332] text-amber-300 flex items-center justify-center shrink-0 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                    m.role === "user"
                      ? "bg-[#1b4332] text-white rounded-br-xs"
                      : "bg-white text-stone-800 border border-stone-200/80 rounded-bl-xs"
                  }`}
                >
                  {m.text}
                </div>
                {m.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-stone-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2.5 items-center text-stone-400 text-xs italic">
                <div className="w-7 h-7 rounded-full bg-[#1b4332] text-amber-300 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  <span>AI đang soạn tư vấn...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-stone-200 flex gap-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi về Mộc Châu..."
              className="flex-1 bg-stone-100 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 focus:outline-none focus:border-emerald-600 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-[#1b4332] hover:bg-emerald-800 disabled:opacity-50 text-white p-2.5 rounded-xl transition-colors shadow-md flex items-center justify-center cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
