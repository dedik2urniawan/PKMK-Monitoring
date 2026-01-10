"use client";
import { useEffect, useState } from "react";
import { getAuthHeaders } from "@/lib/clientSession";
import { Shield, CheckCircle } from "lucide-react";

export default function RoleCard() {
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

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
                    setRole(data.role);
                }
            } catch { }
            setLoading(false);
        })();
    }, []);

    const displayRole = role === 'admin_puskesmas'
        ? 'Admin Puskesmas'
        : role === 'superadmin'
            ? 'Superadmin'
            : role === 'admin_dinkes'
                ? 'Admin Dinkes'
                : role || 'User';

    const roleHint = role === 'superadmin'
        ? 'Akses penuh ke sistem'
        : role === 'admin_dinkes'
            ? 'Akses level kabupaten'
            : role === 'admin_puskesmas'
                ? 'Akses puskesmas Anda'
                : 'Akses terbatas';

    return (
        <div className="stat-card purple-accent">
            <div className="stat-card-decoration" />
            <div className="stat-header">
                <div className="stat-icon purple">
                    <Shield size={24} />
                </div>
                <span className="stat-badge green">
                    <CheckCircle size={12} />
                    Verified
                </span>
            </div>
            <p className="stat-label">Role Anda</p>
            <h3 className="stat-value small">
                {loading ? '...' : displayRole}
            </h3>
            <p className="stat-hint">{loading ? '' : roleHint}</p>
        </div>
    );
}
