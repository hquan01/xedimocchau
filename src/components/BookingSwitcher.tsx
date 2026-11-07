import React, { useEffect, useState } from "react";
import LimousineBooking from "./LimousineBooking";
import SharedCarBooking from "./SharedCarBooking";
import PrivateCharterBooking from "./PrivateCharterBooking";
import { Compass, Users, User } from "lucide-react";

export default function BookingSwitcher(props: any) {
  const [subTab, setSubTab] = useState<"limousine" | "shared" | "charter">(props.initialSubTab || "limousine");
  useEffect(() => {
    if (props.initialSubTab) setSubTab(props.initialSubTab);
  }, [props.initialSubTab]);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div role="tablist" aria-label="Chọn loại hình xe" className="grid grid-cols-3 gap-2 mb-5 p-1.5 rounded-[20px] bg-emerald-50/80 border border-emerald-100 max-w-2xl mx-auto">
        {[
          { id: "limousine", label: "Đặt Xe VIP Limousine", icon: Compass },
          { id: "shared", label: "Xe Ghép 7 chỗ", icon: Users },
          { id: "charter", label: "Thuê Xe Riêng", icon: User },
        ].map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={subTab===tab.id}
            onClick={() => setSubTab(tab.id as any)}
            className={`min-h-[66px] sm:min-h-[56px] px-1.5 sm:px-4 py-2 rounded-2xl text-[11px] sm:text-sm font-extrabold flex flex-col sm:flex-row items-center justify-center text-center gap-1.5 sm:gap-2 leading-snug transition-[background-color,color,box-shadow] focus-visible:outline-2 focus-visible:outline-emerald-700 ${
              subTab === tab.id
                ? "bg-[#1b4332] text-white shadow-md"
                : "bg-white border border-emerald-100 text-emerald-900 hover:bg-emerald-100"
            }`}
          >
            <tab.icon className="w-5 h-5 shrink-0" aria-hidden="true"/>
            {tab.label}
          </button>
        ))}
      </div>
      
      {subTab === "limousine" && <LimousineBooking {...props} />}
      {subTab === "shared" && <SharedCarBooking {...props} />}
      {subTab === "charter" && <PrivateCharterBooking {...props} />}
    </div>
  );
}
