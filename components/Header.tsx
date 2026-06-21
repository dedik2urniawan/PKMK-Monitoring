"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { LogOut, User, ChevronDown, Shield, Building2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { getAuthHeaders } from "@/lib/clientSession";
import NotificationBell from "./NotificationBell";
import LogoutModal from "./LogoutModal";

export default function Header() {
    const router = useRouter();
    const [email, setEmail] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const authHeaders = await getAuthHeaders();
                const res = await fetch('/api/auth/me', {
                    credentials: 'include',
                    headers: authHeaders
                });
                if (res.ok) {
                    const data = await res.json();
                    setEmail(data.email ?? null);
                    setRole(data.role ?? null);
                }
            } catch { }
        })();
    }, []);

    const handleLogoutClick = () => {
        setIsDropdownOpen(false);
        setShowLogoutConfirm(true);
    };

    // Get time-based greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 11) return { text: "Selamat Pagi", emoji: "☀️" };
        if (hour >= 11 && hour < 15) return { text: "Selamat Siang", emoji: "🌤️" };
        if (hour >= 15 && hour < 18) return { text: "Selamat Sore", emoji: "🌅" };
        return { text: "Selamat Malam", emoji: "🌙" };
    };

    const greeting = getGreeting();

    const getRoleBadge = () => {
        if (role === "superadmin") {
            return { label: "SUPERADMIN", color: "#8b5cf6", bg: "linear-gradient(135deg, #8b5cf6, #7c3aed)", icon: Shield };
        }
        return { label: "ADMIN PKM", color: "#3b82f6", bg: "linear-gradient(135deg, #3b82f6, #2563eb)", icon: Building2 };
    };

    const roleBadge = getRoleBadge();
    const RoleIcon = roleBadge.icon;

    return (
        <>
            <header 
                className="sticky top-0 z-10 px-4 py-3 md:px-8 md:py-4 flex items-center justify-between bg-white border-b border-gray-200 shadow-sm"
                style={{
                    background: 'linear-gradient(180deg, #ffffff, #f8fafc)',
                }}
            >
                {/* Left Section - Branding */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 40,
                        height: 40,
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                        flexShrink: 0
                    }}>
                        <Image src="/tindik-anting-logo.png" alt="PKMK" width={24} height={24} style={{ filter: 'brightness(0) invert(1)' }} />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
                                PKMK Monitoring
                            </h2>
                            <span className="hidden sm:inline-flex" style={{
                                alignItems: 'center',
                                gap: 4,
                                padding: '3px 8px',
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                color: 'white',
                                borderRadius: 6,
                                fontSize: 9,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            }}>
                                <Sparkles size={8} />
                                Pro
                            </span>
                        </div>
                        <span className="hidden md:block" style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                            Dinas Kesehatan Kabupaten Malang
                        </span>
                    </div>
                </div>

                {/* Right Section */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    {/* Notifications */}
                    <NotificationBell />

                    {/* Profile Section */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        paddingLeft: 20,
                        borderLeft: '1px solid #e2e8f0',
                        position: 'relative',
                    }}>
                        {/* Profile Info Card - Hidden on Mobile */}
                        <div className="hidden lg:block" style={{
                            background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                            borderRadius: 14,
                            padding: '10px 16px',
                            border: '1px solid #e2e8f0',
                            minWidth: 160,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                                    {greeting.text}
                                </span>
                            </div>
                            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>
                                {email || 'Loading...'}
                            </div>
                            {role && (
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    padding: '3px 8px',
                                    background: roleBadge.bg,
                                    color: 'white',
                                    borderRadius: 6,
                                    fontSize: 8,
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                }}>
                                    <RoleIcon size={8} />
                                    {roleBadge.label}
                                </div>
                            )}
                        </div>

                        {/* Avatar Button */}
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                            }}
                        >
                            <div style={{ position: 'relative' }}>
                                <div style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #10b981, #059669)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                                    border: '3px solid white',
                                }}>
                                    <User size={22} />
                                </div>
                                {/* Online Indicator */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: 2,
                                    right: 2,
                                    width: 12,
                                    height: 12,
                                    background: '#22c55e',
                                    borderRadius: '50%',
                                    border: '2px solid white',
                                    boxShadow: '0 0 0 2px rgba(34, 197, 94, 0.3)',
                                }} />
                            </div>
                            <ChevronDown
                                size={18}
                                color="#64748b"
                                style={{
                                    transform: isDropdownOpen ? 'rotate(180deg)' : 'none',
                                    transition: 'transform 0.2s',
                                }}
                            />
                        </button>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <>
                                <div
                                    onClick={() => setIsDropdownOpen(false)}
                                    style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                                />
                                <div style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: '100%',
                                    marginTop: 12,
                                    width: 220,
                                    background: 'white',
                                    borderRadius: 16,
                                    boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                                    border: '1px solid #e2e8f0',
                                    padding: 8,
                                    zIndex: 20,
                                }}>
                                    {/* User Info in Dropdown */}
                                    <div style={{
                                        padding: '12px 16px',
                                        borderBottom: '1px solid #f1f5f9',
                                        marginBottom: 8,
                                    }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>
                                            {email?.split('@')[0] || 'User'}
                                        </div>
                                        <div style={{ fontSize: 11, color: '#64748b' }}>
                                            {email}
                                        </div>
                                    </div>

                                    {/* Logout Button */}
                                    <button
                                        onClick={handleLogoutClick}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 10,
                                            padding: '12px 16px',
                                            fontSize: 14,
                                            fontWeight: 600,
                                            color: '#dc2626',
                                            borderRadius: 10,
                                            cursor: 'pointer',
                                            transition: 'background 0.2s',
                                            width: '100%',
                                            background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
                                            border: '1px solid #fecaca',
                                            textAlign: 'left',
                                        }}
                                    >
                                        <div style={{
                                            width: 32,
                                            height: 32,
                                            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                            borderRadius: 8,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            <LogOut size={16} color="white" />
                                        </div>
                                        Logout
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <LogoutModal 
                isOpen={showLogoutConfirm} 
                onClose={() => setShowLogoutConfirm(false)} 
            />
        </>
    );
}
