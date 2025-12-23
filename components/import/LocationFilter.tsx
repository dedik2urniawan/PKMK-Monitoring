"use client";

import { useEffect, useState } from "react";
import { ensureServerSession, getAuthHeaders } from "@/lib/clientSession";

type LocationFilterProps = {
    user: { role: string; puskesmas_id: string | null } | null;
    onFilterChange: (filter: {
        kec: string;
        puskesmasId: string;
        desaKel: string;
    }) => void;
    requiredDesa?: boolean; // If true, desa must be selected
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

    // Load kecamatan list for superadmin
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
            // Filter out Kabupaten
            const filtered = (data.items || []).filter(
                (k: string) => !k.toLowerCase().includes("kabupaten")
            );
            setKecList(filtered);
        })();
    }, [user]);

    // Auto-set puskesmas for admin_puskesmas and load desa + kecamatan
    useEffect(() => {
        if (user?.role === "admin_puskesmas" && user.puskesmas_id) {
            setPuskesmasId(user.puskesmas_id);
            loadDesa(user.puskesmas_id);
            // Also fetch kecamatan from puskesmas data
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

    // Load puskesmas when kecamatan changes
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
            // Filter out Dinkes
            const filtered = (data.items || []).filter(
                (p: any) => !p.nama?.toLowerCase().includes("dinkes")
            );
            setPkmList(filtered);
            setPuskesmasId("");
            setDesaKel("");
            setDesaList([]);
        })();
    }, [kec, user]);

    // Load desa when puskesmas changes
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

    // Notify parent of filter changes
    useEffect(() => {
        onFilterChange({ kec, puskesmasId, desaKel });
    }, [kec, puskesmasId, desaKel]);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Kecamatan - Superadmin only */}
            {user?.role === "superadmin" && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kecamatan {requiredDesa && <span className="text-red-500">*</span>}
                    </label>
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        value={kec}
                        onChange={(e) => setKec(e.target.value)}
                    >
                        <option value="">-- Pilih Kecamatan --</option>
                        {kecList.map((k) => (
                            <option key={k} value={k}>
                                {k}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Puskesmas - Superadmin only */}
            {user?.role === "superadmin" && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Puskesmas {requiredDesa && <span className="text-red-500">*</span>}
                    </label>
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        value={puskesmasId}
                        onChange={(e) => setPuskesmasId(e.target.value)}
                        disabled={!kec}
                    >
                        <option value="">-- Pilih Puskesmas --</option>
                        {pkmList.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.nama}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Desa - Both roles */}
            {desaList.length > 0 && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Desa/Kelurahan {requiredDesa && <span className="text-red-500">*</span>}
                    </label>
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        value={desaKel}
                        onChange={(e) => setDesaKel(e.target.value)}
                    >
                        <option value="">-- Pilih Desa --</option>
                        {desaList.map((d) => (
                            <option key={d.id} value={d.desa_kel}>
                                {d.desa_kel}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Show selected context info */}
            {puskesmasId && (
                <div className="col-span-full text-sm text-gray-600 bg-emerald-50 px-3 py-2 rounded-lg">
                    📍 Import akan dilakukan ke:{" "}
                    <strong>
                        {pkmList.find((p) => p.id === puskesmasId)?.nama || "Puskesmas Anda"}
                        {desaKel && ` - ${desaKel}`}
                    </strong>
                </div>
            )}
        </div>
    );
}
