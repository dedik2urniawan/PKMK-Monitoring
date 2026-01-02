"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { LogOut, User, ChevronDown, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { getAuthHeaders } from "@/lib/clientSession";

export default function Header() {
    const router = useRouter();
    const [email, setEmail] = useState<string | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                // Fetch from API which properly reads JWT from localStorage
                const authHeaders = await getAuthHeaders();
                const res = await fetch('/api/auth/me', {
                    credentials: 'include',
                    headers: authHeaders
                });
                if (res.ok) {
                    const data = await res.json();
                    setEmail(data.email ?? null);
                }
            } catch { }
        })();
    }, []);

    const handleLogoutClick = () => {
        setIsDropdownOpen(false);
        setShowLogoutConfirm(true);
    };

    const handleLogout = async () => {
        // Clear session tokens from localStorage
        localStorage.removeItem('sb_access_token');
        localStorage.removeItem('sb_refresh_token');
        sessionStorage.removeItem("pkmk_welcome_shown");
        await supabase.auth.signOut();
        toast.success("Logout berhasil");
        router.push("/login");
    };

    return (
        <>
            <style jsx>{`
                .header {
                    position: sticky;
                    top: 0;
                    z-index: 10;
                    background: white;
                    border-bottom: 1px solid #dce5e4;
                    padding: 12px 32px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                }
                .header-left {
                    display: flex;
                    flex-direction: column;
                }
                .header-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: #111817;
                    line-height: 1.2;
                }
                .header-subtitle {
                    font-size: 12px;
                    color: #638884;
                    font-weight: 500;
                }
                .header-right {
                    display: flex;
                    align-items: center;
                    gap: 24px;
                }
                .notification-btn {
                    position: relative;
                    padding: 8px;
                    color: #638884;
                    background: none;
                    border: none;
                    cursor: pointer;
                    border-radius: 8px;
                    transition: color 0.2s;
                }
                .notification-btn:hover {
                    color: #14b8a6;
                }
                .notification-dot {
                    position: absolute;
                    top: 6px;
                    right: 6px;
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #ef4444;
                    border: 2px solid white;
                }
                .profile-section {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding-left: 24px;
                    border-left: 1px solid #dce5e4;
                }
                .profile-info {
                    text-align: right;
                }
                .profile-greeting {
                    font-size: 14px;
                    font-weight: 700;
                    color: #111817;
                }
                .profile-email {
                    font-size: 12px;
                    color: #638884;
                }
                .profile-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 4px;
                }
                .avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #14b8a6, #0d9488);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    border: 2px solid #14b8a6;
                }
                .dropdown-arrow {
                    color: #638884;
                    transition: transform 0.2s;
                }
                .dropdown-arrow.open {
                    transform: rotate(180deg);
                }
                .dropdown {
                    position: absolute;
                    right: 0;
                    top: 100%;
                    margin-top: 8px;
                    width: 192px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                    border: 1px solid #dce5e4;
                    padding: 4px;
                    z-index: 20;
                }
                .dropdown-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 16px;
                    font-size: 14px;
                    font-weight: 500;
                    color: #ef4444;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: background 0.2s;
                    width: 100%;
                    background: none;
                    border: none;
                    text-align: left;
                }
                .dropdown-item:hover {
                    background: rgba(239, 68, 68, 0.05);
                }
                .backdrop {
                    position: fixed;
                    inset: 0;
                    z-index: 10;
                }
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 16px;
                    z-index: 100;
                }
                .modal {
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 25px 50px rgba(0,0,0,0.25);
                    width: 100%;
                    max-width: 400px;
                    padding: 32px;
                    text-align: center;
                    animation: modalZoomIn 0.2s ease-out;
                }
                .modal-icon {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    background: #fed7aa;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 24px;
                }
                .modal-icon-inner {
                    width: 64px;
                    height: 64px;
                    border-radius: 50%;
                    border: 4px solid #fb923c;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 36px;
                    font-weight: bold;
                    color: #f97316;
                }
                .modal-title {
                    font-size: 24px;
                    font-weight: 700;
                    color: #111827;
                    margin-bottom: 12px;
                }
                .modal-message {
                    font-size: 16px;
                    color: #4b5563;
                    margin-bottom: 32px;
                }
                .modal-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                }
                .btn-danger {
                    padding: 12px 32px;
                    border-radius: 8px;
                    background: #dc2626;
                    color: white;
                    font-weight: 600;
                    border: none;
                    cursor: pointer;
                    min-width: 140px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    transition: background 0.2s;
                }
                .btn-danger:hover {
                    background: #b91c1c;
                }
                .btn-cancel {
                    padding: 12px 32px;
                    border-radius: 8px;
                    background: #9ca3af;
                    color: white;
                    font-weight: 600;
                    border: none;
                    cursor: pointer;
                    min-width: 140px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    transition: background 0.2s;
                }
                .btn-cancel:hover {
                    background: #6b7280;
                }
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
                @media (max-width: 768px) {
                    .profile-info {
                        display: none;
                    }
                    .header {
                        padding: 12px 16px;
                    }
                }
            `}</style>

            <header className="header">
                <div className="header-left">
                    <h2 className="header-title">Sistem Pelaporan PKMK</h2>
                    <span className="header-subtitle">Dinas Kesehatan Kabupaten Malang</span>
                </div>

                <div className="header-right">
                    {/* Notifications */}
                    <button className="notification-btn">
                        <Bell size={20} />
                        <span className="notification-dot" />
                    </button>

                    {/* Profile Dropdown */}
                    <div className="profile-section" style={{ position: 'relative' }}>
                        <div className="profile-info">
                            <p className="profile-greeting">Selamat Datang</p>
                            {email && <p className="profile-email">{email}</p>}
                        </div>
                        <button
                            className="profile-btn"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                            <div className="avatar">
                                <User size={20} />
                            </div>
                            <ChevronDown
                                size={16}
                                className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}
                            />
                        </button>

                        {isDropdownOpen && (
                            <>
                                <div className="backdrop" onClick={() => setIsDropdownOpen(false)} />
                                <div className="dropdown">
                                    <button className="dropdown-item" onClick={handleLogoutClick}>
                                        <LogOut size={16} />
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
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-icon">
                            <div className="modal-icon-inner">!</div>
                        </div>
                        <h3 className="modal-title">Apakah Anda yakin?</h3>
                        <p className="modal-message">Anda akan keluar dari sistem!</p>
                        <div className="modal-actions">
                            <button className="btn-danger" onClick={handleLogout}>
                                Ya, Logout!
                            </button>
                            <button className="btn-cancel" onClick={() => setShowLogoutConfirm(false)}>
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
