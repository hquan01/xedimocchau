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
    <div className="space-y-6">
      <div className="flex justify-center gap-2 mb-6">
        {[
          { id: "limousine", label: "Đặt Xe VIP Limousine", icon: Compass },
          { id: "shared", label: "Xe Ghép 7 chỗ", icon: Users },
          { id: "charter", label: "Thuê Xe Riêng", icon: User },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${
              subTab === tab.id
                ? "bg-[#1b4332] text-white"
                : "bg-white border text-stone-600 hover:bg-stone-100"
            }`}
          >
            <tab.icon className="w-4 h-4" />
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
