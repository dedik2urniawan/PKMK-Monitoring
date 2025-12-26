"use client";
import { useEffect, useMemo, useState, Fragment } from "react";
import { useParams } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area } from "recharts";
import { toast } from "sonner";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { getAuthHeaders } from "@/lib/clientSession";

type Kohort = { id: string; periode_mulai?: string } | null;

export default function NewAntropometri() {
  const params = useParams<{ balitaId: string }>();
  const [kohort, setKohort] = useState<Kohort>(null);
  const [balitaName, setBalitaName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [balita, setBalita] = useState<{ jk: 'L' | 'P'; tgl_lahir: string } | null>(null);
  const [form, setForm] = useState({
    minggu_ke: 1,
    tanggal: "",
    cara_ukur: "terlentang",
    usia_bulan: "",
    bb_kg: "",
    tb_cm: "",
    tb_corr_cm: "",
    lila_cm: "",
    zs_bbu: "",
    zs_tbu: "",
    zs_bbtb: "",
    klas_bbu: "",
    klas_tbu: "",
    klas_bbtb: "",
    delta_bb_kg: "",
    // Pemeriksaan Medis Lanjutan (opsional)
    medis_lanjutan: false,
    bb_tidak_adekuat: "",
    murmur_edema: "",
    delayed_development: "",
    wajah_dismorfik: "",
    organomegali_limfadenopati: "",
    ispa_cystitis: "",
    muntah_diare_berulang: "",
    diagnosa_penyakit_penyerta: "",
    subjective: "",
    objective: "",
    assesment: "",
    plan: "",
  });
  const [corrBadge, setCorrBadge] = useState<string>("");
  const [lmsWarn, setLmsWarn] = useState<{ bbu?: boolean; tbu?: boolean; bbtb?: boolean }>({});
  const [outlier, setOutlier] = useState<{ bbu?: boolean; tbu?: boolean; bbtb?: boolean }>({});
  const [deltaInfo, setDeltaInfo] = useState<{ low: number; high: number; status: 'kurang' | 'sesuai' | 'lebih' | null } | null>(null);
  const hasMedis = (h: any) => !!(
    h?.bb_tidak_adekuat ||
    h?.murmur_edema ||
    h?.delayed_development ||
    h?.wajah_dismorfik ||
    h?.organomegali_limfadenopati ||
    h?.ispa_cystitis ||
    h?.muntah_diare_berulang ||
    h?.diagnosa_penyakit_penyerta ||
    h?.subjective ||
    h?.objective ||
    h?.assesment ||
    h?.plan
  );
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<any | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const r = await fetch(`/api/kohort/by-balita?balita_id=${params.balitaId}`);
      const d = await r.json();
      setKohort(d.item ?? null);
    })();
  }, [params.balitaId]);

  useEffect(() => {
    (async () => {
      const rb = await fetch(`/api/monitoring/balita?balita_id=${params.balitaId}`);
      const db = await rb.json();
      const it = db.items?.[0];
      setBalitaName(it?.nama_balita || "");
      if (it?.jk && it?.tgl_lahir) setBalita({ jk: it.jk as 'L' | 'P', tgl_lahir: it.tgl_lahir });
    })();
  }, [params.balitaId]);

  useEffect(() => {
    if (!kohort) return;
    (async () => {
      const rh = await fetch(`/api/monitoring/antropometri?kohort_id=${kohort.id}`);
      const dh = await rh.json();
      const items = dh.items || [];
      setHistory(items);
      // Auto-set minggu_ke to next available week
      if (items.length > 0 && !editingId) {
        const maxMinggu = Math.max(...items.map((h: any) => h.minggu_ke || 0));
        const nextMinggu = Math.min(12, maxMinggu + 1);
        setForm((f) => ({ ...f, minggu_ke: nextMinggu }));
      }
    })();
  }, [kohort, editingId]);

  // util hitung usia bulan
  function calcMonths(fromISO: string, toISO: string) {
    const d1 = new Date(fromISO);
    const d2 = new Date(toISO);
    let months = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
    // adjust if day-of-month is before birthday day
    if (d2.getDate() < d1.getDate()) months -= 1;
    return Math.max(0, months);
  }

  // Recalculate usia_bulan and tb_corr when tanggal/tb/cara changes
  useEffect(() => {
    if (balita && form.tanggal) {
      const months = calcMonths(balita.tgl_lahir, form.tanggal);
      setForm((f) => ({ ...f, usia_bulan: String(months) }));
    }
  }, [balita, form.tanggal]);

  useEffect(() => {
    const umur = Number(form.usia_bulan);
    const tb = Number(form.tb_cm);
    if (!isNaN(umur) && !isNaN(tb) && tb > 0) {
      let corr = tb;
      let badge = "";
      if (umur >= 24 && form.cara_ukur === 'terlentang') { corr = tb - 0.7; badge = "-0.7 cm"; }
      if (umur < 24 && form.cara_ukur === 'berdiri') { corr = tb + 0.7; badge = "+0.7 cm"; }
      setForm((f) => ({ ...f, tb_corr_cm: corr.toFixed(2) }));
      setCorrBadge(badge);
    }
  }, [form.usia_bulan, form.tb_cm, form.cara_ukur]);

  // fetch LMS and compute zscores
  useEffect(() => {
    (async () => {
      const umur = Number(form.usia_bulan);
      const bb = Number(form.bb_kg);
      const tbCorr = Number(form.tb_corr_cm);
      if (!balita || isNaN(umur) || !form.tanggal) return;
      const jkNum = balita.jk === 'L' ? 1 : 2;

      function lmsZ(x: number, L: number, M: number, S: number) {
        if (!x || !L || !M || !S) return NaN;
        if (L === 0) return Math.log(x / M) / S;
        return (Math.pow(x / M, L) - 1) / (L * S);
      }
      function klasBBU(z: number) {
        if (isNaN(z)) return '';
        if (z < -3) return 'Sangat Kurang';
        if (z < -2) return 'Kurang';
        if (z <= 1) return 'Normal';
        if (z <= 2) return 'Risiko Gemuk';
        return 'Gemuk';
      }
      function klasTBU(z: number) {
        if (isNaN(z)) return '';
        if (z < -3) return 'Sangat Pendek';
        if (z < -2) return 'Pendek';
        if (z > 3) return 'Tinggi';
        return 'Normal';
      }
      function klasBBTB(z: number) {
        if (isNaN(z)) return '';
        if (z < -3) return 'Sangat Kurus';
        if (z < -2) return 'Kurus';
        if (z <= 1) return 'Normal';
        if (z <= 2) return 'Risiko Gemuk';
        return 'Gemuk';
      }

      try {
        setLmsWarn({});
        // BBU by month
        if (!isNaN(bb)) {
          const rb = await fetch(`/api/ref/lms-bbu?jk=${jkNum}&month=${umur}`);
          const lb = await rb.json();
          if (lb.item) {
            const z = lmsZ(bb, lb.item.L, lb.item.M, lb.item.S);
            setForm((f) => ({ ...f, zs_bbu: z.toFixed(3), klas_bbu: klasBBU(z) }));
            setOutlier((o) => ({ ...o, bbu: z < -6 || z > 5 }));
          } else setLmsWarn((w) => ({ ...w, bbu: true }));
        }
        // TBU by month using tb_corr
        if (!isNaN(tbCorr)) {
          const rt = await fetch(`/api/ref/lms-tbu?jk=${jkNum}&month=${umur}`);
          const lt = await rt.json();
          if (lt.item) {
            const zt = lmsZ(tbCorr, lt.item.L, lt.item.M, lt.item.S);
            setForm((f) => ({ ...f, zs_tbu: zt.toFixed(3), klas_tbu: klasTBU(zt) }));
            setOutlier((o) => ({ ...o, tbu: zt < -6 || zt > 6 }));
          } else setLmsWarn((w) => ({ ...w, tbu: true }));
        }
        // BBTB by length
        if (!isNaN(bb) && !isNaN(tbCorr)) {
          const rl = await fetch(`/api/ref/lms-bbtb?jk=${jkNum}&length=${tbCorr}`);
          const ll = await rl.json();
          if (ll.item) {
            const zb = lmsZ(bb, ll.item.L, ll.item.M, ll.item.S);
            setForm((f) => ({ ...f, zs_bbtb: zb.toFixed(3), klas_bbtb: klasBBTB(zb) }));
            setOutlier((o) => ({ ...o, bbtb: zb < -5 || zb > 5 }));
          } else setLmsWarn((w) => ({ ...w, bbtb: true }));
        }
      } catch { }
    })();
  }, [balita, form.usia_bulan, form.bb_kg, form.tb_corr_cm, form.tanggal]);

  // Recalculate delta BB and recommendation when BB or minggu_ke changes
  useEffect(() => {
    const bb = Number(form.bb_kg);
    if (isNaN(bb) || !history || history.length === 0) { setDeltaInfo(null); return; }
    // Find previous week entry (< current minggu_ke) with highest minggu_ke
    const prev = history
      .filter((h: any) => typeof form.minggu_ke === 'number' ? h.minggu_ke < form.minggu_ke : true)
      .sort((a: any, b: any) => b.minggu_ke - a.minggu_ke)[0];
    if (prev && prev.bb_kg != null) {
      const delta = bb - Number(prev.bb_kg);
      setForm((f) => ({ ...f, delta_bb_kg: delta.toFixed(3) }));
      // Recommendation: 5–10 gram per kg BB saat ini
      const low = bb * 0.005; // kg
      const high = bb * 0.01; // kg
      let status: 'kurang' | 'sesuai' | 'lebih' = 'kurang';
      if (delta < low) status = 'kurang'; else if (delta > high) status = 'lebih'; else status = 'sesuai';
      setDeltaInfo({ low, high, status });
    } else {
      setDeltaInfo(null);
    }
  }, [form.bb_kg, form.minggu_ke, history]);

  // Get today's date for validation
  const today = new Date().toISOString().split('T')[0];

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!(form.minggu_ke >= 1 && form.minggu_ke <= 12)) e.minggu_ke = "Minggu ke harus 1–12";
    if (!form.tanggal) e.tanggal = "Wajib diisi";
    else if (form.tanggal > today) e.tanggal = "Tanggal tidak boleh melebihi hari ini";
    if (!form.cara_ukur) e.cara_ukur = "Wajib diisi";
    return e;
  }, [form, today]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!kohort) { setMsg("Balita belum memiliki kohort. Mulai kohort terlebih dahulu."); return; }
    setSaving(true);
    setMsg(null);
    const payload = {
      kohort_id: kohort.id,
      minggu_ke: Number(form.minggu_ke),
      tanggal: form.tanggal,
      cara_ukur: form.cara_ukur,
      usia_bulan: form.usia_bulan === "" ? undefined : Number(form.usia_bulan),
      bb_kg: form.bb_kg === "" ? undefined : Number(form.bb_kg),
      tb_cm: form.tb_cm === "" ? undefined : Number(form.tb_cm),
      tb_corr_cm: form.tb_corr_cm === "" ? undefined : Number(form.tb_corr_cm),
      lila_cm: form.lila_cm === "" ? undefined : Number(form.lila_cm),
      zs_bbu: form.zs_bbu === "" ? undefined : Number(form.zs_bbu),
      zs_tbu: form.zs_tbu === "" ? undefined : Number(form.zs_tbu),
      zs_bbtb: form.zs_bbtb === "" ? undefined : Number(form.zs_bbtb),
      klas_bbu: form.klas_bbu || undefined,
      klas_tbu: form.klas_tbu || undefined,
      klas_bbtb: form.klas_bbtb || undefined,
      delta_bb_kg: form.delta_bb_kg === "" ? undefined : Number(form.delta_bb_kg),
      // Redflag + SOAP (only send when filled)
      bb_tidak_adekuat: form.medis_lanjutan && form.bb_tidak_adekuat ? form.bb_tidak_adekuat : undefined,
      murmur_edema: form.medis_lanjutan && form.murmur_edema ? form.murmur_edema : undefined,
      delayed_development: form.medis_lanjutan && form.delayed_development ? form.delayed_development : undefined,
      wajah_dismorfik: form.medis_lanjutan && form.wajah_dismorfik ? form.wajah_dismorfik : undefined,
      organomegali_limfadenopati: form.medis_lanjutan && form.organomegali_limfadenopati ? form.organomegali_limfadenopati : undefined,
      ispa_cystitis: form.medis_lanjutan && form.ispa_cystitis ? form.ispa_cystitis : undefined,
      muntah_diare_berulang: form.medis_lanjutan && form.muntah_diare_berulang ? form.muntah_diare_berulang : undefined,
      diagnosa_penyakit_penyerta: form.medis_lanjutan && form.diagnosa_penyakit_penyerta ? form.diagnosa_penyakit_penyerta : undefined,
      subjective: form.medis_lanjutan && form.subjective ? form.subjective : undefined,
      objective: form.medis_lanjutan && form.objective ? form.objective : undefined,
      assesment: form.medis_lanjutan && form.assesment ? form.assesment : undefined,
      plan: form.medis_lanjutan && form.plan ? form.plan : undefined,
    };
    const authHeaders = await getAuthHeaders();
    const res = await fetch("/api/monitoring/antropometri", {
      method: editingId ? "PATCH" : "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
    });
    setSaving(false);
    if (!res.ok) { const t = await res.text(); setMsg(t); toast.error(t); return; }
    setMsg("Tersimpan."); toast.success(editingId ? "Perubahan disimpan" : "Tersimpan");
    try {
      const rh = await fetch(`/api/monitoring/antropometri?kohort_id=${kohort.id}`);
      const dh = await rh.json();
      setHistory(dh.items || []);
      setEditingId(null);
    } catch { }
  }

  return (
    <div className="max-w-4xl">
      {/* Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#607a8a', marginBottom: 8 }}>
        <span>Anak</span>
        <span style={{ fontSize: 12 }}>›</span>
        <span>Detail</span>
        <span style={{ fontSize: 12 }}>›</span>
        <span style={{ color: '#3b82f6', fontWeight: 500 }}>Tambah Monitoring</span>
      </div>

      {/* Page Title */}
      <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111518', marginBottom: 8 }}>Tambah Monitoring: Antropometri</h1>

      {/* Child Info Bar */}
      {(balitaName || kohort) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {balita?.jk && (
            <span style={{
              background: balita.jk === 'L' ? '#dbeafe' : '#fce7f3',
              color: balita.jk === 'L' ? '#1d4ed8' : '#be185d',
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 4
            }}>
              {balita.jk === 'L' ? 'Laki-laki' : 'Perempuan'}
            </span>
          )}
          <span style={{ fontSize: 14, color: '#607a8a' }}>
            Anak: <strong style={{ color: '#111518' }}>{balitaName || '-'}</strong>
          </span>
          <span style={{ color: '#d1d5db' }}>|</span>
          <span style={{ fontSize: 14, color: '#607a8a' }}>
            {kohort ? `Awal Kohort: ${new Date(kohort.periode_mulai as any).toLocaleDateString('id-ID')}` : 'Kohort belum dimulai'}
          </span>
        </div>
      )}

      {/* Alert: No Kohort */}
      {!kohort && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#fef3c7', border: '1px solid #fcd34d', color: '#92400e',
          padding: '12px 16px', borderRadius: 8, fontSize: 14, marginBottom: 16
        }}>
          ⚠️ Balita belum memiliki kohort aktif.
        </div>
      )}

      {/* Message Alert */}
      {msg && (
        <div style={{
          background: '#dbeafe', border: '1px solid #93c5fd', color: '#1e40af',
          padding: '12px 16px', borderRadius: 8, fontSize: 14, marginBottom: 16
        }}>
          {msg}
        </div>
      )}

      {/* Main Form Card */}
      <form onSubmit={onSubmit} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>

        {/* Section 1: Data Pengukuran Dasar */}
        <div style={{ padding: '28px 32px', borderBottom: '1px solid #f0f3f5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 40, height: 40, background: '#eff6ff', color: '#3b82f6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📏</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111518' }}>Data Pengukuran Dasar</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 28 }} className="form-grid-responsive">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#111518' }}>Minggu Ke <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="number" min={1} max={12} value={form.minggu_ke} onChange={(e) => setForm({ ...form, minggu_ke: Number(e.target.value) })} className="input" required />
              {errors.minggu_ke && <p style={{ fontSize: 12, color: '#dc2626' }}>{errors.minggu_ke}</p>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#111518' }}>Tanggal Pengukuran <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="date" value={form.tanggal} max={today} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} className="input" required />
              {errors.tanggal && <p style={{ fontSize: 12, color: '#dc2626' }}>{errors.tanggal}</p>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#111518' }}>Cara Ukur <span style={{ color: '#ef4444' }}>*</span></label>
              <select value={form.cara_ukur} onChange={(e) => setForm({ ...form, cara_ukur: e.target.value })} className="input" required>
                <option value="terlentang">Terlentang</option>
                <option value="berdiri">Berdiri</option>
              </select>
              {errors.cara_ukur && <p style={{ fontSize: 12, color: '#dc2626' }}>{errors.cara_ukur}</p>}
              <p style={{ fontSize: 11, color: '#f59e0b', fontStyle: 'italic' }}>Koreksi -0.7cm jika &lt; 24bln diukur berdiri.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#607a8a' }}>Usia Saat Ukur</label>
              <input className="input" type="text" value={form.usia_bulan ? `${form.usia_bulan} Bulan` : '-'} readOnly style={{ background: '#f9fafb', color: '#607a8a' }} />
            </div>
          </div>
        </div>

        {/* Section 2: Data Fisik */}
        <div style={{ padding: '28px 32px', borderBottom: '1px solid #f0f3f5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 40, height: 40, background: '#ecfdf5', color: '#10b981', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⚖️</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111518' }}>Data Fisik</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 28 }} className="form-grid-responsive">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#111518' }}>Berat Badan (BB)</label>
              <div style={{ position: 'relative' }}>
                <input className="input" type="number" step="0.001" value={form.bb_kg} onChange={(e) => setForm({ ...form, bb_kg: e.target.value })} placeholder="0.0" style={{ paddingRight: 40 }} />
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#607a8a' }}>kg</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#111518' }}>Tinggi Badan (TB)</label>
              <div style={{ position: 'relative' }}>
                <input className="input" type="number" step="0.01" value={form.tb_cm} onChange={(e) => setForm({ ...form, tb_cm: e.target.value })} placeholder="0.0" style={{ paddingRight: 40 }} />
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#607a8a' }}>cm</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#607a8a' }}>TB Koreksi</label>
                <span style={{ background: '#f3f4f6', color: '#6b7280', fontSize: 10, padding: '2px 6px', borderRadius: 4, border: '1px solid #e5e7eb' }}>AUTO</span>
              </div>
              <div style={{ position: 'relative' }}>
                <input className="input" type="number" step="0.01" value={form.tb_corr_cm} readOnly style={{ background: '#f9fafb', color: '#607a8a', paddingRight: 40 }} />
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#607a8a' }}>cm</span>
              </div>
              {corrBadge && (
                <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 11, background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: 9999, width: 'fit-content' }}>
                  Koreksi {corrBadge}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#111518' }}>LILA</label>
              <div style={{ position: 'relative' }}>
                <input className="input" type="number" step="0.01" value={form.lila_cm} onChange={(e) => setForm({ ...form, lila_cm: e.target.value })} placeholder="0.0" style={{ paddingRight: 40 }} />
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#607a8a' }}>cm</span>
              </div>
            </div>
          </div>
        </div>
        {/* Section 3: Z-Score & Klasifikasi */}
        <div style={{ padding: '28px 32px', borderBottom: '1px solid #f0f3f5', background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 40, height: 40, background: '#eef2ff', color: '#6366f1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📊</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111518' }}>Z-Score & Klasifikasi</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }} className="form-grid-responsive">
            {/* ZS-BBU Card */}
            <div style={{ background: 'white', padding: 16, borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#6b7280' }}>ZS BB/U</span>
                <span style={{
                  background: form.klas_bbu?.includes('Normal') ? '#dcfce7' : form.klas_bbu?.includes('Sangat') ? '#fee2e2' : '#fef9c3',
                  color: form.klas_bbu?.includes('Normal') ? '#166534' : form.klas_bbu?.includes('Sangat') ? '#991b1b' : '#854d0e',
                  fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 9999,
                  border: form.klas_bbu?.includes('Normal') ? '1px solid #bbf7d0' : form.klas_bbu?.includes('Sangat') ? '1px solid #fecaca' : '1px solid #fde047'
                }}>{form.klas_bbu || '-'}</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#111518', fontFamily: 'ui-monospace, monospace' }}>{form.zs_bbu || '-'}<span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 4 }}>SD</span></div>
              <div style={{ width: '100%', height: 6, background: '#e5e7eb', borderRadius: 3, marginTop: 12 }}>
                <div style={{ width: `${Math.min(100, Math.max(0, ((Number(form.zs_bbu) || 0) + 3) / 6 * 100))}%`, height: 6, background: form.klas_bbu?.includes('Normal') ? '#22c55e' : form.klas_bbu?.includes('Sangat') ? '#ef4444' : '#eab308', borderRadius: 3 }} />
              </div>
              {lmsWarn.bbu && <p style={{ fontSize: 11, color: '#ca8a04', marginTop: 6 }}>LMS tidak ditemukan</p>}
              {outlier.bbu && <p style={{ fontSize: 11, color: '#dc2626', marginTop: 6 }}>Outlier</p>}
            </div>
            {/* ZS-TBU Card */}
            <div style={{ background: 'white', padding: 16, borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#6b7280' }}>ZS TB/U</span>
                <span style={{
                  background: form.klas_tbu?.includes('Normal') ? '#dcfce7' : form.klas_tbu?.includes('Sangat') ? '#fee2e2' : '#ffedd5',
                  color: form.klas_tbu?.includes('Normal') ? '#166534' : form.klas_tbu?.includes('Sangat') ? '#991b1b' : '#9a3412',
                  fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 9999,
                  border: form.klas_tbu?.includes('Normal') ? '1px solid #bbf7d0' : form.klas_tbu?.includes('Sangat') ? '1px solid #fecaca' : '1px solid #fed7aa'
                }}>{form.klas_tbu || '-'}</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#111518', fontFamily: 'ui-monospace, monospace' }}>{form.zs_tbu || '-'}<span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 4 }}>SD</span></div>
              <div style={{ width: '100%', height: 6, background: '#e5e7eb', borderRadius: 3, marginTop: 12 }}>
                <div style={{ width: `${Math.min(100, Math.max(0, ((Number(form.zs_tbu) || 0) + 3) / 6 * 100))}%`, height: 6, background: form.klas_tbu?.includes('Normal') ? '#22c55e' : form.klas_tbu?.includes('Sangat') ? '#ef4444' : '#f97316', borderRadius: 3 }} />
              </div>
              {lmsWarn.tbu && <p style={{ fontSize: 11, color: '#ca8a04', marginTop: 6 }}>LMS tidak ditemukan</p>}
              {outlier.tbu && <p style={{ fontSize: 11, color: '#dc2626', marginTop: 6 }}>Outlier</p>}
            </div>
            {/* ZS-BBTB Card */}
            <div style={{ background: 'white', padding: 16, borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#6b7280' }}>ZS BB/TB</span>
                <span style={{
                  background: form.klas_bbtb?.includes('Normal') ? '#dcfce7' : form.klas_bbtb?.includes('Sangat') || form.klas_bbtb?.includes('Kurus') ? '#fee2e2' : '#fef9c3',
                  color: form.klas_bbtb?.includes('Normal') ? '#166534' : form.klas_bbtb?.includes('Sangat') || form.klas_bbtb?.includes('Kurus') ? '#991b1b' : '#854d0e',
                  fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 9999,
                  border: form.klas_bbtb?.includes('Normal') ? '1px solid #bbf7d0' : form.klas_bbtb?.includes('Sangat') || form.klas_bbtb?.includes('Kurus') ? '1px solid #fecaca' : '1px solid #fde047'
                }}>{form.klas_bbtb || '-'}</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#111518', fontFamily: 'ui-monospace, monospace' }}>{form.zs_bbtb || '-'}<span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 4 }}>SD</span></div>
              <div style={{ width: '100%', height: 6, background: '#e5e7eb', borderRadius: 3, marginTop: 12 }}>
                <div style={{ width: `${Math.min(100, Math.max(0, ((Number(form.zs_bbtb) || 0) + 3) / 6 * 100))}%`, height: 6, background: form.klas_bbtb?.includes('Normal') ? '#22c55e' : form.klas_bbtb?.includes('Sangat') || form.klas_bbtb?.includes('Kurus') ? '#ef4444' : '#eab308', borderRadius: 3 }} />
              </div>
              {lmsWarn.bbtb && <p style={{ fontSize: 11, color: '#ca8a04', marginTop: 6 }}>LMS tidak ditemukan</p>}
              {outlier.bbtb && <p style={{ fontSize: 11, color: '#dc2626', marginTop: 6 }}>Outlier</p>}
            </div>
            {/* Delta BB Card */}
            <div style={{ background: 'white', padding: 16, borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 4, background: deltaInfo?.status === 'sesuai' ? '#22c55e' : deltaInfo?.status === 'lebih' ? '#f97316' : '#ef4444' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Kenaikan BB</span>
                {deltaInfo && (
                  <span style={{
                    background: deltaInfo.status === 'sesuai' ? '#dcfce7' : deltaInfo.status === 'lebih' ? '#ffedd5' : '#fee2e2',
                    color: deltaInfo.status === 'sesuai' ? '#166534' : deltaInfo.status === 'lebih' ? '#9a3412' : '#991b1b',
                    fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 9999,
                    border: deltaInfo.status === 'sesuai' ? '1px solid #bbf7d0' : deltaInfo.status === 'lebih' ? '1px solid #fed7aa' : '1px solid #fecaca'
                  }}>{deltaInfo.status === 'sesuai' ? 'Adekuat' : deltaInfo.status === 'lebih' ? 'Di Atas' : 'Di Bawah'}</span>
                )}
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#111518' }}>
                {form.delta_bb_kg ? `${Number(form.delta_bb_kg) >= 0 ? '+' : ''}${(Number(form.delta_bb_kg) * 1000).toFixed(0)}` : '-'}
                <span style={{ fontSize: 14, color: '#6b7280', marginLeft: 4 }}>gr</span>
              </div>
              {deltaInfo && (
                <p style={{ fontSize: 11, color: '#6b7280', marginTop: 8 }}>
                  Rekomendasi: ≥ {(deltaInfo.low * 1000).toFixed(0)} gr
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Pemeriksaan Medis Lanjutan Toggle */}
        <div style={{ padding: '20px 32px', borderBottom: '1px dashed #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              id="medis_lanjutan"
              type="checkbox"
              checked={form.medis_lanjutan as any}
              onChange={(e) => {
                const checked = e.target.checked;
                setForm({
                  ...form,
                  medis_lanjutan: checked,
                  ...(checked ? {} : {
                    bb_tidak_adekuat: "",
                    murmur_edema: "",
                    delayed_development: "",
                    wajah_dismorfik: "",
                    organomegali_limfadenopati: "",
                    ispa_cystitis: "",
                    muntah_diare_berulang: "",
                    diagnosa_penyakit_penyerta: "",
                    subjective: "",
                    objective: "",
                    assesment: "",
                    plan: "",
                  })
                });
              }}
              style={{ width: 20, height: 20, borderRadius: 4, accentColor: '#3b82f6' }}
            />
            <label htmlFor="medis_lanjutan" style={{ fontSize: 15, fontWeight: 600, color: '#111518', cursor: 'pointer' }}>
              Apakah ada pemeriksaan medis lanjutan?
            </label>
          </div>
        </div>

        {form.medis_lanjutan && (
          <>
            {/* Redflag Section */}
            <div style={{ padding: '28px 32px', background: 'rgba(254,242,242,0.5)', borderBottom: '1px solid #fecaca' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 40, height: 40, background: '#fee2e2', color: '#dc2626', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🚩</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#991b1b' }}>Red Flag Assessment</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }} className="form-grid-responsive">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#991b1b' }}>Kenaikan BB Tidak Adekuat</label>
                  <select className="input" value={form.bb_tidak_adekuat} onChange={(e) => setForm({ ...form, bb_tidak_adekuat: e.target.value })} style={{ borderColor: '#fecaca' }}>
                    <option value="">-</option>
                    <option value="ya">Ya</option>
                    <option value="tidak">Tidak</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#991b1b' }}>Murmur / Edema</label>
                  <select className="input" value={form.murmur_edema} onChange={(e) => setForm({ ...form, murmur_edema: e.target.value })} style={{ borderColor: '#fecaca' }}>
                    <option value="">-</option>
                    <option value="ya">Ya</option>
                    <option value="tidak">Tidak</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#991b1b' }}>Keterlambatan Perkembangan</label>
                  <select className="input" value={form.delayed_development} onChange={(e) => setForm({ ...form, delayed_development: e.target.value })} style={{ borderColor: '#fecaca' }}>
                    <option value="">-</option>
                    <option value="ya">Ya</option>
                    <option value="tidak">Tidak</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#991b1b' }}>Wajah Dismorfik</label>
                  <select className="input" value={form.wajah_dismorfik} onChange={(e) => setForm({ ...form, wajah_dismorfik: e.target.value })} style={{ borderColor: '#fecaca' }}>
                    <option value="">-</option>
                    <option value="ya">Ya</option>
                    <option value="tidak">Tidak</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#991b1b' }}>Organomegali / Limfadenopati</label>
                  <select className="input" value={form.organomegali_limfadenopati} onChange={(e) => setForm({ ...form, organomegali_limfadenopati: e.target.value })} style={{ borderColor: '#fecaca' }}>
                    <option value="">-</option>
                    <option value="ya">Ya</option>
                    <option value="tidak">Tidak</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#991b1b' }}>ISPA / Infeksi Berulang</label>
                  <select className="input" value={form.ispa_cystitis} onChange={(e) => setForm({ ...form, ispa_cystitis: e.target.value })} style={{ borderColor: '#fecaca' }}>
                    <option value="">-</option>
                    <option value="ya">Ya</option>
                    <option value="tidak">Tidak</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#991b1b' }}>Muntah / Diare Berulang</label>
                  <select className="input" value={form.muntah_diare_berulang} onChange={(e) => setForm({ ...form, muntah_diare_berulang: e.target.value })} style={{ borderColor: '#fecaca' }}>
                    <option value="">-</option>
                    <option value="ya">Ya</option>
                    <option value="tidak">Tidak</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: 'span 2' }}>
                  <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#991b1b' }}>Diagnosa Penyakit Penyerta</label>
                  <input className="input" type="text" value={form.diagnosa_penyakit_penyerta} onChange={(e) => setForm({ ...form, diagnosa_penyakit_penyerta: e.target.value })} placeholder="Isi jika ada..." style={{ borderColor: '#fecaca' }} />
                </div>
              </div>
            </div>

            {/* SOAP Section */}
            <div style={{ padding: '28px 32px', background: 'rgba(250,245,255,0.5)', borderBottom: '1px solid #e9d5ff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 40, height: 40, background: '#f3e8ff', color: '#9333ea', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📋</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#6b21a8' }}>SOAP Notes</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }} className="form-grid-responsive">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#7c3aed' }}>Subjective</label>
                  <textarea className="input" rows={3} value={form.subjective} onChange={(e) => setForm({ ...form, subjective: e.target.value })} style={{ borderColor: '#e9d5ff', resize: 'vertical' }} placeholder="Keluhan pasien..." />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#7c3aed' }}>Objective</label>
                  <textarea className="input" rows={3} value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} style={{ borderColor: '#e9d5ff', resize: 'vertical' }} placeholder="Temuan pemeriksaan..." />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#7c3aed' }}>Assessment</label>
                  <textarea className="input" rows={3} value={form.assesment} onChange={(e) => setForm({ ...form, assesment: e.target.value })} style={{ borderColor: '#e9d5ff', resize: 'vertical' }} placeholder="Diagnosis..." />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#7c3aed' }}>Plan</label>
                  <textarea className="input" rows={3} value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} style={{ borderColor: '#e9d5ff', resize: 'vertical' }} placeholder="Rencana tindakan..." />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Form Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', background: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: 14, color: '#6b7280', fontStyle: 'italic' }}>* Kolom wajib diisi</p>
          <div style={{ display: 'flex', gap: 12 }}>
            {editingId && (
              <button
                type="button"
                onClick={() => { setEditingId(null); setForm({ minggu_ke: 1, tanggal: "", cara_ukur: "terlentang", usia_bulan: "", bb_kg: "", tb_cm: "", tb_corr_cm: "", lila_cm: "", zs_bbu: "", zs_tbu: "", zs_bbtb: "", klas_bbu: "", klas_tbu: "", klas_bbtb: "", delta_bb_kg: "", medis_lanjutan: false, bb_tidak_adekuat: "", murmur_edema: "", delayed_development: "", wajah_dismorfik: "", organomegali_limfadenopati: "", ispa_cystitis: "", muntah_diare_berulang: "", diagnosa_penyakit_penyerta: "", subjective: "", objective: "", assesment: "", plan: "" }); }}
                style={{ padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 500, background: 'white', color: '#374151', border: '1px solid #d1d5db', cursor: 'pointer' }}
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              disabled={saving || Object.keys(errors).length > 0}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 700,
                background: saving || Object.keys(errors).length > 0 ? '#9ca3af' : '#3b82f6',
                color: 'white', border: 'none', cursor: saving || Object.keys(errors).length > 0 ? 'not-allowed' : 'pointer',
                boxShadow: '0 1px 3px rgba(59,130,246,0.3)'
              }}
            >
              💾 {saving ? "Menyimpan..." : editingId ? "Perbarui" : "Simpan Data"}
            </button>
          </div>
        </div>
      </form>

      {/* Riwayat Antropometri - Stitch Design */}
      <div style={{ marginTop: 32, background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {/* Section Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', borderBottom: '1px solid #f0f3f5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, background: '#f3f4f6', color: '#6b7280', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🕑</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111518' }}>Riwayat Antropometri</h2>
          </div>
          <button type="button" style={{ fontSize: 14, fontWeight: 500, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>
            Lihat Semua
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6b7280', textAlign: 'left', background: '#f9fafb' }}>MINGGU</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6b7280', textAlign: 'left', background: '#f9fafb' }}>TANGGAL</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6b7280', textAlign: 'left', background: '#f9fafb' }}>BB</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6b7280', textAlign: 'left', background: '#f9fafb' }}>TB</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6b7280', textAlign: 'left', background: '#f9fafb' }}>ZS BBU</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6b7280', textAlign: 'left', background: '#f9fafb' }}>KLAS BBU</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6b7280', textAlign: 'left', background: '#f9fafb' }}>Δ BB</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6b7280', textAlign: 'right', background: '#f9fafb' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h: any) => (
                <Fragment key={h.id}>
                  <tr style={{ borderBottom: '1px solid #f0f3f5' }}>
                    <td style={{ padding: '16px', fontSize: 14, fontWeight: 600, color: '#111518' }}>Mg {h.minggu_ke}</td>
                    <td style={{ padding: '16px', fontSize: 14, color: '#6b7280' }}>{new Date(h.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td style={{ padding: '16px', fontSize: 14, fontWeight: 500, color: '#111518' }}>{h.bb_kg != null ? `${h.bb_kg} kg` : '-'}</td>
                    <td style={{ padding: '16px', fontSize: 14, fontWeight: 500, color: '#111518' }}>{h.tb_cm != null ? `${h.tb_cm} cm` : '-'}</td>
                    <td style={{ padding: '16px', fontSize: 14, fontWeight: 600, color: '#0d9488' }}>{h.zs_bbu != null ? `${Number(h.zs_bbu).toFixed(1)} SD` : '-'}</td>
                    <td style={{ padding: '16px' }}>
                      {h.klas_bbu ? (
                        <span style={{
                          display: 'inline-block', padding: '4px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 500,
                          background: h.klas_bbu.includes('Normal') ? '#dcfce7' : h.klas_bbu.includes('Sangat') ? '#fee2e2' : '#fef9c3',
                          color: h.klas_bbu.includes('Normal') ? '#166534' : h.klas_bbu.includes('Sangat') ? '#991b1b' : '#854d0e'
                        }}>{h.klas_bbu}</span>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '16px', fontSize: 14, fontWeight: 600, color: h.delta_bb_kg > 0 ? '#16a34a' : h.delta_bb_kg < 0 ? '#dc2626' : '#6b7280' }}>
                      {h.delta_bb_kg != null ? `${h.delta_bb_kg > 0 ? '+' : ''}${(h.delta_bb_kg * 1000).toFixed(0)} gr` : '-'}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                        {hasMedis(h) && (
                          <button
                            type="button"
                            onClick={() => { setDetailItem(h); setDetailOpen(true); }}
                            title="Lihat detail medis"
                            style={{ width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#dbeafe', color: '#3b82f6', border: 'none', cursor: 'pointer', fontSize: 14 }}
                          >🩺</button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(h.id); setForm({
                              minggu_ke: h.minggu_ke, tanggal: h.tanggal.slice(0, 10), cara_ukur: h.cara_ukur, usia_bulan: h.usia_bulan?.toString() ?? "", bb_kg: h.bb_kg?.toString() ?? "", tb_cm: h.tb_cm?.toString() ?? "", tb_corr_cm: h.tb_corr_cm?.toString() ?? "", lila_cm: h.lila_cm?.toString() ?? "", zs_bbu: h.zs_bbu?.toString() ?? "", zs_tbu: h.zs_tbu?.toString() ?? "", zs_bbtb: h.zs_bbtb?.toString() ?? "", klas_bbu: h.klas_bbu ?? "", klas_tbu: h.klas_tbu ?? "", klas_bbtb: h.klas_bbtb ?? "", delta_bb_kg: h.delta_bb_kg?.toString() ?? "",
                              medis_lanjutan: !!(h.bb_tidak_adekuat || h.murmur_edema || h.delayed_development || h.wajah_dismorfik || h.organomegali_limfadenopati || h.ispa_cystitis || h.muntah_diare_berulang || h.diagnosa_penyakit_penyerta || h.subjective || h.objective || h.assesment || h.plan),
                              bb_tidak_adekuat: h.bb_tidak_adekuat ?? "",
                              murmur_edema: h.murmur_edema ?? "",
                              delayed_development: h.delayed_development ?? "",
                              wajah_dismorfik: h.wajah_dismorfik ?? "",
                              organomegali_limfadenopati: h.organomegali_limfadenopati ?? "",
                              ispa_cystitis: h.ispa_cystitis ?? "",
                              muntah_diare_berulang: h.muntah_diare_berulang ?? "",
                              diagnosa_penyakit_penyerta: h.diagnosa_penyakit_penyerta ?? "",
                              subjective: h.subjective ?? "",
                              objective: h.objective ?? "",
                              assesment: h.assesment ?? "",
                              plan: h.plan ?? "",
                            });
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          title="Edit"
                          style={{ width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', color: '#374151', border: 'none', cursor: 'pointer', fontSize: 14 }}
                        >✏️</button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm('Hapus entri ini?')) return;
                            const r = await fetch('/api/monitoring/antropometri', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: h.id }) });
                            if (!r.ok) { toast.error(await r.text()); return; }
                            toast.success('Dihapus');
                            const rh = await fetch(`/api/monitoring/antropometri?kohort_id=${kohort!.id}`);
                            const dh = await rh.json();
                            setHistory(dh.items || []);
                          }}
                          title="Hapus"
                          style={{ width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer', fontSize: 14 }}
                        >🗑️</button>
                      </div>
                    </td>
                  </tr>
                </Fragment>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>Belum ada data antropometri.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Medis Lanjutan */}
      {detailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setDetailOpen(false); setDetailItem(null); }} />
          <div className="relative z-10 w-full max-w-3xl rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Detail Medis Lanjutan</h3>
              <button className="px-3 py-1.5 rounded border" onClick={() => { setDetailOpen(false); setDetailItem(null); }}>Tutup</button>
            </div>
            {detailItem ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-[var(--muted-foreground)]">Kenaikan berat tidak adekuat</div>
                  <div className="font-medium">{detailItem.bb_tidak_adekuat ?? '-'}</div>
                </div>
                <div>
                  <div className="text-[var(--muted-foreground)]">Murmur/edema</div>
                  <div className="font-medium">{detailItem.murmur_edema ?? '-'}</div>
                </div>
                <div>
                  <div className="text-[var(--muted-foreground)]">Keterlambatan perkembangan</div>
                  <div className="font-medium">{detailItem.delayed_development ?? '-'}</div>
                </div>
                <div>
                  <div className="text-[var(--muted-foreground)]">Wajah dismorfik</div>
                  <div className="font-medium">{detailItem.wajah_dismorfik ?? '-'}</div>
                </div>
                <div>
                  <div className="text-[var(--muted-foreground)]">Organomegali/limfadenopati</div>
                  <div className="font-medium">{detailItem.organomegali_limfadenopati ?? '-'}</div>
                </div>
                <div>
                  <div className="text-[var(--muted-foreground)]">ISPA/cystitis berulang/berat</div>
                  <div className="font-medium">{detailItem.ispa_cystitis ?? '-'}</div>
                </div>
                <div>
                  <div className="text-[var(--muted-foreground)]">Muntah/diare berulang</div>
                  <div className="font-medium">{detailItem.muntah_diare_berulang ?? '-'}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-[var(--muted-foreground)]">Diagnosa Penyakit</div>
                  <div className="font-medium">{detailItem.diagnosa_penyakit_penyerta ?? '-'}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-[var(--muted-foreground)]">Subjective</div>
                  <div className="font-medium whitespace-pre-wrap">{detailItem.subjective ?? '-'}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-[var(--muted-foreground)]">Objective</div>
                  <div className="font-medium whitespace-pre-wrap">{detailItem.objective ?? '-'}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-[var(--muted-foreground)]">Assesment</div>
                  <div className="font-medium whitespace-pre-wrap">{detailItem.assesment ?? '-'}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-[var(--muted-foreground)]">Plan</div>
                  <div className="font-medium whitespace-pre-wrap">{detailItem.plan ?? '-'}</div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-[var(--muted-foreground)]">Tidak ada data.</div>
            )}
          </div>
        </div>
      )}

      {/* WHO-style charts */}
      {history.length > 0 && (
        <div className="mt-8 space-y-6">
          <h2 className="text-lg font-semibold">Grafik WHO (berdasarkan riwayat)</h2>
          <WhoCharts history={history} jk={balita?.jk} />
        </div>
      )}
      {history.length > 1 && (
        <div className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold">Analisis Kenaikan BB</h2>
          <DeltaBBInsights history={history} />
        </div>
      )}

      <style jsx>{`
        .input {
          width: 100%;
          height: 44px;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 14px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }
        .input:read-only {
          background: #f9fafb;
          color: #6b7280;
          cursor: not-allowed;
        }
        textarea.input {
          height: auto;
          min-height: 80px;
          resize: vertical;
        }
      `}</style>
    </div>
  );
}

function WhoCharts({ history, jk }: { history: any[]; jk?: 'L' | 'P' }) {
  const [bbuData, setBbuData] = useState<any[]>([]);
  const [tbuData, setTbuData] = useState<any[]>([]);
  const [bbtbData, setBbtbData] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      if (!jk) return;
      const jkNum = jk === 'L' ? 1 : 2;

      // Determine ranges based on history or default to 0-24 months
      const maxAge = Math.max(24, ...history.map(h => Number(h.usia_bulan || 0))) + 2;
      const maxLength = Math.max(100, ...history.map(h => Number(h.tb_corr_cm || h.tb_cm || 0))) + 5;

      // --- BBU Data ---
      try {
        const r = await fetch(`/api/ref/lms-bbu?jk=${jkNum}&min_month=0&max_month=${maxAge}`);
        const d = await r.json();
        if (d.items) {
          // Merge child data
          const merged = d.items.map((item: any) => {
            const childPoints = history.filter(h => Number(h.usia_bulan) === item.umur_bulan && h.bb_kg != null);
            // If multiple points in same month, take average or last? Taking last for now.
            const childVal = childPoints.length > 0 ? Number(childPoints[childPoints.length - 1].bb_kg) : null;
            return {
              x: item.umur_bulan,
              ...item,
              sd0: item.sd0 ?? item.M, // Fallback to M if sd0 is missing
              anak: childVal
            };
          });
          setBbuData(merged);
        }
      } catch (e) { console.error("Failed to fetch BBU ref", e); }

      // --- TBU Data ---
      try {
        const r = await fetch(`/api/ref/lms-tbu?jk=${jkNum}&min_month=0&max_month=${maxAge}`);
        const d = await r.json();
        if (d.items) {
          const merged = d.items.map((item: any) => {
            const childPoints = history.filter(h => Number(h.usia_bulan) === item.umur_bulan && (h.tb_corr_cm != null || h.tb_cm != null));
            const childVal = childPoints.length > 0 ? Number(childPoints[childPoints.length - 1].tb_corr_cm ?? childPoints[childPoints.length - 1].tb_cm) : null;
            return {
              x: item.umur_bulan,
              ...item,
              sd0: item.sd0 ?? item.M, // Fallback to M
              anak: childVal
            };
          });
          setTbuData(merged);
        }
      } catch (e) { console.error("Failed to fetch TBU ref", e); }

      // --- BBTB Data ---
      try {
        // BBTB range usually starts from 45cm
        const r = await fetch(`/api/ref/lms-bbtb?jk=${jkNum}&min_length=45&max_length=${maxLength}`);
        const d = await r.json();
        if (d.items) {
          const merged = d.items.map((item: any) => {
            // Match child data by length (rounded to nearest 0.5 or 1??)
            // Reference is by 0.5 or 1 cm steps. Child data is precise.
            // We can't just map reference to child. We need to plot child points on top of reference curves.
            // Recharts 'ComposedChart' with 'Scatter' for child points might be better, or just Line with nulls.
            // But child x-axis (length) might not match reference x-axis exactly.
            // Strategy: Use reference data as the "Line" basis. Add child points as a separate "Scatter" or "Line" data?
            // Recharts XAxis type="number" allows mixing data if we combine them into one array sorted by X.
            return {
              x: item.tb_cm,
              ...item,
              sd0: item.sd0 ?? item.M, // Fallback to M
              anak: null // Placeholder, we'll add child points separately or merge carefully
            };
          });

          // Add child points that don't align exactly with reference steps
          const childPoints = history
            .filter(h => (h.tb_corr_cm != null || h.tb_cm != null) && h.bb_kg != null)
            .map(h => ({
              x: Number(h.tb_corr_cm ?? h.tb_cm),
              anak: Number(h.bb_kg)
            }));

          // Combine and sort
          const combined = [...merged, ...childPoints].sort((a, b) => a.x - b.x);
          setBbtbData(combined);
        }
      } catch (e) { console.error("Failed to fetch BBTB ref", e); }

    })();
  }, [history, jk]);

  const CommonChart = ({ data, xLabel, yLabel, title }: any) => (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-base font-semibold text-gray-800 mb-4">{title}</h3>
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis
              dataKey="x"
              type="number"
              domain={['dataMin', 'dataMax']}
              tick={{ fontSize: 12 }}
              label={{ value: xLabel, position: 'insideBottom', offset: -10, fontSize: 12 }}
              allowDuplicatedCategory={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              label={{ value: yLabel, angle: -90, position: 'insideLeft', fontSize: 12 }}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ fontSize: '12px', padding: '2px 0' }}
              labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
              formatter={(value: number) => value ? value.toFixed(2) : '-'}
            />
            <Legend verticalAlign="top" height={36} iconType="plainline" />

            {/* Reference Lines - Smooth Curves */}
            <Line type="monotone" dataKey="sd3pos" stroke="#ef4444" strokeWidth={1.5} dot={false} name="+3 SD" connectNulls />
            <Line type="monotone" dataKey="sd2pos" stroke="#f97316" strokeWidth={1.5} dot={false} name="+2 SD" connectNulls />
            <Line type="monotone" dataKey="sd1pos" stroke="#eab308" strokeWidth={1.5} dot={false} name="+1 SD" connectNulls />
            <Line type="monotone" dataKey="sd0" stroke="#22c55e" strokeWidth={2} dot={false} name="Median" connectNulls />
            <Line type="monotone" dataKey="sd1neg" stroke="#eab308" strokeWidth={1.5} dot={false} name="-1 SD" connectNulls />
            <Line type="monotone" dataKey="sd2neg" stroke="#f97316" strokeWidth={1.5} dot={false} name="-2 SD" connectNulls />
            <Line type="monotone" dataKey="sd3neg" stroke="#ef4444" strokeWidth={1.5} dot={false} name="-3 SD" connectNulls />

            {/* Child Line - Linear with Dots */}
            <Line
              type="linear"
              dataKey="anak"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 5, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ r: 7 }}
              name="Anak"
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {bbuData.length > 0 && (
        <CommonChart
          data={bbuData}
          title="Grafik Status Gizi BB Menurut Umur (BB/U)"
          xLabel="Umur (bulan)"
          yLabel="Berat Badan (kg)"
        />
      )}
      {tbuData.length > 0 && (
        <CommonChart
          data={tbuData}
          title="Grafik Status Gizi TB Menurut Umur (TB/U)"
          xLabel="Umur (bulan)"
          yLabel="Tinggi Badan (cm)"
        />
      )}
      {bbtbData.length > 0 && (
        <CommonChart
          data={bbtbData}
          title="Grafik Status Gizi BB Menurut TB (BB/TB)"
          xLabel="Tinggi Badan (cm)"
          yLabel="Berat Badan (kg)"
        />
      )}
    </div>
  );
}

function DeltaBBInsights({ history }: { history: any[] }) {
  // build weekly delta from sorted history by minggu_ke
  const sorted = [...history].sort((a, b) => a.minggu_ke - b.minggu_ke);
  const data: any[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    if (prev.bb_kg != null && cur.bb_kg != null) {
      const delta = Number(cur.bb_kg) - Number(prev.bb_kg);
      const low = Number(cur.bb_kg) * 0.005;
      const high = Number(cur.bb_kg) * 0.01;
      data.push({
        week: cur.minggu_ke,
        delta,
        low,
        high,
        status: delta < low ? 'kurang' : delta > high ? 'lebih' : 'sesuai'
      });
    }
  }

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-800">Analisis Kenaikan Berat Badan (ΔBB)</h3>
        <p className="text-sm text-gray-500">Perbandingan kenaikan BB per minggu dengan rekomendasi 5–10 gram/kg BB.</p>
      </div>

      <div className="h-[300px] w-full mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 12 }}
              label={{ value: 'Minggu Ke', position: 'insideBottom', offset: -10, fontSize: 12 }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              label={{ value: 'ΔBB (kg)', angle: -90, position: 'insideLeft', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(value: number, name: string) => [value.toFixed(3) + ' kg', name === 'delta' ? 'ΔBB Anak' : name === 'low' ? 'Min. Rekom' : 'Max. Rekom']}
            />
            <Legend verticalAlign="top" height={36} />

            <Area type="monotone" dataKey="high" stackId="1" stroke="none" fill="#dcfce7" name="Area Rekomendasi" />
            <Area type="monotone" dataKey="low" stackId="2" stroke="none" fill="#ffffff" name="Area Bawah" />

            <Line type="monotone" dataKey="high" stroke="#22c55e" strokeDasharray="5 5" dot={false} name="Max. Rekom" />
            <Line type="monotone" dataKey="low" stroke="#ef4444" strokeDasharray="5 5" dot={false} name="Min. Rekom" />
            <Line
              type="monotone"
              dataKey="delta"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
              name="ΔBB Anak"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-gray-700">
          <thead className="bg-gray-50">
            <tr>
              <th className="border border-gray-200 p-3 text-left font-medium text-gray-600">Minggu</th>
              <th className="border border-gray-200 p-3 text-left font-medium text-gray-600">ΔBB (kg)</th>
              <th className="border border-gray-200 p-3 text-left font-medium text-gray-600">Rekom (kg)</th>
              <th className="border border-gray-200 p-3 text-left font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map(d => {
              const cls = d.status === 'sesuai' ? 'text-emerald-600 font-medium' : d.status === 'lebih' ? 'text-orange-600' : 'text-red-600 font-medium';
              return (
                <tr key={d.week} className="hover:bg-gray-50 transition-colors">
                  <td className="border border-gray-200 p-3">{d.week}</td>
                  <td className="border border-gray-200 p-3">{d.delta.toFixed(3)}</td>
                  <td className="border border-gray-200 p-3">{d.low.toFixed(3)} – {d.high.toFixed(3)}</td>
                  <td className={`border border-gray-200 p-3 ${cls}`}>
                    {d.status === 'sesuai' ? 'Sesuai' : d.status === 'lebih' ? 'Di Atas' : 'Di Bawah'}
                  </td>
                </tr>
              );
            })}
            {data.length === 0 && (
              <tr>
                <td className="border border-gray-200 p-4 text-center text-gray-500" colSpan={4}>Belum cukup data untuk analisis (minimal 2 pengukuran).</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
