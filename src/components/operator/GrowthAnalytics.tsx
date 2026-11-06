import React from "react";
import { TrendingUp, Users, Bus, Sparkles, ArrowUpRight, DollarSign, CheckCircle2, Calendar, Compass } from "lucide-react";
import { Booking } from "../../types";

interface GrowthAnalyticsProps {
  bookings: Booking[];
}

export default function GrowthAnalytics({ bookings }: GrowthAnalyticsProps) {
  const totalBookings = bookings.length;
  const completedBookings = bookings.filter(b => b.status === "completed" || b.status === "success").length;
  const pendingBookings = bookings.filter(b => b.status === "pending").length;
  const totalGrossRevenue = bookings
    .filter(b => b.status === "completed" || b.status === "success")
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  const completionRate = totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0;

  // Route breakdown
  const hnToMc = bookings.filter(b => (b.routeSelection || "").includes("Hà Nội ➔ Mộc Châu") || (b.routeSelection || "").startsWith("Hà Nội")).length;
  const mcToHn = bookings.filter(b => (b.routeSelection || "").includes("Mộc Châu ➔ Hà Nội") || (b.routeSelection || "").startsWith("Mộc Châu")).length;
  const otherRoutes = Math.max(0, totalBookings - hnToMc - mcToHn);

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-emerald-700" />
            <h3 className="text-base font-black text-stone-900">Thống Kê Tăng Trưởng & Phân Tích Kinh Doanh</h3>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Số liệu dưới đây dựa trên đơn đã lưu trong hệ thống, không phải số liệu khách truy cập.
          </p>
        </div>

        <div className="text-xs text-stone-500 font-mono bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200 self-start sm:self-auto">
          Cập nhật: {new Date().toLocaleDateString("vi-VN")}
        </div>
      </div>

      {/* 4 Core KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex justify-between items-center text-stone-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Tổng đơn đặt xe</span>
            <Bus className="w-4 h-4 text-emerald-600" />
          </div>
          <h4 className="text-3xl font-black text-stone-900 font-mono mt-2">{totalBookings} đơn</h4>
          <div className="mt-2 text-xs text-emerald-700 font-medium flex items-center space-x-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Số đơn được ghi nhận trong hệ thống</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex justify-between items-center text-stone-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Giá trị đơn thành công</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <h4 className="text-2xl font-black text-stone-900 font-mono mt-2">
            {totalGrossRevenue.toLocaleString()} đ
          </h4>
          <span className="text-xs text-stone-500 block mt-2 font-sans">
            Tổng giá trị đơn thành công; không đồng nghĩa số tiền thực thu
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex justify-between items-center text-stone-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Tỷ lệ đơn hoàn tất</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <h4 className="text-3xl font-black text-emerald-700 font-mono mt-2">{completionRate}%</h4>
          <span className="text-xs text-stone-500 block mt-2 font-sans">
            {completedBookings}/{totalBookings} đơn thành công; không phải tỷ lệ chuyển đổi khách truy cập
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex justify-between items-center text-stone-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Đơn chờ gọi xác nhận</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <h4 className="text-3xl font-black text-amber-600 font-mono mt-2">{pendingBookings} đơn</h4>
          <span className="text-xs text-amber-700 font-bold block mt-2 font-sans">
            Cần điều hành gọi điện xác nhận
          </span>
        </div>
      </div>

      {/* Route Distribution Progress Bars */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
        <h4 className="font-black text-stone-900 text-sm">Cơ Cấu Chuyến Đi Theo Hướng Tuyến</h4>
        
        <div className="space-y-3 font-sans text-xs">
          <div>
            <div className="flex justify-between font-bold text-stone-700 mb-1">
              <span>Hà Nội ➔ Mộc Châu (Chiều đi cao nguyên)</span>
              <span className="font-mono">{hnToMc} đơn ({totalBookings > 0 ? Math.round((hnToMc / totalBookings) * 100) : 0}%)</span>
            </div>
            <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full"
                style={{ width: `${totalBookings > 0 ? (hnToMc / totalBookings) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between font-bold text-stone-700 mb-1">
              <span>Mộc Châu ➔ Hà Nội (Chiều về xuôi)</span>
              <span className="font-mono">{mcToHn} đơn ({totalBookings > 0 ? Math.round((mcToHn / totalBookings) * 100) : 0}%)</span>
            </div>
            <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-600 rounded-full"
                style={{ width: `${totalBookings > 0 ? (mcToHn / totalBookings) * 100 : 0}%` }}
              />
            </div>
          </div>

          {otherRoutes > 0 && (
            <div>
              <div className="flex justify-between font-bold text-stone-700 mb-1">
                <span>Tuyến Tỉnh khác ⇌ Mộc Châu (Ngoại tỉnh)</span>
                <span className="font-mono">{otherRoutes} đơn ({Math.round((otherRoutes / (totalBookings || 1)) * 100)}%)</span>
              </div>
              <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${(otherRoutes / (totalBookings || 1)) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
