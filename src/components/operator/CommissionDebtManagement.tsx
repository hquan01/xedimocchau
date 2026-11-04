import React, { useState } from "react";
import { Calculator, DollarSign, Download, CheckCircle, Clock, AlertCircle, FileSpreadsheet, Filter } from "lucide-react";

interface CommissionRecord {
  id: string;
  partnerName: string;
  serviceType: "Combo phòng" | "Vé xe đoàn" | "Nhà hàng" | "Tour trải nghiệm";
  period: string; // "10/2026", "11/2026"
  totalBookingValue: number;
  commissionRate: number; // %
  commissionAmount: number; // = totalBookingValue * rate / 100
  paidAmount: number;
  remainingDebt: number;
  status: "completed" | "partial" | "pending";
  dueDate: string;
}

const INITIAL_RECORDS: CommissionRecord[] = [
  {
    id: "rec-01",
    partnerName: "Nhà Ta Homestay Mộc Châu",
    serviceType: "Combo phòng",
    period: "11/2026",
    totalBookingValue: 18500000,
    commissionRate: 15,
    commissionAmount: 2775000,
    paidAmount: 2000000,
    remainingDebt: 775000,
    status: "partial",
    dueDate: "25/11/2026"
  },
  {
    id: "rec-02",
    partnerName: "Thảo Nguyên Resort",
    serviceType: "Combo phòng",
    period: "11/2026",
    totalBookingValue: 34000000,
    commissionRate: 12,
    commissionAmount: 4080000,
    paidAmount: 4080000,
    remainingDebt: 0,
    status: "completed",
    dueDate: "20/11/2026"
  },
  {
    id: "rec-03",
    partnerName: "Nhà hàng Bê Chao 64",
    serviceType: "Nhà hàng",
    period: "11/2026",
    totalBookingValue: 12400000,
    commissionRate: 10,
    commissionAmount: 1240000,
    paidAmount: 0,
    remainingDebt: 1240000,
    status: "pending",
    dueDate: "30/11/2026"
  },
  {
    id: "rec-04",
    partnerName: "Khu DL Cầu Kính Bạch Long",
    serviceType: "Tour trải nghiệm",
    period: "10/2026",
    totalBookingValue: 21500000,
    commissionRate: 8,
    commissionAmount: 1720000,
    paidAmount: 1720000,
    remainingDebt: 0,
    status: "completed",
    dueDate: "31/10/2026"
  }
];

export default function CommissionDebtManagement() {
  const [records, setRecords] = useState<CommissionRecord[]>(INITIAL_RECORDS);
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const totalCommission = records.reduce((sum, r) => sum + r.commissionAmount, 0);
  const totalPaid = records.reduce((sum, r) => sum + r.paidAmount, 0);
  const totalRemaining = records.reduce((sum, r) => sum + r.remainingDebt, 0);

  const handleMarkAsPaid = (id: string) => {
    setRecords(prev =>
      prev.map(r =>
        r.id === id
          ? { ...r, paidAmount: r.commissionAmount, remainingDebt: 0, status: "completed" }
          : r
      )
    );
  };

  const handleExportCSV = () => {
    const headers = "Mã,Đối tác,Dịch vụ,Kỳ đối soát,Doanh thu,Tỷ lệ %,Hoa hồng,Đã thu,Còn nợ,Trạng thái,Hạn thanh toán\n";
    const rows = records.map(r => 
      `"${r.id}","${r.partnerName}","${r.serviceType}","${r.period}",${r.totalBookingValue},${r.commissionRate}%,${r.commissionAmount},${r.paidAmount},${r.remainingDebt},"${r.status}","${r.dueDate}"`
    ).join("\n");
    const blob = new Blob(["\uFEFF" + headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Bao_Cao_Hoa_Hong_Moc_Chau_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = records.filter(r => {
    const matchPeriod = selectedPeriod === "all" || r.period === selectedPeriod;
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchPeriod && matchStatus;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <Calculator className="w-5 h-5 text-emerald-700" />
            <h3 className="text-base font-black text-stone-900">Hoa Hồng Đối Tác & Đối Soát Công Nợ</h3>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Theo dõi hoa hồng phải thu từ các cơ sở homestay, nhà hàng, điểm tham quan và đối soát thanh toán định kỳ cuối tháng.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 bg-[#1b4332] hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Xuất Báo Cáo Đối Soát (CSV)</span>
        </button>
      </div>

      {/* 3 Metric Summary Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
            Tổng hoa hồng dự thu (Kỳ này)
          </span>
          <h4 className="text-2xl font-black text-stone-900 font-mono mt-1">
            {totalCommission.toLocaleString("vi-VN")} đ
          </h4>
          <span className="text-[11px] text-emerald-700 font-medium mt-1 block">
            Tính trên tổng doanh thu giao dịch {records.reduce((s, r) => s + r.totalBookingValue, 0).toLocaleString()} đ
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">
            Đã thanh toán thực thu
          </span>
          <h4 className="text-2xl font-black text-emerald-700 font-mono mt-1">
            {totalPaid.toLocaleString("vi-VN")} đ
          </h4>
          <span className="text-[11px] text-stone-500 font-medium mt-1 block">
            Đạt {Math.round((totalPaid / (totalCommission || 1)) * 100)}% chỉ tiêu thu hồi
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block">
            Công nợ còn phải thu
          </span>
          <h4 className="text-2xl font-black text-amber-600 font-mono mt-1">
            {totalRemaining.toLocaleString("vi-VN")} đ
          </h4>
          <span className="text-[11px] text-amber-700 font-medium mt-1 block">
            {records.filter(r => r.remainingDebt > 0).length} đối tác chưa quyết toán đủ
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2">
          <select
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
            className="bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-700 focus:outline-none"
          >
            <option value="all">Tất cả kỳ đối soát</option>
            <option value="11/2026">Kỳ Tháng 11/2026</option>
            <option value="10/2026">Kỳ Tháng 10/2026</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-700 focus:outline-none"
          >
            <option value="all">Tất cả trạng thái nợ</option>
            <option value="pending">Chưa thanh toán</option>
            <option value="partial">Thanh toán một phần</option>
            <option value="completed">Đã thu đủ 100%</option>
          </select>
        </div>

        <span className="text-xs text-stone-500 font-sans">
          Hiển thị: <strong className="text-stone-800">{filtered.length}</strong> khoản đối soát
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">Kỳ</th>
                <th className="p-3.5">Đối Tác & Dịch Vụ</th>
                <th className="p-3.5 text-right">Doanh Số</th>
                <th className="p-3.5 text-center">Tỷ Lệ</th>
                <th className="p-3.5 text-right">Hoa Hồng</th>
                <th className="p-3.5 text-right">Còn Nợ</th>
                <th className="p-3.5">Hạn Thu</th>
                <th className="p-3.5 text-right">Xử Lý</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-sans">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-stone-50/60 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-stone-700">{r.period}</td>
                  <td className="p-3.5">
                    <span className="font-bold text-stone-900 block">{r.partnerName}</span>
                    <span className="text-[11px] text-stone-500">{r.serviceType}</span>
                  </td>
                  <td className="p-3.5 text-right font-mono font-medium">
                    {r.totalBookingValue.toLocaleString()} đ
                  </td>
                  <td className="p-3.5 text-center font-mono font-bold text-emerald-800">
                    {r.commissionRate}%
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-stone-900">
                    {r.commissionAmount.toLocaleString()} đ
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold">
                    {r.remainingDebt > 0 ? (
                      <span className="text-amber-600">{r.remainingDebt.toLocaleString()} đ</span>
                    ) : (
                      <span className="text-emerald-700">0 đ (Đủ)</span>
                    )}
                  </td>
                  <td className="p-3.5 text-stone-600 font-mono text-[11px]">{r.dueDate}</td>
                  <td className="p-3.5 text-right">
                    {r.remainingDebt > 0 ? (
                      <button
                        onClick={() => handleMarkAsPaid(r.id)}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-bold cursor-pointer"
                      >
                        Đã thu đủ
                      </button>
                    ) : (
                      <span className="inline-flex items-center text-emerald-700 text-[11px] font-bold space-x-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Hoàn tất</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
