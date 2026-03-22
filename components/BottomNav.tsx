"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Activity, Search, Menu, PlusCircle, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function BottomNav() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show banner after 5 seconds of activity
      setTimeout(() => setShowInstallBanner(true), 5000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
    return pathname?.startsWith(href);
  };

  const navItems = [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/balita", label: "Balita", icon: Users },
    { href: "/monitoring", label: "Input", icon: Activity },
    { href: "/determinan/daftar-balita", label: "Survey", icon: Search },
    { href: "#", label: "Menu", icon: Menu },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* PWA Install Banner (Android Style) */}
      {showInstallBanner && (
        <div className="mx-4 mb-2 bg-gradient-to-r from-teal-600 to-teal-500 text-white p-3 rounded-xl shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom-full duration-500">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <PlusCircle size={20} />
            </div>
            <div>
              <p className="text-xs font-bold">Pasang Aplikasi PKMK</p>
              <p className="text-[10px] opacity-90">Akses lebih cepat & offline</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleInstallClick}
              className="bg-white text-teal-700 text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm active:scale-95 transition-transform"
            >
              Pasang
            </button>
            <button 
              onClick={() => setShowInstallBanner(false)}
              className="p-1.5 text-white/70 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Main Navigation Bar */}
      <nav className="bg-white/90 backdrop-blur-lg border-t border-gray-200 px-2 pt-2 pb-safe-area shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <ul className="flex justify-around items-center h-14">
          {navItems.map((item) => (
            <li key={item.label} className="flex-1">
              <Link
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
                  isActive(item.href) ? "text-teal-600 scale-110" : "text-gray-400"
                }`}
              >
                <div className={`relative p-1 rounded-xl transition-colors ${
                  isActive(item.href) ? "bg-teal-50" : ""
                }`}>
                  <item.icon size={22} strokeWidth={isActive(item.href) ? 2.5 : 2} />
                  {isActive(item.href) && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-teal-500 rounded-full border-2 border-white"></span>
                  )}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {item.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Background fill for safe areas (notched phones) */}
      <div className="h-safe-area bg-white/90 backdrop-blur-lg"></div>
    </div>
  );
}
