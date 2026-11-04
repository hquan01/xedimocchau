import React, { useState } from "react";
import { 
  Users, 
  MessageSquare, 
  Search, 
  ExternalLink, 
  ShieldCheck, 
  PlusCircle, 
  ThumbsUp, 
  Flag, 
  Bus, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ArrowRight
} from "lucide-react";
import { User, ZaloGroup, CommunityQuestion } from "../types";
import { saveCommunityQuestionToFirebase } from "../lib/firebaseUtils";

interface CommunityViewProps {
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  zaloGroups?: ZaloGroup[];
}

export default function CommunityView({ 
  setActiveTab, 
  currentUser, 
  onOpenAuth,
  zaloGroups = []
}: CommunityViewProps) {
  // Main view tab: Zalo Groups Hub vs Website Q&A
  const [activeHubTab, setActiveHubTab] = useState<"zalo" | "qa">("zalo");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Question posting modal & state
  const [isPostingModalOpen, setIsPostingModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newContent, setNewContent] = useState<string>("");
  const [newTopic, setNewTopic] = useState<string>("Hỏi đáp");
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Real Questions Data from localStorage / Firestore
  const [questions, setQuestions] = useState<CommunityQuestion[]>(() => {
    try {
      const stored = localStorage.getItem("xemc_community_questions");
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [
      {
        id: "q_init_1",
        authorName: "Nguyễn Minh Tuấn",
        authorRole: "customer",
        topic: "Lịch trình",
        title: "Kinh nghiệm đi Mộc Châu 2 ngày 1 đêm cho gia đình có con nhỏ?",
        content: "Chào cả nhà, cuối tuần này gia đình mình định đi Mộc Châu bằng xe Limousine đón tận nhà. Nhà mình có bé 4 tuổi, xin mọi người tư vấn điểm tham quan thoáng đãng, dễ đi lại và không quá dốc ạ.",
        timestamp: "02/11/2026 10:20",
        likes: 12,
        status: "published",
        comments: [
          {
            id: "c_1",
            authorName: "Trần Mai Phương",
            content: "Nên ghé Rừng thông Bản Áng dạo hồ và Đồi chè Trái Tim bạn nhé, đường bê tông bằng phẳng, xe đẩy đi vô tư!",
            timestamp: "02/11/2026 11:05"
          }
        ]
      },
      {
        id: "q_init_2",
        authorName: "Hoàng Lan Anh",
        authorRole: "customer",
        topic: "Thời tiết",
        title: "Hiện tại thung lũng Nà Ka hoa mận đã bắt đầu chớm nở chưa ạ?",
        content: "Mình dự định lên Mộc Châu giữa tuần tới để chụp ảnh kỷ yếu. Nhờ anh chị ở địa phương cập nhật giúp tình hình thời tiết và hoa mận với ạ.",
        timestamp: "01/11/2026 16:45",
        likes: 9,
        status: "published",
        comments: []
      }
    ];
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter Active, Non-Deleted Zalo Groups
  const activeGroups = (zaloGroups.length > 0 ? zaloGroups : []).filter(g => g.isActive && !g.isDeleted);

  // Topics for Zalo and Forum
  const topics = [
    { id: "all", label: "Tất cả chủ đề" },
    { id: "Hỏi đáp", label: "Hỏi đáp chung" },
    { id: "Thời tiết", label: "Thời tiết & Mùa hoa" },
    { id: "Lưu trú", label: "Homestay & Khách sạn" },
    { id: "Ăn uống", label: "Nhà hàng & Ẩm thực" },
    { id: "Di chuyển", label: "Lịch trình & Đặt xe" },
  ];

  const filteredZaloGroups = activeGroups.filter(group => {
    const matchesTopic = selectedTopic === "all" || group.topic === selectedTopic || group.topic.toLowerCase().includes(selectedTopic.toLowerCase());
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          group.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTopic && matchesSearch;
  });

  const filteredQuestions = questions.filter(q => {
    if (q.status === "hidden") return false;
    const matchesTopic = selectedTopic === "all" || q.topic === selectedTopic;
    const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          q.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTopic && matchesSearch;
  });

  const handleJoinZalo = (group: ZaloGroup) => {
    if (!group.zaloUrl) {
      alert("Đường link Zalo đang được cập nhật!");
      return;
    }
    // Real outward redirect to configured Zalo link
    window.open(group.zaloUrl, "_blank", "noopener,noreferrer");
  };

  const handleCreateQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Vui lòng đăng nhập tài khoản để gửi câu hỏi!");
      onOpenAuth();
      return;
    }
    if (!newTitle.trim() || !newContent.trim()) {
      alert("Vui lòng điền tiêu đề và nội dung câu hỏi!");
      return;
    }

    const newQ: CommunityQuestion = {
      id: `q_${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name || "Khách Mộc Châu Travel",
      authorPhone: currentUser.phone,
      authorRole: currentUser.role || "customer",
      topic: newTopic,
      title: newTitle.trim(),
      content: newContent.trim(),
      timestamp: new Date().toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }),
      likes: 0,
      status: "published",
      comments: []
    };

    const nextList = [newQ, ...questions];
    setQuestions(nextList);
    localStorage.setItem("xemc_community_questions", JSON.stringify(nextList));
    saveCommunityQuestionToFirebase(newQ);

    setNewTitle("");
    setNewContent("");
    setIsPostingModalOpen(false);
    showToast("Câu hỏi của bạn đã được đăng thành công lên diễn đàn!");
  };

  const handleAddComment = (questionId: string) => {
    if (!currentUser) {
      alert("Vui lòng đăng nhập để bình luận trả lời!");
      onOpenAuth();
      return;
    }
    if (!commentText.trim()) return;

    const nextList = questions.map(q => {
      if (q.id === questionId) {
        const updated = {
          ...q,
          comments: [
            ...q.comments,
            {
              id: `c_${Date.now()}`,
              authorName: currentUser.name || "Khách du lịch",
              content: commentText.trim(),
              timestamp: new Date().toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })
            }
          ]
        };
        saveCommunityQuestionToFirebase(updated);
        return updated;
      }
      return q;
    });

    setQuestions(nextList);
    localStorage.setItem("xemc_community_questions", JSON.stringify(nextList));
    setCommentText("");
    showToast("Bình luận của bạn đã được gửi!");
  };

  const handleLike = (questionId: string) => {
    const nextList = questions.map(q => {
      if (q.id === questionId) {
        const updated = { ...q, likes: (q.likes || 0) + 1 };
        saveCommunityQuestionToFirebase(updated);
        return updated;
      }
      return q;
    });
    setQuestions(nextList);
    localStorage.setItem("xemc_community_questions", JSON.stringify(nextList));
  };

  const handleReport = (questionId: string) => {
    const nextList = questions.map(q => {
      if (q.id === questionId) {
        const nextReport = (q.reportCount || 0) + 1;
        const updated: CommunityQuestion = { 
          ...q, 
          reportCount: nextReport,
          status: nextReport >= 3 ? "hidden" : "reported"
        };
        saveCommunityQuestionToFirebase(updated);
        return updated;
      }
      return q;
    });
    setQuestions(nextList);
    localStorage.setItem("xemc_community_questions", JSON.stringify(nextList));
    showToast("Cảm ơn bạn. Báo cáo vi phạm đã được gửi tới quản trị viên để kiểm duyệt!");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/50 flex items-center gap-3 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-xs text-stone-500 mb-6">
        <button onClick={() => { setActiveTab("explore"); window.scrollTo({top: 0, behavior: "smooth"}); }} className="hover:text-emerald-700 cursor-pointer">Trang chủ</button>
        <span>/</span>
        <span className="text-emerald-800 font-bold">Trung tâm cộng đồng Mộc Châu</span>
      </div>

      {/* Hero Header Banner */}
      <div className="bg-gradient-to-r from-stone-950 via-[#113022] to-emerald-950 rounded-3xl p-6 sm:p-10 text-white shadow-2xl relative overflow-hidden mb-8 border border-emerald-900/40">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-400/40 text-blue-300 text-xs font-bold uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" />
              <span>Cộng Đồng Du Lịch Mộc Châu</span>
            </span>
            <span className="text-xs text-emerald-300 font-medium hidden sm:inline">
              · Đồng hành cùng QT Limousine
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-3 text-white">
            Kết Nối & Giao Lưu Cùng Hàng Ngàn Du Khách
          </h1>
          <p className="text-stone-300 text-xs sm:text-sm leading-relaxed mb-6">
            Tham gia các nhóm Zalo chuyên đề chính thức do ban điều hành Mộc Châu Travel quản trị, hoặc trao đổi trực tiếp trên diễn đàn hỏi đáp để có chuyến đi trọn vẹn nhất.
          </p>

          {/* Quick Stats / Highlights */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-stone-300 pt-2 border-t border-emerald-900/60">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>5 nhóm Zalo chuyên đề</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span>100% link thật chính chủ</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Hỗ trợ 24/7 từ tài xế & người bản địa</span>
            </div>
          </div>
        </div>
      </div>

      {/* QT Limousine Non-Intrusive Support Banner */}
      <div className="bg-gradient-to-r from-emerald-900/90 to-stone-900 text-white rounded-2xl p-4 sm:p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-emerald-700/50 shadow-md">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
            <Bus className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h4 className="font-extrabold text-white text-sm">Cần xe đón trả tận nơi Hà Nội ⇌ Mộc Châu?</h4>
            <p className="text-xs text-stone-300 mt-0.5">DCar Limousine VIP 9 chỗ đón tận cổng nhà, ghế massage êm ái, cam kết giữ chỗ 100%.</p>
          </div>
        </div>
        <button
          onClick={() => setActiveTab("limousine")}
          className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black rounded-xl text-xs tracking-wide shadow-md transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <span>Đặt xe QT Limousine</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main 2-Tab Segmented Selector (Zalo Hub vs Website Q&A) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <div className="inline-flex p-1.5 bg-stone-100 rounded-2xl border border-stone-200 shadow-inner">
          <button
            onClick={() => setActiveHubTab("zalo")}
            className={`px-6 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeHubTab === "zalo"
                ? "bg-[#0068FF] text-white shadow-md shadow-blue-500/20"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <span>💬 Mạng Lưới Nhóm Zalo ({activeGroups.length})</span>
          </button>
          <button
            onClick={() => setActiveHubTab("qa")}
            className={`px-6 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeHubTab === "qa"
                ? "bg-[#1b4332] text-white shadow-md shadow-emerald-900/20"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <span>📝 Diễn Đàn Hỏi Đáp Web ({filteredQuestions.length})</span>
          </button>
        </div>

        {/* Action Button for Q&A */}
        {activeHubTab === "qa" && (
          <button
            onClick={() => {
              if (!currentUser) onOpenAuth();
              else setIsPostingModalOpen(true);
            }}
            className="px-5 py-3 bg-[#1b4332] hover:bg-emerald-800 text-white font-extrabold rounded-2xl text-xs sm:text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-amber-300" />
            <span>Đặt câu hỏi mới</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full md:w-auto scrollbar-none">
          {topics.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTopic(t.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                selectedTopic === t.id
                  ? "bg-stone-900 text-white shadow-sm"
                  : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72 shrink-0">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeHubTab === "zalo" ? "Tìm nhóm Zalo theo chủ đề..." : "Tìm câu hỏi thảo luận..."}
            className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:border-blue-600 shadow-sm"
          />
        </div>
      </div>

      {/* TAB 1: ZALO GROUPS HUB */}
      {activeHubTab === "zalo" && (
        <div className="space-y-6">
          {filteredZaloGroups.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-sm">
              <Users className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <h3 className="text-base font-extrabold text-stone-800">Không tìm thấy nhóm Zalo phù hợp</h3>
              <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                Hiện chưa có nhóm nào trong chủ đề "{selectedTopic}". Vui lòng chọn chủ đề khác hoặc bấm Tất cả để xem danh sách.
              </p>
              <button
                onClick={() => { setSelectedTopic("all"); setSearchQuery(""); }}
                className="mt-4 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold cursor-pointer"
              >
                Xem tất cả các nhóm
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredZaloGroups.map((group) => (
                <div
                  key={group.id}
                  className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="space-y-3.5">
                    {/* Top Row: Icon & Topic */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                        {group.iconEmoji || "💬"}
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 inline-block">
                          {group.topic}
                        </span>
                        {group.memberCountNote && (
                          <span className="text-[10px] text-stone-400 block mt-1">
                            {group.memberCountNote}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Group Title & Description */}
                    <div>
                      <h3 className="font-black text-stone-900 text-base group-hover:text-blue-700 transition-colors">
                        {group.name}
                      </h3>
                      <p className="text-xs text-stone-600 mt-1.5 leading-relaxed line-clamp-3">
                        {group.description}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Action: Join Zalo Button */}
                  <div className="pt-5 mt-5 border-t border-stone-100 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Nhóm chính thức</span>
                    </span>

                    <button
                      onClick={() => handleJoinZalo(group)}
                      className="px-4 py-2.5 bg-[#0068FF] hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95"
                    >
                      <span>Vào Zalo ngay</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WEBSITE Q&A FORUM */}
      {activeHubTab === "qa" && (
        <div className="space-y-5">
          {filteredQuestions.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-sm">
              <MessageSquare className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <h3 className="text-base font-extrabold text-stone-800">Chưa có câu hỏi nào trong mục này</h3>
              <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                Hãy là người đầu tiên đặt câu hỏi để nhận được câu trả lời tận tình từ ban quản trị và cộng đồng!
              </p>
              <button
                onClick={() => {
                  if (!currentUser) onOpenAuth();
                  else setIsPostingModalOpen(true);
                }}
                className="mt-4 px-5 py-2.5 bg-[#1b4332] text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-emerald-800"
              >
                Đặt câu hỏi ngay
              </button>
            </div>
          ) : (
            filteredQuestions.map((q) => (
              <div
                key={q.id}
                className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-md space-y-4"
              >
                {/* Author Info & Topic */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-900 font-black flex items-center justify-center text-sm shrink-0">
                      {q.authorName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-stone-900 text-xs sm:text-sm">{q.authorName}</span>
                        {q.authorRole === "operator" ? (
                          <span className="text-[10px] bg-amber-100 text-amber-900 font-extrabold px-1.5 py-0.5 rounded">
                            Nhà xe điều hành
                          </span>
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                      </div>
                      <span className="text-[10px] text-stone-400 block">{q.timestamp}</span>
                    </div>
                  </div>

                  <span className="text-[11px] font-extrabold bg-stone-100 text-stone-700 px-3 py-1 rounded-full border border-stone-200">
                    {q.topic}
                  </span>
                </div>

                {/* Question Body */}
                <div>
                  <h3 className="font-extrabold text-stone-900 text-sm sm:text-base leading-snug">
                    {q.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-700 mt-1.5 leading-relaxed">
                    {q.content}
                  </p>
                </div>

                {/* Footer Reactions & Report */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-stone-600">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLike(q.id)}
                      className="px-3 py-1.5 bg-stone-50 hover:bg-stone-100 rounded-xl border border-stone-200 flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <ThumbsUp className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Hữu ích ({q.likes || 0})</span>
                    </button>

                    <button
                      onClick={() => setActiveQuestionId(activeQuestionId === q.id ? null : q.id)}
                      className="px-3 py-1.5 bg-stone-50 hover:bg-stone-100 rounded-xl border border-stone-200 flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                      <span>Trả lời ({q.comments?.length || 0})</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleReport(q.id)}
                    className="text-stone-400 hover:text-red-600 text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                    title="Báo cáo câu hỏi không phù hợp"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Báo cáo</span>
                  </button>
                </div>

                {/* Comments Section */}
                {activeQuestionId === q.id && (
                  <div className="mt-3 pt-3 border-t border-stone-200 space-y-3 bg-stone-50/70 p-4 rounded-2xl">
                    <div className="space-y-2.5">
                      {q.comments.length === 0 ? (
                        <p className="text-xs text-stone-500 italic">Chưa có câu trả lời nào. Bạn hãy là người đầu tiên chia sẻ!</p>
                      ) : (
                        q.comments.map((c) => (
                          <div key={c.id} className="bg-white p-3 rounded-xl border border-stone-200 text-xs shadow-xs">
                            <div className="flex items-center justify-between font-bold text-stone-800 mb-1">
                              <span>{c.authorName}</span>
                              <span className="text-[10px] text-stone-400">{c.timestamp}</span>
                            </div>
                            <p className="text-stone-700 leading-relaxed">{c.content}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add reply input */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder={currentUser ? "Viết câu trả lời của bạn..." : "Vui lòng đăng nhập để bình luận..."}
                        disabled={!currentUser}
                        className="flex-1 px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600"
                      />
                      <button
                        onClick={() => handleAddComment(q.id)}
                        disabled={!currentUser}
                        className="px-4 py-2.5 bg-[#1b4332] hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Gửi
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Posting Modal */}
      {isPostingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 animate-scale-up">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
              <h3 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
                <span>✍️ Đặt Câu Hỏi Cho Cộng Đồng Mộc Châu</span>
              </h3>
              <button
                onClick={() => setIsPostingModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Chủ đề câu hỏi</label>
                <select
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-800 focus:outline-none focus:border-emerald-600"
                >
                  <option value="Hỏi đáp">Hỏi đáp chung</option>
                  <option value="Thời tiết">Thời tiết & Mùa hoa</option>
                  <option value="Lưu trú">Homestay & Khách sạn</option>
                  <option value="Ăn uống">Nhà hàng & Ẩm thực</option>
                  <option value="Di chuyển">Lịch trình & Đặt xe</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Tiêu đề ngắn gọn</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Xin kinh nghiệm đi xe Limousine và săn mây Tà Xùa..."
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Nội dung chi tiết</label>
                <textarea
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Mô tả cụ thể thắc mắc của bạn (thời gian dự kiến đi, số lượng người, sở thích...)"
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPostingModalOpen(false)}
                  className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#1b4332] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md"
                >
                  Đăng Câu Hỏi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
