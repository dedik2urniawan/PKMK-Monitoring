"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { LogOut, User, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Header() {
    const router = useRouter();
    const [email, setEmail] = useState<string | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await supabase.auth.getUser();
                setEmail(data.user?.email ?? null);
            } catch { }
        })();
    }, []);

    const handleLogoutClick = () => {
        setIsDropdownOpen(false);
        setShowLogoutConfirm(true);
    };

    const handleLogout = async () => {
        // Clear session storage agar welcome modal muncul lagi saat login berikutnya
        sessionStorage.removeItem("pkmk_welcome_shown");
        await supabase.auth.signOut();
        toast.success("Logout berhasil");
        router.push("/login");
    };

    return (
        <>
            <header className="sticky top-0 z-20 bg-white border-b border-[var(--border)] shadow-sm">
                <div className="flex items-center justify-between px-6 py-3">
                    {/* Left: Logo & Title */}
                    <div className="flex items-center gap-4">
                        <Image src="/tindik-anting-logo.png" alt="PKMK" width={48} height={48} className="flex-shrink-0" />
                        <div>
                            <h1 className="text-xl font-bold text-[var(--foreground)] leading-tight">Sistem Pelaporan PKMK</h1>
                            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Dinas Kesehatan Kabupaten Malang</p>
                        </div>
                    </div>

                    {/* Right: User Profile Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-3 px-4 py-2 rounded-lg border border-[var(--border)] bg-white hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
                                    <User size={20} className="text-[var(--primary)]" />
                                </div>
                                <div className="text-left">
                                    <div className="text-sm font-medium text-[var(--foreground)]">Selamat Datang</div>
                                    {email && <div className="text-xs text-[var(--muted-foreground)] max-w-[200px] truncate">{email}</div>}
                                </div>
                            </div>
                            <ChevronDown
                                size={16}
                                className={cn(
                                    "text-[var(--muted-foreground)] transition-transform",
                                    isDropdownOpen && "rotate-180"
                                )}
                            />
                        </button>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <>
                                {/* Backdrop to close dropdown */}
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setIsDropdownOpen(false)}
                                />

                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-[var(--border)] py-1 z-20">
                                    <button
                                        onClick={handleLogoutClick}
                                        className="w-full px-4 py-2.5 text-left flex items-center gap-2 hover:bg-red-50 text-red-600 transition-colors"
                                    >
                                        <LogOut size={16} />
                                        <span className="font-medium">Logout</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Logout Confirmation Modal - Centered on Viewport */}
            {showLogoutConfirm && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px',
                        zIndex: 100
                    }}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full text-center"
                        style={{
                            maxWidth: '28rem',
                            padding: '2rem',
                            animation: 'modalZoomIn 0.2s ease-out'
                        }}
                    >
                        {/* Warning Icon - Orange */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                            <div style={{
                                width: '5rem',
                                height: '5rem',
                                borderRadius: '50%',
                                backgroundColor: '#fed7aa',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <div style={{
                                    width: '4rem',
                                    height: '4rem',
                                    borderRadius: '50%',
                                    border: '4px solid #fb923c',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <span style={{ color: '#f97316', fontSize: '2.25rem', fontWeight: 'bold', lineHeight: 1 }}>!</span>
                                </div>
                            </div>
                        </div>

                        {/* Title */}
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.75rem' }}>
                            Apakah Anda yakin?
                        </h3>

                        {/* Message */}
                        <p style={{ fontSize: '1rem', color: '#4b5563', marginBottom: '2rem' }}>
                            Anda akan keluar dari sistem!
                        </p>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                            <button
                                onClick={handleLogout}
                                style={{
                                    padding: '0.75rem 2rem',
                                    borderRadius: '0.5rem',
                                    backgroundColor: '#dc2626',
                                    color: 'white',
                                    fontWeight: '600',
                                    border: 'none',
                                    cursor: 'pointer',
                                    minWidth: '140px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                            >
                                Ya, Logout!
                            </button>
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                style={{
                                    padding: '0.75rem 2rem',
                                    borderRadius: '0.5rem',
                                    backgroundColor: '#9ca3af',
                                    color: 'white',
                                    fontWeight: '600',
                                    border: 'none',
                                    cursor: 'pointer',
                                    minWidth: '140px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#6b7280'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#9ca3af'}
                            >
                                Batal
                            </button>
                        </div>
                    </div>

                    <style dangerouslySetInnerHTML={{
                        __html: `
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
          `}} />
                </div>
            )}
        </>
    );
}
