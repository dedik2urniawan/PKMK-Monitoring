"use client";

import { useEffect, useState } from "react";
import { FileSpreadsheet, ArrowLeft, Activity, Utensils, Gift } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ensureServerSession, getAuthHeaders } from "@/lib/clientSession";
import LocationFilter from "@/components/import/LocationFilter";
import ExcelImporter, { ImportRow } from "@/components/import/ExcelImporter";

type AppUser = { role: "superadmin" | "admin_puskesmas"; puskesmas_id: string | null };
type MonitoringType = "antropometri" | "konsumsi" | "pemberian";

// Template columns per type
const TEMPLATE_CONFIGS: Record<MonitoringType, { key: string; label: string; required: boolean }[]> = {
    antropometri: [
        { key: "nik", label: "nik", required: true },
        { key: "minggu_ke", label: "minggu_ke", required: true },
        { key: "tanggal", label: "tanggal", required: true },
        { key: "bb_kg", label: "bb_kg", required: true },
        { key: "tb_cm", label: "tb_cm", required: true },
        { key: "cara_ukur", label: "cara_ukur", required: true },
        { key: "lila_cm", label: "lila_cm", required: false },
    ],
    konsumsi: [
        { key: "nik", label: "nik", required: true },
        { key: "minggu_ke", label: "minggu_ke", required: true },
        { key: "tanggal", label: "tanggal", required: true },
        { key: "kepatuhan_pct", label: "kepatuhan_pct", required: false },
        { key: "catatan", label: "catatan", required: false },
    ],
    pemberian: [
        { key: "nik", label: "nik", required: true },
        { key: "minggu_ke", label: "minggu_ke", required: true },
        { key: "tanggal", label: "tanggal", required: true },
        { key: "jumlah_unit", label: "jumlah_unit", required: true },
        { key: "jenis_formulasi", label: "jenis_formulasi", required: true },
        { key: "keterangan", label: "keterangan", required: false },
    ],
};

const TAB_CONFIG = [
    { key: "antropometri" as MonitoringType, label: "Antropometri", icon: Activity, color: "blue" },
    { key: "konsumsi" as MonitoringType, label: "PKMK Konsumsi", icon: Utensils, color: "amber" },
    { key: "pemberian" as MonitoringType, label: "PKMK Pemberian", icon: Gift, color: "purple" },
];

export default function ImportMonitoringPage() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<AppUser | null>(null);
    const [filter, setFilter] = useState({ kec: "", puskesmasId: "", desaKel: "" });
    const [activeTab, setActiveTab] = useState<MonitoringType>("antropometri");

    useEffect(() => {
        (async () => {
            try {
                await ensureServerSession();
                const authHeaders = await getAuthHeaders();
                const res = await fetch("/api/auth/session", {
                    credentials: "include",
                    headers: authHeaders,
                });
                const data = await res.json();
                setUser(data.user);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Validation function
    const validateRows = async (rows: Record<string, any>[]): Promise<ImportRow[]> => {
        const results: ImportRow[] = [];
        const today = new Date().toISOString().split("T")[0];
        const columns = TEMPLATE_CONFIGS[activeTab];

        rows.forEach((row, idx) => {
            const errors: string[] = [];
            let status: ImportRow["status"] = "valid";

            // Check required fields
            columns.forEach((col) => {
                if (col.required && !row[col.key]) {
                    errors.push(`${col.label} wajib diisi`);
                }
            });

            // Validate minggu_ke
            const mingguKe = parseInt(row.minggu_ke);
            if (isNaN(mingguKe) || mingguKe < 1 || mingguKe > 12) {
                errors.push("minggu_ke harus 1-12");
            }

            // Validate tanggal - normalize date format first
            if (row.tanggal) {
                // Parse date from various formats (YYYY-MM-DD, YYYY/MM/DD, DD/MM/YYYY, etc.)
                let parsedDate: Date | null = null;
                const tanggalStr = String(row.tanggal).trim();

                // Try different date formats
                if (/^\d{4}[-\/]\d{2}[-\/]\d{2}$/.test(tanggalStr)) {
                    // YYYY-MM-DD or YYYY/MM/DD
                    parsedDate = new Date(tanggalStr.replace(/\//g, '-'));
                } else if (/^\d{2}[-\/]\d{2}[-\/]\d{4}$/.test(tanggalStr)) {
                    // DD-MM-YYYY or DD/MM/YYYY
                    const parts = tanggalStr.split(/[-\/]/);
                    parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                } else {
                    // Try native parse
                    parsedDate = new Date(tanggalStr);
                }

                if (parsedDate && !isNaN(parsedDate.getTime())) {
                    const todayDate = new Date();
                    todayDate.setHours(23, 59, 59, 999); // End of today

                    if (parsedDate > todayDate) {
                        errors.push("tanggal tidak boleh melebihi hari ini");
                    }

                    // Normalize tanggal to YYYY-MM-DD for API
                    row.tanggal = parsedDate.toISOString().split('T')[0];
                } else {
                    errors.push("format tanggal tidak valid (gunakan YYYY-MM-DD)");
                }
            }

            // Type-specific validations
            if (activeTab === "antropometri") {
                if (row.cara_ukur && !["terlentang", "berdiri"].includes(row.cara_ukur.toLowerCase())) {
                    errors.push("cara_ukur harus 'terlentang' atau 'berdiri'");
                }
                if (row.bb_kg && (parseFloat(row.bb_kg) <= 0 || parseFloat(row.bb_kg) > 50)) {
                    errors.push("bb_kg tidak valid");
                }
                if (row.tb_cm && (parseFloat(row.tb_cm) <= 0 || parseFloat(row.tb_cm) > 200)) {
                    errors.push("tb_cm tidak valid");
                }
            }

            if (activeTab === "konsumsi") {
                if (row.kepatuhan_pct) {
                    const pct = parseFloat(row.kepatuhan_pct);
                    if (isNaN(pct) || pct < 0 || pct > 100) {
                        errors.push("kepatuhan_pct harus 0-100");
                    }
                }
            }

            if (activeTab === "pemberian") {
                if (row.jumlah_unit && parseInt(row.jumlah_unit) <= 0) {
                    errors.push("jumlah_unit harus > 0");
                }
            }

            if (errors.length > 0) {
                status = "error";
            }

            results.push({
                rowNum: idx + 2,
                data: row,
                status,
                errors,
            });
        });

        return results;
    };

    // Import function
    const handleImport = async (validRows: ImportRow[]) => {
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch("/api/import/monitoring", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json", ...authHeaders },
                body: JSON.stringify({
                    rows: validRows,
                    type: activeTab,
                    puskesmasId: filter.puskesmasId,
                }),
            });

            const data = await res.json();

            if (data.success > 0) {
                toast.success(`${data.success} data monitoring berhasil diimport!`);
            }
            if (data.failed > 0) {
                toast.warning(`${data.failed} data gagal/skip`);
            }

            return { success: data.success, failed: data.failed };
        } catch (err) {
            toast.error("Gagal import data");
            return { success: 0, failed: validRows.length };
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    const canImport = !!filter.puskesmasId || user?.role === "admin_puskesmas";

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/monitoring"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft size={24} />
                </Link>
                <div className="flex items-center gap-3">
                    <FileSpreadsheet className="text-emerald-600" size={32} />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Import Data Monitoring</h1>
                        <p className="text-sm text-gray-600">
                            Upload file Excel untuk import data monitoring secara massal
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                {TAB_CONFIG.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium transition-all ${activeTab === tab.key
                                ? "bg-white shadow-sm text-gray-800"
                                : "text-gray-600 hover:text-gray-800"
                                }`}
                        >
                            <Icon size={18} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Location Filter */}
            <div className="bg-white rounded-xl border p-6 space-y-4">
                <h2 className="font-semibold text-gray-800">1. Filter Lokasi (Opsional)</h2>
                <p className="text-sm text-gray-600">
                    Filter membantu validasi: NIK harus dari balita yang terdaftar di puskesmas yang dipilih
                </p>
                <LocationFilter user={user} onFilterChange={setFilter} />
            </div>

            {/* Excel Importer */}
            <div className="bg-white rounded-xl border p-6 space-y-4">
                <h2 className="font-semibold text-gray-800">
                    2. Upload File Excel - {TAB_CONFIG.find((t) => t.key === activeTab)?.label}
                </h2>
                <ExcelImporter
                    key={activeTab} // Reset component when tab changes
                    templateColumns={TEMPLATE_CONFIGS[activeTab]}
                    onValidate={validateRows}
                    onImport={handleImport}
                    templateName={`Import_Monitoring_${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
                    disabled={!canImport}
                />
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 rounded-xl border p-6">
                <h3 className="font-semibold text-gray-800 mb-3">📋 Petunjuk Import Monitoring</h3>
                <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                    <li>
                        <strong>NIK</strong> harus sesuai dengan NIK balita yang sudah terdaftar
                    </li>
                    <li>
                        Balita harus sudah memiliki <strong>Kohort</strong> sebelum bisa diimport monitoringnya
                    </li>
                    <li>
                        <strong>minggu_ke</strong>: 1-12 sesuai siklus PKMK
                    </li>
                    <li>
                        <strong>tanggal</strong>: format YYYY-MM-DD, tidak boleh lebih dari hari ini
                    </li>
                    {activeTab === "antropometri" && (
                        <>
                            <li>
                                <strong>cara_ukur</strong>: "terlentang" atau "berdiri"
                            </li>
                            <li>
                                Z-score (zs_bbu, zs_tbu, zs_bbtb) akan <strong>dihitung otomatis</strong> berdasarkan LMS reference
                            </li>
                        </>
                    )}
                    {activeTab === "konsumsi" && (
                        <li>
                            <strong>kepatuhan_pct</strong>: persentase kepatuhan 0-100
                        </li>
                    )}
                    {activeTab === "pemberian" && (
                        <li>
                            <strong>jenis_formulasi</strong>: contoh F100, F75, dll
                        </li>
                    )}
                    <li>
                        Data duplikat (NIK + minggu_ke yang sama) akan otomatis di-<strong>SKIP</strong>
                    </li>
                </ul>
            </div>
        </div>
    );
}
