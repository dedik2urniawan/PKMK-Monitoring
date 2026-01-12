"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Users, PlusCircle, Activity, BarChart3, ChevronLeft, ChevronRight, Upload, FileText, Package, LogOut, ClipboardList, Sparkles } from "lucide-react";
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

  const sidebarWidth = isExpanded ? 272 : 80;

  return (
    <aside style={{
      width: sidebarWidth,
      flexShrink: 0,
      background: 'linear-gradient(180deg, #ffffff, #f8fafc)',
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s ease',
      position: 'relative',
      height: '100%',
    }}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          position: 'absolute',
          right: -14,
          top: 36,
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          border: '3px solid white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 10,
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
          transition: 'transform 0.2s',
        }}
      >
        {isExpanded ? (
          <ChevronLeft size={14} color="white" />
        ) : (
          <ChevronRight size={14} color="white" />
        )}
      </button>

      {/* Header */}
      <div style={{
        padding: isExpanded ? '20px 20px' : '20px 16px',
        borderBottom: '1px solid #e2e8f0',
        background: 'linear-gradient(135deg, #ecfdf5, #f0fdf4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44,
            height: 44,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
          }}>
            <Image src="/tindik-anting-logo.png" alt="PKMK" width={26} height={26} style={{ filter: 'brightness(0) invert(1)' }} />
          </div>
          {isExpanded && (
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Sistem PKMK</span>
                <span style={{
                  padding: '3px 8px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  borderRadius: 6,
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>Pro</span>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Kab. Malang</div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '20px 12px' }}>
        {/* Section: Menu Utama */}
        {isExpanded && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 12px 10px',
            marginBottom: 4,
          }}>
            <div style={{ width: 20, height: 2, background: 'linear-gradient(90deg, #10b981, transparent)', borderRadius: 2 }} />
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b' }}>Menu Utama</span>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          </div>
        )}

        {nav.slice(0, 4).map((item) => (
          <div key={item.label} style={{ marginBottom: 4 }}>
            {item.children ? (
              <>
                <div
                  onClick={() => isExpanded && toggleMenu(item.label)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: isExpanded ? '10px 12px' : '10px',
                    borderRadius: 12,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: isActive(item.href) ? 'linear-gradient(135deg, #ecfdf5, #d1fae5)' : 'transparent',
                    border: isActive(item.href) ? '1px solid #a7f3d0' : '1px solid transparent',
                    justifyContent: isExpanded ? 'flex-start' : 'center',
                  }}
                >
                  <div style={{
                    width: 36,
                    height: 36,
                    background: isActive(item.href) ? 'linear-gradient(135deg, #10b981, #059669)' : '#f1f5f9',
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isActive(item.href) ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none',
                    transition: 'all 0.2s',
                  }}>
                    {item.icon && <item.icon size={18} color={isActive(item.href) ? 'white' : '#64748b'} />}
                  </div>
                  {isExpanded && (
                    <>
                      <span style={{ flex: 1, fontSize: 14, fontWeight: isActive(item.href) ? 600 : 500, color: isActive(item.href) ? '#047857' : '#374151' }}>{item.label}</span>
                      <ChevronRight
                        size={16}
                        color="#94a3b8"
                        style={{ transform: expandedMenus.includes(item.label) ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}
                      />
                    </>
                  )}
                </div>
                {isExpanded && expandedMenus.includes(item.label) && (
                  <div style={{ marginLeft: 24, paddingLeft: 20, borderLeft: '2px solid #e2e8f0', marginTop: 4, marginBottom: 8 }}>
                    {item.children.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 12px',
                          fontSize: 13,
                          color: isActive(sub.href) ? '#10b981' : '#64748b',
                          textDecoration: 'none',
                          borderRadius: 8,
                          fontWeight: isActive(sub.href) ? 600 : 400,
                          background: isActive(sub.href) ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: isActive(sub.href) ? '#10b981' : '#cbd5e1',
                          boxShadow: isActive(sub.href) ? '0 0 0 3px rgba(16, 185, 129, 0.2)' : 'none',
                        }} />
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Link
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: isExpanded ? '10px 12px' : '10px',
                  borderRadius: 12,
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  background: isActive(item.href) ? 'linear-gradient(135deg, #ecfdf5, #d1fae5)' : 'transparent',
                  border: isActive(item.href) ? '1px solid #a7f3d0' : '1px solid transparent',
                  justifyContent: isExpanded ? 'flex-start' : 'center',
                }}
              >
                <div style={{
                  width: 36,
                  height: 36,
                  background: isActive(item.href) ? 'linear-gradient(135deg, #10b981, #059669)' : '#f1f5f9',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isActive(item.href) ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none',
                  transition: 'all 0.2s',
                }}>
                  {item.icon && <item.icon size={18} color={isActive(item.href) ? 'white' : '#64748b'} />}
                </div>
                {isExpanded && (
                  <span style={{ fontSize: 14, fontWeight: isActive(item.href) ? 600 : 500, color: isActive(item.href) ? '#047857' : '#374151' }}>{item.label}</span>
                )}
              </Link>
            )}
          </div>
        ))}

        {/* Section: Laporan & Aset */}
        {isExpanded && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '20px 12px 10px',
            marginBottom: 4,
          }}>
            <div style={{ width: 20, height: 2, background: 'linear-gradient(90deg, #3b82f6, transparent)', borderRadius: 2 }} />
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b' }}>Laporan & Aset</span>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          </div>
        )}

        {nav.slice(4).map((item) => (
          <div key={item.label} style={{ marginBottom: 4 }}>
            {item.children ? (
              <>
                <div
                  onClick={() => isExpanded && toggleMenu(item.label)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: isExpanded ? '10px 12px' : '10px',
                    borderRadius: 12,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: 'transparent',
                    justifyContent: isExpanded ? 'flex-start' : 'center',
                  }}
                >
                  <div style={{
                    width: 36,
                    height: 36,
                    background: '#f1f5f9',
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {item.icon && <item.icon size={18} color="#64748b" />}
                  </div>
                  {isExpanded && (
                    <>
                      <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: '#374151' }}>{item.label}</span>
                      <ChevronRight
                        size={16}
                        color="#94a3b8"
                        style={{ transform: expandedMenus.includes(item.label) ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}
                      />
                    </>
                  )}
                </div>
                {isExpanded && expandedMenus.includes(item.label) && (
                  <div style={{ marginLeft: 24, paddingLeft: 20, borderLeft: '2px solid #e2e8f0', marginTop: 4, marginBottom: 8 }}>
                    {item.children.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 12px',
                          fontSize: 13,
                          color: isActive(sub.href) ? '#10b981' : '#64748b',
                          textDecoration: 'none',
                          borderRadius: 8,
                          fontWeight: isActive(sub.href) ? 600 : 400,
                          background: isActive(sub.href) ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: isActive(sub.href) ? '#10b981' : '#cbd5e1',
                        }} />
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Link
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: isExpanded ? '10px 12px' : '10px',
                  borderRadius: 12,
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  background: isActive(item.href) ? 'linear-gradient(135deg, #ecfdf5, #d1fae5)' : 'transparent',
                  border: isActive(item.href) ? '1px solid #a7f3d0' : '1px solid transparent',
                  justifyContent: isExpanded ? 'flex-start' : 'center',
                }}
              >
                <div style={{
                  width: 36,
                  height: 36,
                  background: isActive(item.href) ? 'linear-gradient(135deg, #10b981, #059669)' : '#f1f5f9',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isActive(item.href) ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none',
                }}>
                  {item.icon && <item.icon size={18} color={isActive(item.href) ? 'white' : '#64748b'} />}
                </div>
                {isExpanded && (
                  <span style={{ fontSize: 14, fontWeight: isActive(item.href) ? 600 : 500, color: isActive(item.href) ? '#047857' : '#374151' }}>{item.label}</span>
                )}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: 16,
        borderTop: '1px solid #e2e8f0',
        background: 'linear-gradient(180deg, #f8fafc, #f1f5f9)',
      }}>
        <Link
          href="/logout"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: isExpanded ? '12px 16px' : '12px',
            borderRadius: 12,
            textDecoration: 'none',
            background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
            border: '1px solid #fecaca',
            transition: 'all 0.2s',
            justifyContent: isExpanded ? 'flex-start' : 'center',
          }}
        >
          <div style={{
            width: 36,
            height: 36,
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
          }}>
            <LogOut size={18} color="white" />
          </div>
          {isExpanded && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#dc2626' }}>Keluar</span>
              <span style={{
                padding: '3px 8px',
                background: '#fecaca',
                color: '#991b1b',
                borderRadius: 6,
                fontSize: 10,
                fontWeight: 600,
              }}>v1.2</span>
            </div>
          )}
        </Link>
      </div>
    </aside>
  );
}
