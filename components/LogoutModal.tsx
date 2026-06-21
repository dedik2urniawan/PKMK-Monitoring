"use client";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface LogoutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LogoutModal({ isOpen, onClose }: LogoutModalProps) {
    const router = useRouter();

    if (!isOpen) return null;

    const handleLogout = async () => {
        localStorage.removeItem('sb_access_token');
        localStorage.removeItem('sb_refresh_token');
        sessionStorage.removeItem("pkmk_welcome_shown");
        await supabase.auth.signOut();
        toast.success("Logout berhasil");
        router.push("/login");
    };

    return (
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
                        onClick={onClose}
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
        </div>
    );
}
