"use client";

import { useEffect, useState } from "react";
import { MapPin, Building2, Home, ChevronDown, Check } from "lucide-react";
import { ensureServerSession, getAuthHeaders } from "@/lib/clientSession";

type LocationFilterProps = {
    user: { role: string; puskesmas_id: string | null } | null;
    onFilterChange: (filter: {
        kec: string;
        puskesmasId: string;
        desaKel: string;
    }) => void;
    requiredDesa?: boolean;
};

export default function LocationFilter({
    user,
    onFilterChange,
    requiredDesa = false,
}: LocationFilterProps) {
    const [kecList, setKecList] = useState<string[]>([]);
    const [pkmList, setPkmList] = useState<{ id: string; nama: string }[]>([]);
    const [desaList, setDesaList] = useState<{ id: string; desa_kel: string }[]>([]);

    const [kec, setKec] = useState("");
    const [puskesmasId, setPuskesmasId] = useState("");
    const [desaKel, setDesaKel] = useState("");

    useEffect(() => {
        if (user?.role !== "superadmin") return;
        (async () => {
            await ensureServerSession();
            const authHeaders = await getAuthHeaders();
            const res = await fetch("/api/ref/kecamatan", {
                credentials: "include",
                headers: authHeaders,
            });
            const data = await res.json();
            const filtered = (data.items || []).filter(
                (k: string) => !k.toLowerCase().includes("kabupaten")
            );
            setKecList(filtered);
        })();
    }, [user]);

    useEffect(() => {
        if (user?.role === "admin_puskesmas" && user.puskesmas_id) {
            setPuskesmasId(user.puskesmas_id);
            loadDesa(user.puskesmas_id);
            (async () => {
                await ensureServerSession();
                const authHeaders = await getAuthHeaders();
                const res = await fetch(`/api/ref/puskesmas?id=${user.puskesmas_id}`, {
                    credentials: "include",
                    headers: authHeaders,
                });
                const data = await res.json();
                if (data.items?.[0]?.kecamatan) {
                    setKec(data.items[0].kecamatan);
                }
            })();
        }
    }, [user]);

    useEffect(() => {
        if (!kec || user?.role !== "superadmin") return;
        (async () => {
            await ensureServerSession();
            const authHeaders = await getAuthHeaders();
            const res = await fetch(
                `/api/ref/puskesmas?kecamatan=${encodeURIComponent(kec)}`,
                { credentials: "include", headers: authHeaders }
            );
            const data = await res.json();
            const filtered = (data.items || []).filter(
                (p: any) => !p.nama?.toLowerCase().includes("dinkes")
            );
            setPkmList(filtered);
            setPuskesmasId("");
            setDesaKel("");
            setDesaList([]);
        })();
    }, [kec, user]);

    useEffect(() => {
        if (!puskesmasId || user?.role === "admin_puskesmas") return;
        loadDesa(puskesmasId);
    }, [puskesmasId, user]);

    const loadDesa = async (pkmId: string) => {
        await ensureServerSession();
        const authHeaders = await getAuthHeaders();
        const res = await fetch(`/api/ref/desa?puskesmas_id=${pkmId}`, {
            credentials: "include",
            headers: authHeaders,
        });
        const data = await res.json();
        setDesaList(data.items || []);
        setDesaKel("");
    };

    useEffect(() => {
        onFilterChange({ kec, puskesmasId, desaKel });
    }, [kec, puskesmasId, desaKel]);

    const selectStyle: React.CSSProperties = {
        width: '100%',
        padding: '12px 16px',
        paddingLeft: '44px',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        fontSize: 14,
        fontWeight: 500,
        color: '#1e293b',
        background: 'white',
        appearance: 'none' as const,
        cursor: 'pointer',
        transition: 'all 0.2s',
        outline: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        fontSize: 13,
        fontWeight: 600,
        color: '#374151',
        marginBottom: 8,
    };

    const iconWrapperStyle: React.CSSProperties = {
        position: 'absolute',
        left: 14,
        top: '50%',
        transform: 'translateY(-50%)',
        color: '#64748b',
        pointerEvents: 'none',
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            {/* Kecamatan - Superadmin only */}
            {user?.role === "superadmin" && (
                <div>
                    <label style={labelStyle}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <MapPin size={14} style={{ color: '#10b981' }} />
                            Kecamatan {requiredDesa && <span style={{ color: '#ef4444' }}>*</span>}
                        </span>
                    </label>
                    <div style={{ position: 'relative' }}>
                        <div style={iconWrapperStyle}>
                            <MapPin size={18} />
                        </div>
                        <select
                            style={selectStyle}
                            value={kec}
                            onChange={(e) => setKec(e.target.value)}
                        >
                            <option value="">-- Pilih Kecamatan --</option>
                            {kecList.map((k) => (
                                <option key={k} value={k}>{k}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* Puskesmas - Superadmin only */}
            {user?.role === "superadmin" && (
                <div>
                    <label style={labelStyle}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Building2 size={14} style={{ color: '#3b82f6' }} />
                            Puskesmas {requiredDesa && <span style={{ color: '#ef4444' }}>*</span>}
                        </span>
                    </label>
                    <div style={{ position: 'relative' }}>
                        <div style={iconWrapperStyle}>
                            <Building2 size={18} />
                        </div>
                        <select
                            style={{ ...selectStyle, opacity: kec ? 1 : 0.6 }}
                            value={puskesmasId}
                            onChange={(e) => setPuskesmasId(e.target.value)}
                            disabled={!kec}
                        >
                            <option value="">-- Pilih Puskesmas --</option>
                            {pkmList.map((p) => (
                                <option key={p.id} value={p.id}>{p.nama}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* Desa - Both roles */}
            {desaList.length > 0 && (
                <div>
                    <label style={labelStyle}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Home size={14} style={{ color: '#8b5cf6' }} />
                            Desa/Kelurahan {requiredDesa && <span style={{ color: '#ef4444' }}>*</span>}
                        </span>
                    </label>
                    <div style={{ position: 'relative' }}>
                        <div style={iconWrapperStyle}>
                            <Home size={18} />
                        </div>
                        <select
                            style={selectStyle}
                            value={desaKel}
                            onChange={(e) => setDesaKel(e.target.value)}
                        >
                            <option value="">-- Pilih Desa --</option>
                            {desaList.map((d) => (
                                <option key={d.id} value={d.desa_kel}>{d.desa_kel}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* Show selected context info */}
            {puskesmasId && (
                <div style={{
                    gridColumn: '1 / -1',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 18px',
                    background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
                    borderRadius: 12,
                    border: '1px solid #a7f3d0',
                }}>
                    <div style={{
                        width: 36,
                        height: 36,
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        borderRadius: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                    }}>
                        <Check size={18} color="white" />
                    </div>
                    <div>
                        <p style={{ fontSize: 12, color: '#065f46', fontWeight: 500, margin: 0 }}>Import akan dilakukan ke:</p>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#047857', margin: 0 }}>
                            {pkmList.find((p) => p.id === puskesmasId)?.nama || "Puskesmas Anda"}
                            {desaKel && ` → ${desaKel}`}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
