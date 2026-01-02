"use client";
import { useEffect, useState } from "react";
import { getAuthHeaders } from "@/lib/clientSession";
import { FileText } from "lucide-react";

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
            ? 'superadmin'
            : role || 'User';

    return (
        <div className="stat-card">
            <div className="stat-header">
                <div className="stat-icon purple">
                    <FileText size={24} />
                </div>
            </div>
            <p className="stat-label">Role Anda</p>
            <h3 className="stat-value small">
                {loading ? '...' : displayRole}
            </h3>
        </div>
    );
}
