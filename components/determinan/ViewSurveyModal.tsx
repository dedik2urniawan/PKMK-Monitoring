"use client";
import React, { useState, useEffect } from "react";
import { X, MapPin, Baby, Utensils, Pill, Home, Users, Calendar, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { getAuthHeaders } from "@/lib/clientSession";

type Balita = {
    id: string;
    nik: string;
    nama: string;
};

type Props = {
    balita: Balita;
    onClose: () => void;
};

type Survey = {
    id: string;
    tanggal_survey: string;
    risk_score: number;
    risk_category: string;
    latitude?: number;
    longitude?: number;
    foto_rumah_url?: string;
    catatan?: string;
    [key: string]: any;
};

const SECTIONS = [
    { id: 2, title: "Riwayat Kelahiran & Ibu", icon: Baby, color: "#ec4899" },
    { id: 3, title: "ASI & MP-ASI", icon: Utensils, color: "#f97316" },
    { id: 4, title: "Penyakit Infeksi", icon: Pill, color: "#ef4444" },
    { id: 5, title: "WASH & Ekonomi", icon: Home, color: "#10b981" },
    { id: 6, title: "Pola Pengasuhan", icon: Users, color: "#8b5cf6" },
];

const QUESTIONS: Record<string, string> = {
    q2_1_lbw: "Berat lahir <2,5 kg?",
    q2_2_hf_delivery: "Lahir di fasilitas kesehatan?",
    q2_3_anc4: "Kunjungan ANC ≥4 kali?",
    q2_4_mat_height_low: "Tinggi ibu <150 cm?",
    q2_5_mat_underweight: "Ibu kurus (IMT <18,5)?",
    q2_6_low_mat_edu: "Pendidikan ibu SMP ke bawah?",
    q3_1_ebf: "ASI eksklusif 0-6 bulan?",
    q3_2_cf_6m: "MP-ASI tepat 6 bulan?",
    q3_3_current_bf: "Masih disusui?",
    q3_4_min_meal_freq: "Frekuensi makan minimal?",
    q3_5_mdd: "Keragaman pangan ≥4 kelompok?",
    q4_1_diarrhea: "Diare 2 minggu terakhir?",
    q4_1a_recurrent_diarrhea: "Diare berulang?",
    q4_2_ari: "ISPA?",
    q4_3_fever: "Demam ≥2 hari?",
    q4_4_helminth: "Cacingan 6 bulan terakhir?",
    q5_1_safe_water: "Air minum layak?",
    q5_2_water_treat: "Air diolah?",
    q5_3_improved_san: "Jamban sehat?",
    q5_4_hwws: "Fasilitas cuci tangan?",
    q5_5_overcrowd: "Anggota RT >5 orang?",
    q5_6_multi_u5: "≥2 balita dalam rumah?",
    q5_7_low_ses: "Status ekonomi rendah?",
    q5_8_female_hhh: "KRT perempuan?",
    q6_1_non_mat_care: "Ibu bukan pengasuh utama?",
    q6_2_child_not_priority: "Anak bukan prioritas makan?",
};

export default function ViewSurveyModal({ balita, onClose }: Props) {
    const [loading, setLoading] = useState(true);
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);

    useEffect(() => {
        loadSurveys();
    }, []);

    const loadSurveys = async () => {
        try {
            const headers = await getAuthHeaders();
            const res = await fetch(`/api/determinan/survey?balita_id=${balita.id}`, { headers });
            if (res.ok) {
                const data = await res.json();
                setSurveys(data.items || []);
                if (data.items?.length > 0) {
                    setSelectedSurvey(data.items[0]);
                }
            }
        } catch (err) {
            console.error("Error loading surveys:", err);
        } finally {
            setLoading(false);
        }
    };

    const getRiskBadge = (category: string) => {
        const colors: Record<string, { bg: string; text: string; icon: any }> = {
            'Rendah': { bg: '#dcfce7', text: '#15803d', icon: CheckCircle },
            'Sedang': { bg: '#fef9c3', text: '#a16207', icon: AlertTriangle },
            'Tinggi': { bg: '#fee2e2', text: '#dc2626', icon: AlertTriangle },
        };
        const style = colors[category] || colors['Rendah'];
        const Icon = style.icon;
        return (
            <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 700,
                background: style.bg,
                color: style.text,
            }}>
                <Icon size={16} />
                {category}
            </span>
        );
    };

    const getAnswerBadge = (answer: string, isRisk: boolean) => {
        const isYes = answer === 'Ya';
        const color = isRisk
            ? (isYes ? '#dc2626' : '#22c55e')
            : (isYes ? '#22c55e' : '#dc2626');
        const Icon = (isRisk ? !isYes : isYes) ? CheckCircle : XCircle;

        return (
            <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 8px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                background: `${color}15`,
                color: color,
            }}>
                <Icon size={12} />
                {answer}
            </span>
        );
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 100,
        }}>
            <div style={{
                background: 'white',
                borderRadius: 20,
                width: '100%',
                maxWidth: 800,
                maxHeight: '90vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <div>
                        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                            Detail Survey Determinan
                        </h2>
                        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                            {balita.nama} ({balita.nik})
                        </p>
                    </div>
                    <button onClick={onClose} style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        border: '1px solid #e2e8f0',
                        background: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <X size={18} color="#64748b" />
                    </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 40 }}>
                            <div style={{
                                width: 32,
                                height: 32,
                                border: '3px solid #e2e8f0',
                                borderTopColor: '#8b5cf6',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                margin: '0 auto',
                            }} />
                        </div>
                    ) : surveys.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                            Belum ada survey
                        </div>
                    ) : selectedSurvey && (
                        <>
                            {/* Survey Selector */}
                            {surveys.length > 1 && (
                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, display: 'block' }}>
                                        Pilih Survey:
                                    </label>
                                    <select
                                        value={selectedSurvey.id}
                                        onChange={(e) => setSelectedSurvey(surveys.find(s => s.id === e.target.value) || null)}
                                        style={{
                                            padding: '10px 12px',
                                            borderRadius: 10,
                                            border: '1px solid #e2e8f0',
                                            fontSize: 14,
                                        }}
                                    >
                                        {surveys.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {new Date(s.tanggal_survey).toLocaleDateString('id-ID')} - {s.risk_category}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Summary Card */}
                            <div style={{
                                background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                                borderRadius: 16,
                                padding: 20,
                                marginBottom: 24,
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                gap: 16,
                            }}>
                                <div>
                                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                                        <Calendar size={14} style={{ display: 'inline', marginRight: 4 }} />
                                        Tanggal Survey
                                    </div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                                        {new Date(selectedSurvey.tanggal_survey).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Risk Score</div>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>
                                        {selectedSurvey.risk_score}/26
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Kategori Risiko</div>
                                    {getRiskBadge(selectedSurvey.risk_category)}
                                </div>
                                {selectedSurvey.latitude && selectedSurvey.longitude && (
                                    <div>
                                        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                                            <MapPin size={14} style={{ display: 'inline', marginRight: 4 }} />
                                            Koordinat
                                        </div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                                            {selectedSurvey.latitude.toFixed(6)}, {selectedSurvey.longitude.toFixed(6)}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Answers by Section */}
                            {SECTIONS.map(section => {
                                const sectionQuestions = Object.entries(QUESTIONS).filter(([key]) =>
                                    key.startsWith(`q${section.id}_`)
                                );
                                const Icon = section.icon;

                                return (
                                    <div key={section.id} style={{ marginBottom: 20 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                            <div style={{
                                                width: 32,
                                                height: 32,
                                                background: section.color,
                                                borderRadius: 8,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}>
                                                <Icon size={16} color="white" />
                                            </div>
                                            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                                                {section.title}
                                            </h4>
                                        </div>
                                        <div style={{
                                            background: '#fafafa',
                                            borderRadius: 12,
                                            overflow: 'hidden',
                                            border: '1px solid #e2e8f0',
                                        }}>
                                            {sectionQuestions.map(([key, label], idx) => {
                                                const answer = selectedSurvey[key];
                                                // Determine if this is a "risk if yes" question
                                                const isRiskIfYes = !['q2_2_hf_delivery', 'q2_3_anc4', 'q3_1_ebf', 'q3_2_cf_6m', 'q3_3_current_bf', 'q3_4_min_meal_freq', 'q3_5_mdd', 'q5_1_safe_water', 'q5_2_water_treat', 'q5_3_improved_san', 'q5_4_hwws'].includes(key);

                                                return (
                                                    <div key={key} style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '10px 14px',
                                                        borderBottom: idx < sectionQuestions.length - 1 ? '1px solid #e2e8f0' : 'none',
                                                        background: idx % 2 === 0 ? 'white' : '#fafafa',
                                                    }}>
                                                        <span style={{ fontSize: 13, color: '#475569' }}>{label}</span>
                                                        {answer ? getAnswerBadge(answer, isRiskIfYes) : (
                                                            <span style={{ fontSize: 12, color: '#94a3b8' }}>-</span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    background: '#f8fafc',
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 24px',
                            borderRadius: 10,
                            border: '1px solid #e2e8f0',
                            background: 'white',
                            color: '#475569',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        Tutup
                    </button>
                </div>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
