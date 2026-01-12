"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { LogOut, User, ChevronDown, Shield, Building2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { getAuthHeaders } from "@/lib/clientSession";
import NotificationBell from "./NotificationBell";

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

    const handleLogout = async () => {
        localStorage.removeItem('sb_access_token');
        localStorage.removeItem('sb_refresh_token');
        sessionStorage.removeItem("pkmk_welcome_shown");
        await supabase.auth.signOut();
        toast.success("Logout berhasil");
        router.push("/login");
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
            <header style={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                background: 'linear-gradient(180deg, #ffffff, #f8fafc)',
                borderBottom: '1px solid #e2e8f0',
                padding: '16px 32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
                {/* Left Section - Branding */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                        width: 48,
                        height: 48,
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        borderRadius: 14,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                    }}>
                        <Image src="/tindik-anting-logo.png" alt="PKMK" width={28} height={28} style={{ filter: 'brightness(0) invert(1)' }} />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                                Sistem Pelaporan PKMK
                            </h2>
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '4px 10px',
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                color: 'white',
                                borderRadius: 8,
                                fontSize: 10,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                            }}>
                                <Sparkles size={10} />
                                Pro
                            </span>
                        </div>
                        <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>
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
                        {/* Profile Info Card */}
                        <div style={{
                            background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                            borderRadius: 14,
                            padding: '10px 16px',
                            border: '1px solid #e2e8f0',
                            minWidth: 180,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                                    {greeting.text}
                                </span>
                                <span style={{ fontSize: 16 }}>{greeting.emoji}</span>
                            </div>
                            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>
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
                                    fontSize: 9,
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                }}>
                                    <RoleIcon size={10} />
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

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 16,
                    zIndex: 100,
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: 24,
                        boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
                        width: '100%',
                        maxWidth: 400,
                        padding: 32,
                        textAlign: 'center',
                        animation: 'modalZoomIn 0.2s ease-out',
                    }}>
                        {/* Icon */}
                        <div style={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px',
                            boxShadow: '0 8px 24px rgba(251, 191, 36, 0.3)',
                        }}>
                            <div style={{
                                width: 56,
                                height: 56,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 28,
                                fontWeight: 'bold',
                                color: 'white',
                            }}>!</div>
                        </div>

                        <h3 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
                            Apakah Anda yakin?
                        </h3>
                        <p style={{ fontSize: 15, color: '#64748b', marginBottom: 32 }}>
                            Anda akan keluar dari sistem!
                        </p>

                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <button
                                onClick={handleLogout}
                                style={{
                                    padding: '14px 32px',
                                    borderRadius: 12,
                                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                    color: 'white',
                                    fontWeight: 700,
                                    border: 'none',
                                    cursor: 'pointer',
                                    minWidth: 130,
                                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                                    fontSize: 15,
                                }}
                            >
                                Ya, Logout!
                            </button>
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                style={{
                                    padding: '14px 32px',
                                    borderRadius: 12,
                                    background: 'linear-gradient(135deg, #94a3b8, #64748b)',
                                    color: 'white',
                                    fontWeight: 700,
                                    border: 'none',
                                    cursor: 'pointer',
                                    minWidth: 130,
                                    boxShadow: '0 4px 12px rgba(100, 116, 139, 0.4)',
                                    fontSize: 15,
                                }}
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes modalZoomIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
            `}</style>
        </>
    );
}
