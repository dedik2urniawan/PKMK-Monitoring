"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CalendarDays, ChevronRight, Info, CheckCircle, AlertCircle, FileSpreadsheet } from "lucide-react";
import { ensureServerSession, getAuthHeaders } from "@/lib/clientSession";
import LocationFilter from "@/components/import/LocationFilter";
import ExcelImporter, { ImportRow } from "@/components/import/ExcelImporter";

type AppUser = { role: "superadmin" | "admin_puskesmas"; puskesmas_id: string | null };

const TEMPLATE_COLUMNS = [
    { key: "nik", label: "nik", required: true },
    { key: "tanggal_mulai", label: "tanggal_mulai", required: true },
];

export default function ImportKohortPage() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<AppUser | null>(null);
    const [filter, setFilter] = useState({ kec: "", puskesmasId: "", desaKel: "" });

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
                if (!data.user) {
                    window.location.href = "/login?redirectedFrom=" + encodeURIComponent(window.location.pathname);
                    return;
                }
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

        rows.forEach((row, idx) => {
            const errors: string[] = [];
            let status: ImportRow["status"] = "valid";

            TEMPLATE_COLUMNS.forEach((col) => {
                if (col.required && !row[col.key]) {
                    errors.push(`${col.label} wajib diisi`);
                }
            });

            if (row.tanggal_mulai) {
                let parsedDate: Date | null = null;
                const tanggalStr = String(row.tanggal_mulai).trim();

                if (/^\d{4}[-\/]\d{2}[-\/]\d{2}$/.test(tanggalStr)) {
                    parsedDate = new Date(tanggalStr.replace(/\//g, '-'));
                } else if (/^\d{2}[-\/]\d{2}[-\/]\d{4}$/.test(tanggalStr)) {
                    const parts = tanggalStr.split(/[-\/]/);
                    parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                } else {
                    parsedDate = new Date(tanggalStr);
                }

                if (parsedDate && !isNaN(parsedDate.getTime())) {
                    row.tanggal_mulai = parsedDate.toISOString().split('T')[0];
                } else {
                    errors.push("format tanggal_mulai tidak valid (gunakan YYYY-MM-DD)");
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
            const res = await fetch("/api/import/kohort", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json", ...authHeaders },
                body: JSON.stringify({
                    rows: validRows,
                    puskesmasId: filter.puskesmasId,
                }),
            });

            const data = await res.json();

            if (data.success > 0) {
                toast.success(`${data.success} data kohort berhasil didaftarkan!`);
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

    return (
        <div style={{ maxWidth: 1024, margin: '0 auto', padding: '32px 24px' }}>
            {/* Breadcrumbs */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 24 }}>
                <Link href="/dashboard" style={{ color: '#64748b', fontWeight: 500, textDecoration: 'none' }}>Home</Link>
                <ChevronRight size={14} style={{ color: '#94a3b8' }} />
                <Link href="/kohort/new" style={{ color: '#64748b', fontWeight: 500, textDecoration: 'none' }}>Kohort</Link>
                <ChevronRight size={14} style={{ color: '#94a3b8' }} />
                <span style={{ color: '#0f172a', fontWeight: 600 }}>Import Kohort</span>
            </nav>

            {/* Page Header - Modernized */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
                <div style={{
                    width: 64,
                    height: 64,
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    borderRadius: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 6px 20px rgba(16,185,129,0.4)`,
                    transition: 'all 0.3s',
                }}>
                    <FileSpreadsheet size={32} color="white" />
                </div>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.025em' }}>
                        Import Data Kohort
                    </h1>
                    <p style={{ fontSize: 14, color: '#64748b', margin: '6px 0 0 0' }}>
                        Upload file Excel untuk mendaftarkan periode intervensi secara massal
                    </p>
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
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                        color: 'white',
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        fontWeight: 800,
                        boxShadow: '0 3px 10px rgba(59,130,246, 0.3)',
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
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white',
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        fontWeight: 800,
                        boxShadow: `0 3px 10px rgba(16,185,129,0.4)`,
                    }}>2</div>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                            Upload File Excel - Pendaftaran Kohort
                        </h2>
                        <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0 0' }}>Download template, isi data, lalu upload</p>
                    </div>
                </div>
                <ExcelImporter
                    templateColumns={TEMPLATE_COLUMNS}
                    onValidate={validateRows}
                    onImport={handleImport}
                    templateName="Import_Kohort"
                    disabled={!canImport}
                />
            </section>

            {/* Section 3: Instructions */}
            <section style={{
                background: `linear-gradient(135deg, #f0fdf4, white)`,
                borderRadius: 20,
                padding: 28,
                border: `1px solid rgba(16,185,129,0.2)`,
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    paddingBottom: 20,
                    marginBottom: 20,
                    borderBottom: `1px solid rgba(16,185,129,0.15)`,
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
                        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0 }}>Petunjuk Import Kohort</h2>
                        <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0 0' }}>Panduan format data yang benar</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gap: 12 }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        padding: '12px 16px',
                        background: 'white',
                        borderRadius: 12,
                        border: '1px solid #e5e7eb',
                    }}>
                        <CheckCircle size={18} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>NIK harus sesuai dengan NIK balita stunting yang sudah terdaftar di sistem.</span>
                    </div>
                    
                    <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        padding: '12px 16px',
                        background: 'white',
                        borderRadius: 12,
                        border: '1px solid #e5e7eb',
                    }}>
                        <CheckCircle size={18} color="#3b82f6" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>Format <strong>tanggal_mulai</strong> harus YYYY-MM-DD (contoh: 2023-08-17).</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', background: '#eff6ff', borderRadius: 12, border: '1px solid #bfdbfe' }}>
                        <Info size={18} color="#3b82f6" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 13, color: '#1e40af', lineHeight: 1.5 }}>Periode kohort akan berjalan otomatis selama <strong>12 Minggu</strong> terhitung sejak Tanggal Mulai.</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', background: '#fef2f2', borderRadius: 12, border: '1px solid #fecaca' }}>
                        <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 13, color: '#991b1b', lineHeight: 1.5 }}>Balita yang <strong>sudah memiliki periode kohort aktif</strong> (berjalan) tidak bisa didaftarkan lagi sampai periode sebelumnya selesai (Data akan otomatis di-SKIP).</span>
                    </div>
                </div>
            </section>
        </div>
    );
}
