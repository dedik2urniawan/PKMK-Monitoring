"use client";

import React, { useState, useMemo } from "react";
import { X, Dna, Save, AlertTriangle, CheckCircle, Info, TrendingUp } from "lucide-react";
import { getAuthHeaders } from "@/lib/clientSession";
import { toast } from "sonner";
import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

type Props = {
  balita: any;
  onClose: () => void;
  onSaveSuccess?: () => void;
};

export function calculateTPG(gender: 'MALE' | 'FEMALE', fatherCm: number, motherCm: number) {
  const VARIATION_SD = 8.5; // IDAI / Tanner standard variation +-8.5 cm
  let targetHeight: number;

  if (gender === 'MALE') {
    targetHeight = (fatherCm + (motherCm + 13)) / 2;
  } else {
    targetHeight = ((fatherCm - 13) + motherCm) / 2;
  }

  const roundedTarget = Math.round(targetHeight * 10) / 10;
  const minRange = Math.round((targetHeight - VARIATION_SD) * 10) / 10;
  const maxRange = Math.round((targetHeight + VARIATION_SD) * 10) / 10;

  return {
    targetHeightCm: roundedTarget,
    minRangeCm: minRange,
    maxRangeCm: maxRange,
    deviationRangeCm: VARIATION_SD,
  };
}

export default function TinggiPotensiGenetikModal({ balita, onClose, onSaveSuccess }: Props) {
  const [fatherHeight, setFatherHeight] = useState<string>(
    balita?.tb_ayah_cm != null ? String(balita.tb_ayah_cm) : "168"
  );
  const [motherHeight, setMotherHeight] = useState<string>(
    balita?.tb_ibu_cm != null ? String(balita.tb_ibu_cm) : "155"
  );
  const [isAdopted, setIsAdopted] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  const gender: 'MALE' | 'FEMALE' = (balita?.jk === 'P' || balita?.jk === 'PEREMPUAN') ? 'FEMALE' : 'MALE';
  const fatherCm = Number(fatherHeight) || 0;
  const motherCm = Number(motherHeight) || 0;

  const isValidInput = fatherCm >= 120 && fatherCm <= 220 && motherCm >= 110 && motherCm <= 210;

  // Calculate TPG
  const tpgResult = useMemo(() => {
    if (!isValidInput) return null;
    return calculateTPG(gender, fatherCm, motherCm);
  }, [gender, fatherCm, motherCm, isValidInput]);

  // Extract latest height measurement & Z-score from balita history if available
  const latestAntro = useMemo(() => {
    if (!balita?.kohort || balita.kohort.length === 0) return null;
    let latest: any = null;
    for (const k of balita.kohort) {
      if (k.monitoring_antropometri && k.monitoring_antropometri.length > 0) {
        for (const a of k.monitoring_antropometri) {
          if (!latest || new Date(a.tanggal || a.created_at).getTime() > new Date(latest.tanggal || latest.created_at).getTime()) {
            latest = a;
          }
        }
      }
    }
    return latest;
  }, [balita]);

  const currentHeight = latestAntro?.tb_corr_cm || latestAntro?.tb_cm || balita?.tb_lahir_cm || 85;
  const currentZScore = latestAntro?.zs_tbu != null ? Number(latestAntro.zs_tbu) : -1.5;

  // Predicted Adult Height (PAH) based on Z-score channel tracking to age 18
  const predictedAdultHeight = useMemo(() => {
    if (!tpgResult) return 165;
    // Mean adult height reference (WHO/CDC at 18yo): Boy ~176.5cm (SD 6.8), Girl ~163.5cm (SD 6.2)
    const adultMeanRef = gender === 'MALE' ? 176.5 : 163.5;
    const adultSdRef = gender === 'MALE' ? 6.8 : 6.2;
    const pah = adultMeanRef + (currentZScore * adultSdRef);
    return Math.round(pah * 10) / 10;
  }, [gender, currentZScore, tpgResult]);

  // Assessment Category
  const assessment = useMemo(() => {
    if (!tpgResult) return null;
    const { minRangeCm, maxRangeCm, targetHeightCm } = tpgResult;

    if (predictedAdultHeight >= minRangeCm && predictedAdultHeight <= maxRangeCm) {
      return {
        category: 'ON_TRACK',
        label: 'Sesuai Potensi Genetik (On-Track)',
        color: '#10b981',
        bg: '#ecfdf5',
        border: '#a7f3d0',
        notes: `Proyeksi tinggi dewasa (${predictedAdultHeight} cm) berada dalam rentang TPG keluarga (${minRangeCm} cm - ${maxRangeCm} cm). Pertumbuhan linier seimbang.`,
      };
    } else if (predictedAdultHeight < minRangeCm) {
      return {
        category: 'BELOW_GENETIC_POTENTIAL',
        label: 'Di Bawah Potensi Genetik (Growth Faltering)',
        color: '#ef4444',
        bg: '#fef2f2',
        border: '#fecaca',
        notes: `Proyeksi tinggi dewasa (${predictedAdultHeight} cm) di bawah rentang potensi genetik (${minRangeCm} cm). Mengindikasikan stunting nutrisional kronis, penyakit sistemik, atau gangguan endokrin.`,
      };
    } else {
      return {
        category: 'ABOVE_GENETIC_POTENTIAL',
        label: 'Di Atas Potensi Genetik (Accelerated Growth)',
        color: '#3b82f6',
        bg: '#eff6ff',
        border: '#bfdbfe',
        notes: `Proyeksi tinggi dewasa (${predictedAdultHeight} cm) melampaui potensi genetik orang tua (${maxRangeCm} cm). Evaluasi kemungkinan variasi nutrisi optimal atau pubertas prekoks.`,
      };
    }
  }, [tpgResult, predictedAdultHeight]);

  // Generate chart data trajectory from current age to 18yo
  const chartData = useMemo(() => {
    if (!tpgResult) return [];
    const points = [];
    const targetMean = tpgResult.targetHeightCm;
    const targetMin = tpgResult.minRangeCm;
    const targetMax = tpgResult.maxRangeCm;

    // Standard WHO/CDC median curve reference approximation (Boys vs Girls)
    const baseP50 = gender === 'MALE' 
      ? [50, 75.7, 87.1, 96.1, 103.3, 110, 116, 122, 128, 133.5, 138.5, 144, 150, 158, 166, 172, 175, 176.5]
      : [49.1, 74, 85.7, 95.1, 102.7, 109.4, 115.5, 121.5, 127.5, 133, 139, 145, 152, 157, 160, 162, 163, 163.5];

    for (let age = 0; age <= 18; age += 2) {
      const idx = Math.min(age, baseP50.length - 1);
      const p50 = baseP50[idx];
      const trajHeight = Math.round((p50 + (currentZScore * 6.5)) * 10) / 10;
      
      points.push({
        age: `${age} Thn`,
        'Tinggi Standar P50': p50,
        'Lintasan Anak': age <= 4 ? (age === 4 ? currentHeight : undefined) : trajHeight,
        'Proyeksi Anak': age >= 4 ? trajHeight : undefined,
        'TPG Max': age >= 16 ? targetMax : undefined,
        'TPG Mean': age >= 16 ? targetMean : undefined,
        'TPG Min': age >= 16 ? targetMin : undefined,
      });
    }
    return points;
  }, [gender, currentHeight, currentZScore, tpgResult]);

  async function handleSaveParentalHeights() {
    if (!isValidInput) {
      toast.error("Silakan masukkan tinggi badan orang tua yang valid (Ayah: 120-220 cm, Ibu: 110-210 cm)");
      return;
    }
    setSaving(true);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch("/api/balita/update", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        credentials: "include",
        body: JSON.stringify({
          id: balita.id,
          nik: balita.nik,
          tb_ayah_cm: fatherCm,
          tb_ibu_cm: motherCm,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        toast.error("Gagal menyimpan data orang tua: " + err);
        return;
      }

      toast.success("Data Tinggi Orang Tua & TPG berhasil diperbarui!");
      if (onSaveSuccess) onSaveSuccess();
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 px-6 py-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center font-bold">
              <Dna className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Analisis Tinggi Potensi Genetik (TPG)
                <span className="text-xs bg-emerald-400/30 text-emerald-100 border border-emerald-300/30 px-2 py-0.5 rounded-full font-medium">
                  IDAI & Tanner
                </span>
              </h2>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                {balita?.nama_balita} ({gender === 'MALE' ? 'Laki-laki' : 'Perempuan'}) • NIK: {balita?.nik || '-'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-sm">
          
          {/* Section 1: Input Data Orang Tua */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <span>👨‍👩‍👧 Data Tinggi Biologis Orang Tua</span>
              </h3>
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAdopted}
                  onChange={(e) => setIsAdopted(e.target.checked)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span>Anak Adopsi / Orang Tua Asuh</span>
              </label>
            </div>

            {isAdopted ? (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-xs flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Disclaimer Anak Adopsi:</strong> Perhitungan TPG memerlukan data tinggi biologis kedua orang tua kandung. Untuk anak adopsi, analisis TPG genetika dinonaktifkan dan disarankan menggunakan kurva persentil populasi WHO (Z-score TB/U).
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Tinggi Badan Ayah Kandung (cm) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={120}
                      max={220}
                      step={0.1}
                      value={fatherHeight}
                      onChange={(e) => setFatherHeight(e.target.value)}
                      placeholder="Contoh: 170"
                      className="w-full h-11 px-3.5 pr-12 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                    />
                    <span className="absolute right-3.5 top-3 text-xs text-slate-400 font-medium">cm</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Rentang valid: 120 – 220 cm</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Tinggi Badan Ibu Kandung (cm) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={110}
                      max={210}
                      step={0.1}
                      value={motherHeight}
                      onChange={(e) => setMotherHeight(e.target.value)}
                      placeholder="Contoh: 156"
                      className="w-full h-11 px-3.5 pr-12 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                    />
                    <span className="absolute right-3.5 top-3 text-xs text-slate-400 font-medium">cm</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Rentang valid: 110 – 210 cm</p>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Results & Clinical Assessment */}
          {tpgResult && !isAdopted && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Min Target */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                  <span className="text-xs uppercase font-bold text-slate-500">TPG Minimum (-8.5 cm)</span>
                  <div className="text-2xl font-extrabold text-slate-700 mt-1">
                    {tpgResult.minRangeCm} <span className="text-xs text-slate-400 font-normal">cm</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Batas Bawah Genetik (P3)</span>
                </div>

                {/* Target Height Mean */}
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-center">
                  <span className="text-xs uppercase font-bold text-teal-700">Target Height (Rata-rata)</span>
                  <div className="text-3xl font-black text-teal-800 mt-1">
                    {tpgResult.targetHeightCm} <span className="text-sm text-teal-600 font-normal">cm</span>
                  </div>
                  <span className="text-[11px] text-teal-600 font-medium">Estimasi Potensi Dewasa</span>
                </div>

                {/* Max Target */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                  <span className="text-xs uppercase font-bold text-slate-500">TPG Maksimum (+8.5 cm)</span>
                  <div className="text-2xl font-extrabold text-slate-700 mt-1">
                    {tpgResult.maxRangeCm} <span className="text-xs text-slate-400 font-normal">cm</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Batas Atas Genetik (P97)</span>
                </div>
              </div>

              {/* Clinical Assessment Card */}
              {assessment && (
                <div
                  className="rounded-xl p-5 border"
                  style={{ backgroundColor: assessment.bg, borderColor: assessment.border }}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {assessment.category === 'ON_TRACK' && <CheckCircle className="w-6 h-6 text-emerald-600" />}
                      {assessment.category === 'BELOW_GENETIC_POTENTIAL' && <AlertTriangle className="w-6 h-6 text-red-600" />}
                      {assessment.category === 'ABOVE_GENETIC_POTENTIAL' && <TrendingUp className="w-6 h-6 text-blue-600" />}
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-base" style={{ color: assessment.color }}>
                        {assessment.label}
                      </h4>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {assessment.notes}
                      </p>
                      <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 mt-2 pt-2 border-t border-slate-200/60">
                        <span>Proyeksi Usia 18 Thn (PAH): <strong>{predictedAdultHeight} cm</strong></span>
                        <span>•</span>
                        <span>Deviasi Target: <strong className={predictedAdultHeight < tpgResult.targetHeightCm ? 'text-red-600' : 'text-emerald-600'}>
                          {(predictedAdultHeight - tpgResult.targetHeightCm).toFixed(1)} cm
                        </strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 3: Visual Chart Growth Trajectory & TPG Target Band */}
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-teal-600" />
                      Visualisasi Kurva Pertumbuhan & TPG Target Band (Usia 0–18 Tahun)
                    </h4>
                    <p className="text-xs text-slate-400">
                      Ekstrapolasi lintasan pertumbuhan anak menuju rentang target genetik orang tua saat usia dewasa.
                    </p>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="age" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis domain={[40, 190]} tick={{ fontSize: 11, fill: '#64748b' }} unit="cm" />
                      <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px', borderColor: '#cbd5e1' }} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                      
                      <Line type="monotone" dataKey="Tinggi Standar P50" stroke="#cbd5e1" strokeDasharray="4 4" dot={false} strokeWidth={1.5} />
                      <Line type="monotone" dataKey="Proyeksi Anak" stroke="#3b82f6" strokeDasharray="3 3" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="Lintasan Anak" stroke="#059669" strokeWidth={3} dot={{ r: 4, fill: '#059669' }} />
                      
                      <Line type="stepAfter" dataKey="TPG Max" stroke="#f59e0b" strokeDasharray="2 2" strokeWidth={1.5} dot={false} />
                      <Line type="stepAfter" dataKey="TPG Mean" stroke="#d97706" strokeWidth={2} dot={{ r: 4, fill: '#d97706' }} />
                      <Line type="stepAfter" dataKey="TPG Min" stroke="#f59e0b" strokeDasharray="2 2" strokeWidth={1.5} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Section 4: Clinical Differentiation Decision Matrix */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4 text-cyan-600" />
                  Matriks Diferensiasi Klinis: Perawakan Pendek vs Stunting vs CDGP
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-800 block mb-1">Familial Short Stature</span>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      PAH berada dalam rentang TPG. Laju pertumbuhan normal, Bone Age sesuai usia kronologis. Merupakan variasi normal tinggi keluarga.
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-800 block mb-1">Constitutional Delay (CDGP)</span>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      PAH dalam rentang TPG. Laju pertumbuhan normal tetapi maturasi tulang (Bone Age) terlambat. Pubertas terlambat.
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-800 block mb-1 text-red-600">Nutritional Stunting / Patologis</span>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      PAH jauh di bawah TPG Min. Terjadi gagal tumbuh (growth faltering) akibat kurang gizi kronis, infeksi berulang, atau endokrinopati.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-slate-300 font-semibold text-slate-600 text-sm hover:bg-slate-100 transition"
          >
            Tutup
          </button>
          {!isAdopted && (
            <button
              onClick={handleSaveParentalHeights}
              disabled={saving || !isValidInput}
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm shadow-md shadow-emerald-500/20 hover:from-emerald-700 hover:to-teal-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? "Memproses..." : "Simpan Data TPG"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
