"use client";

import { useState, useEffect } from "react";
import { getAuthHeaders } from "@/lib/clientSession";
import { X, TrendingUp, Calendar, Weight, Ruler } from "lucide-react";
import {
    ComposedChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

type Balita = {
    id: string;
    nama_balita: string | null;
    jk: string | null;
    tgl_lahir: string | null;
};

type AntroRecord = {
    id: string;
    minggu_ke: number;
    tgl_ukur: string;
    bb_kg: number | null;
    tb_cm: number | null;
    tb_corr_cm: number | null;
    zscore_bbu: number | null;
    zscore_tbu: number | null;
    zscore_bbtb: number | null;
    klas_bbu: string | null;
    klas_tbu: string | null;
    klas_bbtb: string | null;
    delta_bb_gr: number | null;
};

interface GrowthModalProps {
    balita: Balita;
    onClose: () => void;
}

export default function GrowthModal({ balita, onClose }: GrowthModalProps) {
    const [history, setHistory] = useState<AntroRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [bbuData, setBbuData] = useState<any[]>([]);
    const [tbuData, setTbuData] = useState<any[]>([]);
    const [bbtbData, setBbtbData] = useState<any[]>([]);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const authHeaders = await getAuthHeaders();

                // Step 1: Get kohort by balita_id
                const kohortRes = await fetch(`/api/kohort/by-balita?balita_id=${balita.id}`, {
                    credentials: 'include',
                    headers: authHeaders
                });
                const kohortData = await kohortRes.json();
                // API returns single item, not items array
                const kohort = kohortData.item;

                if (!kohort) {
                    setHistory([]);
                    setLoading(false);
                    return;
                }

                // Use kohort id
                const kohortId = kohort.id;

                // Step 2: Get antropometri by kohort_id
                const antroRes = await fetch(`/api/monitoring/antropometri?kohort_id=${kohortId}`, {
                    credentials: 'include',
                    headers: authHeaders
                });
                const antroData = await antroRes.json();
                const rawItems = antroData.items || [];

                // Map api field names to component field names
                const items = rawItems.map((item: any) => ({
                    id: item.id,
                    minggu_ke: item.minggu_ke,
                    tgl_ukur: item.tanggal,
                    bb_kg: item.bb_kg,
                    tb_cm: item.tb_cm,
                    tb_corr_cm: item.tb_corr_cm,
                    zscore_bbu: item.zs_bbu,
                    zscore_tbu: item.zs_tbu,
                    zscore_bbtb: item.zs_bbtb,
                    klas_bbu: item.klas_bbu,
                    klas_tbu: item.klas_tbu,
                    klas_bbtb: item.klas_bbtb,
                    delta_bb_gr: item.delta_bb_kg != null ? Math.round(item.delta_bb_kg * 1000) : null,
                }));

                setHistory(items.sort((a: AntroRecord, b: AntroRecord) => b.minggu_ke - a.minggu_ke));

                // Fetch WHO reference data
                if (items.length > 0 && balita.jk) {
                    const jkNum = balita.jk === 'L' ? 1 : 2;
                    const maxAge = Math.max(24, ...items.map((h: AntroRecord) => {
                        if (balita.tgl_lahir && h.tgl_ukur) {
                            const birth = new Date(balita.tgl_lahir);
                            const ukur = new Date(h.tgl_ukur);
                            return Math.floor((ukur.getTime() - birth.getTime()) / (30.44 * 24 * 60 * 60 * 1000));
                        }
                        return 0;
                    })) + 2;
                    const maxLength = Math.max(100, ...items.map((h: AntroRecord) => Number(h.tb_corr_cm || h.tb_cm || 0))) + 5;

                    // Calculate ages for history items
                    const historyWithAge = items.map((h: AntroRecord) => {
                        let age = 0;
                        if (balita.tgl_lahir && h.tgl_ukur) {
                            const birth = new Date(balita.tgl_lahir);
                            const ukur = new Date(h.tgl_ukur);
                            age = Math.floor((ukur.getTime() - birth.getTime()) / (30.44 * 24 * 60 * 60 * 1000));
                        }
                        return { ...h, usia_bulan: age };
                    });

                    // BBU
                    try {
                        const r = await fetch(`/api/ref/lms-bbu?jk=${jkNum}&min_month=0&max_month=${maxAge}`, { headers: authHeaders });
                        const d = await r.json();
                        if (d.items) {
                            const merged = d.items.map((item: any) => {
                                const childPoints = historyWithAge.filter((h: any) => h.usia_bulan === item.umur_bulan && h.bb_kg != null);
                                const childVal = childPoints.length > 0 ? Number(childPoints[childPoints.length - 1].bb_kg) : null;
                                return { x: item.umur_bulan, ...item, sd0: item.sd0 ?? item.M, anak: childVal };
                            });
                            setBbuData(merged);
                        }
                    } catch (e) { console.error("BBU fetch error", e); }

                    // TBU
                    try {
                        const r = await fetch(`/api/ref/lms-tbu?jk=${jkNum}&min_month=0&max_month=${maxAge}`, { headers: authHeaders });
                        const d = await r.json();
                        if (d.items) {
                            const merged = d.items.map((item: any) => {
                                const childPoints = historyWithAge.filter((h: any) => h.usia_bulan === item.umur_bulan && (h.tb_corr_cm != null || h.tb_cm != null));
                                const childVal = childPoints.length > 0 ? Number(childPoints[childPoints.length - 1].tb_corr_cm ?? childPoints[childPoints.length - 1].tb_cm) : null;
                                return { x: item.umur_bulan, ...item, sd0: item.sd0 ?? item.M, anak: childVal };
                            });
                            setTbuData(merged);
                        }
                    } catch (e) { console.error("TBU fetch error", e); }

                    // BBTB
                    try {
                        const r = await fetch(`/api/ref/lms-bbtb?jk=${jkNum}&min_length=45&max_length=${maxLength}`, { headers: authHeaders });
                        const d = await r.json();
                        if (d.items) {
                            const merged = d.items.map((item: any) => ({ x: item.tb_cm, ...item, sd0: item.sd0 ?? item.M, anak: null }));
                            const childPoints = items
                                .filter((h: any) => (h.tb_corr_cm != null || h.tb_cm != null) && h.bb_kg != null)
                                .map((h: any) => ({ x: Number(h.tb_corr_cm ?? h.tb_cm), anak: Number(h.bb_kg) }));
                            const combined = [...merged, ...childPoints].sort((a, b) => a.x - b.x);
                            setBbtbData(combined);
                        }
                    } catch (e) { console.error("BBTB fetch error", e); }
                }
            } catch (e) {
                console.error("Failed to fetch history", e);
            }
            setLoading(false);
        })();
    }, [balita.id, balita.jk, balita.tgl_lahir]);

    const getStatusBadge = (klas: string | null, type: 'bbu' | 'tbu' | 'bbtb') => {
        if (!klas) return null;
        const lower = klas.toLowerCase();
        let bg = '#f3f4f6', color = '#6b7280';

        if (type === 'bbu') {
            if (lower.includes('normal')) { bg = '#dcfce7'; color = '#166534'; }
            else if (lower.includes('kurang')) { bg = '#fef9c3'; color = '#854d0e'; }
            else if (lower.includes('sangat kurang') || lower.includes('buruk')) { bg = '#fecaca'; color = '#991b1b'; }
        } else if (type === 'tbu') {
            if (lower.includes('normal')) { bg = '#dcfce7'; color = '#166534'; }
            else if (lower.includes('pendek')) { bg = '#fef9c3'; color = '#854d0e'; }
            else if (lower.includes('sangat pendek')) { bg = '#fecaca'; color = '#991b1b'; }
        } else {
            if (lower.includes('normal') || lower.includes('baik')) { bg = '#dcfce7'; color = '#166534'; }
            else if (lower.includes('kurus') || lower.includes('gizi kurang')) { bg = '#fef9c3'; color = '#854d0e'; }
            else if (lower.includes('sangat') || lower.includes('buruk')) { bg = '#fecaca'; color = '#991b1b'; }
        }

        return (
            <span style={{ padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: bg, color, display: 'inline-block' }}>
                {klas}
            </span>
        );
    };

    const formatDate = (s: string | null) => {
        if (!s) return '-';
        const d = new Date(s);
        return isNaN(d.getTime()) ? s : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const formatZScore = (z: number | null) => {
        if (z == null) return '-';
        return z.toFixed(1) + ' SD';
    };

    const GrowthChart = ({ data, title, xLabel, yLabel, type }: any) => {
        const config = type === 'bbu'
            ? { gradient: '#3b82f6', light: '#eff6ff', badge: 'BB/U', icon: '⚖️' }
            : type === 'tbu'
                ? { gradient: '#10b981', light: '#ecfdf5', badge: 'TB/U', icon: '📏' }
                : { gradient: '#8b5cf6', light: '#f5f3ff', badge: 'BB/TB', icon: '📊' };

        return (
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: config.light }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 20 }}>{config.icon}</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{title}</span>
                    </div>
                    <span style={{ padding: '4px 10px', background: config.gradient, color: 'white', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>{config.badge}</span>
                </div>
                <div style={{ padding: 16, height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={data} margin={{ top: 5, right: 15, bottom: 15, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="x" type="number" domain={['dataMin', 'dataMax']} tick={{ fontSize: 10, fill: '#64748b' }} label={{ value: xLabel, position: 'insideBottom', offset: -8, fontSize: 10, fill: '#64748b' }} />
                            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} label={{ value: yLabel, angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748b' }} domain={['auto', 'auto']} />
                            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', padding: '8px 12px', fontSize: 12 }} formatter={(v: number) => v ? v.toFixed(2) : '-'} />
                            <Line type="monotone" dataKey="sd3pos" stroke="#ef4444" strokeWidth={1} dot={false} name="+3 SD" connectNulls />
                            <Line type="monotone" dataKey="sd2pos" stroke="#f97316" strokeWidth={1} dot={false} name="+2 SD" connectNulls />
                            <Line type="monotone" dataKey="sd1pos" stroke="#eab308" strokeWidth={1} dot={false} name="+1 SD" connectNulls />
                            <Line type="monotone" dataKey="sd0" stroke="#22c55e" strokeWidth={1.5} dot={false} name="Median" connectNulls />
                            <Line type="monotone" dataKey="sd1neg" stroke="#eab308" strokeWidth={1} dot={false} name="-1 SD" connectNulls />
                            <Line type="monotone" dataKey="sd2neg" stroke="#f97316" strokeWidth={1} dot={false} name="-2 SD" connectNulls />
                            <Line type="monotone" dataKey="sd3neg" stroke="#ef4444" strokeWidth={1} dot={false} name="-3 SD" connectNulls />
                            <Line type="linear" dataKey="anak" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 5, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }} name="Anak" connectNulls />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999 }}>
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '95%', maxWidth: '1000px' }}>
                <div style={{ backgroundColor: 'white', borderRadius: 16, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
                    {/* Header */}
                    <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', borderRadius: '16px 16px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: 18, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                            <TrendingUp size={20} /> Progress Pertumbuhan
                        </h2>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
                    </div>

                    {/* Child Info */}
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>{balita.nama_balita || '-'}</h3>
                        <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0 0' }}>
                            {balita.jk === 'L' ? 'Laki-laki' : balita.jk === 'P' ? 'Perempuan' : '-'} • {history.length} pengukuran
                        </p>
                    </div>

                    {loading ? (
                        <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
                            <div style={{ width: 32, height: 32, border: '3px solid #e5e7eb', borderTopColor: '#10b981', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
                            Memuat data...
                        </div>
                    ) : history.length === 0 ? (
                        <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
                            <TrendingUp size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                            <p>Belum ada riwayat antropometri.</p>
                        </div>
                    ) : (
                        <div style={{ padding: 20 }}>
                            {/* Riwayat Table */}
                            <div style={{ marginBottom: 24 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                    <Calendar size={18} style={{ color: '#10b981' }} />
                                    <h4 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>Riwayat Antropometri</h4>
                                </div>
                                <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                            <thead>
                                                <tr style={{ background: '#f8fafc' }}>
                                                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#475569', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>Minggu</th>
                                                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#475569', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>Tanggal</th>
                                                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#475569', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>BB</th>
                                                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#475569', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>TB</th>
                                                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#475569', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>ZS BBU</th>
                                                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#475569', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>Klas BBU</th>
                                                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#475569', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>ZS TBU</th>
                                                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#475569', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>Klas TBU</th>
                                                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#475569', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>ZS BBTB</th>
                                                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#475569', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>Klas BBTB</th>
                                                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#475569', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>Δ BB</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {history.map((h, idx) => (
                                                    <tr key={h.id} style={{ background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                                                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#0ea5e9' }}>Mg {h.minggu_ke}</td>
                                                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', color: '#374151' }}>{formatDate(h.tgl_ukur)}</td>
                                                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', color: '#374151' }}>{h.bb_kg ? `${h.bb_kg} kg` : '-'}</td>
                                                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', color: '#374151' }}>{(h.tb_corr_cm || h.tb_cm) ? `${h.tb_corr_cm || h.tb_cm} cm` : '-'}</td>
                                                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', color: '#374151' }}>{formatZScore(h.zscore_bbu)}</td>
                                                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>{getStatusBadge(h.klas_bbu, 'bbu')}</td>
                                                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', color: '#374151' }}>{formatZScore(h.zscore_tbu)}</td>
                                                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>{getStatusBadge(h.klas_tbu, 'tbu')}</td>
                                                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', color: '#374151' }}>{formatZScore(h.zscore_bbtb)}</td>
                                                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>{getStatusBadge(h.klas_bbtb, 'bbtb')}</td>
                                                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', color: h.delta_bb_gr != null && h.delta_bb_gr > 0 ? '#10b981' : h.delta_bb_gr != null && h.delta_bb_gr < 0 ? '#ef4444' : '#6b7280', fontWeight: 600 }}>
                                                            {h.delta_bb_gr != null ? (h.delta_bb_gr > 0 ? '+' : '') + h.delta_bb_gr + ' gr' : '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* WHO Charts */}
                            {(bbuData.length > 0 || tbuData.length > 0 || bbtbData.length > 0) && (
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                        <TrendingUp size={18} style={{ color: '#10b981' }} />
                                        <h4 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>Grafik Pertumbuhan WHO</h4>
                                    </div>
                                    {bbuData.length > 0 && <GrowthChart data={bbuData} title="BB Menurut Umur" xLabel="Umur (bulan)" yLabel="BB (kg)" type="bbu" />}
                                    {tbuData.length > 0 && <GrowthChart data={tbuData} title="TB Menurut Umur" xLabel="Umur (bulan)" yLabel="TB (cm)" type="tbu" />}
                                    {bbtbData.length > 0 && <GrowthChart data={bbtbData} title="BB Menurut TB" xLabel="TB (cm)" yLabel="BB (kg)" type="bbtb" />}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Footer */}
                    <div style={{ padding: '16px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end' }}>
                        <button onClick={onClose} style={{ padding: '10px 24px', background: '#10b981', color: 'white', borderRadius: 8, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Tutup</button>
                    </div>
                </div>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
