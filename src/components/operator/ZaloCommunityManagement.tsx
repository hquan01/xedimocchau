import React, { useState } from "react";
import { ZaloGroup } from "../../types";
import { 
  Users, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  Save, 
  X, 
  CheckCircle2, 
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Link as LinkIcon
} from "lucide-react";
import { saveZaloGroupToFirebase, deleteZaloGroupFromFirebase } from "../../lib/firebaseUtils";

interface ZaloCommunityManagementProps {
  zaloGroups: ZaloGroup[];
  onUpdateZaloGroups: (groups: ZaloGroup[]) => void;
}

export default function ZaloCommunityManagement({
  zaloGroups,
  onUpdateZaloGroups
}: ZaloCommunityManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("all");
  
  // Modal states for creating / editing
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ZaloGroup | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formTopic, setFormTopic] = useState("Hỏi đáp");
  const [formDesc, setFormDesc] = useState("");
  const [formZaloUrl, setFormZaloUrl] = useState("");
  const [formIconEmoji, setFormIconEmoji] = useState("💬");
  const [formMemberNote, setFormMemberNote] = useState("Đang hoạt động sôi nổi");
  const [formOrder, setFormOrder] = useState<number>(1);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const topics = [
    { id: "all", label: "Tất cả chủ đề" },
    { id: "Hỏi đáp", label: "Hỏi đáp" },
    { id: "Thời tiết", label: "Thời tiết" },
    { id: "Lưu trú", label: "Lưu trú" },
    { id: "Ăn uống", label: "Ăn uống" },
    { id: "Di chuyển", label: "Di chuyển" },
    { id: "Khác", label: "Khác" }
  ];

  const filteredGroups = zaloGroups
    .filter(g => !g.isDeleted)
    .filter(g => {
      const matchTopic = selectedTopic === "all" || g.topic === selectedTopic;
      const matchSearch = g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          g.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchTopic && matchSearch;
    })
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const handleOpenAddModal = () => {
    setEditingGroup(null);
    setFormName("");
    setFormTopic("Hỏi đáp");
    setFormDesc("");
    setFormZaloUrl("");
    setFormIconEmoji("💬");
    setFormMemberNote("Cộng đồng sôi nổi");
    setFormOrder(zaloGroups.length + 1);
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (group: ZaloGroup) => {
    setEditingGroup(group);
    setFormName(group.name);
    setFormTopic(group.topic);
    setFormDesc(group.description);
    setFormZaloUrl(group.zaloUrl);
    setFormIconEmoji(group.iconEmoji || "💬");
    setFormMemberNote(group.memberCountNote || "");
    setFormOrder(group.order || 1);
    setFormIsActive(group.isActive);
    setIsModalOpen(true);
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formZaloUrl.trim()) {
      alert("Vui lòng nhập Tên nhóm và Đường dẫn Zalo!");
      return;
    }

    if (editingGroup) {
      // Update existing
      const updated: ZaloGroup = {
        ...editingGroup,
        name: formName.trim(),
        topic: formTopic,
        description: formDesc.trim(),
        zaloUrl: formZaloUrl.trim(),
        iconEmoji: formIconEmoji.trim() || "💬",
        memberCountNote: formMemberNote.trim(),
        order: Number(formOrder) || 1,
        isActive: formIsActive,
        updatedAt: new Date().toISOString()
      };

      const nextList = zaloGroups.map(g => g.id === updated.id ? updated : g);
      onUpdateZaloGroups(nextList);
      await saveZaloGroupToFirebase(updated);
      showToast(`Đã cập nhật nhóm "${updated.name}" thành công!`);
    } else {
      // Add new
      const newGroup: ZaloGroup = {
        id: `zalo_${Date.now()}`,
        name: formName.trim(),
        topic: formTopic,
        description: formDesc.trim(),
        zaloUrl: formZaloUrl.trim(),
        iconEmoji: formIconEmoji.trim() || "💬",
        memberCountNote: formMemberNote.trim(),
        order: Number(formOrder) || zaloGroups.length + 1,
        isActive: formIsActive,
        createdAt: new Date().toISOString()
      };

      const nextList = [...zaloGroups, newGroup];
      onUpdateZaloGroups(nextList);
      await saveZaloGroupToFirebase(newGroup);
      showToast(`Đã thêm nhóm mới "${newGroup.name}"!`);
    }

    setIsModalOpen(false);
  };

  const handleToggleActive = async (group: ZaloGroup) => {
    const updated: ZaloGroup = {
      ...group,
      isActive: !group.isActive,
      updatedAt: new Date().toISOString()
    };
    const nextList = zaloGroups.map(g => g.id === group.id ? updated : g);
    onUpdateZaloGroups(nextList);
    await saveZaloGroupToFirebase(updated);
    showToast(`Đã ${updated.isActive ? "kích hoạt hiển thị" : "ẩn"} nhóm "${group.name}"!`);
  };

  const handleDeleteGroup = async (groupId: string) => {
    const group = zaloGroups.find(g => g.id === groupId);
    if (!group) return;

    // Soft delete
    const updated: ZaloGroup = {
      ...group,
      isDeleted: true,
      updatedAt: new Date().toISOString()
    };
    const nextList = zaloGroups.map(g => g.id === groupId ? updated : g);
    onUpdateZaloGroups(nextList);
    await deleteZaloGroupFromFirebase(groupId);
    setDeleteConfirmId(null);
    showToast(`Đã xóa nhóm "${group.name}" khỏi danh sách công khai.`);
  };

  const handleMoveOrder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filteredGroups.length) return;

    const currentGroup = filteredGroups[index];
    const targetGroup = filteredGroups[targetIndex];

    const tempOrder = currentGroup.order;
    const updatedCurrent = { ...currentGroup, order: targetGroup.order };
    const updatedTarget = { ...targetGroup, order: tempOrder };

    const nextList = zaloGroups.map(g => {
      if (g.id === updatedCurrent.id) return updatedCurrent;
      if (g.id === updatedTarget.id) return updatedTarget;
      return g;
    });

    onUpdateZaloGroups(nextList);
    await saveZaloGroupToFirebase(updatedCurrent);
    await saveZaloGroupToFirebase(updatedTarget);
    showToast("Đã cập nhật thứ tự hiển thị nhóm!");
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/50 flex items-center gap-2 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              💬
            </span>
            <h2 className="text-xl font-black text-stone-900">Quản Lý Nhóm Zalo Cộng Đồng</h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Quản trị các phòng Zalo du lịch Mộc Châu, đổi link mời, chỉnh sửa mô tả, ẩn/hiện hoặc sắp xếp thứ tự hiển thị trên trang chủ và trang /cong-dong.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-5 py-2.5 bg-[#0068FF] hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Nhóm Zalo Mới</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-stone-50 p-3 rounded-2xl border border-stone-200/70">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          {topics.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTopic(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                selectedTopic === t.id
                  ? "bg-stone-900 text-white shadow-xs"
                  : "bg-white text-stone-600 hover:bg-stone-200/70 border border-stone-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72 shrink-0">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên nhóm hoặc mô tả..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Groups Table / List */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden">
        {filteredGroups.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-sm font-extrabold text-stone-700">Chưa có nhóm Zalo nào phù hợp</h3>
            <p className="text-xs text-stone-400 mt-1">Hãy bấm "Thêm Nhóm Zalo Mới" để tạo nhóm đầu tiên.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filteredGroups.map((group, idx) => (
              <div
                key={group.id}
                className={`p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
                  !group.isActive ? "bg-stone-50/70 opacity-70" : "hover:bg-blue-50/30"
                }`}
              >
                {/* Left: Reorder Controls + Icon + Details */}
                <div className="flex items-start gap-4 flex-1">
                  {/* Up/Down buttons for sorting order */}
                  <div className="flex flex-col gap-1 items-center justify-center shrink-0 pt-1">
                    <button
                      onClick={() => handleMoveOrder(idx, "up")}
                      disabled={idx === 0}
                      className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-20 cursor-pointer"
                      title="Chuyển lên trên"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-mono font-bold text-stone-400">
                      #{group.order || idx + 1}
                    </span>
                    <button
                      onClick={() => handleMoveOrder(idx, "down")}
                      disabled={idx === filteredGroups.length - 1}
                      className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-20 cursor-pointer"
                      title="Chuyển xuống dưới"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Icon Avatar */}
                  <div className="w-12 h-12 rounded-2xl bg-blue-100/70 border border-blue-200 flex items-center justify-center text-2xl shrink-0">
                    {group.iconEmoji || "💬"}
                  </div>

                  {/* Information */}
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-extrabold text-stone-900 text-sm">{group.name}</h4>
                      <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        {group.topic}
                      </span>
                      {group.isActive ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                          <Eye className="w-3 h-3 text-emerald-600" />
                          <span>Đang hiển thị</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200 flex items-center gap-1">
                          <EyeOff className="w-3 h-3 text-stone-400" />
                          <span>Đang ẩn</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                      {group.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-stone-500">
                      <span className="font-mono text-blue-600 truncate max-w-xs flex items-center gap-1">
                        <LinkIcon className="w-3 h-3" />
                        {group.zaloUrl}
                      </span>
                      {group.memberCountNote && (
                        <span>· {group.memberCountNote}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-stone-100">
                  <a
                    href={group.zaloUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                    title="Mở thử link Zalo này"
                  >
                    <span>Mở link</span>
                    <ExternalLink className="w-3 h-3 text-stone-500" />
                  </a>

                  <button
                    onClick={() => handleToggleActive(group)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                      group.isActive 
                        ? "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200" 
                        : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
                    }`}
                  >
                    {group.isActive ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Ẩn</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Hiện</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(group)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-700" />
                    <span>Sửa</span>
                  </button>

                  {deleteConfirmId === group.id ? (
                    <div className="flex items-center gap-1 bg-red-50 p-1 rounded-xl border border-red-200">
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="px-2 py-1 bg-red-600 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        Chắc chắn xóa
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-2 py-1 bg-stone-200 text-stone-700 rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(group.id)}
                      className="p-2 text-stone-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
                      title="Xóa nhóm này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
              <h3 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
                <span>{editingGroup ? "✏️ Chỉnh Sửa Nhóm Zalo" : "➕ Thêm Nhóm Zalo Mới"}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Tên nhóm Zalo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ví dụ: Hội Review Homestay Mộc Châu"
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Chủ đề</label>
                  <select
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-800 focus:outline-none focus:border-blue-600"
                  >
                    <option value="Hỏi đáp">Hỏi đáp chung</option>
                    <option value="Thời tiết">Thời tiết & Mùa hoa</option>
                    <option value="Lưu trú">Homestay & Khách sạn</option>
                    <option value="Ăn uống">Nhà hàng & Ẩm thực</option>
                    <option value="Di chuyển">Lịch trình & Đặt xe</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Biểu tượng (Emoji)</label>
                  <input
                    type="text"
                    value={formIconEmoji}
                    onChange={(e) => setFormIconEmoji(e.target.value)}
                    placeholder="Ví dụ: 💬, 🌸, 🏡, 🍲, 🚐"
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:border-blue-600 text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Đường link Zalo (Mời vào nhóm) <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={formZaloUrl}
                  onChange={(e) => setFormZaloUrl(e.target.value)}
                  placeholder="https://zalo.me/g/..."
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-blue-700 focus:outline-none focus:border-blue-600"
                  required
                />
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Link tham gia do Quản trị viên nhóm Zalo tạo trong mục cài đặt nhóm.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Mô tả ngắn gọn</label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Giới thiệu nội dung, tôn chỉ của nhóm..."
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Ghi chú thành viên</label>
                  <input
                    type="text"
                    value={formMemberNote}
                    onChange={(e) => setFormMemberNote(e.target.value)}
                    placeholder="Ví dụ: Hơn 1.200 thành viên"
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Thứ tự hiển thị</label>
                  <input
                    type="number"
                    min={1}
                    value={formOrder}
                    onChange={(e) => setFormOrder(parseInt(e.target.value, 10) || 1)}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isActiveCheck" className="text-xs font-bold text-stone-800 cursor-pointer">
                  Công khai hiển thị trên trang chủ và cộng đồng
                </label>
              </div>

              {/* Live Preview Box */}
              <div className="pt-3 border-t border-stone-100">
                <span className="text-[10px] uppercase font-bold text-stone-400 block mb-2">
                  Xem trước giao diện thẻ khách hàng nhìn thấy:
                </span>
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{formIconEmoji || "💬"}</span>
                    <div>
                      <h5 className="font-extrabold text-stone-900 text-xs">{formName || "Tên nhóm mẫu"}</h5>
                      <span className="text-[10px] text-blue-600 font-bold block">{formTopic} · {formMemberNote}</span>
                    </div>
                  </div>
                  <span className="px-3 py-1.5 bg-[#0068FF] text-white text-[11px] font-bold rounded-lg shrink-0">
                    Vào Zalo ngay
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0068FF] hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingGroup ? "Lưu Thay Đổi" : "Tạo Nhóm Mới"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
