import React, { useState, useEffect } from "react";
import { Phone, MessageCircle, Send, ArrowUp, MessageSquare, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function FloatingContact() {
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const contacts = [
    {
      id: "call",
      name: "Gọi điện",
      value: "0971.050.324",
      href: "tel:0971050324",
      bgColor: "bg-emerald-500",
      textColor: "text-white",
      hoverColor: "hover:bg-emerald-600",
      icon: Phone,
      pulse: true,
    },
    {
      id: "zalo",
      name: "Zalo tư vấn",
      value: "0971050324",
      href: "https://zalo.me/0971050324",
      bgColor: "bg-[#0068ff]",
      textColor: "text-white",
      hoverColor: "hover:bg-[#0052cc]",
      isZalo: true,
      textLabel: "Zalo",
    },
    {
      id: "messenger",
      name: "Messenger",
      value: "m.me/1277673239073987",
      href: "https://m.me/1277673239073987",
      bgColor: "bg-gradient-to-r from-[#00c6ff] to-[#0072ff]",
      textColor: "text-white",
      hoverColor: "hover:from-[#00b5eb] hover:to-[#0060d6]",
      icon: Send,
    },
  ];

  return (
    <div className="fixed bottom-6 left-4 sm:bottom-8 sm:left-8 z-50 print:hidden flex flex-col items-start gap-2">
      {/* Scroll to Top Button (Hidden via state if preferred, but leaving behavior same) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            className="flex flex-col space-y-3"
            id="floating_contact_bar"
          >
            {contacts.map((contact) => {
              const Icon = contact.icon;
              return (
                <motion.a
                  key={contact.id}
                  href={contact.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center justify-center relative group shadow-lg ${contact.bgColor} ${contact.textColor} ${contact.hoverColor} transition-all duration-300 w-12 h-12 rounded-full cursor-pointer`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  id={`float_${contact.id}_btn`}
                >
                  {/* Ripple Ring Effect for Caller or active states */}
                  {contact.pulse && (
                    <span className="absolute -inset-1.5 rounded-full bg-emerald-500/20 animate-ping pointer-events-none" />
                  )}

                  {/* Icon / Content */}
                  {contact.isZalo ? (
                    <span className="font-extrabold text-[11px] uppercase tracking-wide font-sans">
                      {contact.textLabel}
                    </span>
                  ) : Icon ? (
                    <Icon className={`w-5 h-5 ${contact.pulse ? "animate-bounce" : ""}`} />
                  ) : null}

                  {/* Tooltip text showing on right hover */}
                  <span className="hidden md:block absolute left-14 top-1/2 -translate-y-1/2 bg-stone-900 text-stone-100 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 shadow-md pointer-events-none font-sans">
                    <span className="block font-bold">{contact.name}</span>
                    <span className="block text-[10px] text-stone-300 font-mono mt-0.5">{contact.value}</span>
                  </span>
                </motion.a>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Toggle Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 cursor-pointer text-white focus:outline-none ${
            isOpen ? "bg-stone-800 rotate-90" : "bg-emerald-600 hover:bg-emerald-700 hover:scale-110 animate-pulse"
          }`}
          aria-label="Liên hệ"
        >
          {isOpen ? <X className="w-5 h-5" /> : <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />}
        </button>

        {showScrollToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={scrollToTop}
            className="w-10 h-10 rounded-full bg-stone-800/80 text-white shadow-lg flex items-center justify-center hover:bg-stone-900 transition-colors pointer-events-auto"
            aria-label="Lên đầu trang"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </div>
    </div>
  );
}
