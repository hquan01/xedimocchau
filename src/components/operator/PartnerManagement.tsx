import React, { useState, useEffect } from "react";
import { UserCheck, Plus, Edit2, Trash2, Phone, Mail, Building, Percent, FileText, CheckCircle, Search, ExternalLink } from "lucide-react";

export interface PartnerItem {
  id: string;
  name: string;
  category: "homestay" | "hotel" | "restaurant" | "transport" | "activity";
  contactPerson: string;
  phone: string;
  email?: string;
  address: string;
  contractCode: string;
  commissionRate: number; // % hoa hồng
  status: "active" | "pending" | "paused";
  bankAccount?: string;
  notes?: string;
}

const INITIAL_PARTNERS: PartnerItem[] = [
  {
    id: "part-01",
    name: "Nhà Ta Homestay Mộc Châu",
    category: "homestay",
    contactPerson: "Anh Tuấn Anh",
    phone: "0968.123.456",
    address: "Tiểu khu 3, Thị trấn Mộc Châu",
    contractCode: "HD-MC-2025-01",
    commissionRate: 15,
    status: "active",
    bankAccount: "Techcombank 1903456789 (Nguyen Tuan Anh)",
    notes: "Đối tác combo phòng + xe QT Limousine đón tận nơi"
  },
  {
    id: "part-02",
    name: "Thảo Nguyên Resort Mộc Châu",
    category: "hotel",
    contactPerson: "Chị Mai Lan (Phòng Kinh Doanh)",
    phone: "0212.3869.888",
    address: "Tiểu khu Khí Tượng, TT. Nông Trường",
    contractCode: "HD-MC-2025-02",
    commissionRate: 12,
    status: "active",
    bankAccount: "Vietcombank 0541000123456 (Cong ty CP Thao Nguyen)",
    notes: "Ưu tiên đặt phòng gia đình và villa"
  },
  {
    id: "part-03",
    name: "Nhà hàng Bê Chao 64",
    category: "restaurant",
    contactPerson: "Anh Hải",
    phone: "0969.811.666",
    address: "Tiểu khu Chiềng Đi, Mộc Châu",
    contractCode: "HD-MC-2025-03",
    commissionRate: 10,
    status: "active",
    bankAccount: "BIDV 41110000987654 (Tran Van Hai)",
    notes: "Giảm 10% hoặc trích hoa hồng đoàn cho tài xế QT Limousine"
  },
  {
    id: "part-04",
    name: "Khu Du Lịch Cầu Kính Bạch Long",
    category: "activity",
    contactPerson: "Bộ phận Vé Đoàn Mộc Châu Island",
    phone: "0966.888.999",
    address: "Xã Mường Sang, Mộc Châu",
    contractCode: "HD-MC-2025-04",
    commissionRate: 8,
    status: "active",
    bankAccount: "VPBank 888888888 (Moc Chau Island)",
    notes: "Vé tham quan cầu kính & khu vui chơi mạo hiểm"
  }
];

export default function PartnerManagement() {
  const [partners, setPartners] = useState<PartnerItem[]>(() => {
    try {
      const saved = localStorage.getItem("mocchau_operator_partners");
      return saved ? JSON.parse(saved) : INITIAL_PARTNERS;
    } catch {
      return INITIAL_PARTNERS;
    }
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editingItem, setEditingItem] = useState<PartnerItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<PartnerItem["category"]>("homestay");
  const [formContactPerson, setFormContactPerson] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formContractCode, setFormContractCode] = useState("");
  const [formCommissionRate, setFormCommissionRate] = useState(10);
  const [formStatus, setFormStatus] = useState<PartnerItem["status"]>("active");
  const [formBankAccount, setFormBankAccount] = useState("");
  const [formNotes, setFormNotes] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem("mocchau_operator_partners", JSON.stringify(partners));
    } catch {}
  }, [partners]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormName("");
    setFormCategory("homestay");
    setFormContactPerson("");
    setFormPhone("");
    setFormAddress("");
    setFormContractCode(`HD-MC-${new Date().getFullYear()}-${String(partners.length + 1).padStart(2, "0")}`);
    setFormCommissionRate(10);
    setFormStatus("active");
    setFormBankAccount("");
    setFormNotes("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PartnerItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormContactPerson(item.contactPerson);
    setFormPhone(item.phone);
    setFormAddress(item.address);
    setFormContractCode(item.contractCode);
    setFormCommissionRate(item.commissionRate);
    setFormStatus(item.status);
    setFormBankAccount(item.bankAccount || "");
    setFormNotes(item.notes || "");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    let updated: PartnerItem[] = [];

    if (editingItem) {
      updated = partners.map(p =>
        p.id === editingItem.id
          ? {
              ...p,
              name: formName.trim(),
              category: formCategory,
              contactPerson: formContactPerson.trim(),
              phone: formPhone.trim(),
              address: formAddress.trim(),
              contractCode: formContractCode.trim(),
              commissionRate: Number(formCommissionRate) || 0,
              status: formStatus,
              bankAccount: formBankAccount.trim(),
              notes: formNotes.trim()
            }
          : p
      );
    } else {
      const newItem: PartnerItem = {
        id: `part_${Date.now()}`,
        name: formName.trim(),
        category: formCategory,
        contactPerson: formContactPerson.trim() || "Chưa định danh",
        phone: formPhone.trim() || "0971.050.324",
        address: formAddress.trim() || "Mộc Châu",
        contractCode: formContractCode.trim() || `HD-MC-${Date.now().toString().slice(-4)}`,
        commissionRate: Number(formCommissionRate) || 10,
        status: formStatus,
        bankAccount: formBankAccount.trim(),
        notes: formNotes.trim()
      };
      updated = [newItem, ...partners];
    }

    setPartners(updated);
    setIsModalOpen(false);

    try {
      const { saveCollectionItemsToLocalAndFirebase } = await import("../../lib/firebaseUtils");
      await saveCollectionItemsToLocalAndFirebase("partners", "mocchau_operator_partners", updated);
    } catch (err: any) {
      console.warn("Background Firebase sync failed (saved locally):", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa đối tác này?")) {
      const updated = partners.filter(p => p.id !== id);
      setPartners(updated);
      try {
        const { saveCollectionItemsToLocalAndFirebase } = await import("../../lib/firebaseUtils");
        await saveCollectionItemsToLocalAndFirebase("partners", "mocchau_operator_partners", updated);
      } catch (err: any) {
        console.warn("Background Firebase sync failed:", err);
      }
    }
  };

  const filtered = partners.filter(p => {
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm) ||
      p.contractCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = categoryFilter === "all" || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-emerald-700" />
            <h3 className="text-base font-black text-stone-900">Quản Lý Mạng Lưới Đối Tác Du Lịch</h3>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Quản lý nhà xe liên kết, homestay, khách sạn, nhà hàng và các dịch vụ trải nghiệm liên kết hưởng hoa hồng.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-[#1b4332] hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Đối Tác Mới</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên đối tác, người liên hệ, số điện thoại, mã hợp đồng..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-600"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-700 focus:outline-none cursor-pointer"
        >
          <option value="all">Tất cả loại hình</option>
          <option value="homestay">Homestay</option>
          <option value="hotel">Khách sạn / Resort</option>
          <option value="restaurant">Nhà hàng / Ẩm thực</option>
          <option value="activity">Điểm vui chơi / Trải nghiệm</option>
        </select>
      </div>

      {/* Partners List Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">Mã HĐ</th>
                <th className="p-3.5">Tên Đối Tác & Địa Chỉ</th>
                <th className="p-3.5">Người Liên Hệ / SĐT</th>
                <th className="p-3.5 text-center">Hoa Hồng (%)</th>
                <th className="p-3.5">Trạng Thái</th>
                <th className="p-3.5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-sans">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-stone-50/60 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-emerald-800">{p.contractCode}</td>
                  <td className="p-3.5">
                    <span className="font-bold text-stone-900 block">{p.name}</span>
                    <span className="text-[11px] text-stone-500">{p.address}</span>
                  </td>
                  <td className="p-3.5">
                    <span className="text-stone-800 font-medium block">{p.contactPerson}</span>
                    <a href={`tel:${p.phone}`} className="text-emerald-700 font-mono font-bold hover:underline">
                      {p.phone}
                    </a>
                  </td>
                  <td className="p-3.5 text-center">
                    <span className="inline-block bg-emerald-50 text-emerald-800 font-mono font-black px-2 py-0.5 rounded border border-emerald-200">
                      {p.commissionRate}%
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        p.status === "active"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {p.status === "active" ? "Đang hợp tác" : "Tạm ngưng"}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 text-stone-600 hover:text-emerald-700 hover:bg-stone-100 rounded-lg"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-left text-xs">
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <h3 className="font-black text-stone-900 text-base">
                {editingItem ? "Chỉnh sửa đối tác" : "Thêm đối tác liên kết mới"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-700 font-bold p-1 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Tên cơ sở / Đối tác *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Ví dụ: Nhà Ta Homestay Mộc Châu"
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Phân loại</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium"
                  >
                    <option value="homestay">Homestay</option>
                    <option value="hotel">Khách sạn / Resort</option>
                    <option value="restaurant">Nhà hàng / Ẩm thực</option>
                    <option value="activity">Vui chơi / Trải nghiệm</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Mã hợp đồng</label>
                  <input
                    type="text"
                    value={formContractCode}
                    onChange={e => setFormContractCode(e.target.value)}
                    placeholder="HD-MC-2025-01"
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Người đại diện liên hệ</label>
                  <input
                    type="text"
                    value={formContactPerson}
                    onChange={e => setFormContactPerson(e.target.value)}
                    placeholder="Anh Nguyễn Văn A"
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Số điện thoại *</label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    placeholder="0971.050.324"
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Địa chỉ cơ sở</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={e => setFormAddress(e.target.value)}
                  placeholder="Tiểu khu 3, Thị trấn Mộc Châu..."
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Tỷ lệ hoa hồng thỏa thuận (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={formCommissionRate}
                    onChange={e => setFormCommissionRate(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Trạng thái hợp tác</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl font-medium"
                  >
                    <option value="active">Đang hợp tác tích cực</option>
                    <option value="pending">Đang đàm phán</option>
                    <option value="paused">Tạm dừng</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Tài khoản ngân hàng đối soát</label>
                <input
                  type="text"
                  value={formBankAccount}
                  onChange={e => setFormBankAccount(e.target.value)}
                  placeholder="Techcombank 1903... (Chủ TK)"
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Ghi chú nghiệp vụ riêng</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Ghi chú về chính sách đón trả, hoa hồng, thời gian chuyển tiền..."
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 rounded-xl font-bold text-stone-600 hover:bg-stone-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1b4332] hover:bg-emerald-800 text-white rounded-xl font-bold shadow-sm"
                >
                  Lưu Đối Tác
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
