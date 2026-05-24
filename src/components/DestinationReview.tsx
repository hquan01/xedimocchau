import React, { useState, useEffect } from "react";
import { Star, MessageSquare, Send, Mail, Facebook, User, X, Edit2, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Review } from "../types";
import { saveReviewToFirebase, deleteReviewFromFirebase, listenToReviews } from "../lib/firebaseUtils";

interface DestinationReviewProps {
  destinationId: string;
  destinationName: string;
  isAdmin?: boolean;
}

export default function DestinationReview({ destinationId, destinationName, isAdmin }: DestinationReviewProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("xemc_user_profile"));
  const [userProfile, setUserProfile] = useState<{name: string, email: string, avatar?: string} | null>(() => {
    const saved = localStorage.getItem("xemc_user_profile");
    return saved ? JSON.parse(saved) : null;
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");

  useEffect(() => {
    // Listen to real-time updates from Firebase
    const unsubscribe = listenToReviews(destinationId, (fetchedReviews) => {
      setReviews(fetchedReviews);
    });
    return () => unsubscribe();
  }, [destinationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }

    const newReview: Review = {
      id: `rev_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      destinationId,
      userName: userProfile?.name || "Khách hàng",
      userEmail: userProfile?.email,
      userAvatar: userProfile?.avatar,
      rating,
      comment,
      timestamp: new Date().toISOString(),
    };

    await saveReviewToFirebase(newReview);
    setComment("");
    setRating(5);
    setShowForm(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editComment.trim() || !editingReviewId) return;

    const reviewToUpdate = reviews.find(r => r.id === editingReviewId);
    if (reviewToUpdate) {
      const updatedReview = { 
        ...reviewToUpdate, 
        comment: editComment, 
        rating: editRating, 
        timestamp: new Date().toISOString() 
      };
      await saveReviewToFirebase(updatedReview);
    }
    
    setEditingReviewId(null);
    setEditComment("");
    setEditRating(5);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa đánh giá này không?")) {
      await deleteReviewFromFirebase(id);
    }
  };

  const startEditing = (review: Review) => {
    setEditingReviewId(review.id);
    setEditComment(review.comment);
    setEditRating(review.rating);
  };

  const loginWithEmail = (name: string, email: string) => {
    const profile = { name, email, avatar: `https://ui-avatars.com/api/?name=${name}&background=10b981&color=fff` };
    setUserProfile(profile);
    setIsLoggedIn(true);
    localStorage.setItem("xemc_user_profile", JSON.stringify(profile));
    setShowAuthModal(false);
  };

  const loginWithFB = () => {
    const profile = { 
      name: "Người dùng Facebook", 
      email: "fb_user@facebook.com", 
      avatar: "https://www.facebook.com/images/fb_icon_325x325.png" 
    };
    setUserProfile(profile);
    setIsLoggedIn(true);
    localStorage.setItem("xemc_user_profile", JSON.stringify(profile));
    setShowAuthModal(false);
  };

  return (
    <div className="mt-8 pt-8 border-t border-stone-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-emerald-600" />
          <h4 className="font-black text-stone-900 text-sm uppercase tracking-wider">Đánh giá thực tế ({reviews.length})</h4>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="text-xs font-black text-emerald-600 hover:text-emerald-700 transition-colors uppercase tracking-widest"
        >
          {showForm ? "Đóng lại" : "Viết đánh giá"}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-stone-50 rounded-2xl p-5 mb-8 border border-stone-200"
            onSubmit={handleSubmit}
          >
            <div className="flex items-center space-x-1 mb-4">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className="outline-none"
                >
                  <Star 
                    className={`w-5 h-5 ${s <= rating ? 'text-amber-400 fill-current' : 'text-stone-300'}`} 
                  />
                </button>
              ))}
              <span className="ml-2 text-xs font-bold text-stone-500">
                {rating}/5 Sao
              </span>
            </div>

            <textarea
              className="w-full bg-white border border-stone-200 rounded-xl p-4 text-xs font-sans outline-none focus:border-emerald-500 transition-colors resize-none mb-4"
              placeholder={`Chia sẻ cảm nhận của bạn về ${destinationName}...`}
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            <div className="flex items-center justify-between">
              {isLoggedIn ? (
                <div className="flex items-center space-x-2">
                  <img src={userProfile?.avatar} className="w-6 h-6 rounded-full" alt="avatar" />
                  <span className="text-[10px] font-bold text-stone-600">Đăng bởi: {userProfile?.name}</span>
                </div>
              ) : (
                <span className="text-[10px] font-medium text-stone-400 italic">* Yêu cầu định danh để đăng bài</span>
              )}

              <button
                type="submit"
                className="bg-emerald-600 text-white px-5 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center space-x-2 hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-900/10"
              >
                <span>Gửi đánh giá</span>
                <Send className="w-3 h-3" />
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-8 bg-stone-50/50 rounded-2xl border border-dashed border-stone-200">
            <p className="text-xs text-stone-400 font-medium italic">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="flex space-x-4 group">
              <img 
                src={review.userAvatar || `https://ui-avatars.com/api/?name=${review.userName}`} 
                className="w-10 h-10 rounded-full bg-stone-100 shrink-0" 
                alt={review.userName} 
              />
              <div className="flex-1">
                {editingReviewId === review.id ? (
                  <form onSubmit={handleUpdate} className="bg-stone-50 rounded-xl p-4 border border-emerald-200">
                    <div className="flex items-center space-x-1 mb-3">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setEditRating(s)}
                          className="outline-none"
                        >
                          <Star 
                            className={`w-4 h-4 ${s <= editRating ? 'text-amber-400 fill-current' : 'text-stone-300'}`} 
                          />
                        </button>
                      ))}
                    </div>
                    <textarea
                      className="w-full bg-white border border-stone-200 rounded-lg p-3 text-xs font-sans outline-none focus:border-emerald-500 transition-colors mb-3"
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      rows={2}
                    />
                    <div className="flex space-x-2">
                      <button 
                        type="submit"
                        className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
                      >
                        Lưu thay đổi
                      </button>
                      <button 
                        type="button"
                        onClick={() => setEditingReviewId(null)}
                        className="bg-stone-200 text-stone-600 px-3 py-1.5 rounded-lg text-xs font-bold"
                      >
                        Hủy
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <h5 className="text-xs font-black text-stone-900">{review.userName}</h5>
                        {isLoggedIn && userProfile?.email === review.userEmail && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-black uppercase">Bạn</span>
                        )}
                      </div>
                      <div className="flex space-x-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-2.5 h-2.5 ${s <= review.rating ? 'text-amber-400 fill-current' : 'text-stone-200'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] text-stone-600 leading-relaxed font-sans mb-2">{review.comment}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 text-[9px] text-stone-400 font-bold uppercase tracking-wider">
                        <span>{new Date(review.timestamp).toLocaleDateString("vi-VN")}</span>
                        <span>•</span>
                        <button className="hover:text-emerald-600 transition-colors">Thích</button>
                        <span>•</span>
                        <button className="hover:text-emerald-600 transition-colors">Phản hồi</button>
                      </div>
                      
                      {((isLoggedIn && userProfile?.email === review.userEmail) || isAdmin) && (
                        <div className="flex items-center space-x-3">
                          {isLoggedIn && userProfile?.email === review.userEmail && (
                            <button 
                              onClick={() => startEditing(review)}
                              className="text-stone-400 hover:text-emerald-600 transition-colors"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleDelete(review.id)}
                            className="text-stone-400 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Auth Modal Mockup */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
              onClick={() => setShowAuthModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16" />
              
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-black text-stone-900 text-sm uppercase tracking-widest">Định danh Review</h3>
                </div>
                <button onClick={() => setShowAuthModal(false)} className="text-stone-400 hover:text-stone-600 outline-none">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-stone-500 text-xs mb-8 leading-relaxed text-center">
                Vui lòng kết nối tài khoản để gửi đánh giá. Điều này giúp ngăn chặn tin rác và bảo vệ cộng đồng.
              </p>

              <div className="space-y-4">
                <button 
                  onClick={loginWithFB}
                  className="w-full h-12 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-xl flex items-center justify-center space-x-3 transition-all font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20"
                >
                  <Facebook className="w-5 h-5" />
                  <span>Tiếp tục với Facebook</span>
                </button>

                <div className="relative flex items-center justify-center py-2">
                  <div className="absolute inset-x-0 h-px bg-stone-100" />
                  <span className="relative px-4 bg-white text-[10px] font-black text-stone-400 uppercase tracking-widest">Hoặc sử dụng Email</span>
                </div>

                <div className="space-y-3">
                  <input 
                    type="text" 
                    placeholder="Tên của bạn" 
                    id="auth_name"
                    className="w-full h-12 bg-stone-50 border border-stone-200 rounded-xl px-4 text-xs font-sans outline-none focus:border-emerald-500 transition-all"
                  />
                  <input 
                    type="email" 
                    placeholder="Địa chỉ Email" 
                    id="auth_email"
                    className="w-full h-12 bg-stone-50 border border-stone-200 rounded-xl px-4 text-xs font-sans outline-none focus:border-emerald-500 transition-all"
                  />
                  <button 
                    onClick={() => {
                      const nameInput = document.getElementById("auth_name") as HTMLInputElement;
                      const emailInput = document.getElementById("auth_email") as HTMLInputElement;
                      if(nameInput.value && emailInput.value) {
                        loginWithEmail(nameInput.value, emailInput.value);
                      }
                    }}
                    className="w-full h-12 bg-stone-900 hover:bg-stone-800 text-white rounded-xl flex items-center justify-center space-x-3 transition-all font-bold text-xs uppercase tracking-widest shadow-lg shadow-stone-900/10"
                  >
                    <Mail className="w-5 h-5" />
                    <span>Xác nhận danh tính</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
