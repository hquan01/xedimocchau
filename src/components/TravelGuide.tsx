import React, { useState } from "react";
import { 
  BookOpen, Heart, Search, Compass, Utensils, Calendar, Sparkles, 
  MapPin, Clock, ArrowRight, CheckCircle2, Bookmark, Flame, 
  Share2, ArrowLeft, Bus, Camera, Eye
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GuideArticle } from "../types";

interface TravelGuideProps {
  articles: GuideArticle[];
  initialArticleId?: string | null;
}

export default function TravelGuide({ articles, initialArticleId }: TravelGuideProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "checkin" | "food" | "tips" | "season">("all");
  const [readingArticle, setReadingArticle] = useState<GuideArticle | null>(null);
  const openedInitialId = React.useRef<string | null>(null);
  // A banner opens the actual article reader, not just the guide index.
  React.useEffect(() => {
    if(!initialArticleId){openedInitialId.current=null;return;}
    const linked=articles.find(article=>article.id===initialArticleId);
    if(linked&&openedInitialId.current!==initialArticleId){
      openedInitialId.current=initialArticleId;
      setReadingArticle(linked);
    }
  },[articles,initialArticleId]);
  const [likedArticles, setLikedArticles] = useState<Record<string, boolean>>({});
  const [savedArticles, setSavedArticles] = useState<Record<string, boolean>>({});
  const [displayCount, setDisplayCount] = useState(4);
  
  // Packing Tool state
  const [packingItems, setPackingItems] = useState([
    { id: 1, text: "Giấy tờ tùy thân (CCCD, Bằng lái xe)", checked: true, category: "Mộc Châu Essentials" },
    { id: 2, text: "Áo khoác gió nhẹ (Mộc Châu se lạnh về đêm)", checked: false, category: "Mộc Châu Essentials" },
    { id: 3, text: "Điện thoại, sạc dự phòng, máy ảnh", checked: false, category: "Thiết bị" },
    { id: 4, text: "Thuốc chống xịt muỗi, kem chống nắng", checked: false, category: "Mộc Châu Essentials" },
    { id: 5, text: "Trang phục váy áo màu trắng/vàng chụp đồi chè cực sang", checked: false, category: "Điểm chụp ảnh" },
    { id: 6, text: "Đồ ăn nhẹ dọc đường (Nước, xôi nếp...)", checked: false, category: "Thiết bị" }
  ]);

  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedArticles(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedArticles(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleShare = (article: GuideArticle, e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.excerpt,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Đã sao chép liên kết bài viết!");
    }
  };

  const handleReadArticle = (article: GuideArticle) => {
    setReadingArticle(article);
    // Simulate updating view count locally
    article.views += 1;
  };

  const handleTogglePacking = (id: number) => {
    setPackingItems(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          article.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const visibleArticles = filteredArticles.slice(0, displayCount);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "checkin": return <Camera className="w-4 h-4" />;
      case "food": return <Utensils className="w-4 h-4" />;
      case "tips": return <Compass className="w-4 h-4" />;
      case "season": return <Calendar className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="travel_guide_container">
      {/* Visual Header Grid */}
      <div className="text-center md:text-left mb-8 space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-800 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Thông tin hữu ích - Review có tâm</span>
        </div>
        <h1 className="text-2xl sm:text-3.5xl font-extrabold text-[#1b4332] tracking-tight">
          Cẩm Nang Du Lịch Mộc Châu
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 max-w-2xl leading-relaxed">
          Tổng hợp kinh nghiệm bỏ túi mới nhất năm 2026, những quán ăn ngon chuẩn vị Tây Bắc, các địa điểm sống ảo lý tưởng giúp chuyến vi vu của bạn trọn vẹn hơn.
        </p>
      </div>

      {/* Main Grid: Articles + Packing Tool Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Articles List & Filters */}
        <div className="lg:col-span-2 space-y-6">
          {/* Controls Bar: Search & Filter Tabs */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="Tìm bài viết, mẹo du lịch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-500 text-stone-800"
              />
            </div>

            {/* Scrollable Category Filter */}
            <div className="flex space-x-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
              {(["all", "checkin", "food", "tips", "season"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center space-x-1 ${
                    selectedCategory === cat
                      ? "bg-[#1b4332] text-white shadow-sm shadow-[#1a3a2c]/10"
                      : "bg-stone-50 text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  {getCategoryIcon(cat)}
                  <span>
                    {cat === "all" ? "Tất cả" :
                     cat === "checkin" ? "Điểm hot" :
                     cat === "food" ? "Ẩm thực" :
                     cat === "tips" ? "Mẹo vặt" : "Mùa hoa"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Regular Articles List View with Motion */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {visibleArticles.length > 0 ? (
                visibleArticles.map((article) => {
                  const liked = likedArticles[article.id];
                  return (
                    <motion.div
                      key={article.id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="bg-white border border-stone-200 rounded-2xl overflow-hidden hover:shadow-md transition-all flex flex-col group cursor-pointer"
                      onClick={() => handleReadArticle(article)}
                      id={`article_card_${article.id}`}
                    >
                      {/* Image Frame */}
                      <div className="relative aspect-video w-full overflow-hidden bg-stone-100">
                        <img
                          src={article.imageUrl || null}
                          alt={article.title}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                          <span className="px-2.5 py-1 bg-stone-900/85 backdrop-blur-xs text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                            {article.categoryLabel}
                          </span>
                          {article.isHot && (
                            <span className="px-2 py-0.5 bg-amber-500 text-stone-950 font-extrabold text-[10px] rounded-full flex items-center space-x-0.5">
                              <Flame className="w-3 h-3 animate-pulse fill-current shrink-0" />
                              <span>HOT</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Info & Description */}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2.5 text-[10px] text-stone-400 font-sans font-medium">
                            <span className="flex items-center space-x-0.5">
                              <Clock className="w-3 h-3 shrink-0" />
                              <span>{article.readTime} đọc</span>
                            </span>
                            <span>•</span>
                            <span>{article.date}</span>
                          </div>
                          <h3 className="font-extrabold text-[#1b4332] text-sm sm:text-base leading-snug group-hover:text-emerald-700 transition-colors line-clamp-2">
                            {article.title}
                          </h3>
                          <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                            {article.excerpt}
                          </p>
                        </div>

                        {/* Interactive footer details */}
                        <div className="mt-4 pt-3.5 border-t border-stone-100 flex items-center justify-between">
                          <span className="text-xs text-emerald-600 font-bold flex items-center space-x-1 hover:underline">
                            <span>Đọc tiếp</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                          </span>

                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-0.5 text-[10px] text-stone-400 font-bold bg-stone-50 px-2 py-0.5 rounded-md">
                              <Eye className="w-3 h-3" />
                              <span>{article.views}</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => toggleLike(article.id, e)}
                              className={`flex items-center space-x-1 p-1 px-2 bg-stone-50 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors ${
                                liked ? "text-rose-600 bg-rose-50" : "text-stone-400 hover:text-rose-600"
                              }`}
                              title={liked ? "Bỏ thích" : "Yêu thích"}
                              id={`like_btn_${article.id}`}
                            >
                              <Heart className={`w-3.5 h-3.5 ${liked ? "fill-current text-rose-600" : ""}`} />
                              <span className="font-mono text-[10px]">{article.likes + (liked ? 1 : 0)}</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => toggleSave(article.id, e)}
                              className={`p-1 px-2 bg-stone-50 hover:bg-emerald-50 rounded-lg text-xs font-semibold transition-colors ${
                                savedArticles[article.id] ? "text-emerald-600 bg-emerald-50" : "text-stone-400 hover:text-emerald-600"
                              }`}
                              title={savedArticles[article.id] ? "Bỏ lưu" : "Lưu bài viết"}
                            >
                              <Bookmark className={`w-3.5 h-3.5 ${savedArticles[article.id] ? "fill-current text-emerald-600" : ""}`} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleShare(article, e)}
                              className="p-1 px-2 bg-stone-50 hover:bg-emerald-50 rounded-lg text-stone-400 hover:text-emerald-600 transition-colors"
                              title="Chia sẻ"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="col-span-full py-12 text-center text-stone-400 space-y-2">
                  <BookOpen className="w-12 h-12 text-stone-300 mx-auto stroke-1" />
                  <p className="text-sm font-semibold">Không tìm thấy bài viết nào phù hợp.</p>
                  <p className="text-xs text-stone-400">Hãy thử nhập từ khóa tìm kiếm khác</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {displayCount < filteredArticles.length && (
            <div className="text-center mt-4">
              <button 
                onClick={() => setDisplayCount(prev => prev + 4)}
                className="bg-white border-2 border-emerald-600 text-emerald-600 px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all cursor-pointer shadow-lg shadow-emerald-900/10"
              >
                Xem thêm bài viết
              </button>
            </div>
          )}
        </div>

        {/* Right Col: Extra Dynamic Widgets (Packing list & Weather warning) */}
        <div className="space-y-6">
          {/* Packing items helper */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4" id="packing_tool_widget">
            <div className="flex items-center space-x-2.5 border-b border-stone-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                🧳
              </div>
              <div>
                <h3 className="font-extrabold text-stone-800 text-sm">Checklist Chuẩn Bị Đồ</h3>
                <p className="text-[11px] text-stone-400">Canh chỉnh hành lý hoàn hảo khi đi Tây Bắc</p>
              </div>
            </div>

            <div className="space-y-2">
              {packingItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTogglePacking(item.id)}
                  className="w-full flex items-start space-x-2.5 p-2 rounded-xl text-left bg-stone-50 hover:bg-stone-100/70 transition-colors border border-transparent hover:border-stone-200 cursor-pointer text-xs"
                >
                  <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${item.checked ? "text-emerald-600 fill-emerald-50" : "text-stone-300"}`} />
                  <div className="flex-1">
                    <span className={`font-semibold ${item.checked ? "line-through text-stone-400 font-medium" : "text-stone-700"}`}>
                      {item.text}
                    </span>
                    <span className="block text-[9px] font-bold text-stone-400 uppercase mt-0.5 tracking-wider font-sans">
                      {item.category}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-2 text-center">
              <p className="text-[10px] text-stone-400 leading-normal">
                💡 Tây Bắc có khí hậu biên độ nhiệt ngày/đêm lớn. Vui lòng mang đủ áo khoác mỏng ấm để tránh bị nhiễm lạnh sương buổi tối.
              </p>
            </div>
          </div>

          {/* Local specialties recommendation banner */}
          <div className="bg-[#1b4332] text-stone-100 p-5 rounded-2xl shadow-sm space-y-4 relative overflow-hidden">
            <div className="absolute opacity-5 -right-6 -bottom-6">
              <Utensils className="w-32 h-32 text-stone-100" />
            </div>
            
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Đặc sản mua làm quà</span>
              <h3 className="text-base font-extrabold">Mua gì làm quà tại Mộc Châu?</h3>
            </div>

            <ul className="space-y-2.5 text-xs text-stone-200 font-sans font-medium">
              <li className="flex items-start space-x-2">
                <span className="text-amber-400 shrink-0 mt-0.5">✔</span>
                <span><strong>Sữa tơi, Bánh sữa Mộc Châu:</strong> Mua trực tiếp từ hệ thống Nông trường vắt sữa bò sạch.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-amber-400 shrink-0 mt-0.5">✔</span>
                <span><strong>Chè Mộc Châu (Shan Tuyết, Ô Long):</strong> Hương thơm thanh tao ngọt sâu đặc trưng.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-amber-400 shrink-0 mt-0.5">✔</span>
                <span><strong>Mận hậu, hồng giòn:</strong> Mua đúng mùa giá cực rẻ trực tiếp tại sườn đồi hoang vu.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-amber-400 shrink-0 mt-0.5">✔</span>
                <span><strong>Bánh khảo, măng chua Tây Bắc:</strong> Đặc sắc thơm nồng vị gia vị rừng sâu.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Article Detail Reader Modal */}
      <AnimatePresence>
        {readingArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setReadingArticle(null)}
            id="article_detail_modal_backdrop"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl relative"
              id="article_detail_modal_paper"
            >
              {/* Header Image Cover */}
              <div className="relative aspect-video w-full bg-stone-100">
                <img
                  src={readingArticle.imageUrl || null}
                  alt={readingArticle.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setReadingArticle(null)}
                  className="absolute top-4 left-4 p-2 bg-white/90 backdrop-blur-xs text-stone-800 hover:bg-stone-100 hover:text-stone-950 rounded-full cursor-pointer shadow-sm transition-all"
                  aria-label="Đóng"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>

              {/* Main reading content container */}
              <div className="p-6 md:p-8 space-y-5">
                <div className="flex items-center space-x-3 text-xs text-stone-400 font-sans">
                  <span className="px-2.5 py-1 bg-stone-100 text-[#1b4332] font-extrabold uppercase rounded-full">
                    {readingArticle.categoryLabel}
                  </span>
                  <span>•</span>
                  <span>{readingArticle.date}</span>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{readingArticle.views}</span>
                  </div>
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold text-[#1b4332] tracking-tight leading-snug">
                  {readingArticle.title}
                </h2>

                <div className="space-y-4 text-xs sm:text-sm text-stone-600 leading-relaxed font-sans font-medium whitespace-pre-wrap">
                  {readingArticle.content.map((paragraph, index) => (
                    <p key={index} className="indent-4">
                      {paragraph}
                    </p>
                  ))}
                </div>

                {readingArticle.albumImages && readingArticle.albumImages.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[#1b4332]">
                      <Camera className="w-4 h-4" />
                      <span className="text-xs font-black uppercase tracking-wider">Album ảnh thực tế</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {readingArticle.albumImages.map((img, idx) => (
                        <div key={idx} className="aspect-square rounded-2xl overflow-hidden border border-stone-100 group/img cursor-zoom-in">
                          <img 
                            src={img || null} 
                            alt={`Album ${idx}`} 
                            loading="lazy"
                            className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500" 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer Modal Info */}
                <div className="pt-6 border-t border-stone-100 flex items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={(e) => toggleLike(readingArticle.id, e)}
                      className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        likedArticles[readingArticle.id] 
                          ? "text-rose-600 bg-rose-50 border border-rose-100" 
                          : "text-stone-500 bg-stone-50 hover:text-rose-600 hover:bg-rose-50"
                      }`}
                      id="modal_like_btn"
                    >
                      <Heart className={`w-4 h-4 ${likedArticles[readingArticle.id] ? "fill-current text-rose-600" : ""}`} />
                      <span>{likedArticles[readingArticle.id] ? "Đã thích" : "Yêu thích"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => toggleSave(readingArticle.id, e)}
                      className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        savedArticles[readingArticle.id] 
                          ? "text-emerald-600 bg-emerald-50 border border-emerald-100" 
                          : "text-stone-500 bg-stone-50 hover:text-emerald-600 hover:bg-emerald-50"
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${savedArticles[readingArticle.id] ? "fill-current text-emerald-600" : ""}`} />
                      <span>{savedArticles[readingArticle.id] ? "Đã lưu" : "Lưu bài"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleShare(readingArticle, e)}
                      className="flex items-center space-x-1.5 px-3.5 py-2 bg-stone-50 text-stone-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl text-xs font-bold transition-all"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Chia sẻ</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setReadingArticle(null)}
                    className="px-5 py-2 bg-[#1b4332] hover:bg-[#122e22] text-white font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-md shadow-[#1b4332]/10"
                  >
                    Đóng bài đọc
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
