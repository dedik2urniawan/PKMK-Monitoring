"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, MouseEvent } from "react";
import { LayoutDashboard, Users, PlusCircle, Activity, BarChart3, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";


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
  { href: "/kohort/new", label: "Daftar Kohort Intervensi", icon: Activity },
  {
    href: "#laporan",
    label: "Laporan Tatalaksana",
    icon: BarChart3,
    children: [
      { href: "/riwayat", label: "Daftar Riwayat Intervensi", icon: Activity },
      { href: "/rekap-laporan", label: "Rekap Laporan", icon: BarChart3 },
    ],
  },
  { href: "/logistik", label: "Manajemen Logistik", icon: BarChart3 },
  { href: "/logistik/rekap", label: "Rekap Logistik", icon: BarChart3 },
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
        className="absolute -right-3 top-6 w-7 h-7 rounded-full bg-white shadow-lg border-2 border-emerald-500 flex items-center justify-center hover:scale-110 hover:shadow-xl transition-all duration-200 z-10"
        aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
      >
        <ChevronLeft
          className={cn(
            "h-4 w-4 text-emerald-600 transition-transform duration-200",
            !isExpanded && "rotate-180"
          )}
        />
      </button>

      <nav className={cn("flex flex-col p-4 text-sm transition-all duration-300")}>
        {/* Search Bar - Only show when expanded */}
        {isExpanded && (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Cari menu"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-white/60 border border-gray-300 text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className={cn(
          "px-2 pb-3 text-[11px] uppercase tracking-wider font-semibold transition-all",
          isExpanded ? "text-gray-500" : "text-center text-gray-600"
        )}>
          {isExpanded ? "Menu Utama" : "≡"}
        </div>

        {/* Main Navigation */}
        <div className="space-y-2">
          {nav.map((item) => (
            <div key={item.label}>
              <Link
                href={item.href === "#laporan" ? "#" : item.href}
                className={cn(
                  "px-3 py-3 rounded-lg flex items-center gap-3 transition-all duration-200 ease-in-out font-medium",
                  !isExpanded && "justify-center",
                  // Inactive state - DARK BLACK text with elegant hover
                  !isActive(item.href) && "text-gray-900 hover:bg-white/60",
                  // Active state - DARK BLACK BOLD with emerald accent
                  isActive(item.href) && "text-gray-900 font-extrabold bg-emerald-100 border-l-4 border-emerald-500 shadow-sm"
                )}
                style={{ color: '#111827' }}
              >
                {item.icon && <item.icon size={20} className={cn("flex-shrink-0", !isActive(item.href) && "opacity-75")} />}
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
                <div className="ml-12 mt-1.5 space-y-1 border-l border-gray-300 pl-2">
                  {item.children.map((sub) => {
                    return (
                      <Link
                        key={`${sub.href}:${sub.label}`}
                        href={sub.href}
                        className={cn(
                          "px-3 py-2.5 rounded-md flex items-center gap-2 transition-all duration-200 ease-in-out text-sm font-medium",
                          // Inactive submenu - DARK BLACK text
                          !isActive(sub.href) && "text-gray-900 hover:bg-white/50",
                          // Active submenu - DARK BLACK BOLD with emerald accent
                          isActive(sub.href) && "text-gray-900 font-bold bg-emerald-50 border-l-2 border-emerald-500"
                        )}
                        style={{ color: '#111827' }}
                      >
                        {sub.icon && <sub.icon size={16} className={cn("flex-shrink-0", !isActive(sub.href) && "opacity-75")} />}
                        <span className="flex items-center gap-2 truncate flex-1">
                          {sub.label}
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
