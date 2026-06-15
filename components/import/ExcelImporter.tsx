"use client";

import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download, X, FileUp, Sparkles, Table } from "lucide-react";
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
    onImport: (validRows: ImportRow[]) => Promise<{ success: number; failed: number; errors?: { row: number; error: string }[] }>;
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
    const [result, setResult] = useState<{ success: number; failed: number; errors?: { row: number; error: string }[] } | null>(null);

    const downloadTemplate = () => {
        const headers = templateColumns.map((c) => c.label);
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        ws["!cols"] = templateColumns.map(() => ({ wch: 20 }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, `Template_${templateName}.xlsx`);
    };

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

                const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
                    raw: false,
                    dateNF: "yyyy-mm-dd",
                });

                const mappedData = jsonData.map((row) => {
                    const mapped: Record<string, any> = {};
                    templateColumns.forEach((col) => {
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

    const handleImport = async () => {
        const validRows = previewRows.filter((r) => r.status === "valid");
        if (validRows.length === 0) return;

        setImporting(true);
        try {
            const result = await onImport(validRows);
            setResult(result);
            if (result.success > 0) {
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Download Template - Premium Card */}
            <div style={{
                background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                borderRadius: 16,
                padding: 24,
                border: '1px solid #93c5fd',
                position: 'relative',
                overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    width: 100,
                    height: 100,
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    borderRadius: '50%',
                    opacity: 0.1,
                }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{
                            width: 52,
                            height: 52,
                            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                            borderRadius: 14,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                        }}>
                            <FileSpreadsheet size={26} color="white" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e40af', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                                Download Template Excel
                                <span style={{
                                    padding: '4px 10px',
                                    background: '#3b82f6',
                                    color: 'white',
                                    borderRadius: 12,
                                    fontSize: 10,
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                }}>XLSX</span>
                            </h3>
                            <p style={{ fontSize: 13, color: '#3b82f6', margin: '4px 0 0 0' }}>
                                Download template, isi data sesuai kolom, lalu upload kembali
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={downloadTemplate}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '12px 24px',
                            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                            color: 'white',
                            borderRadius: 12,
                            border: 'none',
                            fontWeight: 600,
                            fontSize: 14,
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                            transition: 'all 0.2s',
                        }}
                    >
                        <Download size={18} />
                        Download Template
                    </button>
                </div>

                {/* Columns Preview */}
                <div style={{
                    marginTop: 16,
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.8)',
                    borderRadius: 10,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#1e40af', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Table size={14} /> Kolom:
                    </span>
                    {templateColumns.slice(0, 8).map((c) => (
                        <span key={c.key} style={{
                            padding: '4px 10px',
                            background: c.required ? '#dbeafe' : '#f1f5f9',
                            color: c.required ? '#1d4ed8' : '#64748b',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 500,
                        }}>
                            {c.label}{c.required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
                        </span>
                    ))}
                    {templateColumns.length > 8 && (
                        <span style={{ fontSize: 11, color: '#64748b' }}>+{templateColumns.length - 8} lainnya</span>
                    )}
                </div>
            </div>

            {/* Upload Area - Premium */}
            <div
                style={{
                    border: `2px dashed ${disabled ? '#e2e8f0' : file ? '#10b981' : '#94a3b8'}`,
                    borderRadius: 16,
                    padding: 40,
                    textAlign: 'center',
                    transition: 'all 0.3s',
                    background: disabled ? '#f8fafc' : file ? 'linear-gradient(135deg, #ecfdf5, #d1fae5)' : 'linear-gradient(135deg, #fafafa, white)',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {!disabled && !file && (
                    <div style={{
                        position: 'absolute',
                        top: 20,
                        right: 20,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                    }}>
                        <Sparkles size={12} /> Drag & Drop
                    </div>
                )}
                <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    disabled={disabled || importing}
                    style={{ display: 'none' }}
                    id="excel-upload"
                />
                <label htmlFor="excel-upload" style={{ cursor: disabled ? 'not-allowed' : 'pointer', display: 'block' }}>
                    {file ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                            <div style={{
                                width: 56,
                                height: 56,
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                borderRadius: 14,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                            }}>
                                <FileSpreadsheet size={28} color="white" />
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <p style={{ fontSize: 16, fontWeight: 700, color: '#047857', margin: 0 }}>{file.name}</p>
                                <p style={{ fontSize: 13, color: '#10b981', margin: '4px 0 0 0' }}>File siap diproses</p>
                            </div>
                            <button
                                onClick={(e) => { e.preventDefault(); handleReset(); }}
                                style={{
                                    marginLeft: 12,
                                    padding: 8,
                                    background: '#fee2e2',
                                    color: '#dc2626',
                                    borderRadius: 8,
                                    border: 'none',
                                    cursor: 'pointer',
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                    ) : (
                        <>
                            <div style={{
                                width: 72,
                                height: 72,
                                margin: '0 auto 16px',
                                background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
                                borderRadius: 18,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <FileUp size={32} color={disabled ? '#94a3b8' : '#64748b'} />
                            </div>
                            <p style={{ fontSize: 16, fontWeight: 600, color: disabled ? '#94a3b8' : '#374151', margin: '0 0 8px 0' }}>
                                {disabled ? 'Pilih lokasi terlebih dahulu' : 'Klik atau seret file ke sini'}
                            </p>
                            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
                                Format: .xlsx, .xls (max 5MB)
                            </p>
                        </>
                    )}
                </label>
            </div>

            {/* Validation Status */}
            {validating && (
                <div style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>
                    <div style={{
                        display: 'inline-block',
                        width: 32,
                        height: 32,
                        border: '3px solid #e5e7eb',
                        borderTopColor: '#10b981',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        marginBottom: 12,
                    }} />
                    <p style={{ margin: 0, fontWeight: 500 }}>Memvalidasi data...</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            )}

            {/* Preview Table */}
            {previewRows.length > 0 && (
                <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                    <div style={{
                        padding: '16px 20px',
                        background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                        borderBottom: '1px solid #e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Table size={18} style={{ color: '#10b981' }} />
                            Preview Data ({previewRows.length} baris)
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            {validCount > 0 && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#dcfce7', color: '#166534', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                                    <CheckCircle size={16} /> {validCount} valid
                                </span>
                            )}
                            {warningCount > 0 && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#fef9c3', color: '#854d0e', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                                    <AlertCircle size={16} /> {warningCount} skip
                                </span>
                            )}
                            {errorCount > 0 && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#fecaca', color: '#991b1b', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                                    <AlertCircle size={16} /> {errorCount} error
                                </span>
                            )}
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto', maxHeight: 400 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '1px solid #e5e7eb' }}>#</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                                    {templateColumns.slice(0, 5).map((col) => (
                                        <th key={col.key} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '1px solid #e5e7eb' }}>
                                            {col.label}
                                        </th>
                                    ))}
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '1px solid #e5e7eb' }}>Keterangan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {previewRows.slice(0, 20).map((row, idx) => (
                                    <tr
                                        key={row.rowNum}
                                        style={{
                                            background: row.status === "error" ? '#fef2f2' : row.status === "warning" || row.status === "duplicate" ? '#fffbeb' : idx % 2 === 0 ? 'white' : '#fafafa',
                                        }}
                                    >
                                        <td style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>{row.rowNum}</td>
                                        <td style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9' }}>
                                            {row.status === "valid" && (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#dcfce7', color: '#166534', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                                                    <CheckCircle size={14} /> OK
                                                </span>
                                            )}
                                            {row.status === "error" && (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#fecaca', color: '#991b1b', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                                                    <AlertCircle size={14} /> Error
                                                </span>
                                            )}
                                            {(row.status === "warning" || row.status === "duplicate") && (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#fef9c3', color: '#854d0e', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                                                    <AlertCircle size={14} /> Skip
                                                </span>
                                            )}
                                        </td>
                                        {templateColumns.slice(0, 5).map((col) => (
                                            <td key={col.key} style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', color: '#374151', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {String(row.data[col.key] || "-")}
                                            </td>
                                        ))}
                                        <td style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', color: '#dc2626', fontSize: 12 }}>
                                            {row.errors.length > 0 ? row.errors.join(", ") : "-"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {previewRows.length > 20 && (
                        <div style={{ padding: 12, textAlign: 'center', background: '#f8fafc', color: '#64748b', fontSize: 13, borderTop: '1px solid #e5e7eb' }}>
                            Menampilkan 20 dari {previewRows.length} baris
                        </div>
                    )}
                </div>
            )}

            {/* Import Button */}
            {previewRows.length > 0 && validCount > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#f8fafc', borderRadius: 12 }}>
                    <p style={{ fontSize: 14, color: '#475569', margin: 0 }}>
                        <strong style={{ color: '#10b981' }}>{validCount}</strong> data siap di-import.
                        {warningCount > 0 && <span style={{ color: '#d97706' }}> {warningCount} data akan di-skip.</span>}
                    </p>
                    <button
                        onClick={handleImport}
                        disabled={importing}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '14px 28px',
                            background: importing ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)',
                            color: 'white',
                            borderRadius: 12,
                            border: 'none',
                            fontWeight: 700,
                            fontSize: 15,
                            cursor: importing ? 'not-allowed' : 'pointer',
                            boxShadow: importing ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.4)',
                        }}
                    >
                        {importing ? (
                            <>
                                <div style={{ width: 18, height: 18, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                Importing...
                            </>
                        ) : (
                            <>
                                <Upload size={20} />
                                Import {validCount} Data
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Result */}
            {result && (
                <div style={{
                    borderRadius: 16,
                    padding: 20,
                    background: result.failed > 0 ? 'linear-gradient(135deg, #fffbeb, #fef3c7)' : 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
                    border: `1px solid ${result.failed > 0 ? '#fcd34d' : '#a7f3d0'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                }}>
                    <div style={{
                        width: 48,
                        height: 48,
                        background: result.failed > 0 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #10b981, #059669)',
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 4px 12px ${result.failed > 0 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                    }}>
                        {result.failed > 0 ? <AlertCircle size={24} color="white" /> : <CheckCircle size={24} color="white" />}
                    </div>
                    <div>
                        <p style={{ fontSize: 16, fontWeight: 700, color: result.failed > 0 ? '#92400e' : '#047857', margin: 0 }}>
                            Import selesai: {result.success} berhasil
                            {result.failed > 0 && `, ${result.failed} gagal`}
                        </p>
                        {result.success > 0 && (
                            <p style={{ fontSize: 13, color: result.failed > 0 ? '#a16207' : '#10b981', margin: '4px 0 0 0' }}>
                                Data sudah tersimpan ke database.
                            </p>
                        )}
                        {result.errors && result.errors.length > 0 && (
                            <div style={{ marginTop: 12, maxHeight: 150, overflowY: 'auto', fontSize: 12, color: '#991b1b', background: 'rgba(255,255,255,0.5)', padding: '8px 12px', borderRadius: 8 }}>
                                <p style={{ margin: '0 0 4px 0', fontWeight: 600 }}>Detail Kegagalan:</p>
                                {result.errors.map((e, idx) => (
                                    <div key={idx} style={{ marginBottom: 4 }}><strong>Baris {e.row}:</strong> {e.error}</div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
