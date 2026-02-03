"use client";
import { useState, useEffect } from "react";
import { Users, Search, MapPin, Building2, Home, Plus, Eye, Trash2, CheckCircle, XCircle, Filter, ClipboardList, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Pencil } from "lucide-react";
import { ensureServerSession, getAuthHeaders } from "@/lib/clientSession";
import SurveyModal from "@/components/determinan/SurveyModal";
import ViewSurveyModal from "@/components/determinan/ViewSurveyModal";

type Balita = {
    id: string;
    nik: string;
    nama: string;
    desa_nama: string;
    survey_count: number;
    latest_risk_category: string | null;
};

type Pkm = { id: string; nama: string };
type Desa = { id: string; desa_kel: string };

export default function DaftarBalitaDeterminan() {
    const [balitaList, setBalitaList] = useState<Balita[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [kecList, setKecList] = useState<string[]>([]);
    const [pkmList, setPkmList] = useState<Pkm[]>([]);
    const [desaList, setDesaList] = useState<Desa[]>([]);
    const [kec, setKec] = useState("");
    const [puskesmasId, setPuskesmasId] = useState("");
    const [desa, setDesa] = useState("");
    const [nik, setNik] = useState("");

    // Pagination
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [limit, setLimit] = useState(10);
    const [pageInput, setPageInput] = useState("1");

    // Modals
    const [showSurveyModal, setShowSurveyModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedBalita, setSelectedBalita] = useState<Balita | null>(null);
    const [editingSurveyId, setEditingSurveyId] = useState<string | null>(null);

    // Fetch Kecamatan on mount
    useEffect(() => {
        (async () => {
            await ensureServerSession();
            const headers = await getAuthHeaders();
            const res = await fetch('/api/ref/kecamatan', { credentials: 'include', headers });
            const data = await res.json();
            const items: string[] = data.items || [];
            setKecList(items);
            if (items.length === 1) setKec(items[0]);
        })();
    }, []);

    // Fetch Puskesmas when kec changes
    useEffect(() => {
        if (!kec) {
            setPkmList([]);
            setPuskesmasId("");
            setDesaList([]);
            setDesa("");
            return;
        }
        (async () => {
            await ensureServerSession();
            const headers = await getAuthHeaders();
            const res = await fetch(`/api/ref/puskesmas?kec=${encodeURIComponent(kec)}`, { credentials: 'include', headers });
            const data = await res.json();
            const mapped = (data.items || []).map((r: any) => ({ id: r.id, nama: r.nama }));
            setPkmList(mapped);
            if (mapped.length === 1) setPuskesmasId(mapped[0].id);
        })();
    }, [kec]);

    // Fetch Desa when puskesmasId changes
    useEffect(() => {
        if (!puskesmasId) {
            setDesaList([]);
            setDesa("");
            return;
        }
        (async () => {
            await ensureServerSession();
            const headers = await getAuthHeaders();
            const res = await fetch(`/api/ref/desa?puskesmas_id=${puskesmasId}`, { credentials: 'include', headers });
            const data = await res.json();
            const mapped = (data.items || []).map((r: any) => ({ id: r.id, desa_kel: r.desa_kel }));
            setDesaList(mapped);
            if (mapped.length === 1) setDesa(mapped[0].desa_kel);
        })();
    }, [puskesmasId]);

    // Fetch balita data
    async function fetchBalita(e?: React.FormEvent) {
        if (e) {
            e.preventDefault();
            if (page !== 1) setPage(1);
            setPageInput("1");
        }
        setLoading(true);
        try {
            await ensureServerSession();
            const headers = await getAuthHeaders();
            const params = new URLSearchParams();
            if (kec) params.set('kec', kec);
            if (puskesmasId) params.set('puskesmas_id', puskesmasId);
            if (desa) params.set('desa_kel', desa);
            if (nik) params.set('nik', nik);
            params.set('page', String(e ? 1 : page));
            params.set('limit', String(limit));

            const res = await fetch(`/api/determinan/balita-list?${params.toString()}`, { credentials: 'include', headers });
            const data = await res.json();
            setBalitaList(data.items || []);
            setPages(data.pages || 1);
            setTotal(data.total || (data.items?.length ?? 0));
        } catch (err) {
            console.error("Error fetching balita:", err);
        } finally {
            setLoading(false);
        }
    }

    // Fetch on page/limit change
    useEffect(() => {
        fetchBalita();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, limit]);

    // Sync pageInput with page
    useEffect(() => {
        setPageInput(String(page));
    }, [page]);

    const handleAddSurvey = (balita: Balita) => {
        setSelectedBalita(balita);
        setEditingSurveyId(null);
        setShowSurveyModal(true);
    };

    const handleViewSurvey = (balita: Balita) => {
        setSelectedBalita(balita);
        setShowViewModal(true);
    };

    const handleDeleteSurvey = async (balitaId: string) => {
        if (!confirm("Apakah Anda yakin ingin menghapus survey ini?")) return;
        try {
            const headers = await getAuthHeaders();
            // First, get the survey ID for this balita
            const surveyRes = await fetch(`/api/determinan/survey?balita_id=${balitaId}`, { headers });
            const surveyData = await surveyRes.json();

            if (surveyData.items && surveyData.items.length > 0) {
                const surveyId = surveyData.items[0].id; // Get the latest survey ID
                const res = await fetch(`/api/determinan/survey/${surveyId}`, {
                    method: 'DELETE',
                    headers
                });
                if (res.ok) {
                    fetchBalita();
                } else {
                    const errData = await res.json();
                    console.error("Delete failed:", errData);
                    alert("Gagal menghapus survey: " + (errData.error || "Unknown error"));
                }
            }
        } catch (err) {
            console.error("Error deleting survey:", err);
            alert("Gagal menghapus survey");
        }
    };

    const handleEditSurvey = async (balita: Balita) => {
        // Get the latest survey ID for this balita
        try {
            const headers = await getAuthHeaders();
            const res = await fetch(`/api/determinan/survey?balita_id=${balita.id}`, { headers });
            const data = await res.json();
            if (data.items && data.items.length > 0) {
                setSelectedBalita(balita);
                setEditingSurveyId(data.items[0].id); // Latest survey
                setShowSurveyModal(true);
            }
        } catch (err) {
            console.error("Error fetching survey for edit:", err);
        }
    };

    const getRiskBadge = (category: string | null) => {
        if (!category) return null;
        const colors: Record<string, { bg: string; text: string; border: string }> = {
            'Rendah': { bg: '#dcfce7', text: '#15803d', border: '#86efac' },
            'Sedang': { bg: '#fef9c3', text: '#a16207', border: '#fde047' },
            'Tinggi': { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5' },
        };
        const style = colors[category] || colors['Rendah'];
        return (
            <span style={{
                padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                background: style.bg, color: style.text, border: `1px solid ${style.border}`,
            }}>
                {category}
            </span>
        );
    };

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: 32 }}>
            {/* Page Header */}
            <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                    <div style={{
                        width: 48, height: 48,
                        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                        borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                    }}>
                        <ClipboardList color="white" size={24} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                            Daftar Balita - Survey Determinan
                        </h1>
                        <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
                            Kelola survey determinan stunting untuk setiap balita
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <form onSubmit={fetchBalita} style={{
                background: 'white', borderRadius: 16, padding: 24, marginBottom: 24,
                border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <Filter size={18} color="#8b5cf6" />
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>Filter Data</span>
                </div>
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 16, alignItems: 'end',
                }}>
                    <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, display: 'block' }}>
                            <MapPin size={14} style={{ display: 'inline', marginRight: 4 }} />Kecamatan
                        </label>
                        <select value={kec} onChange={(e) => setKec(e.target.value)} style={{
                            width: '100%', padding: '10px 12px', borderRadius: 10,
                            border: '1px solid #e2e8f0', fontSize: 14, background: 'white',
                        }}>
                            <option value="">Semua Kecamatan</option>
                            {kecList.map((k, idx) => <option key={`kec-${idx}`} value={k}>{k}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, display: 'block' }}>
                            <Building2 size={14} style={{ display: 'inline', marginRight: 4 }} />Puskesmas
                        </label>
                        <select value={puskesmasId} onChange={(e) => setPuskesmasId(e.target.value)} style={{
                            width: '100%', padding: '10px 12px', borderRadius: 10,
                            border: '1px solid #e2e8f0', fontSize: 14, background: 'white',
                        }}>
                            <option value="">Semua Puskesmas</option>
                            {pkmList.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, display: 'block' }}>
                            <Home size={14} style={{ display: 'inline', marginRight: 4 }} />Desa/Kelurahan
                        </label>
                        <select value={desa} onChange={(e) => setDesa(e.target.value)} style={{
                            width: '100%', padding: '10px 12px', borderRadius: 10,
                            border: '1px solid #e2e8f0', fontSize: 14, background: 'white',
                        }}>
                            <option value="">Semua Desa</option>
                            {desaList.map((d) => <option key={d.id} value={d.desa_kel}>{d.desa_kel}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, display: 'block' }}>
                            <Search size={14} style={{ display: 'inline', marginRight: 4 }} />Cari NIK
                        </label>
                        <input type="text" placeholder="Masukkan NIK..." value={nik}
                            onChange={(e) => setNik(e.target.value)} style={{
                                width: '100%', padding: '10px 12px', borderRadius: 10,
                                border: '1px solid #e2e8f0', fontSize: 14,
                            }}
                        />
                    </div>
                    <div>
                        <button type="submit" style={{
                            width: '100%', padding: '10px 16px', borderRadius: 10, border: 'none',
                            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                            color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
                        }}>
                            <Filter size={16} />Filter
                        </button>
                    </div>
                </div>
            </form>

            {/* Table */}
            <div style={{
                background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
                overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, fontSize: 13, color: '#475569', borderBottom: '1px solid #e2e8f0' }}>NIK</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, fontSize: 13, color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Nama Balita</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, fontSize: 13, color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Desa/Kel</th>
                                <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, fontSize: 13, color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Survey</th>
                                <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, fontSize: 13, color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Risiko</th>
                                <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, fontSize: 13, color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                                        <div style={{
                                            width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#8b5cf6',
                                            borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto',
                                        }} />
                                        <p style={{ marginTop: 12 }}>Memuat data...</p>
                                    </td>
                                </tr>
                            ) : balitaList.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                                        <Users size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                                        <p>Tidak ada data balita</p>
                                    </td>
                                </tr>
                            ) : (
                                balitaList.map((balita, idx) => (
                                    <tr key={balita.id} style={{
                                        borderBottom: '1px solid #f1f5f9',
                                        background: idx % 2 === 0 ? 'white' : '#fafafa',
                                    }}>
                                        <td style={{ padding: '14px 16px', fontWeight: 500, fontSize: 13, color: '#0f172a' }}>{balita.nik}</td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>{balita.nama}</div>
                                        </td>
                                        <td style={{ padding: '14px 16px', fontSize: 13, color: '#64748b' }}>{balita.desa_nama}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            {balita.survey_count > 0 ? (
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                                    <CheckCircle size={16} color="#22c55e" />
                                                    <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>Sudah</span>
                                                </div>
                                            ) : (
                                                <div style={{
                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                                    background: '#fef2f2', padding: '6px 12px', borderRadius: 20,
                                                    border: '1px solid #fecaca',
                                                }}>
                                                    <XCircle size={14} color="#dc2626" />
                                                    <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 700 }}>Belum</span>
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>{getRiskBadge(balita.latest_risk_category)}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                                <button onClick={() => handleAddSurvey(balita)} title="Tambah Survey" style={{
                                                    width: 32, height: 32, borderRadius: 8, border: 'none',
                                                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                                                    color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    boxShadow: '0 2px 6px rgba(139, 92, 246, 0.3)',
                                                }}>
                                                    <Plus size={16} />
                                                </button>
                                                {balita.survey_count > 0 && (
                                                    <>
                                                        <button onClick={() => handleViewSurvey(balita)} title="Lihat Detail" style={{
                                                            width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0',
                                                            background: 'white', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        }}>
                                                            <Eye size={16} />
                                                        </button>
                                                        <button onClick={() => handleEditSurvey(balita)} title="Edit Survey" style={{
                                                            width: 32, height: 32, borderRadius: 8, border: '1px solid #fef0c7',
                                                            background: '#fffbeb', color: '#d97706', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        }}>
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button onClick={() => handleDeleteSurvey(balita.id)} title="Hapus Survey" style={{
                                                            width: 32, height: 32, borderRadius: 8, border: '1px solid #fecaca',
                                                            background: '#fef2f2', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        }}>
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div style={{
                    display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
                    gap: 16, padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#fafafa',
                }}>
                    <div style={{ fontSize: 14, color: '#64748b' }}>
                        Menampilkan <strong style={{ color: '#0f172a' }}>{Math.min((page - 1) * limit + 1, total)}</strong> - <strong style={{ color: '#0f172a' }}>{Math.min(page * limit, total)}</strong> dari <strong style={{ color: '#0f172a' }}>{total}</strong> data
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#64748b' }}>
                            <span>Rows per page:</span>
                            <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} style={{
                                padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14, background: 'white',
                            }}>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <button type="button" onClick={() => setPage(1)} disabled={page <= 1} title="First" style={{
                                padding: 8, border: 'none', background: 'none', borderRadius: 6, color: page <= 1 ? '#cbd5e1' : '#64748b', cursor: page <= 1 ? 'not-allowed' : 'pointer',
                            }}>
                                <ChevronsLeft size={18} />
                            </button>
                            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} title="Previous" style={{
                                padding: 8, border: 'none', background: 'none', borderRadius: 6, color: page <= 1 ? '#cbd5e1' : '#64748b', cursor: page <= 1 ? 'not-allowed' : 'pointer',
                            }}>
                                <ChevronLeft size={18} />
                            </button>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 8px' }}>
                                <input type="number" min={1} max={pages} value={pageInput}
                                    onChange={(e) => setPageInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const n = Math.max(1, Math.min(pages, Number(pageInput) || 1));
                                            setPage(n);
                                        }
                                    }}
                                    style={{
                                        width: 48, padding: 6, textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14,
                                    }}
                                />
                                <span style={{ fontSize: 14, color: '#64748b' }}>of {pages}</span>
                            </div>
                            <button type="button" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages} title="Next" style={{
                                padding: 8, border: 'none', background: 'none', borderRadius: 6, color: page >= pages ? '#cbd5e1' : '#64748b', cursor: page >= pages ? 'not-allowed' : 'pointer',
                            }}>
                                <ChevronRight size={18} />
                            </button>
                            <button type="button" onClick={() => setPage(pages)} disabled={page >= pages} title="Last" style={{
                                padding: 8, border: 'none', background: 'none', borderRadius: 6, color: page >= pages ? '#cbd5e1' : '#64748b', cursor: page >= pages ? 'not-allowed' : 'pointer',
                            }}>
                                <ChevronsRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showSurveyModal && selectedBalita && (
                <SurveyModal
                    balita={selectedBalita}
                    surveyId={editingSurveyId}
                    onClose={() => setShowSurveyModal(false)}
                    onSuccess={() => { setShowSurveyModal(false); fetchBalita(); }}
                />
            )}

            {showViewModal && selectedBalita && (
                <ViewSurveyModal
                    balita={selectedBalita}
                    onClose={() => setShowViewModal(false)}
                />
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
