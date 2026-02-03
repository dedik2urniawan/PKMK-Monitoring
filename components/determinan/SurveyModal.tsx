"use client";
import React, { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Save, Baby, Heart, Utensils, Pill, Home, Users, MapPin, Camera, CheckCircle } from "lucide-react";
import { getAuthHeaders } from "@/lib/clientSession";
import { toast } from "sonner";

type Balita = {
    id: string;
    nik: string;
    nama: string;
};

type Props = {
    balita: Balita;
    surveyId: string | null;
    onClose: () => void;
    onSuccess: () => void;
};

const SECTIONS = [
    { id: 1, title: "Info Lokasi", icon: MapPin, color: "#3b82f6" },
    { id: 2, title: "Riwayat Kelahiran & Ibu", icon: Baby, color: "#ec4899" },
    { id: 3, title: "ASI & MP-ASI", icon: Utensils, color: "#f97316" },
    { id: 4, title: "Penyakit Infeksi", icon: Pill, color: "#ef4444" },
    { id: 5, title: "WASH & Ekonomi", icon: Home, color: "#10b981" },
    { id: 6, title: "Pola Pengasuhan", icon: Users, color: "#8b5cf6" },
];

const QUESTIONS: Record<number, { key: string; label: string; options: string[] }[]> = {
    2: [
        { key: "q2_1_lbw", label: "Apakah berat lahir anak kurang dari 2,5 kg?", options: ["Ya", "Tidak", "Tidak tahu"] },
        { key: "q2_2_hf_delivery", label: "Apakah anak lahir di fasilitas kesehatan (RS, Puskesmas, klinik, bidan)?", options: ["Ya", "Tidak"] },
        { key: "q2_3_anc4", label: "Selama kehamilan, apakah ibu melakukan kunjungan ANC ≥4 kali?", options: ["Ya", "Tidak", "Tidak tahu"] },
        { key: "q2_4_mat_height_low", label: "Apakah tinggi badan ibu <150 cm?", options: ["Ya", "Tidak", "Tidak diukur"] },
        { key: "q2_5_mat_underweight", label: "Apakah ibu kurus (IMT <18,5) sebelum atau pada awal kehamilan?", options: ["Ya", "Tidak", "Tidak tahu"] },
        { key: "q2_6_low_mat_edu", label: "Apakah pendidikan terakhir ibu SMP ke bawah?", options: ["Ya", "Tidak"] },
    ],
    3: [
        { key: "q3_1_ebf", label: "Apakah anak hanya mendapat ASI selama usia 0–6 bulan (tanpa makanan/minuman lain)?", options: ["Ya", "Tidak"] },
        { key: "q3_2_cf_6m", label: "Apakah MP-ASI mulai diberikan tepat usia 6 bulan?", options: ["Ya", "Tidak"] },
        { key: "q3_3_current_bf", label: "Apakah anak masih disusui saat ini?", options: ["Ya", "Tidak"] },
        { key: "q3_4_min_meal_freq", label: "Apakah anak makan minimal sesuai usianya dalam 24 jam terakhir?", options: ["Ya", "Tidak"] },
        { key: "q3_5_mdd", label: "Dalam 24 jam terakhir, apakah anak mengonsumsi ≥4 kelompok pangan berbeda?", options: ["Ya", "Tidak"] },
    ],
    4: [
        { key: "q4_1_diarrhea", label: "Apakah anak mengalami diare (BAB cair ≥3x/hari) dalam 2 minggu terakhir?", options: ["Ya", "Tidak"] },
        { key: "q4_1a_recurrent_diarrhea", label: "Apakah diare terjadi lebih dari 1 episode?", options: ["Ya", "Tidak"] },
        { key: "q4_2_ari", label: "Apakah anak mengalami batuk/pilek disertai napas cepat atau sesak?", options: ["Ya", "Tidak"] },
        { key: "q4_3_fever", label: "Apakah anak mengalami demam ≥2 hari?", options: ["Ya", "Tidak"] },
        { key: "q4_4_helminth", label: "Apakah anak pernah cacingan dalam 6 bulan terakhir?", options: ["Ya", "Tidak"] },
    ],
    5: [
        { key: "q5_1_safe_water", label: "Apakah sumber air minum keluarga layak dan terlindungi?", options: ["Ya", "Tidak"] },
        { key: "q5_2_water_treat", label: "Apakah air minum diolah (direbus/disaring) sebelum diminum?", options: ["Ya", "Tidak"] },
        { key: "q5_3_improved_san", label: "Apakah keluarga memiliki jamban sehat dengan septic tank?", options: ["Ya", "Tidak"] },
        { key: "q5_4_hwws", label: "Apakah tersedia fasilitas cuci tangan dengan air & sabun dekat jamban?", options: ["Ya", "Tidak"] },
        { key: "q5_5_overcrowd", label: "Apakah jumlah anggota rumah tangga lebih dari 5 orang?", options: ["Ya", "Tidak"] },
        { key: "q5_6_multi_u5", label: "Apakah terdapat ≥2 anak balita dalam satu rumah?", options: ["Ya", "Tidak"] },
        { key: "q5_7_low_ses", label: "Apakah keluarga tidak memiliki aset utama (motor/TV/lantai permanen)?", options: ["Ya", "Tidak"] },
        { key: "q5_8_female_hhh", label: "Apakah rumah tangga dipimpin oleh perempuan (single parent)?", options: ["Ya", "Tidak"] },
    ],
    6: [
        { key: "q6_1_non_mat_care", label: "Apakah ibu bukan pengasuh utama anak pada siang hari?", options: ["Ya", "Tidak"] },
        { key: "q6_2_child_not_priority", label: "Apakah anak balita tidak menjadi prioritas utama saat pembagian makanan keluarga?", options: ["Ya", "Tidak"] },
    ],
};

export default function SurveyModal({ balita, surveyId, onClose, onSuccess }: Props) {
    const [currentSection, setCurrentSection] = useState(1);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState<Record<string, string>>({
        tanggal_survey: new Date().toISOString().split('T')[0],
        latitude: "",
        longitude: "",
        foto_rumah_url: "",
        catatan: "",
    });

    useEffect(() => {
        if (surveyId) {
            loadSurvey();
        }
        // Try to get current location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setFormData(prev => ({
                        ...prev,
                        latitude: position.coords.latitude.toString(),
                        longitude: position.coords.longitude.toString(),
                    }));
                },
                (error) => console.log("Geolocation error:", error)
            );
        }
    }, [surveyId]);

    const loadSurvey = async () => {
        setLoading(true);
        try {
            const headers = await getAuthHeaders();
            const res = await fetch(`/api/determinan/survey/${surveyId}`, { headers });
            if (res.ok) {
                const data = await res.json();
                setFormData(data.item);
            }
        } catch (err) {
            console.error("Error loading survey:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleNext = () => {
        if (currentSection < 6) {
            setCurrentSection(currentSection + 1);
        }
    };

    const handlePrev = () => {
        if (currentSection > 1) {
            setCurrentSection(currentSection - 1);
        }
    };

    const handleSubmit = async () => {
        setSaving(true);
        try {
            const headers = await getAuthHeaders();
            headers['Content-Type'] = 'application/json';

            const payload = {
                ...formData,
                balita_id: balita.id,
                latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                longitude: formData.longitude ? parseFloat(formData.longitude) : null,
            };

            const url = surveyId
                ? `/api/determinan/survey/${surveyId}`
                : '/api/determinan/survey';

            const res = await fetch(url, {
                method: surveyId ? 'PUT' : 'POST',
                headers,
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                toast.success(surveyId ? "Survey berhasil diupdate!" : "Survey berhasil disimpan!");
                onSuccess();
            } else {
                const err = await res.json();
                toast.error(err.error || "Gagal menyimpan survey");
            }
        } catch (err) {
            console.error("Error saving survey:", err);
            toast.error("Gagal menyimpan survey");
        } finally {
            setSaving(false);
        }
    };

    const currentSectionData = SECTIONS.find(s => s.id === currentSection)!;
    const CurrentIcon = currentSectionData.icon;

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
                maxWidth: 700,
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 40,
                            height: 40,
                            background: `linear-gradient(135deg, ${currentSectionData.color}, ${currentSectionData.color}cc)`,
                            borderRadius: 10,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <CurrentIcon color="white" size={20} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                                Survey Determinan Stunting
                            </h2>
                            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                                {balita.nama} ({balita.nik})
                            </p>
                        </div>
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

                {/* Progress Steps */}
                <div style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
                        {SECTIONS.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setCurrentSection(section.id)}
                                style={{
                                    flex: '0 0 auto',
                                    padding: '8px 14px',
                                    borderRadius: 20,
                                    border: 'none',
                                    background: currentSection === section.id
                                        ? section.color
                                        : 'white',
                                    color: currentSection === section.id ? 'white' : '#64748b',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    boxShadow: currentSection === section.id
                                        ? `0 2px 8px ${section.color}40`
                                        : '0 1px 2px rgba(0,0,0,0.05)',
                                }}
                            >
                                {React.createElement(section.icon, { size: 14 })}
                                {section.title}
                            </button>
                        ))}
                    </div>
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
                    ) : currentSection === 1 ? (
                        /* Section 1: Location Info */
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>
                                <MapPin size={18} style={{ display: 'inline', marginRight: 8, color: '#3b82f6' }} />
                                Informasi Lokasi & Tanggal
                            </h3>
                            <div style={{ display: 'grid', gap: 16 }}>
                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6, display: 'block' }}>
                                        Tanggal Survey *
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.tanggal_survey}
                                        onChange={(e) => handleChange('tanggal_survey', e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            borderRadius: 10,
                                            border: '1px solid #e2e8f0',
                                            fontSize: 14,
                                        }}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div>
                                        <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6, display: 'block' }}>
                                            Latitude
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.latitude}
                                            onChange={(e) => handleChange('latitude', e.target.value)}
                                            placeholder="Otomatis dari GPS"
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                borderRadius: 10,
                                                border: '1px solid #e2e8f0',
                                                fontSize: 14,
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6, display: 'block' }}>
                                            Longitude
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.longitude}
                                            onChange={(e) => handleChange('longitude', e.target.value)}
                                            placeholder="Otomatis dari GPS"
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                borderRadius: 10,
                                                border: '1px solid #e2e8f0',
                                                fontSize: 14,
                                            }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6, display: 'block' }}>
                                        <Camera size={14} style={{ display: 'inline', marginRight: 4 }} />
                                        URL Foto Rumah
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.foto_rumah_url}
                                        onChange={(e) => handleChange('foto_rumah_url', e.target.value)}
                                        placeholder="Paste URL foto rumah..."
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            borderRadius: 10,
                                            border: '1px solid #e2e8f0',
                                            fontSize: 14,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Question Sections */
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>
                                Section {currentSection}: {currentSectionData.title}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                {QUESTIONS[currentSection]?.map((q, idx) => (
                                    <div key={q.key} style={{
                                        background: '#f8fafc',
                                        borderRadius: 12,
                                        padding: 16,
                                        border: formData[q.key] ? `2px solid ${currentSectionData.color}40` : '1px solid #e2e8f0',
                                    }}>
                                        <p style={{ fontSize: 14, fontWeight: 500, color: '#0f172a', marginBottom: 12 }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                width: 24,
                                                height: 24,
                                                background: currentSectionData.color,
                                                color: 'white',
                                                borderRadius: 6,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 12,
                                                fontWeight: 700,
                                                marginRight: 10,
                                            }}>
                                                {idx + 1}
                                            </span>
                                            {q.label}
                                        </p>
                                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                            {q.options.map(opt => (
                                                <button
                                                    key={opt}
                                                    onClick={() => handleChange(q.key, opt)}
                                                    style={{
                                                        padding: '8px 16px',
                                                        borderRadius: 8,
                                                        border: formData[q.key] === opt
                                                            ? `2px solid ${currentSectionData.color}`
                                                            : '1px solid #d1d5db',
                                                        background: formData[q.key] === opt ? `${currentSectionData.color}15` : 'white',
                                                        color: formData[q.key] === opt ? currentSectionData.color : '#475569',
                                                        fontSize: 13,
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 6,
                                                    }}
                                                >
                                                    {formData[q.key] === opt && <CheckCircle size={14} />}
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    background: '#f8fafc',
                }}>
                    <button
                        onClick={handlePrev}
                        disabled={currentSection === 1}
                        style={{
                            padding: '10px 20px',
                            borderRadius: 10,
                            border: '1px solid #e2e8f0',
                            background: 'white',
                            color: currentSection === 1 ? '#cbd5e1' : '#475569',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: currentSection === 1 ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        <ChevronLeft size={18} />
                        Sebelumnya
                    </button>

                    {currentSection < 6 ? (
                        <button
                            onClick={handleNext}
                            style={{
                                padding: '10px 20px',
                                borderRadius: 10,
                                border: 'none',
                                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                                color: 'white',
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
                            }}
                        >
                            Selanjutnya
                            <ChevronRight size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            style={{
                                padding: '10px 24px',
                                borderRadius: 10,
                                border: 'none',
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                color: 'white',
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: saving ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                            }}
                        >
                            <Save size={18} />
                            {saving ? "Menyimpan..." : "Simpan Survey"}
                        </button>
                    )}
                </div>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
