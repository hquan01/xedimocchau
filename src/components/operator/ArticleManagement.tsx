import React, { useState } from "react";
import { GuideArticle } from "../../types";
import { Plus, Edit2, Trash2, X, Check, Image as ImageIcon, Calendar, Clock, Flame, User as UserIcon, Eye, Heart, Bookmark, Upload } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ArticleManagementProps {
  articles: GuideArticle[];
  onUpdateArticles: (updated: GuideArticle[]) => void;
}

export default function ArticleManagement({ articles, onUpdateArticles }: ArticleManagementProps) {
  const [editingArticle, setEditingArticle] = useState<GuideArticle | null>(null);
  const [contentRaw, setContentRaw] = useState("");
  const [albumRaw, setAlbumRaw] = useState("");

  const handleSave = (updated: GuideArticle) => {
    // Convert raw strings back to arrays
    const finalContent = contentRaw.split('\n').filter(p => p.trim() !== '');
    const finalAlbum = albumRaw.split('\n').filter(url => url.trim() !== '');

    const cleanedArticle: GuideArticle = {
      ...updated,
      content: finalContent,
      albumImages: finalAlbum
    };
    
    const exists = articles.find(a => a.id === cleanedArticle.id);
    const nextArticles = exists 
      ? articles.map(a => a.id === cleanedArticle.id ? cleanedArticle : a)
      : [...articles, cleanedArticle];
    onUpdateArticles(nextArticles);
    setEditingArticle(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa bài viết này?")) {
      onUpdateArticles(articles.filter(a => a.id !== id));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isAlbum: boolean = false) => {
    const files = e.target.files;
    if (!files) return;

    const fileList = Array.from(files) as File[];
    
    fileList.forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (isAlbum) {
          setAlbumRaw(prev => prev ? `${prev}\n${base64String}` : base64String);
        } else if (editingArticle) {
          setEditingArticle({ ...editingArticle, imageUrl: base64String });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const startNew = () => {
    // Generate starter stats for viral look
    const starterViews = Math.floor(Math.random() * 500) + 800; // 800 - 1300 views
    const starterLikes = Math.floor(starterViews * (0.15 + Math.random() * 0.1)); // 15-25% of views
    const starterSaves = Math.floor(starterLikes * (0.3 + Math.random() * 0.2)); // 30-50% of likes

    const newArt: GuideArticle = {
      id: `article_${Date.now()}`,
      title: "",
      excerpt: "",
      content: [],
      imageUrl: "",
      category: "tips",
      categoryLabel: "Kinh nghiệm",
      readTime: "",
      date: new Date().toLocaleDateString('vi-VN'),
      views: starterViews,
      likes: starterLikes,
      saves: starterSaves,
      isHot: false
    };
    setEditingArticle(newArt);
    setContentRaw("");
    setAlbumRaw("");
  };

  const startEdit = (article: GuideArticle) => {
    setEditingArticle(article);
    setContentRaw(article.content.join('\n'));
    setAlbumRaw(article.albumImages?.join('\n') || '');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-black text-stone-800 uppercase tracking-tight">Danh sách bài viết Cẩm nang</h3>
        <button 
          onClick={startNew}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all cursor-pointer shadow-lg shadow-emerald-900/20"
        >
          <Plus className="w-4 h-4" />
          Viết Bài Mới
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {articles.map(article => (
          <div key={article.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <img src={article.imageUrl || "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=cover&w=400&q=80"} alt={article.title} className="w-24 h-24 rounded-lg object-cover" />
                <div className="flex-1">
                  <h4 className="font-bold text-stone-900 line-clamp-1">{article.title}</h4>
                  <p className="text-stone-500 text-xs mt-1 line-clamp-2">{article.excerpt}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className="text-[10px] bg-stone-100 text-[#1b4332] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">{article.categoryLabel}</span>
                    <span className="text-[10px] text-stone-400 font-bold flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {article.date}
                    </span>
                    <div className="flex items-center gap-2 border-l border-stone-200 pl-3 ml-1">
                      <span className="text-[10px] text-stone-400 flex items-center gap-1" title="Lượt xem"><Eye className="w-3 h-3" /> {article.views || 0}</span>
                      <span className="text-[10px] text-rose-400 flex items-center gap-1" title="Yêu thích"><Heart className="w-3 h-3" /> {article.likes || 0}</span>
                      <span className="text-[10px] text-stone-400 flex items-center gap-1" title="Lượt lưu"><Bookmark className="w-3 h-3" /> {article.saves || 0}</span>
                    </div>
                    {article.isHot && <span className="text-[10px] text-amber-600 font-black flex items-center gap-0.5"><Flame className="w-3 h-3" /> HOT</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(article)} className="p-2 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(article.id)} className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {editingArticle && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center shrink-0">
                <h3 className="text-xl font-black text-stone-900">Biên soạn bài viết</h3>
                <button onClick={() => setEditingArticle(null)} className="p-2 hover:bg-stone-100 rounded-full cursor-pointer transition-all">
                  <X className="w-5 h-5 text-stone-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Tiêu đề bài viết</label>
                    <input 
                      className="w-full mt-1 p-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                      value={editingArticle.title} 
                      onChange={e => setEditingArticle({...editingArticle, title: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Mô tả ngắn (Excerpt)</label>
                    <textarea 
                      className="w-full mt-1 p-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans" 
                      rows={2}
                      value={editingArticle.excerpt} 
                      onChange={e => setEditingArticle({...editingArticle, excerpt: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Danh mục</label>
                    <select 
                      className="w-full mt-1 p-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={editingArticle.category}
                      onChange={e => {
                        const cat = e.target.value as any;
                        const labelMap: any = { checkin: "Điểm hot", food: "Ẩm thực", tips: "Mẹo vặt", season: "Mùa hoa" };
                        setEditingArticle({...editingArticle, category: cat, categoryLabel: labelMap[cat]});
                      }}
                    >
                      <option value="tips">Mẹo vặt / Kinh nghiệm</option>
                      <option value="checkin">Điểm Check-in hot</option>
                      <option value="food">Ẩm thực Mộc Châu</option>
                      <option value="season">Mùa hoa & Khí hậu</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Thời gian đọc (Ví dụ: 5 phút)</label>
                    <input 
                      className="w-full mt-1 p-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                      value={editingArticle.readTime} 
                      onChange={e => setEditingArticle({...editingArticle, readTime: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Link Ảnh bìa</label>
                      <label className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-black cursor-pointer hover:bg-emerald-700 transition-all shadow-sm">
                        <Upload className="w-3 h-3" />
                        CHỌN ẢNH TỪ MÁY
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={e => handleFileUpload(e, false)}
                        />
                      </label>
                    </div>
                    <input 
                      className="w-full mt-1 p-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono" 
                      value={editingArticle.imageUrl} 
                      onChange={e => setEditingArticle({...editingArticle, imageUrl: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Album ảnh thực tế (Tách bằng dấu xuống dòng)</label>
                      <label className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-black cursor-pointer hover:bg-emerald-700 transition-all shadow-sm">
                        <Plus className="w-3 h-3" />
                        TẢI LÊN NHIỀU ẢNH
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          multiple
                          onChange={e => handleFileUpload(e, true)}
                        />
                      </label>
                    </div>
                    <textarea 
                      className="w-full p-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono" 
                      rows={3}
                      value={albumRaw} 
                      onChange={e => setAlbumRaw(e.target.value)}
                      placeholder="Dán link ảnh tại đây, mỗi dòng 1 link..."
                    />
                  </div>
                  <div className="col-span-2 grid grid-cols-3 gap-4 border-t border-stone-100 pt-4 mt-2">
                    <div>
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Số lượt xem (Views)</label>
                      <input 
                        type="number"
                        className="w-full mt-1 p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                        value={editingArticle.views} 
                        onChange={e => setEditingArticle({...editingArticle, views: Number(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Số lượt thích (Likes)</label>
                      <input 
                        type="number"
                        className="w-full mt-1 p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                        value={editingArticle.likes} 
                        onChange={e => setEditingArticle({...editingArticle, likes: Number(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Số lượt lưu (Saves)</label>
                      <input 
                        type="number"
                        className="w-full mt-1 p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                        value={editingArticle.saves} 
                        onChange={e => setEditingArticle({...editingArticle, saves: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Nội dung bài viết (Tách đoạn bằng dấu xuống dòng)</label>
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Đánh dấu HOT</label>
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                          checked={editingArticle.isHot}
                          onChange={e => setEditingArticle({...editingArticle, isHot: e.target.checked})}
                        />
                      </div>
                    </div>
                    <textarea 
                      className="w-full p-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans" 
                      rows={10}
                      value={contentRaw} 
                      onChange={e => setContentRaw(e.target.value)}
                      placeholder="Nội dung bài viết..."
                    />
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-stone-100 flex gap-3 shrink-0 bg-stone-50/50">
                <button 
                  onClick={() => setEditingArticle(null)}
                  className="flex-1 py-3 border border-stone-200 text-stone-600 rounded-xl text-sm font-bold hover:bg-stone-100 transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={() => handleSave(editingArticle)}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20 cursor-pointer"
                >
                  Đăng bài viết
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
