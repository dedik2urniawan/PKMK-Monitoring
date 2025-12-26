"use client";

import { useEffect, useState } from "react";
import { FileSpreadsheet, ArrowLeft, Upload, X, Download, Rocket, CheckCircle, Flag, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ensureServerSession, getAuthHeaders } from "@/lib/clientSession";
import LocationFilter from "@/components/import/LocationFilter";
import ExcelImporter, { ImportRow } from "@/components/import/ExcelImporter";

type AppUser = { role: "superadmin" | "admin_puskesmas"; puskesmas_id: string | null };

// Template columns for Balita import (includes redflag fields)
const BALITA_COLUMNS = [
    { key: "nik", label: "nik", required: true },
    { key: "nama_balita", label: "nama_balita", required: true },
    { key: "jk", label: "jk", required: true },
    { key: "tgl_lahir", label: "tgl_lahir", required: true },
    { key: "nama_ortu", label: "nama_ortu", required: false },
    { key: "posyandu", label: "posyandu", required: false },
    { key: "rt", label: "rt", required: false },
    { key: "rw", label: "rw", required: false },
    { key: "alamat", label: "alamat", required: false },
    { key: "bb_lahir_kg", label: "bb_lahir_kg", required: false },
    { key: "tb_lahir_cm", label: "tb_lahir_cm", required: false },
    // Redflag fields (Ya/Tidak)
    { key: "bb_tidak_adekuat", label: "bb_tidak_adekuat", required: false },
    { key: "murmur_edema", label: "murmur_edema", required: false },
    { key: "delayed_development", label: "delayed_development", required: false },
    { key: "wajah_dismorfik", label: "wajah_dismorfik", required: false },
    { key: "organomegali_limfadenopati", label: "organomegali_limfadenopati", required: false },
    { key: "ispa_cystitis", label: "ispa_cystitis", required: false },
    { key: "muntah_diare_berulang", label: "muntah_diare_berulang", required: false },
    { key: "diagnosa_penyakit_penyerta", label: "diagnosa_penyakit_penyerta", required: false },
    { key: "keterangan_redflag", label: "keterangan_redflag", required: false },
];

export default function ImportBalitaPage() {
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
        const authHeaders = await getAuthHeaders();
        const results: ImportRow[] = [];

        // Get existing NIKs for duplicate check
        const niks = rows.map((r) => r.nik).filter(Boolean);
        let existingNiks: string[] = [];

        if (niks.length > 0) {
            const res = await fetch(`/api/balita?niks=${niks.join(",")}`, {
                credentials: "include",
                headers: authHeaders,
            });
            const data = await res.json();
            existingNiks = (data.items || []).map((b: any) => b.nik);
        }

        rows.forEach((row, idx) => {
            const errors: string[] = [];
            let status: ImportRow["status"] = "valid";

            // Check required fields
            if (!row.nik) {
                errors.push("NIK wajib diisi");
            } else {
                // Validate NIK is exactly 16 digits
                const nikStr = String(row.nik).trim();
                if (!/^\d{16}$/.test(nikStr)) {
                    errors.push("NIK harus 16 digit angka");
                }
            }
            if (!row.nama_balita) errors.push("nama_balita wajib diisi");
            if (!row.jk || !["L", "P", "l", "p"].includes(row.jk)) {
                errors.push("jk harus L atau P");
            }
            if (!row.tgl_lahir) errors.push("tgl_lahir wajib diisi");

            // Check duplicate NIK
            if (row.nik && existingNiks.includes(row.nik)) {
                errors.push("NIK sudah terdaftar");
                status = "duplicate";
            }

            if (errors.length > 0 && status !== "duplicate") {
                status = "error";
            }

            results.push({
                rowNum: idx + 2, // Excel row (1-indexed + header)
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
            const res = await fetch("/api/import/balita", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json", ...authHeaders },
                body: JSON.stringify({
                    rows: validRows,
                    puskesmasId: filter.puskesmasId,
                    desaKel: filter.desaKel,
                    kec: filter.kec,
                }),
            });

            const data = await res.json();

            if (data.success > 0) {
                toast.success(`${data.success} data balita berhasil diimport!`);
            }
            if (data.failed > 0) {
                toast.warning(`${data.failed} data gagal diimport`);
            }

            return { success: data.success, failed: data.failed };
        } catch (err) {
            toast.error("Gagal import data");
            return { success: 0, failed: validRows.length };
        }
    };

    if (loading) {
        return (
            <>
                <style jsx>{`
                    .loading-container {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                    }
                    .spinner {
                        width: 40px;
                        height: 40px;
                        border: 4px solid #e2e8f0;
                        border-top-color: #14b8a6;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                    }
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
                <div className="loading-container">
                    <div className="spinner" />
                </div>
            </>
        );
    }

    const canImport =
        user?.role === "admin_puskesmas" ||
        (user?.role === "superadmin" && filter.puskesmasId && filter.desaKel);

    return (
        <>
            <style jsx>{`
                .page-container {
                    max-width: 1024px;
                    margin: 0 auto;
                    padding: 32px;
                }
                .page-header {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    margin-bottom: 24px;
                }
                @media (min-width: 768px) {
                    .page-header {
                        flex-direction: row;
                        align-items: center;
                    }
                }
                .back-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 44px;
                    height: 44px;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    color: #64748b;
                    transition: all 0.2s;
                }
                .back-btn:hover {
                    border-color: #14b8a6;
                    color: #14b8a6;
                }
                .header-content {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .header-icon {
                    width: 56px;
                    height: 56px;
                    background: #d1fae5;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #059669;
                }
                .page-title {
                    font-size: 24px;
                    font-weight: 700;
                    color: #0f172a;
                    letter-spacing: -0.025em;
                }
                .page-subtitle {
                    color: #64748b;
                    font-size: 14px;
                    margin-top: 2px;
                }
                .section-card {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 24px;
                    margin-bottom: 24px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                }
                .section-card.instructions {
                    background: #f8fafc;
                }
                .section-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding-bottom: 16px;
                    margin-bottom: 24px;
                    border-bottom: 1px solid #f1f5f9;
                }
                .step-badge {
                    width: 32px;
                    height: 32px;
                    background: #14b8a6;
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    font-weight: 700;
                }
                .section-card.instructions .step-badge {
                    background: #cbd5e1;
                    color: #475569;
                }
                .section-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: #0f172a;
                }
                .warning-alert {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 16px;
                    background: #fffbeb;
                    border: 1px solid #fef3c7;
                    border-radius: 12px;
                    margin-top: 20px;
                }
                .warning-alert-icon {
                    color: #d97706;
                    flex-shrink: 0;
                    margin-top: 2px;
                }
                .warning-alert-text {
                    font-size: 14px;
                    color: #92400e;
                    font-weight: 500;
                    line-height: 1.5;
                }
                .instructions-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 32px;
                }
                @media (min-width: 768px) {
                    .instructions-grid {
                        grid-template-columns: 1fr 1fr;
                    }
                }
                .instruction-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                    font-weight: 700;
                    color: #0f172a;
                    margin-bottom: 12px;
                }
                .instruction-title-icon {
                    color: #14b8a6;
                }
                .instruction-title-icon.red {
                    color: #ef4444;
                }
                .instruction-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                .instruction-item {
                    display: flex;
                    gap: 10px;
                    font-size: 14px;
                    color: #475569;
                    margin-bottom: 8px;
                    line-height: 1.5;
                }
                .instruction-bullet {
                    width: 6px;
                    height: 6px;
                    background: #94a3b8;
                    border-radius: 50%;
                    flex-shrink: 0;
                    margin-top: 7px;
                }
                .instruction-item strong {
                    color: #0f172a;
                }
                .redflag-note {
                    font-size: 12px;
                    color: #64748b;
                    margin-bottom: 12px;
                }
                .redflag-tags {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 8px;
                }
                .redflag-tag {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    background: white;
                    border-radius: 6px;
                    font-size: 13px;
                    color: #475569;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                }
                .redflag-dot {
                    width: 6px;
                    height: 6px;
                    background: #ef4444;
                    border-radius: 50%;
                }
            `}</style>

            <div className="page-container">
                {/* Page Header */}
                <div className="page-header">
                    <Link href="/balita" className="back-btn">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="header-content">
                        <div className="header-icon">
                            <FileSpreadsheet size={28} />
                        </div>
                        <div>
                            <h1 className="page-title">Import Data Balita</h1>
                            <p className="page-subtitle">Upload file Excel untuk import data balita secara massal</p>
                        </div>
                    </div>
                </div>

                {/* Step 1: Location Filter */}
                <section className="section-card">
                    <div className="section-header">
                        <span className="step-badge">1</span>
                        <h2 className="section-title">Pilih Lokasi Tujuan Import</h2>
                    </div>
                    <LocationFilter
                        user={user}
                        onFilterChange={setFilter}
                        requiredDesa={user?.role === "superadmin"}
                    />
                    {user?.role === "superadmin" && !canImport && (
                        <div className="warning-alert">
                            <AlertTriangle size={20} className="warning-alert-icon" />
                            <p className="warning-alert-text">
                                ⚠️ Perhatian: Superadmin wajib memilih Puskesmas dan Desa sebelum melanjutkan proses upload data.
                            </p>
                        </div>
                    )}
                </section>

                {/* Step 2: Excel Importer */}
                <section className="section-card">
                    <div className="section-header">
                        <span className="step-badge">2</span>
                        <h2 className="section-title">Upload File Excel</h2>
                    </div>
                    <ExcelImporter
                        templateColumns={BALITA_COLUMNS}
                        onValidate={validateRows}
                        onImport={handleImport}
                        templateName="Import_Balita"
                        disabled={!canImport}
                    />
                </section>

                {/* Step 3: Instructions */}
                <section className="section-card instructions">
                    <div className="section-header">
                        <span className="step-badge">3</span>
                        <h2 className="section-title">Petunjuk Pengisian</h2>
                    </div>
                    <div className="instructions-grid">
                        {/* Required Fields */}
                        <div>
                            <h4 className="instruction-title">
                                <CheckCircle size={16} className="instruction-title-icon" />
                                Kolom Wajib Diisi
                            </h4>
                            <ul className="instruction-list">
                                <li className="instruction-item">
                                    <span className="instruction-bullet" />
                                    <span><strong>NIK:</strong> Nomor Induk Kependudukan (16 digit)</span>
                                </li>
                                <li className="instruction-item">
                                    <span className="instruction-bullet" />
                                    <span><strong>nama_balita:</strong> Nama lengkap sesuai KK</span>
                                </li>
                                <li className="instruction-item">
                                    <span className="instruction-bullet" />
                                    <span><strong>jk:</strong> Jenis Kelamin (L atau P)</span>
                                </li>
                                <li className="instruction-item">
                                    <span className="instruction-bullet" />
                                    <span><strong>tgl_lahir:</strong> Format YYYY-MM-DD</span>
                                </li>
                            </ul>
                        </div>
                        {/* Red Flag Options */}
                        <div>
                            <h4 className="instruction-title">
                                <Flag size={16} className="instruction-title-icon red" />
                                Red Flag (Opsional)
                            </h4>
                            <p className="redflag-note">Isi dengan "Ya" atau "Tidak" untuk kolom berikut:</p>
                            <div className="redflag-tags">
                                <div className="redflag-tag">
                                    <span className="redflag-dot" />
                                    BB tidak adekuat
                                </div>
                                <div className="redflag-tag">
                                    <span className="redflag-dot" />
                                    Murmur/Edema
                                </div>
                                <div className="redflag-tag">
                                    <span className="redflag-dot" />
                                    Delayed Dev.
                                </div>
                                <div className="redflag-tag">
                                    <span className="redflag-dot" />
                                    Wajah Dismorfik
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}
