"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, MouseEvent } from "react";
import { supabase } from "@/lib/supabase/client";
import { LayoutDashboard, Users, PlusCircle, Activity, BarChart3, LogOut } from "lucide-react";
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
  const [email, setEmail] = useState<string | null>(null);
  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
    return href !== "#laporan" && pathname?.startsWith(href);
  };

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        setEmail(data.user?.email ?? null);
      } catch {}
    })();
  }, []);

  return (
    <nav className="flex flex-col p-2 text-sm text-white">
      <div className="px-3 pt-3 pb-1 text-xs uppercase tracking-wide text-white font-bold">Navigasi</div>
      <div className="space-y-1">
        {nav.map((item) => (
          <div key={item.label}>
            <Link
              href={item.href === "#laporan" ? "#" : item.href}
              className={cn(
                "px-3 py-2 rounded-md hover:bg-white/10 flex items-center gap-2 text-white",
                isActive(item.href) && "bg-white/15 font-semibold"
              )}
            >
              {item.icon ? <item.icon size={16} /> : null}
              <span>{item.label}</span>
            </Link>
            {item.children && (
              <div className="ml-7 mt-1 space-y-1">
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
                        "px-3 py-1.5 rounded-md hover:bg-white/10 flex items-center gap-2 text-white",
                        isActive(sub.href) && "bg-white/15 font-semibold"
                      )}
                    >
                      {sub.icon ? <sub.icon size={14} /> : null}
                      <span className="flex items-center gap-2">
                        {sub.label}
                        {comingSoon && (
                          <span className="text-[10px] leading-none rounded-full bg-white/20 text-white px-2 py-0.5 border border-white/30">
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

      <div className="px-3 pt-3 pb-1 text-xs uppercase tracking-wide text-white font-bold">Akun</div>
      {email && (
        <div className="px-3 pb-1 text-xs text-white/85">{email}</div>
      )}
      <Link
        href="/logout"
        className="px-3 py-2 rounded-md hover:bg-white/10 inline-flex items-center gap-2 text-white"
      >
        <LogOut size={16} /> Keluar
      </Link>
    </nav>
  );
}




