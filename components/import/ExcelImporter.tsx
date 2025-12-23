"use client";

import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download, X } from "lucide-react";
import * as XLSX from "xlsx";

export type ImportRow = {
    rowNum: number;
    data: Record<string, any>;
    status: "valid" | "error" | "warning" | "duplicate";
    errors: string[];
};

type ExcelImporterProps = {
    templateColumns: { key: string; label: string; required: boolean }[];
    onValidate: (rows: Record<string, any>[]) => Promise<ImportRow[]>;
    onImport: (validRows: ImportRow[]) => Promise<{ success: number; failed: number }>;
    templateName: string;
    disabled?: boolean;
};

export default function ExcelImporter({
    templateColumns,
    onValidate,
    onImport,
    templateName,
    disabled = false,
}: ExcelImporterProps) {
    const [file, setFile] = useState<File | null>(null);
    const [rawData, setRawData] = useState<Record<string, any>[]>([]);
    const [previewRows, setPreviewRows] = useState<ImportRow[]>([]);
    const [importing, setImporting] = useState(false);
    const [validating, setValidating] = useState(false);
    const [result, setResult] = useState<{ success: number; failed: number } | null>(null);

    // Download template
    const downloadTemplate = () => {
        const headers = templateColumns.map((c) => c.label);
        const ws = XLSX.utils.aoa_to_sheet([headers]);

        // Set column widths
        ws["!cols"] = templateColumns.map(() => ({ wch: 20 }));

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, `Template_${templateName}.xlsx`);
    };

    // Handle file upload
    const handleFileChange = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const selectedFile = e.target.files?.[0];
            if (!selectedFile) return;

            setFile(selectedFile);
            setResult(null);
            setValidating(true);

            try {
                const buffer = await selectedFile.arrayBuffer();
                const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // Convert to JSON with header mapping
                const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
                    raw: false,
                    dateNF: "yyyy-mm-dd",
                });

                // Map Excel headers to expected keys
                const mappedData = jsonData.map((row) => {
                    const mapped: Record<string, any> = {};
                    templateColumns.forEach((col) => {
                        // Try to find matching column by label (case-insensitive)
                        const key = Object.keys(row).find(
                            (k) => k.toLowerCase().trim() === col.label.toLowerCase().trim()
                        );
                        if (key) {
                            mapped[col.key] = row[key];
                        }
                    });
                    return mapped;
                });

                setRawData(mappedData);

                // Validate rows
                const validated = await onValidate(mappedData);
                setPreviewRows(validated);
            } catch (err) {
                console.error("Error reading Excel:", err);
                setPreviewRows([]);
            } finally {
                setValidating(false);
            }
        },
        [templateColumns, onValidate]
    );

    // Handle import
    const handleImport = async () => {
        const validRows = previewRows.filter((r) => r.status === "valid");
        if (validRows.length === 0) return;

        setImporting(true);
        try {
            const result = await onImport(validRows);
            setResult(result);
            if (result.success > 0) {
                // Clear file after successful import
                setFile(null);
                setRawData([]);
                setPreviewRows([]);
            }
        } catch (err) {
            console.error("Import error:", err);
        } finally {
            setImporting(false);
        }
    };

    // Reset
    const handleReset = () => {
        setFile(null);
        setRawData([]);
        setPreviewRows([]);
        setResult(null);
    };

    const validCount = previewRows.filter((r) => r.status === "valid").length;
    const errorCount = previewRows.filter((r) => r.status === "error").length;
    const warningCount = previewRows.filter((r) => r.status === "warning" || r.status === "duplicate").length;

    return (
        <div className="space-y-6">
            {/* Download Template */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                            <FileSpreadsheet size={20} />
                            Download Template Excel
                        </h3>
                        <p className="text-sm text-blue-700 mt-1">
                            Download template, isi data sesuai kolom, lalu upload kembali.
                        </p>
                    </div>
                    <button
                        onClick={downloadTemplate}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        <Download size={18} />
                        Download Template
                    </button>
                </div>

                {/* Column info */}
                <div className="mt-3 text-xs text-blue-800">
                    <strong>Kolom:</strong>{" "}
                    {templateColumns.map((c, i) => (
                        <span key={c.key}>
                            {c.label}
                            {c.required && <span className="text-red-500">*</span>}
                            {i < templateColumns.length - 1 && ", "}
                        </span>
                    ))}
                </div>
            </div>

            {/* Upload Area */}
            <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${disabled
                        ? "border-gray-200 bg-gray-50 cursor-not-allowed"
                        : file
                            ? "border-emerald-300 bg-emerald-50"
                            : "border-gray-300 hover:border-emerald-400 hover:bg-emerald-50 cursor-pointer"
                    }`}
            >
                <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    disabled={disabled || importing}
                    className="hidden"
                    id="excel-upload"
                />
                <label
                    htmlFor="excel-upload"
                    className={disabled ? "cursor-not-allowed" : "cursor-pointer"}
                >
                    <Upload className="mx-auto text-gray-400 mb-3" size={40} />
                    {file ? (
                        <div className="flex items-center justify-center gap-2 text-emerald-700">
                            <FileSpreadsheet size={20} />
                            <span className="font-medium">{file.name}</span>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleReset();
                                }}
                                className="ml-2 text-gray-500 hover:text-red-500"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    ) : (
                        <>
                            <p className="text-gray-600 font-medium">
                                Drag & drop atau klik untuk upload
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                Format: .xlsx, .xls (max 5MB)
                            </p>
                        </>
                    )}
                </label>
                {disabled && (
                    <p className="text-sm text-amber-600 mt-2">
                        ⚠️ Pilih lokasi (Puskesmas/Desa) terlebih dahulu
                    </p>
                )}
            </div>

            {/* Validation Status */}
            {validating && (
                <div className="text-center text-gray-600 py-4">
                    <div className="animate-spin inline-block w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full mr-2" />
                    Memvalidasi data...
                </div>
            )}

            {/* Preview Table */}
            {previewRows.length > 0 && (
                <div className="border rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800">
                            Preview Data ({previewRows.length} baris)
                        </h3>
                        <div className="flex items-center gap-4 text-sm">
                            {validCount > 0 && (
                                <span className="flex items-center gap-1 text-emerald-600">
                                    <CheckCircle size={16} /> {validCount} valid
                                </span>
                            )}
                            {warningCount > 0 && (
                                <span className="flex items-center gap-1 text-amber-600">
                                    <AlertCircle size={16} /> {warningCount} warning
                                </span>
                            )}
                            {errorCount > 0 && (
                                <span className="flex items-center gap-1 text-red-600">
                                    <AlertCircle size={16} /> {errorCount} error
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto max-h-96">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700">#</th>
                                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700">Status</th>
                                    {templateColumns.slice(0, 5).map((col) => (
                                        <th key={col.key} className="px-3 py-2 text-left text-xs font-bold text-gray-700">
                                            {col.label}
                                        </th>
                                    ))}
                                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700">Keterangan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {previewRows.slice(0, 20).map((row) => (
                                    <tr
                                        key={row.rowNum}
                                        className={
                                            row.status === "error"
                                                ? "bg-red-50"
                                                : row.status === "warning" || row.status === "duplicate"
                                                    ? "bg-amber-50"
                                                    : ""
                                        }
                                    >
                                        <td className="px-3 py-2 text-gray-600">{row.rowNum}</td>
                                        <td className="px-3 py-2">
                                            {row.status === "valid" && (
                                                <span className="inline-flex items-center gap-1 text-emerald-600">
                                                    <CheckCircle size={14} /> OK
                                                </span>
                                            )}
                                            {row.status === "error" && (
                                                <span className="inline-flex items-center gap-1 text-red-600">
                                                    <AlertCircle size={14} /> Error
                                                </span>
                                            )}
                                            {(row.status === "warning" || row.status === "duplicate") && (
                                                <span className="inline-flex items-center gap-1 text-amber-600">
                                                    <AlertCircle size={14} /> Skip
                                                </span>
                                            )}
                                        </td>
                                        {templateColumns.slice(0, 5).map((col) => (
                                            <td key={col.key} className="px-3 py-2 text-gray-800 max-w-32 truncate">
                                                {String(row.data[col.key] || "-")}
                                            </td>
                                        ))}
                                        <td className="px-3 py-2 text-gray-600 text-xs">
                                            {row.errors.length > 0 ? row.errors.join(", ") : "-"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {previewRows.length > 20 && (
                        <div className="bg-gray-50 px-4 py-2 text-center text-sm text-gray-500">
                            Menampilkan 20 dari {previewRows.length} baris
                        </div>
                    )}
                </div>
            )}

            {/* Import Button */}
            {previewRows.length > 0 && validCount > 0 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                        <strong>{validCount}</strong> data siap di-import.
                        {warningCount > 0 && ` ${warningCount} data akan di-skip.`}
                    </p>
                    <button
                        onClick={handleImport}
                        disabled={importing}
                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                    >
                        {importing ? (
                            <>
                                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                Importing...
                            </>
                        ) : (
                            <>
                                <Upload size={18} />
                                Import {validCount} Data
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Result */}
            {result && (
                <div
                    className={`rounded-xl p-4 ${result.failed > 0 ? "bg-amber-50 border border-amber-200" : "bg-emerald-50 border border-emerald-200"
                        }`}
                >
                    <div className="flex items-center gap-3">
                        {result.failed > 0 ? (
                            <AlertCircle className="text-amber-600" size={24} />
                        ) : (
                            <CheckCircle className="text-emerald-600" size={24} />
                        )}
                        <div>
                            <p className="font-semibold text-gray-800">
                                Import selesai: {result.success} berhasil
                                {result.failed > 0 && `, ${result.failed} gagal`}
                            </p>
                            {result.success > 0 && (
                                <p className="text-sm text-gray-600">Data sudah tersimpan ke database.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
