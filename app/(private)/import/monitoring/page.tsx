"use client";

import { useEffect, useState } from "react";
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
    { key: "antropometri" as MonitoringType, label: "Antropometri", icon: "📊", color: "#3b82f6" },
    { key: "konsumsi" as MonitoringType, label: "PKMK Konsumsi", icon: "🍽️", color: "#f59e0b" },
    { key: "pemberian" as MonitoringType, label: "PKMK Pemberian", icon: "📦", color: "#8b5cf6" },
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
                let parsedDate: Date | null = null;
                const tanggalStr = String(row.tanggal).trim();

                if (/^\d{4}[-\/]\d{2}[-\/]\d{2}$/.test(tanggalStr)) {
                    parsedDate = new Date(tanggalStr.replace(/\//g, '-'));
                } else if (/^\d{2}[-\/]\d{2}[-\/]\d{4}$/.test(tanggalStr)) {
                    const parts = tanggalStr.split(/[-\/]/);
                    parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                } else {
                    parsedDate = new Date(tanggalStr);
                }

                if (parsedDate && !isNaN(parsedDate.getTime())) {
                    const todayDate = new Date();
                    todayDate.setHours(23, 59, 59, 999);

                    if (parsedDate > todayDate) {
                        errors.push("tanggal tidak boleh melebihi hari ini");
                    }
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div style={{ width: 40, height: 40, border: '4px solid #10b981', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
        );
    }

    const canImport = !!filter.puskesmasId || user?.role === "admin_puskesmas";
    const activeTabConfig = TAB_CONFIG.find(t => t.key === activeTab);

    return (
        <div style={{ maxWidth: 1024, margin: '0 auto', padding: '32px 24px' }}>
            {/* Breadcrumbs */}
            <nav style={{ display: 'flex', gap: 8, fontSize: 14, marginBottom: 24 }}>
                <Link href="/dashboard" style={{ color: '#61897c', fontWeight: 500, textDecoration: 'none' }}>Home</Link>
                <span style={{ color: '#61897c' }}>/</span>
                <Link href="/monitoring" style={{ color: '#61897c', fontWeight: 500, textDecoration: 'none' }}>Monitoring</Link>
                <span style={{ color: '#61897c' }}>/</span>
                <span style={{ color: '#111816', fontWeight: 500 }}>Import Data</span>
            </nav>

            {/* Page Heading */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 32 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <span style={{ fontSize: 48, lineHeight: 1 }}>📊</span>
                        <h1 style={{ fontSize: 36, fontWeight: 900, color: '#111816', letterSpacing: '-0.033em', margin: 0 }}>Import Data Monitoring</h1>
                    </div>
                    <p style={{ color: '#61897c', fontSize: 16, marginLeft: 64, margin: 0 }}>Upload file Excel untuk import data monitoring secara massal</p>
                </div>
            </div>

            {/* Tabs - Stitch Style */}
            <div style={{ background: 'white', padding: 8, borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6', marginBottom: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {TAB_CONFIG.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                padding: '12px 16px',
                                borderRadius: 12,
                                border: activeTab === tab.key ? '1px solid #f3f4f6' : 'none',
                                background: activeTab === tab.key ? 'white' : 'transparent',
                                boxShadow: activeTab === tab.key ? '0 4px 6px rgba(0,0,0,0.05)' : 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                position: 'relative',
                            }}
                        >
                            {activeTab === tab.key && (
                                <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 4, height: 32, background: tab.color, borderRadius: '0 4px 4px 0' }} />
                            )}
                            <span style={{ fontSize: 18 }}>{tab.icon}</span>
                            <span style={{ fontSize: 14, fontWeight: 700, color: activeTab === tab.key ? '#111816' : '#61897c' }}>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Section 1: Location Filter - Stitch Style */}
            <div style={{ background: 'white', borderRadius: 24, padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6', marginBottom: 24 }}>
                <div style={{ marginBottom: 20 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111816', margin: 0 }}>Filter Lokasi (Opsional)</h3>
                    <p style={{ color: '#61897c', fontSize: 14, marginTop: 6 }}>Pilih lokasi untuk validasi data otomatis saat upload.</p>
                </div>
                <LocationFilter user={user} onFilterChange={setFilter} />
            </div>

            {/* Section 2: Excel Uploader - Stitch Style */}
            <div style={{ background: 'white', borderRadius: 24, padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6', marginBottom: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111816', marginBottom: 24 }}>
                    Upload File Excel - {activeTabConfig?.label}
                </h3>
                <ExcelImporter
                    key={activeTab}
                    templateColumns={TEMPLATE_CONFIGS[activeTab]}
                    onValidate={validateRows}
                    onImport={handleImport}
                    templateName={`Import_Monitoring_${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
                    disabled={!canImport}
                />
            </div>

            {/* Section 3: Instructions - Stitch Style */}
            <div style={{ background: '#f9fafb', borderRadius: 24, padding: '32px', border: '1px solid rgba(229,231,235,0.6)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ padding: 10, background: '#dbeafe', color: '#2563eb', borderRadius: 12, flexShrink: 0 }}>
                        <span style={{ fontSize: 24 }}>ℹ️</span>
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111816', marginBottom: 16 }}>📋 Petunjuk Import Monitoring</h3>
                        <ul style={{ listStyle: 'disc', paddingLeft: 20, color: '#4b5563', fontSize: 14, lineHeight: 1.8, margin: 0 }}>
                            <li><strong>NIK</strong> harus sesuai dengan NIK balita yang sudah terdaftar di sistem.</li>
                            <li>Balita harus sudah memiliki data <strong>Kohort</strong> sebelum monitoring diinput.</li>
                            <li>Format tanggal harus <strong>YYYY-MM-DD</strong> (contoh: 2023-08-17).</li>
                            <li>Kolom <strong>minggu_ke</strong> harus berisi angka antara 1-12.</li>
                            {activeTab === "antropometri" && (
                                <>
                                    <li>Untuk Antropometri, <strong>cara_ukur</strong> diisi &apos;terlentang&apos; atau &apos;berdiri&apos;.</li>
                                    <li>Nilai <strong>Z-score</strong> akan dihitung secara otomatis oleh sistem setelah import.</li>
                                </>
                            )}
                            {activeTab === "konsumsi" && (
                                <li><strong>kepatuhan_pct</strong>: persentase kepatuhan 0-100</li>
                            )}
                            {activeTab === "pemberian" && (
                                <li><strong>jenis_formulasi</strong>: contoh F100, F75, dll</li>
                            )}
                            <li>Data yang terdeteksi <strong>duplikat</strong> (NIK &amp; Tanggal sama) akan otomatis di-SKIP.</li>
                        </ul>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
