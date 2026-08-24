"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { LogOut, User, Shield, Building2, ChevronRight, Settings, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getAuthHeaders } from "@/lib/clientSession";

export default function ProfilPage() {
    const router = useRouter();
    const [email, setEmail] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);
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

    const handleLogout = async () => {
        localStorage.removeItem('sb_access_token');
        localStorage.removeItem('sb_refresh_token');
        sessionStorage.removeItem("pkmk_welcome_shown");
        await supabase.auth.signOut();
        toast.success("Logout berhasil");
        router.push("/login");
    };

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
            <style>{`
                .profil-container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 0 0 32px 0;
                    min-height: 100vh;
                    background: #f8fafc;
                }
                .profil-header {
                    background: white;
                    padding: 32px 24px 24px;
                    border-bottom: 1px solid #e2e8f0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                }
                .avatar-wrapper {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #10b981, #059669);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    box-shadow: 0 8px 16px rgba(16, 185, 129, 0.25);
                    border: 4px solid white;
                    margin-bottom: 16px;
                }
                .user-name {
                    font-size: 20px;
                    font-weight: 800;
                    color: #0f172a;
                    margin-bottom: 4px;
                }
                .user-email {
                    font-size: 14px;
                    color: #64748b;
                    margin-bottom: 12px;
                }
                .menu-section {
                    margin-top: 24px;
                    padding: 0 16px;
                }
                .menu-group {
                    background: white;
                    border-radius: 16px;
                    border: 1px solid #e2e8f0;
                    overflow: hidden;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                }
                .menu-item {
                    display: flex;
                    align-items: center;
                    padding: 16px;
                    border-bottom: 1px solid #f1f5f9;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .menu-item:active {
                    background: #f8fafc;
                }
                .menu-item:last-child {
                    border-bottom: none;
                }
                .menu-icon {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 12px;
                }
                .menu-content {
                    flex: 1;
                }
                .menu-title {
                    font-size: 15px;
                    font-weight: 600;
                    color: #334155;
                }
            `}</style>

            <div className="profil-container pb-28 md:pb-12">
                <div className="profil-header">
                    <div className="avatar-wrapper">
                        <User size={40} />
                    </div>
                    <div className="user-name">
                        {email?.split('@')[0] || 'User'}
                    </div>
                    <div className="user-email">
                        {email || 'Loading...'}
                    </div>
                    {role && (
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '4px 10px',
                            background: roleBadge.bg,
                            color: 'white',
                            borderRadius: 8,
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                        }}>
                            <RoleIcon size={12} />
                            {roleBadge.label}
                        </div>
                    )}
                </div>

                <div className="menu-section">
                    <div className="text-sm font-bold text-slate-500 mb-2 ml-2 uppercase tracking-wide">Pengaturan</div>
                    <div className="menu-group">
                        <div className="menu-item">
                            <div className="menu-icon bg-slate-100 text-slate-600">
                                <Settings size={20} />
                            </div>
                            <div className="menu-content">
                                <div className="menu-title">Preferensi Akun</div>
                            </div>
                            <ChevronRight size={20} className="text-slate-400" />
                        </div>
                        <div className="menu-item">
                            <div className="menu-icon bg-slate-100 text-slate-600">
                                <Info size={20} />
                            </div>
                            <div className="menu-content">
                                <div className="menu-title">Tentang Aplikasi</div>
                            </div>
                            <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-md">v2.0</span>
                        </div>
                    </div>
                </div>

                <div className="menu-section mt-6">
                    <div className="menu-group border-red-100">
                        <div className="menu-item" onClick={() => setShowLogoutConfirm(true)}>
                            <div className="menu-icon bg-red-50 text-red-500">
                                <LogOut size={20} />
                            </div>
                            <div className="menu-content">
                                <div className="menu-title text-red-600">Keluar (Logout)</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

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
                        maxWidth: 340,
                        padding: 24,
                        textAlign: 'center',
                        animation: 'modalZoomIn 0.2s ease-out',
                    }}>
                        <div style={{
                            width: 64,
                            height: 64,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px',
                        }}>
                            <div style={{
                                width: 44,
                                height: 44,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 24,
                                fontWeight: 'bold',
                                color: 'white',
                            }}>!</div>
                        </div>

                        <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>
                            Apakah Anda yakin?
                        </h3>
                        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>
                            Anda akan keluar dari sistem!
                        </p>

                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <button
                                onClick={handleLogout}
                                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl active:bg-red-600 transition-colors"
                            >
                                Ya, Keluar
                            </button>
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 py-3 bg-slate-200 text-slate-700 font-bold rounded-xl active:bg-slate-300 transition-colors"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
