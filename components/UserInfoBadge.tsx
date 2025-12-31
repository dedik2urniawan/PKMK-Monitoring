"use client";
import { useEffect, useState } from "react";
import { getAuthHeaders } from "@/lib/clientSession";

type UserInfo = {
    id: string;
    email: string;
    role: 'superadmin' | 'admin_puskesmas' | 'user';
    puskesmas_id: string | null;
    puskesmas_name: string | null;
};

export default function UserInfoBadge({ fallbackText }: { fallbackText?: string }) {
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchUserInfo() {
            try {
                const headers = await getAuthHeaders();
                const response = await fetch('/api/auth/me', { headers });

                if (response.ok) {
                    const data = await response.json();
                    setUserInfo(data);
                }
            } catch (err) {
                console.error('[UserInfoBadge] Error fetching user info:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchUserInfo();
    }, []);

    if (loading) {
        return <span style={{ opacity: 0.6 }}>{fallbackText || 'Loading...'}</span>;
    }

    if (!userInfo) {
        return <span>{fallbackText || 'Ringkasan data pemantauan dan intervensi gizi.'}</span>;
    }

    // Display based on role
    if (userInfo.role === 'superadmin') {
        return (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                    background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
                    color: 'white',
                    padding: '2px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase'
                }}>
                    Superadmin
                </span>
                <span>Akses penuh ke semua data</span>
            </span>
        );
    }

    if (userInfo.role === 'admin_puskesmas' && userInfo.puskesmas_name) {
        return (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                    background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                    color: 'white',
                    padding: '2px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase'
                }}>
                    Admin
                </span>
                <span>Puskesmas {userInfo.puskesmas_name}</span>
            </span>
        );
    }

    return <span>{fallbackText || 'Ringkasan data pemantauan dan intervensi gizi.'}</span>;
}
