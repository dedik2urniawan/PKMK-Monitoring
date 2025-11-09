"use client";
import { useEffect, useMemo, useState, Fragment } from "react";
import { useParams } from "next/navigation";
import SimpleChart from "@/components/SimpleChart";
import { toast } from "sonner";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

type Kohort = { id: string; periode_mulai?: string } | null;

export default function NewAntropometri() {
  const params = useParams<{ balitaId: string }>();
  const [kohort, setKohort] = useState<Kohort>(null);
  const [balitaName, setBalitaName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [balita, setBalita] = useState<{ jk: 'L'|'P'; tgl_lahir: string }|null>(null);
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
  const [deltaInfo, setDeltaInfo] = useState<{ low: number; high: number; status: 'kurang'|'sesuai'|'lebih'|null }|null>(null);
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
      if (it?.jk && it?.tgl_lahir) setBalita({ jk: it.jk as 'L'|'P', tgl_lahir: it.tgl_lahir });
    })();
  }, [params.balitaId]);

  useEffect(() => {
    if (!kohort) return;
    (async () => {
      const rh = await fetch(`/api/monitoring/antropometri?kohort_id=${kohort.id}`);
      const dh = await rh.json();
      setHistory(dh.items || []);
    })();
  }, [kohort]);

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
            setOutlier((o)=>({ ...o, bbu: z < -6 || z > 5 }));
          } else setLmsWarn((w) => ({ ...w, bbu: true }));
        }
        // TBU by month using tb_corr
        if (!isNaN(tbCorr)) {
          const rt = await fetch(`/api/ref/lms-tbu?jk=${jkNum}&month=${umur}`);
          const lt = await rt.json();
          if (lt.item) {
            const zt = lmsZ(tbCorr, lt.item.L, lt.item.M, lt.item.S);
            setForm((f) => ({ ...f, zs_tbu: zt.toFixed(3), klas_tbu: klasTBU(zt) }));
            setOutlier((o)=>({ ...o, tbu: zt < -6 || zt > 6 }));
          } else setLmsWarn((w) => ({ ...w, tbu: true }));
        }
        // BBTB by length
        if (!isNaN(bb) && !isNaN(tbCorr)) {
          const rl = await fetch(`/api/ref/lms-bbtb?jk=${jkNum}&length=${tbCorr}`);
          const ll = await rl.json();
          if (ll.item) {
            const zb = lmsZ(bb, ll.item.L, ll.item.M, ll.item.S);
            setForm((f) => ({ ...f, zs_bbtb: zb.toFixed(3), klas_bbtb: klasBBTB(zb) }));
            setOutlier((o)=>({ ...o, bbtb: zb < -5 || zb > 5 }));
          } else setLmsWarn((w) => ({ ...w, bbtb: true }));
        }
      } catch {}
    })();
  }, [balita, form.usia_bulan, form.bb_kg, form.tb_corr_cm, form.tanggal]);

  // Recalculate delta BB and recommendation when BB or minggu_ke changes
  useEffect(() => {
    const bb = Number(form.bb_kg);
    if (isNaN(bb) || !history || history.length === 0) { setDeltaInfo(null); return; }
    // Find previous week entry (< current minggu_ke) with highest minggu_ke
    const prev = history
      .filter((h:any) => typeof form.minggu_ke === 'number' ? h.minggu_ke < form.minggu_ke : true)
      .sort((a:any,b:any)=> b.minggu_ke - a.minggu_ke)[0];
    if (prev && prev.bb_kg != null) {
      const delta = bb - Number(prev.bb_kg);
      setForm((f)=>({...f, delta_bb_kg: delta.toFixed(3)}));
      // Recommendation: 5–10 gram per kg BB saat ini
      const low = bb * 0.005; // kg
      const high = bb * 0.01; // kg
      let status: 'kurang'|'sesuai'|'lebih' = 'kurang';
      if (delta < low) status = 'kurang'; else if (delta > high) status = 'lebih'; else status = 'sesuai';
      setDeltaInfo({ low, high, status });
    } else {
      setDeltaInfo(null);
    }
  }, [form.bb_kg, form.minggu_ke, history]);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!(form.minggu_ke >= 1 && form.minggu_ke <= 12)) e.minggu_ke = "Minggu ke harus 1–12";
    if (!form.tanggal) e.tanggal = "Wajib diisi";
    if (!form.cara_ukur) e.cara_ukur = "Wajib diisi";
    return e;
  }, [form]);

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
    const res = await fetch("/api/monitoring/antropometri", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
    });
    setSaving(false);
    if (!res.ok) { const t = await res.text(); setMsg(t); toast.error(t); return; }
    setMsg("Tersimpan."); toast.success(editingId?"Perubahan disimpan":"Tersimpan");
    try {
      const rh = await fetch(`/api/monitoring/antropometri?kohort_id=${kohort.id}`);
      const dh = await rh.json();
      setHistory(dh.items || []);
      setEditingId(null);
    } catch {}
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold mb-2">Tambah Monitoring: Antropometri</h1>
      {(balitaName || kohort) && (
        <p className="mb-4 text-sm text-[var(--muted-foreground)]">
          {balitaName ? <><span className="font-medium">{balitaName}</span> — </> : null}
          {kohort ? <>Kohort mulai {new Date(kohort.periode_mulai as any).toLocaleDateString('id-ID')}</> : "Kohort belum dimulai"}
        </p>
      )}
      {!kohort && (
        <div className="mb-3 text-sm p-3 rounded bg-yellow-50 text-yellow-800">Balita belum memiliki kohort aktif.</div>
      )}
      {msg && <div className="mb-3 text-sm p-3 rounded bg-blue-50">{msg}</div>}
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div><label className="text-sm">Minggu Ke*</label>
          <input type="number" min={1} max={12} value={form.minggu_ke} onChange={(e)=>setForm({...form, minggu_ke: Number(e.target.value)})} className="input" required />
          {errors.minggu_ke && <p className="text-xs text-red-600 mt-1">{errors.minggu_ke}</p>}</div>
        <div><label className="text-sm">Tanggal Pengukuran Balita*</label>
          <input type="date" value={form.tanggal} onChange={(e)=>setForm({...form, tanggal: e.target.value})} className="input" required />
          {errors.tanggal && <p className="text-xs text-red-600 mt-1">{errors.tanggal}</p>}</div>
        <div><label className="text-sm">Cara Ukur*</label>
          <select value={form.cara_ukur} onChange={(e)=>setForm({...form, cara_ukur: e.target.value})} className="input" required>
            <option value="terlentang">terlentang</option>
            <option value="berdiri">berdiri</option>
          </select>
          {errors.cara_ukur && <p className="text-xs text-red-600 mt-1">{errors.cara_ukur}</p>}
          <p className="text-xs text-[var(--muted-foreground)] mt-1" title="Koreksi TB: &lt;24 bln & berdiri = +0.7cm; ≥24 bln & terlentang = -0.7cm">
            Aturan koreksi: usia &lt; 24 bln &amp; berdiri → +0.7cm; usia ≥ 24 bln &amp; terlentang → -0.7cm
          </p>
        </div>

        <div><label className="text-sm">Usia (bulan)</label><input className="input" type="number" value={form.usia_bulan} readOnly /></div>
        <div><label className="text-sm">BB (kg)</label><input className="input" type="number" step="0.001" value={form.bb_kg} onChange={(e)=>setForm({...form, bb_kg: e.target.value})} /></div>
        <div><label className="text-sm">TB (cm)</label><input className="input" type="number" step="0.01" value={form.tb_cm} onChange={(e)=>setForm({...form, tb_cm: e.target.value})} /></div>
        <div>
          <label className="text-sm">TB Corr (cm)</label>
          <input className="input" type="number" step="0.01" value={form.tb_corr_cm} readOnly />
          {corrBadge && (
            <span className="mt-1 inline-flex text-xs items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5">
              Koreksi {corrBadge}
            </span>
          )}
        </div>
        <div><label className="text-sm">LILA (cm)</label><input className="input" type="number" step="0.01" value={form.lila_cm} onChange={(e)=>setForm({...form, lila_cm: e.target.value})} /></div>

        <div>
          <label className="text-sm">ZS-BBU</label>
          <input className="input" type="text" value={form.zs_bbu} readOnly />
          {lmsWarn.bbu && <p className="text-xs text-yellow-700 mt-1">Referensi LMS BBU tidak ditemukan.</p>}
          {outlier.bbu && <p className="text-xs text-red-600 mt-1">Outlier: nilai ZS-BBU di luar rentang wajar (&lt;-6 atau &gt;5).</p>}
        </div>
        <div>
          <label className="text-sm">ZS-TBU</label>
          <input className="input" type="text" value={form.zs_tbu} readOnly />
          {lmsWarn.tbu && <p className="text-xs text-yellow-700 mt-1">Referensi LMS TBU tidak ditemukan.</p>}
          {outlier.tbu && <p className="text-xs text-red-600 mt-1">Outlier: nilai ZS-TBU di luar rentang wajar (&lt;-6 atau &gt;6).</p>}
        </div>
        <div>
          <label className="text-sm">ZS-BBTB</label>
          <input className="input" type="text" value={form.zs_bbtb} readOnly />
          {lmsWarn.bbtb && <p className="text-xs text-yellow-700 mt-1">Referensi LMS BBTB tidak ditemukan.</p>}
          {outlier.bbtb && <p className="text-xs text-red-600 mt-1">Outlier: nilai ZS-BBTB di luar rentang wajar (&lt;-5 atau &gt;5).</p>}
        </div>

        <div><label className="text-sm">Klas BBU</label><input className="input" value={form.klas_bbu} readOnly /></div>
        <div><label className="text-sm">Klas TBU</label><input className="input" value={form.klas_tbu} readOnly /></div>
        <div><label className="text-sm">Klas BBTB</label><input className="input" value={form.klas_bbtb} readOnly /></div>
        <div>
          <label className="text-sm">ΔBB (kg)</label>
          <input className="input" type="number" step="0.001" value={form.delta_bb_kg} readOnly />
          {deltaInfo && (
            <p className="text-xs mt-1" title="Rekomendasi kenaikan mingguan 5–10 gram per kg BB saat ini">
              Rekomendasi: {deltaInfo.low.toFixed(3)}–{deltaInfo.high.toFixed(3)} kg —
              {" "}
              <span className={deltaInfo.status==='sesuai' ? 'text-emerald-600' : deltaInfo.status==='lebih' ? 'text-orange-600' : 'text-red-600'}>
                {deltaInfo.status === 'sesuai' ? 'sesuai' : deltaInfo.status === 'lebih' ? 'di atas' : 'di bawah'}
              </span>
            </p>
          )}
        </div>

        {/* Pemeriksaan Medis Lanjutan toggle */}
        <div className="md:col-span-2 flex items-center gap-2 py-2 border-t border-[var(--border)] mt-2">
          <input id="medis_lanjutan" type="checkbox" className="h-4 w-4" checked={form.medis_lanjutan as any}
            onChange={(e)=>{
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
            }} />
          <label htmlFor="medis_lanjutan" className="text-sm select-none">Pemeriksaan Medis Lanjutan</label>
        </div>

        {form.medis_lanjutan && (
          <>
            <div className="md:col-span-2 mt-1">
              <h3 className="text-base font-semibold mb-2">Redflag</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm">Kenaikan berat tidak adekuat walaupun asupan kalori cukup</label>
                  <select className="input" value={form.bb_tidak_adekuat} onChange={(e)=>setForm({...form, bb_tidak_adekuat: e.target.value})}>
                    <option value="">-</option>
                    <option value="ya">Ya</option>
                    <option value="tidak">Tidak</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm">Kelainan jantung bawaan (murmur, edema)</label>
                  <select className="input" value={form.murmur_edema} onChange={(e)=>setForm({...form, murmur_edema: e.target.value})}>
                    <option value="">-</option>
                    <option value="ya">Ya</option>
                    <option value="tidak">Tidak</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm">Keterlambatan perkembangan</label>
                  <select className="input" value={form.delayed_development} onChange={(e)=>setForm({...form, delayed_development: e.target.value})}>
                    <option value="">-</option>
                    <option value="ya">Ya</option>
                    <option value="tidak">Tidak</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm">Wajah dismorfik</label>
                  <select className="input" value={form.wajah_dismorfik} onChange={(e)=>setForm({...form, wajah_dismorfik: e.target.value})}>
                    <option value="">-</option>
                    <option value="ya">Ya</option>
                    <option value="tidak">Tidak</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm">Organomegali atau limfadenopati</label>
                  <select className="input" value={form.organomegali_limfadenopati} onChange={(e)=>setForm({...form, organomegali_limfadenopati: e.target.value})}>
                    <option value="">-</option>
                    <option value="ya">Ya</option>
                    <option value="tidak">Tidak</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm">Infeksi saluran napas/ kulit/ kemih berulang/berat</label>
                  <select className="input" value={form.ispa_cystitis} onChange={(e)=>setForm({...form, ispa_cystitis: e.target.value})}>
                    <option value="">-</option>
                    <option value="ya">Ya</option>
                    <option value="tidak">Tidak</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm">Muntah atau diare berulang</label>
                  <select className="input" value={form.muntah_diare_berulang} onChange={(e)=>setForm({...form, muntah_diare_berulang: e.target.value})}>
                    <option value="">-</option>
                    <option value="ya">Ya</option>
                    <option value="tidak">Tidak</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm">Diagnosa Penyakit (jika ada)</label>
                  <input className="input" type="text" value={form.diagnosa_penyakit_penyerta} onChange={(e)=>setForm({...form, diagnosa_penyakit_penyerta: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="md:col-span-2 mt-4">
              <h3 className="text-base font-semibold mb-2">SOAP</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="text-sm">Subjective</label>
                  <textarea className="input" rows={4} value={form.subjective} onChange={(e)=>setForm({...form, subjective: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm">Objective</label>
                  <textarea className="input" rows={4} value={form.objective} onChange={(e)=>setForm({...form, objective: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm">Assesment</label>
                  <textarea className="input" rows={4} value={form.assesment} onChange={(e)=>setForm({...form, assesment: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm">Plan</label>
                  <textarea className="input" rows={4} value={form.plan} onChange={(e)=>setForm({...form, plan: e.target.value})} />
                </div>
              </div>
            </div>
          </>
        )}

        <div className="md:col-span-2 flex items-center gap-2">
          <button disabled={saving || Object.keys(errors).length>0} className="px-4 py-2 bg-[var(--primary-600)] hover:bg-[var(--primary-700)] text-white rounded">{saving?"Menyimpan...": editingId?"Perbarui":"Simpan"}</button>
          {editingId && (
            <button type="button" onClick={()=>{setEditingId(null); setForm({ minggu_ke:1, tanggal:"", cara_ukur:"terlentang", usia_bulan:"", bb_kg:"", tb_cm:"", tb_corr_cm:"", lila_cm:"", zs_bbu:"", zs_tbu:"", zs_bbtb:"", klas_bbu:"", klas_tbu:"", klas_bbtb:"", delta_bb_kg:"", medis_lanjutan:false, bb_tidak_adekuat:"", murmur_edema:"", delayed_development:"", wajah_dismorfik:"", organomegali_limfadenopati:"", ispa_cystitis:"", muntah_diare_berulang:"", diagnosa_penyakit_penyerta:"", subjective:"", objective:"", assesment:"", plan:""}); }} className="px-3 py-2 border rounded">Batal</button>
          )}
        </div>
      </form>

      {/* Riwayat */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Riwayat Antropometri</h2>
        <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <Table>
            <TableHeader className="bg-[var(--background)]">
              <TableRow>
                <TableHead>Minggu</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Cara</TableHead>
                <TableHead>BB</TableHead>
                <TableHead>TB</TableHead>
                <TableHead>LILA</TableHead>
                <TableHead>ZS-BBU</TableHead>
                <TableHead>ZS-TBU</TableHead>
                <TableHead>ZS-BBTB</TableHead>
                <TableHead>Klas BBU</TableHead>
                <TableHead>Klas TBU</TableHead>
                <TableHead>Klas BBTB</TableHead>
                <TableHead>ΔBB (kg)</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((h:any) => (
                <Fragment key={h.id}>
                <TableRow>
                  <TableCell>{h.minggu_ke}</TableCell>
                  <TableCell>{new Date(h.tanggal).toLocaleDateString('id-ID')}</TableCell>
                  <TableCell>{h.cara_ukur}</TableCell>
                  <TableCell>{h.bb_kg ?? '-'}</TableCell>
                  <TableCell>{h.tb_cm ?? '-'}</TableCell>
                  <TableCell>{h.lila_cm ?? '-'}</TableCell>
                  <TableCell>{h.zs_bbu ?? '-'}</TableCell>
                  <TableCell>{h.zs_tbu ?? '-'}</TableCell>
                  <TableCell>{h.zs_bbtb ?? '-'}</TableCell>
                  <TableCell>{h.klas_bbu ?? '-'}</TableCell>
                  <TableCell>{h.klas_tbu ?? '-'}</TableCell>
                  <TableCell>{h.klas_bbtb ?? '-'}</TableCell>
                  <TableCell>{h.delta_bb_kg ?? '-'}</TableCell>
                  <TableCell>
                    <div className="mb-1">
                      <button
                        type="button"
                        onClick={()=>{ if(!hasMedis(h)){ toast.info('Tidak ada detail medis untuk entri ini'); return;} setDetailItem(h); setDetailOpen(true); }}
                        className={"inline-flex items-center rounded-full border px-2 py-0.5 text-xs transition-colors " + (hasMedis(h) ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200")}
                        aria-label="Lihat detail medis"
                        title="Lihat detail medis"
                      >
                        Medis: {hasMedis(h) ? 'Ya' : 'Tidak'}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasMedis(h) && (
                        <button
                          type="button"
                          className="text-[var(--primary-700)] underline"
                          onClick={() => { setExpandedId(expandedId === h.id ? null : h.id); }}
                        >
                          Lihat detail
                        </button>
                      )}
                      <button className="text-[var(--primary-700)] underline" onClick={() => { setEditingId(h.id); setForm({ minggu_ke: h.minggu_ke, tanggal: h.tanggal.slice(0,10), cara_ukur: h.cara_ukur, usia_bulan: h.usia_bulan?.toString() ?? "", bb_kg: h.bb_kg?.toString() ?? "", tb_cm: h.tb_cm?.toString() ?? "", tb_corr_cm: h.tb_corr_cm?.toString() ?? "", lila_cm: h.lila_cm?.toString() ?? "", zs_bbu: h.zs_bbu?.toString() ?? "", zs_tbu: h.zs_tbu?.toString() ?? "", zs_bbtb: h.zs_bbtb?.toString() ?? "", klas_bbu: h.klas_bbu ?? "", klas_tbu: h.klas_tbu ?? "", klas_bbtb: h.klas_bbtb ?? "", delta_bb_kg: h.delta_bb_kg?.toString() ?? "",
                        // set medis lanjutan fields
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
                      }); }}>Edit</button>
                      <button className="text-red-600 underline" onClick={async ()=>{ if(!confirm('Hapus entri ini?')) return; const r = await fetch('/api/monitoring/antropometri', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: h.id }) }); if(!r.ok){ toast.error(await r.text()); return;} toast.success('Dihapus'); const rh = await fetch(`/api/monitoring/antropometri?kohort_id=${kohort!.id}`); const dh = await rh.json(); setHistory(dh.items||[]); }}>Hapus</button>
                    </div>
                  </TableCell>
                </TableRow>
                {expandedId === h.id && (
                  <TableRow>
                    <TableCell colSpan={14}>
                      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-base font-semibold">Detail Medis Lanjutan</h3>
                          <button
                            type="button"
                            className="px-2 py-1 text-xs rounded border"
                            onClick={() => setExpandedId(null)}
                          >Tutup</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-semibold mb-2">Redflag</div>
                            <div className="space-y-1">
                              <div><span className="text-[var(--muted-foreground)]">Kenaikan berat tak adekuat: </span><span className="font-medium">{h.bb_tidak_adekuat ?? '-'}</span></div>
                              <div><span className="text-[var(--muted-foreground)]">Murmur/edema: </span><span className="font-medium">{h.murmur_edema ?? '-'}</span></div>
                              <div><span className="text-[var(--muted-foreground)]">Keterlambatan perkembangan: </span><span className="font-medium">{h.delayed_development ?? '-'}</span></div>
                              <div><span className="text-[var(--muted-foreground)]">Wajah dismorfik: </span><span className="font-medium">{h.wajah_dismorfik ?? '-'}</span></div>
                              <div><span className="text-[var(--muted-foreground)]">Organomegali/limfadenopati: </span><span className="font-medium">{h.organomegali_limfadenopati ?? '-'}</span></div>
                              <div><span className="text-[var(--muted-foreground)]">ISPA/cystitis berulang/berat: </span><span className="font-medium">{h.ispa_cystitis ?? '-'}</span></div>
                              <div><span className="text-[var(--muted-foreground)]">Muntah/diare berulang: </span><span className="font-medium">{h.muntah_diare_berulang ?? '-'}</span></div>
                              <div><span className="text-[var(--muted-foreground)]">Diagnosa Penyakit: </span><span className="font-medium">{h.diagnosa_penyakit_penyerta ?? '-'}</span></div>
                            </div>
                          </div>
                          <div>
                            <div className="font-semibold mb-2">SOAP</div>
                            <div className="space-y-2">
                              <div>
                                <div className="text-[var(--muted-foreground)]">Subjective</div>
                                <div className="font-medium whitespace-pre-wrap">{h.subjective ?? '-'}</div>
                              </div>
                              <div>
                                <div className="text-[var(--muted-foreground)]">Objective</div>
                                <div className="font-medium whitespace-pre-wrap">{h.objective ?? '-'}</div>
                              </div>
                              <div>
                                <div className="text-[var(--muted-foreground)]">Assesment</div>
                                <div className="font-medium whitespace-pre-wrap">{h.assesment ?? '-'}</div>
                              </div>
                              <div>
                                <div className="text-[var(--muted-foreground)]">Plan</div>
                                <div className="font-medium whitespace-pre-wrap">{h.plan ?? '-'}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                </Fragment>
              ))}
              {history.length === 0 && (
                <TableRow>
                  <TableCell colSpan={14} className="text-center text-[var(--muted-foreground)]">Belum ada data antropometri.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal Detail Medis Lanjutan */}
      {detailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={()=>{setDetailOpen(false); setDetailItem(null);}} />
          <div className="relative z-10 w-full max-w-3xl rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Detail Medis Lanjutan</h3>
              <button className="px-3 py-1.5 rounded border" onClick={()=>{setDetailOpen(false); setDetailItem(null);}}>Tutup</button>
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

      <style jsx>{`.input{width:100%;border:1px solid #d1d5db;border-radius:.5rem;padding:.5rem .75rem;}`}</style>
    </div>
  );
}

function WhoCharts({ history, jk }: { history: any[]; jk?: 'L'|'P' }) {
  const [bbuRef, setBbuRef] = useState<{ month: number; values: Record<string, number> }[]>([]);
  const [tbuRef, setTbuRef] = useState<{ month: number; values: Record<string, number> }[]>([]);
  const [bbtbRef, setBbtbRef] = useState<{ len: number; values: Record<string, number> }[]>([]);

  useEffect(() => {
    (async () => {
      if (!jk || history.length === 0) return;
      const jkNum = jk === 'L' ? 1 : 2;
      // derive months from history (if usia not available, estimate from tanggal differences is complex; here we use the stored usia_bulan in each history if available; else skip)
      const months = Array.from(new Set(history
        .map((h) => Number(h.usia_bulan))
        .filter((v) => !isNaN(v)))).sort((a,b)=>a-b);
      if (months.length === 0) return;
      let minM = months[0];
      let maxM = months[months.length-1];
      if (minM === maxM) { minM = Math.max(0, minM-3); maxM = Math.min(60, maxM+3); }
      const reqMonths:number[] = [];
      for (let m=minM; m<=maxM; m++) reqMonths.push(m);

      // helper to get x for given z
      function xForZ(L:number,M:number,S:number,z:number){
        if (L===0) return M*Math.exp(S*z);
        return M*Math.pow(1+L*S*z,1/L);
      }

      // BBU
      const bbu: { month:number; values: Record<string, number> }[] = [];
      for (const m of reqMonths) {
        const r = await fetch(`/api/ref/lms-bbu?jk=${jkNum}&month=${m}`);
        const d = await r.json();
        if (d.item) {
          const vals: Record<string, number> = {};
          for (const z of [-3,-2,-1,0,1,2,3]) vals[z.toString()] = xForZ(d.item.L,d.item.M,d.item.S, z);
          bbu.push({ month: m, values: vals });
        }
      }
      setBbuRef(bbu);

      // TBU
      const tbu: { month:number; values: Record<string, number> }[] = [];
      for (const m of reqMonths) {
        const r = await fetch(`/api/ref/lms-tbu?jk=${jkNum}&month=${m}`);
        const d = await r.json();
        if (d.item) {
          const vals: Record<string, number> = {};
          for (const z of [-3,-2,-1,0,1,2,3]) vals[z.toString()] = xForZ(d.item.L,d.item.M,d.item.S, z);
          tbu.push({ month: m, values: vals });
        }
      }
      setTbuRef(tbu);

      // BBTB: generate by length domain from child data
      const pointsLen = history
        .map((h) => Number(h.tb_corr_cm ?? h.tb_cm))
        .filter((v) => !isNaN(v));
      if (pointsLen.length > 0) {
        let minL = Math.min(...pointsLen);
        let maxL = Math.max(...pointsLen);
        if (minL === maxL) { minL = Math.max(30, minL - 3); maxL = Math.min(120, maxL + 3); }
        const reqLen: number[] = [];
        for (let L = Math.round(minL*2)/2; L <= Math.round(maxL*2)/2; L += 0.5) reqLen.push(Number(L.toFixed(1)));
        const arr: { len:number; values: Record<string, number> }[] = [];
        for (const Lval of reqLen) {
          const r = await fetch(`/api/ref/lms-bbtb?jk=${jkNum}&length=${Lval}`);
          const d = await r.json();
          if (d.item) {
            const vals: Record<string, number> = {};
            for (const z of [-3,-2,-1,0,1,2,3]) vals[z.toString()] = xForZ(d.item.L,d.item.M,d.item.S, z);
            arr.push({ len: Lval, values: vals });
          }
        }
        setBbtbRef(arr);
      }
    })();
  }, [history, jk]);

  // Build child series from history
  const pointsBB = history
    .filter((h) => typeof h.usia_bulan !== 'undefined' && h.bb_kg != null)
    .map((h) => ({ x: Number(h.usia_bulan), y: Number(h.bb_kg) }))
    .sort((a,b)=>a.x-b.x);
  const pointsTB = history
    .filter((h) => typeof h.usia_bulan !== 'undefined' && (h.tb_corr_cm != null || h.tb_cm != null))
    .map((h) => ({ x: Number(h.usia_bulan), y: Number(h.tb_corr_cm ?? h.tb_cm) }))
    .sort((a,b)=>a.x-b.x);
  const pointsBBTB = history
    .filter((h)=> (h.tb_corr_cm != null || h.tb_cm != null) && h.bb_kg != null)
    .map((h)=> ({ x: Number(h.tb_corr_cm ?? h.tb_cm), y: Number(h.bb_kg) }))
    .sort((a,b)=>a.x-b.x);

  return (
    <div className="space-y-6">
      {pointsBB.length>0 && bbuRef.length>0 && (
        <div>
          <div className="mb-1 text-sm text-[var(--muted-foreground)]">BB (kg) vs Umur (bulan)</div>
          <SimpleChart
            height={260}
            xLabel="Bulan"
            yLabel="BB (kg)"
            series={[
              { name: "Anak", color: "#0ea5e9", points: pointsBB, legend: true },
              { name: "-3 SD", color: "#9ca3af", points: bbuRef.map(r=>({x:r.month,y:r.values['-3']})), dashed: true },
              { name: "-2 SD", color: "#ef4444", points: bbuRef.map(r=>({x:r.month,y:r.values['-2']})), dashed: true, legend: true },
              { name: "-1 SD", color: "#9ca3af", points: bbuRef.map(r=>({x:r.month,y:r.values['-1']})), dashed: true },
              { name: "Median", color: "#6b7280", points: bbuRef.map(r=>({x:r.month,y:r.values['0']})), dashed: true, legend: true },
              { name: "+1 SD", color: "#9ca3af", points: bbuRef.map(r=>({x:r.month,y:r.values['1']})), dashed: true },
              { name: "+2 SD", color: "#22c55e", points: bbuRef.map(r=>({x:r.month,y:r.values['2']})), dashed: true, legend: true },
              { name: "+3 SD", color: "#9ca3af", points: bbuRef.map(r=>({x:r.month,y:r.values['3']})), dashed: true },
            ]}
          />
        </div>
      )}

      {pointsTB.length>0 && tbuRef.length>0 && (
        <div>
          <div className="mb-1 text-sm text-[var(--muted-foreground)]">TB (cm, terkoreksi) vs Umur (bulan)</div>
          <SimpleChart
            height={260}
            xLabel="Bulan"
            yLabel="TB (cm)"
            series={[
              { name: "Anak", color: "#0ea5e9", points: pointsTB, legend: true },
              { name: "-3 SD", color: "#9ca3af", points: tbuRef.map(r=>({x:r.month,y:r.values['-3']})), dashed: true },
              { name: "-2 SD", color: "#ef4444", points: tbuRef.map(r=>({x:r.month,y:r.values['-2']})), dashed: true, legend: true },
              { name: "-1 SD", color: "#9ca3af", points: tbuRef.map(r=>({x:r.month,y:r.values['-1']})), dashed: true },
              { name: "Median", color: "#6b7280", points: tbuRef.map(r=>({x:r.month,y:r.values['0']})), dashed: true, legend: true },
              { name: "+1 SD", color: "#9ca3af", points: tbuRef.map(r=>({x:r.month,y:r.values['1']})), dashed: true },
              { name: "+2 SD", color: "#22c55e", points: tbuRef.map(r=>({x:r.month,y:r.values['2']})), dashed: true, legend: true },
              { name: "+3 SD", color: "#9ca3af", points: tbuRef.map(r=>({x:r.month,y:r.values['3']})), dashed: true },
            ]}
          />
        </div>
      )}

      {pointsBBTB.length>0 && bbtbRef.length>0 && (
        <div>
          <div className="mb-1 text-sm text-[var(--muted-foreground)]">BB (kg) vs TB Corr (cm)</div>
          <SimpleChart
            height={260}
            xLabel="TB Corr (cm)"
            yLabel="BB (kg)"
            series={[
              { name: "Anak", color: "#0ea5e9", points: pointsBBTB, legend: true },
              { name: "-3 SD", color: "#9ca3af", points: bbtbRef.map(r=>({x:r.len,y:r.values['-3']})), dashed: true, showPoints: false },
              { name: "-2 SD", color: "#ef4444", points: bbtbRef.map(r=>({x:r.len,y:r.values['-2']})), dashed: true, legend: true, showPoints: false },
              { name: "-1 SD", color: "#9ca3af", points: bbtbRef.map(r=>({x:r.len,y:r.values['-1']})), dashed: true, showPoints: false },
              { name: "Median", color: "#6b7280", points: bbtbRef.map(r=>({x:r.len,y:r.values['0']})), dashed: true, legend: true, showPoints: false },
              { name: "+1 SD", color: "#9ca3af", points: bbtbRef.map(r=>({x:r.len,y:r.values['1']})), dashed: true, showPoints: false },
              { name: "+2 SD", color: "#22c55e", points: bbtbRef.map(r=>({x:r.len,y:r.values['2']})), dashed: true, legend: true, showPoints: false },
              { name: "+3 SD", color: "#9ca3af", points: bbtbRef.map(r=>({x:r.len,y:r.values['3']})), dashed: true, showPoints: false },
            ]}
          />
        </div>
      )}
    </div>
  );
}

function DeltaBBInsights({ history }:{ history:any[] }){
  // build weekly delta from sorted history by minggu_ke
  const sorted = [...history].sort((a,b)=>a.minggu_ke-b.minggu_ke);
  const deltas: { week:number; delta:number; low:number; high:number }[] = [];
  for (let i=1;i<sorted.length;i++){
    const prev = sorted[i-1];
    const cur = sorted[i];
    if (prev.bb_kg!=null && cur.bb_kg!=null){
      const delta = Number(cur.bb_kg) - Number(prev.bb_kg);
      const low = Number(cur.bb_kg) * 0.005;
      const high = Number(cur.bb_kg) * 0.01;
      deltas.push({ week: cur.minggu_ke, delta, low, high });
    }
  }
  const series = [
    { name: 'ΔBB Anak', color: '#0ea5e9', points: deltas.map(d=>({x:d.week,y:d.delta})), legend: true },
    { name: 'Rekom Low', color: '#ef4444', points: deltas.map(d=>({x:d.week,y:d.low})), dashed: true, showPoints:false, legend: true },
    { name: 'Rekom High', color: '#22c55e', points: deltas.map(d=>({x:d.week,y:d.high})), dashed: true, showPoints:false, legend: true },
  ];
  return (
    <div>
      <div className="mb-2 text-sm text-[var(--muted-foreground)]">Perbandingan kenaikan BB (kg) per minggu dengan rekomendasi 5–10 gram/kg BB.</div>
      <SimpleChart height={260} xLabel="Minggu" yLabel="ΔBB (kg)" series={series as any} />
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm text-[var(--foreground)]">
          <thead className="bg-[var(--background)]">
            <tr>
              <th className="border border-[var(--border)] p-2 text-left text-[var(--muted-foreground)]">Minggu</th>
              <th className="border border-[var(--border)] p-2 text-left text-[var(--muted-foreground)]">ΔBB (kg)</th>
              <th className="border border-[var(--border)] p-2 text-left text-[var(--muted-foreground)]">Rekom (kg)</th>
              <th className="border border-[var(--border)] p-2 text-left text-[var(--muted-foreground)]">Status</th>
            </tr>
          </thead>
          <tbody>
            {deltas.map(d=>{
              const status = d.delta < d.low ? 'di bawah' : d.delta> d.high ? 'di atas' : 'sesuai';
              const cls = status==='sesuai' ? 'text-emerald-600' : status==='di atas' ? 'text-orange-600' : 'text-red-600';
              return (
                <tr key={d.week} className="even:bg-gray-50/60">
                  <td className="border border-[var(--border)] p-2">{d.week}</td>
                  <td className="border border-[var(--border)] p-2">{d.delta.toFixed(3)}</td>
                  <td className="border border-[var(--border)] p-2">{d.low.toFixed(3)}–{d.high.toFixed(3)}</td>
                  <td className={`border border-[var(--border)] p-2 ${cls}`}>{status}</td>
                </tr>
              );
            })}
            {deltas.length===0 && (
              <tr>
                <td className="border border-[var(--border)] p-2 text-center text-[var(--muted-foreground)]" colSpan={4}>Belum cukup data untuk analisis.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
