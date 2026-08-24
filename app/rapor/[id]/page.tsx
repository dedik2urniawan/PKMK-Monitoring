"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  Baby, Heart, ShieldCheck, Calendar, MapPin, Building2, TrendingUp,
  Activity, Award, CheckCircle2, AlertTriangle, Sparkles, Printer,
  BookOpen, ChevronRight, Lock, Unlock, Phone, Utensils, Ruler,
  Brain, FileText, ArrowUpRight, Scale, Info
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, LineChart, Line, Legend, ComposedChart, ReferenceLine
} from "recharts";

export default function RaporBalitaPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const balitaId = params?.id as string;

  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Security Verification State
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [inputPin, setInputPin] = useState<string>("");
  const [pinError, setPinError] = useState<string | null>(null);

  useEffect(() => {
    if (!balitaId) return;

    const fetchRaporData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/rapor/${balitaId}`);
        if (!res.ok) {
          throw new Error("Data rapor balita tidak ditemukan");
        }
        const json = await res.json();
        setData(json);

        // Check if previously verified in sessionStorage
        const savedSession = sessionStorage.getItem(`rapor_auth_${balitaId}`);
        if (savedSession === "verified") {
          setIsUnlocked(true);
        }
      } catch (err: any) {
        setError(err.message || "Gagal memuat rapor");
      } finally {
        setLoading(false);
      }
    };

    fetchRaporData();
  }, [balitaId]);

  const balita = data?.balita;
  const latestAntro = data?.latestAntro;
  const initialAntro = data?.initialAntro;
  const trajectory = data?.growthTrajectory || [];
  const compliance = data?.complianceTimeline || [];
  const distribution = data?.distributionHistory || [];
  const sdidtk = data?.sdidtkAssessment;

  // Age calculation in months and days
  const ageString = useMemo(() => {
    if (!balita?.tgl_lahir) return "-";
    const birth = new Date(balita.tgl_lahir);
    const now = new Date();
    const diffMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    const days = Math.floor((now.getTime() - new Date(now.getFullYear(), now.getMonth(), birth.getDate()).getTime()) / (1000 * 60 * 60 * 24));
    return `${Math.max(0, diffMonths)} Bulan ${Math.max(0, days % 30)} Hari`;
  }, [balita]);

  // Handle PIN verification
  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!balita?.tgl_lahir) return;

    const cleanInput = inputPin.replace(/[^0-9]/g, "");
    const dob = balita.tgl_lahir.split("-"); // YYYY-MM-DD
    const ddmmyyyy = `${dob[2]}${dob[1]}${dob[0]}`; // DDMMYYYY
    const yyyymmdd = `${dob[0]}${dob[1]}${dob[2]}`; // YYYYMMDD
    const last4Nik = balita.nik ? balita.nik.slice(-4) : "";

    if (cleanInput === ddmmyyyy || cleanInput === yyyymmdd || (last4Nik && cleanInput === last4Nik)) {
      setIsUnlocked(true);
      sessionStorage.setItem(`rapor_auth_${balitaId}`, "verified");
      setPinError(null);
    } else {
      setPinError("Kunci akses salah. Masukkan Tanggal Lahir (DDMMYYYY) anak.");
    }
  };

  // Generate synthetic KMS chart data with WHO standard reference
  const chartData = useMemo(() => {
    if (!trajectory || trajectory.length === 0) {
      if (!latestAntro) return [];
      return [
        {
          minggu: "Awal",
          bb_balita: latestAntro.bb_kg,
          tb_balita: latestAntro.tb_cm,
          who_median_bb: 8.9,
          who_minus2sd_bb: 7.4,
          who_minus3sd_bb: 6.7,
        },
      ];
    }

    return trajectory.map((m: any, idx: number) => {
      const usia = Number(m.usia_bulan) || 12;
      // Approximate WHO 2006 Boys/Girls weight median & -2SD
      const medianBB = balita?.jk === "L" ? 2.5 + usia * 0.55 : 2.4 + usia * 0.52;
      const minus2sdBB = medianBB * 0.84;
      const minus3sdBB = medianBB * 0.76;

      return {
        minggu: `M${m.minggu_ke}`,
        minggu_ke: m.minggu_ke,
        tanggal: m.tanggal,
        bb_balita: m.bb_kg,
        tb_balita: m.tb_cm,
        zs_tbu: m.zs_tbu,
        who_median_bb: Math.round(medianBB * 10) / 10,
        who_minus2sd_bb: Math.round(minus2sdBB * 10) / 10,
        who_minus3sd_bb: Math.round(minus3sdBB * 10) / 10,
      };
    });
  }, [trajectory, latestAntro, balita]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto animate-pulse">
            <Baby className="w-7 h-7" />
          </div>
          <div className="font-bold text-slate-800 text-sm">Membuka Buku Rapor Balita...</div>
          <p className="text-xs text-slate-500">Memuat data rekam pertumbuhan &amp; asuhan KMS digital</p>
        </div>
      </div>
    );
  }

  if (error || !balita) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-base">Rapor Tidak Ditemukan</h3>
            <p className="text-xs text-slate-500">{error || "Data balita tidak ditemukan di sistem."}</p>
          </div>
        </div>
      </div>
    );
  }

  // === SECURITY VERIFICATION VIEW ===
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-slate-50 to-amber-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 max-w-sm w-full p-6 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-rose-500/30">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
              Privasi &amp; Keamanan Rekam Medis
            </span>
            <h2 className="text-xl font-black text-slate-800">Verifikasi Rapor Balita</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Untuk melindungi privasi tumbuh kembang anak, masukkan <strong>Tanggal Lahir</strong> balita (format: <code>DDMMYYYY</code>, contoh: <code>21102024</code>).
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-1">
            <div className="text-[11px] text-slate-400 font-bold uppercase">Nama Balita:</div>
            <div className="text-sm font-black text-slate-800">{balita.nama_balita}</div>
            <div className="text-xs text-slate-500">Desa: {balita.desa_kel || "-"}</div>
          </div>

          <form onSubmit={handleVerifyPin} className="space-y-3">
            <div>
              <input
                type="text"
                placeholder="Contoh: 21102024"
                value={inputPin}
                onChange={(e) => setInputPin(e.target.value)}
                maxLength={8}
                className="w-full text-center tracking-widest text-lg font-mono font-black py-3 px-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-rose-500 focus:bg-white transition"
              />
              {pinError && <p className="text-xs text-rose-600 font-bold mt-1.5">{pinError}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-rose-500/25 transition flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Buka Buku Rapor KMS</span>
            </button>
          </form>

          <p className="text-[10px] text-slate-400">
            Dinas Kesehatan Kabupaten Malang • Sistem SIGMA PKMK
          </p>
        </div>
      </div>
    );
  }

  // === FULL DIGITAL KMS BOOK & RAPOR VIEW ===
  return (
    <div className="min-h-screen bg-slate-100/70 pb-16 print:bg-white print:pb-0 font-sans">
      
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
              <Baby className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-800 leading-tight">E-KMS Digital Balita</h1>
              <p className="text-[10px] text-slate-400">Dinas Kesehatan Kabupaten Malang</p>
            </div>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-200"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Rapor</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">

        {/* 1. Cover Card Buku Rapor */}
        <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
          
          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-white/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Buku Rapor Pertumbuhan &amp; KMS Digital
              </span>
              <span className="text-xs text-white/80 font-bold">
                Siklus Pemantauan: {data?.totalSiklus || 1}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-white">{balita.nama_balita}</h2>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    balita.jk === "L" ? "bg-blue-200 text-blue-950" : "bg-pink-200 text-pink-950"
                  }`}>
                    {balita.jk === "L" ? "♂ Laki-laki" : "♀ Perempuan"}
                  </span>
                </div>
                <p className="text-xs text-white/90">
                  Nama Orang Tua / Pengasuh: <strong>{balita.nama_ortu || "-"}</strong>
                </p>
              </div>

              <div className="bg-white/15 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 shrink-0 text-left sm:text-right">
                <div className="text-[10px] text-white/80 font-bold uppercase tracking-wider">Usia Saat Ini:</div>
                <div className="text-lg font-black text-white">{ageString}</div>
                <div className="text-[11px] text-white/80">Lahir: {balita.tgl_lahir || "-"}</div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/20 flex flex-wrap items-center justify-between gap-2 text-xs text-white/90">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-amber-300" />
                Puskesmas: <strong>{balita.puskesmasName}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-300" />
                Desa: <strong>{balita.desa_kel || "-"}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* 2. Latest Growth Scorecard */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Berat Badan (BB)</span>
            <div className="text-2xl font-black text-slate-800">
              {latestAntro?.bb_kg ? `${latestAntro.bb_kg} kg` : "-"}
            </div>
            <span className="text-[10px] text-emerald-600 font-bold block">
              {latestAntro?.delta_bb_kg ? `+${(latestAntro.delta_bb_kg * 1000).toFixed(0)} gr (Kenaikan)` : "Pemantauan Aktif"}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tinggi Badan (TB)</span>
            <div className="text-2xl font-black text-slate-800">
              {latestAntro?.tb_cm ? `${latestAntro.tb_cm} cm` : "-"}
            </div>
            <span className="text-[10px] text-slate-500 block">
              Lahir: {balita.tb_lahir_cm ? `${balita.tb_lahir_cm} cm` : "-"}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status Gizi (TB/U)</span>
            <div className="text-lg font-black text-rose-700 truncate">
              {latestAntro?.klas_tbu || "Dalam Pemantauan"}
            </div>
            <span className="text-[10px] font-mono text-slate-400 block">
              Z-Score: {latestAntro?.zs_tbu ? `${Number(latestAntro.zs_tbu).toFixed(2)} SD` : "-"}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kepatuhan PKMK</span>
            <div className="text-2xl font-black text-indigo-700">
              {compliance.length > 0
                ? `${Math.round(compliance.reduce((a: number, c: any) => a + (Number(c.porsi_habis_pct) || 0), 0) / compliance.length)}%`
                : "100%"}
            </div>
            <span className="text-[10px] text-indigo-600 font-bold block">Formula Khusus</span>
          </div>
        </div>

        {/* 3. Interactive KMS Digital Growth Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-rose-600" />
                Kurva Pertumbuhan Berat Badan (KMS Digital Standar WHO)
              </h3>
              <p className="text-xs text-slate-500">
                Pita hijau adalah rentang pertumbuhan normal anak. Garis merah putus-putus batas bawah stunting.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
              {chartData.length} Sesi Terdata
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="minggu" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis domain={["dataMin - 1", "dataMax + 2"]} tick={{ fontSize: 11, fill: "#64748b" }} unit=" kg" />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", fontSize: "12px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                  formatter={(v: any, name: string) => [`${v} kg`, name]}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Line type="monotone" dataKey="who_median_bb" name="Standar Median WHO (Ideal)" stroke="#10b981" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="who_minus2sd_bb" name="Batas Garis Kuning (-2 SD)" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="who_minus3sd_bb" name="Batas Garis Merah (-3 SD)" stroke="#ef4444" strokeWidth={1.5} dot={false} />
                <Area type="monotone" dataKey="bb_balita" name="Berat Badan Balita" stroke="#e11d48" strokeWidth={3} fillOpacity={1} fill="url(#colorBB)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Catatan Tenaga Kesehatan:</strong> Balita dalam program intervensi PKMK dipantau secara ketat setiap minggu. 
              Target kenaikan berat badan: <strong>≥ 15–20 gram/hari</strong> untuk mengejar ketertinggalan pertumbuhan (<em>catch-up growth</em>).
            </div>
          </div>
        </div>

        {/* 4. Weekly Monitoring History Table */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Catatan Pemantauan Antropometri &amp; Konsumsi Mingguan
          </h3>

          {trajectory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <th className="p-3 font-bold">Minggu</th>
                    <th className="p-3 font-bold">Tanggal</th>
                    <th className="p-3 font-bold text-center">BB (kg)</th>
                    <th className="p-3 font-bold text-center">TB (cm)</th>
                    <th className="p-3 font-bold text-center">Z-Score TB/U</th>
                    <th className="p-3 font-bold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trajectory.map((m: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-bold text-slate-800">Minggu {m.minggu_ke}</td>
                      <td className="p-3 text-slate-500">{m.tanggal || "-"}</td>
                      <td className="p-3 text-center font-bold text-slate-800">{m.bb_kg || "-"} kg</td>
                      <td className="p-3 text-center font-bold text-slate-800">{m.tb_cm || "-"} cm</td>
                      <td className="p-3 text-center font-mono font-bold text-rose-700">
                        {m.zs_tbu ? `${Number(m.zs_tbu).toFixed(2)} SD` : "-"}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          {m.klas_tbu || "Tercatat"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400">
              Belum ada riwayat monitoring yang diinput oleh kader/Puskesmas.
            </div>
          )}
        </div>

        {/* 5. SDIDTK Developmental Milestone Assessment */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              Skrining Tumbuh Kembang (SDIDTK / KPSP)
            </h3>
            <span className="text-xs font-bold bg-purple-50 text-purple-700 px-3 py-1 rounded-full border border-purple-200">
              Kemenkes RI
            </span>
          </div>

          {sdidtk ? (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-purple-600 uppercase block">Hasil Skrining KPSP:</span>
                  <span className="text-lg font-black text-purple-950">{sdidtk.kpsp_status?.replace(/_/g, " ")}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Skor 'Ya':</span>
                  <span className="text-xl font-black text-purple-800">{sdidtk.kpsp_yes_count} / 10</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 text-center text-xs text-slate-500">
              Skrining perkembangan KPSP belum dijadwalkan untuk periode ini.
            </div>
          )}
        </div>

        {/* 6. Asuhan Gizi & Pesan Khusus Ortu */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-3xl p-6 border border-emerald-200 space-y-3">
          <h3 className="font-black text-emerald-950 text-base flex items-center gap-2">
            <Utensils className="w-5 h-5 text-emerald-700" />
            Panduan Asuhan Gizi di Rumah untuk Orang Tua
          </h3>
          <ul className="text-xs text-emerald-900 space-y-1.5 list-disc list-inside leading-relaxed font-medium">
            <li>Pastikan formula PKMK diminum sesuai anjuran dosis dokter/petugas Puskesmas setiap hari.</li>
            <li>Berikan makanan pendamping ASI (MP-ASI) yang kaya akan <strong>protein hewani</strong> (telur, hati ayam, ikan, daging sapi) pada setiap waktu makan.</li>
            <li>Jaga kebersihan alat makan, air minum yang dimasak matang, dan sanitasi rumah untuk mencegah penyakit diare/ISPA.</li>
            <li>Bawa balita ke Posyandu / Puskesmas setiap minggu untuk penimbangan berat badan berkala.</li>
          </ul>
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-slate-400 pt-4 space-y-1">
          <p>Buku Rapor Digital ini diterbitkan resmi oleh Dinas Kesehatan Kabupaten Malang.</p>
          <p className="font-mono text-[10px]">ID: {balita.id}</p>
        </footer>

      </main>
    </div>
  );
}
