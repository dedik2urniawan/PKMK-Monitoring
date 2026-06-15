"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { BarChart3, Utensils, Package, ChevronRight, Info, CheckCircle, AlertCircle, FileSpreadsheet } from "lucide-react";
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
    { key: "antropometri" as MonitoringType, label: "Antropometri", icon: BarChart3, color: "#3b82f6", gradient: "linear-gradient(135deg, #3b82f6, #2563eb)", bgLight: "#eff6ff" },
    { key: "konsumsi" as MonitoringType, label: "PKMK Konsumsi", icon: Utensils, color: "#f59e0b", gradient: "linear-gradient(135deg, #f59e0b, #d97706)", bgLight: "#fffbeb" },
    { key: "pemberian" as MonitoringType, label: "PKMK Pemberian", icon: Package, color: "#8b5cf6", gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)", bgLight: "#f5f3ff" },
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

            columns.forEach((col) => {
                if (col.required && !row[col.key]) {
                    errors.push(`${col.label} wajib diisi`);
                }
            });

            const mingguKe = parseInt(row.minggu_ke);
            if (isNaN(mingguKe) || mingguKe < 1 || mingguKe > 12) {
                errors.push("minggu_ke harus 1-12");
            }

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

            return { success: data.success, failed: data.failed, errors: data.errors };
        } catch (err) {
            toast.error("Gagal import data");
            return { success: 0, failed: validRows.length };
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div style={{ width: 40, height: 40, border: '4px solid #10b981', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const canImport = !!filter.puskesmasId || user?.role === "admin_puskesmas";
    const activeTabConfig = TAB_CONFIG.find(t => t.key === activeTab)!;
    const ActiveIcon = activeTabConfig.icon;

    return (
        <div style={{ maxWidth: 1024, margin: '0 auto', padding: '32px 24px' }}>
            {/* Breadcrumbs */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 24 }}>
                <Link href="/dashboard" style={{ color: '#64748b', fontWeight: 500, textDecoration: 'none' }}>Home</Link>
                <ChevronRight size={14} style={{ color: '#94a3b8' }} />
                <Link href="/monitoring" style={{ color: '#64748b', fontWeight: 500, textDecoration: 'none' }}>Monitoring</Link>
                <ChevronRight size={14} style={{ color: '#94a3b8' }} />
                <span style={{ color: '#0f172a', fontWeight: 600 }}>Import Data</span>
            </nav>

            {/* Page Header - Modernized */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
                <div style={{
                    width: 64,
                    height: 64,
                    background: activeTabConfig.gradient,
                    borderRadius: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 6px 20px ${activeTabConfig.color}40`,
                    transition: 'all 0.3s',
                }}>
                    <FileSpreadsheet size={32} color="white" />
                </div>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.025em' }}>
                        Import Data Monitoring
                    </h1>
                    <p style={{ fontSize: 14, color: '#64748b', margin: '6px 0 0 0' }}>
                        Upload file Excel untuk import data monitoring secara massal
                    </p>
                </div>
            </div>

            {/* Tabs - Premium Gradient Style */}
            <div style={{
                background: 'white',
                padding: 8,
                borderRadius: 20,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                border: '1px solid #e5e7eb',
                marginBottom: 28,
            }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {TAB_CONFIG.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 10,
                                    padding: '14px 20px',
                                    borderRadius: 14,
                                    border: 'none',
                                    background: isActive ? tab.gradient : 'transparent',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s',
                                    boxShadow: isActive ? `0 4px 12px ${tab.color}40` : 'none',
                                }}
                            >
                                <div style={{
                                    width: 36,
                                    height: 36,
                                    background: isActive ? 'rgba(255,255,255,0.25)' : tab.bgLight,
                                    borderRadius: 10,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <Icon size={20} color={isActive ? 'white' : tab.color} />
                                </div>
                                <span style={{
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: isActive ? 'white' : '#475569',
                                }}>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Section 1: Location Filter */}
            <section style={{
                background: 'white',
                borderRadius: 20,
                padding: 28,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                border: '1px solid #e5e7eb',
                marginBottom: 24,
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    paddingBottom: 20,
                    marginBottom: 24,
                    borderBottom: '1px solid #f1f5f9',
                }}>
                    <div style={{
                        width: 42,
                        height: 42,
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white',
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        fontWeight: 800,
                        boxShadow: '0 3px 10px rgba(16, 185, 129, 0.3)',
                    }}>1</div>
                    <div>
                        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0 }}>Filter Lokasi (Opsional)</h2>
                        <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0 0' }}>Pilih lokasi untuk validasi data otomatis saat upload</p>
                    </div>
                </div>
                <LocationFilter user={user} onFilterChange={setFilter} />
            </section>

            {/* Section 2: Excel Uploader */}
            <section style={{
                background: 'white',
                borderRadius: 20,
                padding: 28,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                border: '1px solid #e5e7eb',
                marginBottom: 24,
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    paddingBottom: 20,
                    marginBottom: 24,
                    borderBottom: '1px solid #f1f5f9',
                }}>
                    <div style={{
                        width: 42,
                        height: 42,
                        background: activeTabConfig.gradient,
                        color: 'white',
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        fontWeight: 800,
                        boxShadow: `0 3px 10px ${activeTabConfig.color}40`,
                    }}>2</div>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                            Upload File Excel - {activeTabConfig.label}
                        </h2>
                        <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0 0' }}>Download template, isi data, lalu upload</p>
                    </div>
                    <span style={{
                        padding: '6px 14px',
                        background: activeTabConfig.gradient,
                        color: 'white',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        boxShadow: `0 2px 8px ${activeTabConfig.color}30`,
                    }}>
                        {activeTabConfig.label.toUpperCase()}
                    </span>
                </div>
                <ExcelImporter
                    key={activeTab}
                    templateColumns={TEMPLATE_CONFIGS[activeTab]}
                    onValidate={validateRows}
                    onImport={handleImport}
                    templateName={`Import_Monitoring_${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
                    disabled={!canImport}
                />
            </section>

            {/* Section 3: Instructions - Type-specific */}
            <section style={{
                background: `linear-gradient(135deg, ${activeTabConfig.bgLight}, white)`,
                borderRadius: 20,
                padding: 28,
                border: `1px solid ${activeTabConfig.color}20`,
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    paddingBottom: 20,
                    marginBottom: 20,
                    borderBottom: `1px solid ${activeTabConfig.color}15`,
                }}>
                    <div style={{
                        width: 42,
                        height: 42,
                        background: 'linear-gradient(135deg, #64748b, #475569)',
                        color: 'white',
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        fontWeight: 800,
                        boxShadow: '0 3px 10px rgba(100, 116, 139, 0.3)',
                    }}>3</div>
                    <div>
                        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0 }}>Petunjuk Import {activeTabConfig.label}</h2>
                        <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0 0' }}>Panduan format data yang benar</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gap: 12 }}>
                    {/* Common Instructions */}
                    {[
                        { icon: CheckCircle, color: '#10b981', text: 'NIK harus sesuai dengan NIK balita yang sudah terdaftar di sistem' },
                        { icon: CheckCircle, color: '#10b981', text: 'Balita harus sudah memiliki data Kohort sebelum monitoring diinput' },
                        { icon: CheckCircle, color: '#3b82f6', text: 'Format tanggal harus YYYY-MM-DD (contoh: 2023-08-17)' },
                        { icon: CheckCircle, color: '#3b82f6', text: 'Kolom minggu_ke harus berisi angka antara 1-12' },
                    ].map((item, idx) => (
                        <div key={idx} style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 12,
                            padding: '12px 16px',
                            background: 'white',
                            borderRadius: 12,
                            border: '1px solid #e5e7eb',
                        }}>
                            <item.icon size={18} color={item.color} style={{ flexShrink: 0, marginTop: 2 }} />
                            <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{item.text}</span>
                        </div>
                    ))}

                    {/* Type-specific */}
                    {activeTab === "antropometri" && (
                        <>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', background: '#eff6ff', borderRadius: 12, border: '1px solid #bfdbfe' }}>
                                <Info size={18} color="#3b82f6" style={{ flexShrink: 0, marginTop: 2 }} />
                                <span style={{ fontSize: 13, color: '#1e40af', lineHeight: 1.5 }}><strong>cara_ukur</strong> diisi 'terlentang' atau 'berdiri'</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', background: '#eff6ff', borderRadius: 12, border: '1px solid #bfdbfe' }}>
                                <Info size={18} color="#3b82f6" style={{ flexShrink: 0, marginTop: 2 }} />
                                <span style={{ fontSize: 13, color: '#1e40af', lineHeight: 1.5 }}>Nilai <strong>Z-score</strong> akan dihitung secara otomatis oleh sistem setelah import</span>
                            </div>
                        </>
                    )}
                    {activeTab === "konsumsi" && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', background: '#fffbeb', borderRadius: 12, border: '1px solid #fcd34d' }}>
                            <Info size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
                            <span style={{ fontSize: 13, color: '#92400e', lineHeight: 1.5 }}><strong>kepatuhan_pct</strong>: persentase kepatuhan 0-100</span>
                        </div>
                    )}
                    {activeTab === "pemberian" && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', background: '#f5f3ff', borderRadius: 12, border: '1px solid #c4b5fd' }}>
                            <Info size={18} color="#7c3aed" style={{ flexShrink: 0, marginTop: 2 }} />
                            <span style={{ fontSize: 13, color: '#5b21b6', lineHeight: 1.5 }}><strong>jenis_formulasi</strong>: contoh F100, F75, dll</span>
                        </div>
                    )}

                    {/* Warning */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', background: '#fef2f2', borderRadius: 12, border: '1px solid #fecaca' }}>
                        <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 13, color: '#991b1b', lineHeight: 1.5 }}>Data yang terdeteksi <strong>duplikat</strong> (NIK & Tanggal sama) akan otomatis di-SKIP</span>
                    </div>
                </div>
            </section>
        </div>
    );
}
