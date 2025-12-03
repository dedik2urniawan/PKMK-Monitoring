"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, MouseEvent } from "react";
import { LayoutDashboard, Users, PlusCircle, Activity, BarChart3, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type NavItem = { href: string; label: string; icon?: any; children?: NavItem[] };

const nav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/balita",
    label: "Daftar Balita",
    icon: Users,
    children: [{ href: "/balita/new", label: "Tambah Balita", icon: PlusCircle }],
  },
  { href: "/monitoring", label: "Monitoring PKMK", icon: Activity },
  {
    href: "#laporan",
    label: "Laporan Tatalaksana",
    icon: BarChart3,
    children: [
      { href: "/kohort/new", label: "Daftar Kohort Intervensi", icon: Activity },
      { href: "/monitoring", label: "Daftar Riwayat Intervensi", icon: Activity },
      { href: "/monitoring", label: "Rekap Laporan", icon: BarChart3 },
      { href: "/logistik", label: "Manajemen Logistik", icon: BarChart3 },
      { href: "/logistik/rekap", label: "Rekap Logistik", icon: BarChart3 },
    ],
  },
];

export default function SideNav() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
    return href !== "#laporan" && pathname?.startsWith(href);
  };

  // Auto-collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsExpanded(false);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={cn(
      "h-full transition-all duration-300",
      isExpanded ? "w-64" : "w-20"
    )}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -right-3 top-6 w-7 h-7 rounded-full bg-white shadow-lg border-2 border-[var(--primary)] flex items-center justify-center hover:scale-110 hover:shadow-xl transition-all duration-200 z-10"
        aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
      >
        <ChevronLeft
          className={cn(
            "h-4 w-4 text-[var(--primary)] transition-transform duration-200",
            !isExpanded && "rotate-180"
          )}
        />
      </button>

      <nav className={cn("flex flex-col p-4 text-sm transition-all duration-300")}>
        {/* Search Bar - Only show when expanded */}
        {isExpanded && (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
              <input
                type="text"
                placeholder="Cari menu"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/15 transition-all"
              />
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className={cn(
          "px-2 pb-3 text-[11px] uppercase tracking-wider font-semibold transition-all",
          isExpanded ? "text-white/60" : "text-center text-white/50"
        )}>
          {isExpanded ? "Menu Utama" : "≡"}
        </div>

        {/* Main Navigation */}
        <div className="space-y-1">
          {nav.map((item) => (
            <div key={item.label}>
              <Link
                href={item.href === "#laporan" ? "#" : item.href}
                className={cn(
                  "px-3 py-2.5 rounded-lg flex items-center gap-3 transition-all duration-200 font-medium",
                  !isExpanded && "justify-center",
                  // Inactive state - clean white text
                  !isActive(item.href) && "text-white hover:bg-white/10",
                  // Active state - bold with left border
                  isActive(item.href) && "text-white font-bold bg-white/15 border-l-4 border-white shadow-sm"
                )}
              >
                {item.icon && <item.icon size={20} className="flex-shrink-0" />}
                {isExpanded && (
                  <>
                    <span className="truncate flex-1">{item.label}</span>
                    {item.children && (
                      <ChevronRight size={16} className="flex-shrink-0 opacity-80" />
                    )}
                  </>
                )}
              </Link>

              {/* Sub-menu items */}
              {item.children && isExpanded && (
                <div className="ml-9 mt-1 space-y-0.5">
                  {item.children.map((sub) => {
                    const comingSoon = (
                      sub.label === "Daftar Riwayat Intervensi" ||
                      sub.label === "Rekap Laporan" ||
                      sub.label === "Manajemen Logistik" ||
                      sub.label === "Rekap Logistik"
                    );
                    const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
                      if (!comingSoon) return;
                      e.preventDefault();
                      toast.info(
                        "Fitur masih dalam pengembangan. Mohon tunggu pembaruan selanjutnya.",
                        { description: "Tim akan menginformasikan saat fitur siap digunakan." }
                      );
                    };
                    return (
                      <Link
                        key={`${sub.href}:${sub.label}`}
                        href={comingSoon ? "#" : sub.href}
                        onClick={onClick}
                        className={cn(
                          "px-3 py-2 rounded-md flex items-center gap-2 transition-all duration-150 text-sm font-medium",
                          // Inactive submenu - clear white
                          !isActive(sub.href) && "text-white/95 hover:text-white hover:bg-white/10",
                          // Active submenu - bold with left border
                          isActive(sub.href) && "text-white font-semibold bg-white/12 border-l-2 border-white/80"
                        )}
                      >
                        {sub.icon && <sub.icon size={16} className="flex-shrink-0" />}
                        <span className="flex items-center gap-2 truncate flex-1">
                          {sub.label}
                          {comingSoon && (
                            <span className="text-[10px] leading-none rounded-full bg-white/25 text-white px-2 py-0.5 border border-white/40 flex-shrink-0 font-semibold">
                              Beta
                            </span>
                          )}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
}
