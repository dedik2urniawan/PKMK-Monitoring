"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Users, PlusCircle, Activity, BarChart3, ChevronLeft, ChevronRight, Search, Upload, FileText, Package, LogOut, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

type NavItem = { href: string; label: string; icon?: any; children?: NavItem[] };

const nav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/balita",
    label: "Daftar Balita",
    icon: Users,
    children: [
      { href: "/balita", label: "Data Balita", icon: Users },
      { href: "/balita/new", label: "Tambah Balita", icon: PlusCircle },
      { href: "/import/balita", label: "Import Excel", icon: Upload },
    ],
  },
  {
    href: "/monitoring",
    label: "Monitoring PKMK",
    icon: Activity,
    children: [
      { href: "/monitoring", label: "Monitoring PKMK", icon: Activity },
      { href: "/import/monitoring", label: "Import Excel", icon: Upload },
    ],
  },
  { href: "/kohort/new", label: "Daftar Kohort Intervensi", icon: ClipboardList },
  {
    href: "#laporan",
    label: "Laporan Tatalaksana",
    icon: FileText,
    children: [
      { href: "/riwayat", label: "Daftar Riwayat Intervensi", icon: Activity },
      { href: "/rekap-laporan", label: "Rekap Laporan", icon: BarChart3 },
    ],
  },
  { href: "/logistik", label: "Manajemen Logistik", icon: Package },
  { href: "/logistik/rekap", label: "Rekap Logistik", icon: BarChart3 },
];

export default function SideNav() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
    return href !== "#laporan" && pathname?.startsWith(href);
  };

  const toggleMenu = (label: string) => {
    setExpandedMenus(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
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
    <>
      <style jsx>{`
        .sidebar {
          width: ${isExpanded ? '256px' : '80px'};
          flex-shrink: 0;
          background: white;
          border-right: 1px solid #dce5e4;
          display: flex;
          flex-direction: column;
          transition: width 0.3s ease;
          position: relative;
          height: 100%;
        }
        .sidebar-header {
          height: 80px;
          display: flex;
          align-items: center;
          padding: 0 ${isExpanded ? '24px' : '16px'};
          border-bottom: 1px solid #dce5e4;
          gap: 12px;
        }
        .logo-icon {
          width: 40px;
          height: 40px;
          background: rgba(20, 184, 166, 0.1);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .sidebar-nav {
          flex: 1;
          overflow-y: auto;
          padding: 24px 12px;
        }
        .nav-section-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #638884;
          padding: 16px 12px 8px;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #111817;
          text-decoration: none;
          transition: all 0.2s;
          cursor: pointer;
          margin-bottom: 4px;
        }
        .nav-item:hover {
          background: #f6f8f8;
        }
        .nav-item.active {
          background: rgba(20, 184, 166, 0.1);
          color: #14b8a6;
          border-left: 4px solid #14b8a6;
          font-weight: 600;
        }
        .nav-item.active .nav-icon {
          color: #14b8a6;
        }
        .nav-icon {
          width: 20px;
          height: 20px;
          color: #638884;
          flex-shrink: 0;
        }
        .nav-item.active .nav-icon {
          color: #14b8a6;
        }
        .nav-arrow {
          margin-left: auto;
          width: 16px;
          height: 16px;
          color: #638884;
          transition: transform 0.2s;
        }
        .nav-arrow.expanded {
          transform: rotate(180deg);
        }
        .submenu {
          display: flex;
          flex-direction: column;
          padding-left: 44px;
          margin-top: 4px;
          gap: 2px;
        }
        .submenu-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          font-size: 13px;
          color: #638884;
          text-decoration: none;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .submenu-item:hover {
          color: #14b8a6;
          background: rgba(20, 184, 166, 0.05);
        }
        .submenu-item.active {
          color: #14b8a6;
          font-weight: 500;
        }
        .submenu-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }
        .sidebar-footer {
          padding: 16px;
          border-top: 1px solid #dce5e4;
        }
        .logout-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #ef4444;
          width: 100%;
          background: none;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
        }
        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.05);
        }
        .toggle-btn {
          position: absolute;
          right: -12px;
          top: 32px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          border: 2px solid #14b8a6;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: transform 0.2s;
        }
        .toggle-btn:hover {
          transform: scale(1.1);
        }
        .collapsed-nav {
          justify-content: center;
        }
      `}</style>

      <aside className="sidebar">
        {/* Toggle Button */}
        <button
          className="toggle-btn"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronLeft size={14} color="#14b8a6" />
          ) : (
            <ChevronRight size={14} color="#14b8a6" />
          )}
        </button>

        {/* Header */}
        <div className="sidebar-header">
          <div className="logo-icon">
            <Image src="/tindik-anting-logo.png" alt="PKMK" width={28} height={28} />
          </div>
          {isExpanded && (
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#111817' }}>Sistem PKMK</div>
              <div style={{ fontSize: '12px', color: '#638884' }}>Kab. Malang</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {isExpanded && <div className="nav-section-title">Menu Utama</div>}

          {nav.slice(0, 4).map((item) => (
            <div key={item.label}>
              {item.children ? (
                <>
                  <div
                    className={cn("nav-item", isActive(item.href) && "active", !isExpanded && "collapsed-nav")}
                    onClick={() => isExpanded && toggleMenu(item.label)}
                  >
                    {item.icon && <item.icon className="nav-icon" />}
                    {isExpanded && (
                      <>
                        <span style={{ flex: 1 }}>{item.label}</span>
                        <ChevronRight
                          className={cn("nav-arrow", expandedMenus.includes(item.label) && "expanded")}
                          style={{ transform: expandedMenus.includes(item.label) ? 'rotate(90deg)' : 'none' }}
                        />
                      </>
                    )}
                  </div>
                  {isExpanded && expandedMenus.includes(item.label) && (
                    <div className="submenu">
                      {item.children.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={cn("submenu-item", isActive(sub.href) && "active")}
                        >
                          <span className="submenu-dot" />
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  className={cn("nav-item", isActive(item.href) && "active", !isExpanded && "collapsed-nav")}
                >
                  {item.icon && <item.icon className="nav-icon" />}
                  {isExpanded && <span>{item.label}</span>}
                </Link>
              )}
            </div>
          ))}

          {isExpanded && <div className="nav-section-title">Laporan & Aset</div>}

          {nav.slice(4).map((item) => (
            <div key={item.label}>
              {item.children ? (
                <>
                  <div
                    className={cn("nav-item", !isExpanded && "collapsed-nav")}
                    onClick={() => isExpanded && toggleMenu(item.label)}
                  >
                    {item.icon && <item.icon className="nav-icon" />}
                    {isExpanded && (
                      <>
                        <span style={{ flex: 1 }}>{item.label}</span>
                        <ChevronRight
                          className={cn("nav-arrow")}
                          style={{ transform: expandedMenus.includes(item.label) ? 'rotate(90deg)' : 'none' }}
                        />
                      </>
                    )}
                  </div>
                  {isExpanded && expandedMenus.includes(item.label) && (
                    <div className="submenu">
                      {item.children.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={cn("submenu-item", isActive(sub.href) && "active")}
                        >
                          <span className="submenu-dot" />
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  className={cn("nav-item", isActive(item.href) && "active", !isExpanded && "collapsed-nav")}
                >
                  {item.icon && <item.icon className="nav-icon" />}
                  {isExpanded && <span>{item.label}</span>}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <Link href="/logout" className="logout-btn">
            <LogOut size={20} />
            {isExpanded && <span>Keluar</span>}
          </Link>
        </div>
      </aside>
    </>
  );
}
