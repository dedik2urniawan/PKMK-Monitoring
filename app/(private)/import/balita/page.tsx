"use client";

import { useEffect, useState } from "react";
import { FileSpreadsheet, ArrowLeft } from "lucide-react";
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
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    const canImport =
        user?.role === "admin_puskesmas" ||
        (user?.role === "superadmin" && filter.puskesmasId && filter.desaKel);

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/balita"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft size={24} />
                </Link>
                <div className="flex items-center gap-3">
                    <FileSpreadsheet className="text-emerald-600" size={32} />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Import Data Balita</h1>
                        <p className="text-sm text-gray-600">
                            Upload file Excel untuk import data balita secara massal
                        </p>
                    </div>
                </div>
            </div>

            {/* Location Filter */}
            <div className="bg-white rounded-xl border p-6 space-y-4">
                <h2 className="font-semibold text-gray-800">1. Pilih Lokasi Tujuan Import</h2>
                <LocationFilter
                    user={user}
                    onFilterChange={setFilter}
                    requiredDesa={user?.role === "superadmin"}
                />
                {user?.role === "superadmin" && !canImport && (
                    <p className="text-sm text-amber-600">
                        ⚠️ Superadmin wajib memilih Puskesmas dan Desa sebelum import
                    </p>
                )}
            </div>

            {/* Excel Importer */}
            <div className="bg-white rounded-xl border p-6 space-y-4">
                <h2 className="font-semibold text-gray-800">2. Upload File Excel</h2>
                <ExcelImporter
                    templateColumns={BALITA_COLUMNS}
                    onValidate={validateRows}
                    onImport={handleImport}
                    templateName="Import_Balita"
                    disabled={!canImport}
                />
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 rounded-xl border p-6">
                <h3 className="font-semibold text-gray-800 mb-3">📋 Petunjuk Import</h3>
                <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                    <li>
                        <strong>NIK</strong> harus unik, wajib diisi, dan harus <strong>16 digit angka</strong>
                    </li>
                    <li>
                        <strong>jk</strong> (jenis kelamin): isi dengan L (laki-laki) atau P (perempuan)
                    </li>
                    <li>
                        <strong>tgl_lahir</strong>: format YYYY-MM-DD (contoh: 2023-05-15)
                    </li>
                    <li>
                        Data yang duplikat (NIK sudah ada) akan otomatis di-skip
                    </li>
                    <li>
                        <strong>Puskesmas</strong>, <strong>Kecamatan</strong>, dan <strong>Desa</strong> akan diisi otomatis dari filter yang dipilih
                    </li>
                </ul>

                <h4 className="font-semibold text-gray-800 mt-4 mb-2">🚩 Petunjuk Pengisian Redflag</h4>
                <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                    <li>
                        Kolom redflag bersifat <strong>opsional</strong> (boleh dikosongkan)
                    </li>
                    <li>
                        Nilai yang valid: <strong>Ya</strong> atau <strong>Tidak</strong> (tidak case-sensitive)
                    </li>
                    <li>
                        <strong>bb_tidak_adekuat</strong>: BB tidak naik/turun dalam 2 bulan terakhir
                    </li>
                    <li>
                        <strong>murmur_edema</strong>: Terdengar murmur jantung atau ada edema
                    </li>
                    <li>
                        <strong>delayed_development</strong>: Keterlambatan perkembangan
                    </li>
                    <li>
                        <strong>wajah_dismorfik</strong>: Wajah dismorfik/kelainan wajah
                    </li>
                    <li>
                        <strong>organomegali_limfadenopati</strong>: Pembesaran organ/kelenjar getah bening
                    </li>
                    <li>
                        <strong>ispa_cystitis</strong>: ISPA berulang atau infeksi saluran kemih
                    </li>
                    <li>
                        <strong>muntah_diare_berulang</strong>: Muntah/diare berulang
                    </li>
                    <li>
                        <strong>diagnosa_penyakit_penyerta</strong>: Diagnosa penyakit penyerta (teks bebas)
                    </li>
                    <li>
                        <strong>keterangan_redflag</strong>: Keterangan tambahan redflag (teks bebas)
                    </li>
                </ul>
            </div>
        </div>
    );
}
