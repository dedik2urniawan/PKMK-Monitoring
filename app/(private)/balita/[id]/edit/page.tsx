"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

type FormVals = {
  nik?: string;
  nama_balita: string;
  jk: "L" | "P";
  tgl_lahir: string;
  nama_ortu?: string;
  kab_kota?: string;
  kec?: string;
  desa_kel?: string;
  posyandu?: string;
  rt?: string;
  rw?: string;
  alamat?: string;
  bb_lahir_kg?: number | "";
  tb_lahir_cm?: number | "";
  puskesmas_id?: string;
  bb_tidak_adekuat?: string;
  murmur_edema?: string;
  delayed_development?: string;
  wajah_dismorfik?: string;
  organomegali_limfadenopati?: string;
  ispa_cystitis?: string;
  muntah_diare_berulang?: string;
  diagnosa_penyakit_penyerta?: string;
  keterangan_redflag?: string;
};

export default function EditBalitaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [values, setValues] = useState<FormVals | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function set<K extends keyof FormVals>(key: K, val: FormVals[K]) {
    setValues((v) => ({ ...(v as FormVals), [key]: val }));
  }

  useEffect(() => {
    (async () => {
      try {
        const base = (typeof window !== 'undefined' ? window.location.origin : '') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const res = await fetch(`${base}/api/balita/detail?id=${encodeURIComponent(params.id)}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(await res.text());
        const j = await res.json();
        const d = j.item;
        setValues({
          nik: d.nik ?? "",
          nama_balita: d.nama_balita ?? "",
          jk: d.jk ?? "L",
          tgl_lahir: (d.tgl_lahir ?? '').toString().slice(0,10),
          nama_ortu: d.nama_ortu ?? "",
          kab_kota: d.kab_kota ?? "MALANG",
          kec: d.kec ?? "",
          desa_kel: d.desa_kel ?? "",
          posyandu: d.posyandu ?? "",
          rt: d.rt ?? "",
          rw: d.rw ?? "",
          alamat: d.alamat ?? "",
          bb_lahir_kg: d.bb_lahir_kg ?? "",
          tb_lahir_cm: d.tb_lahir_cm ?? "",
          puskesmas_id: d.puskesmas_id ?? undefined,
          bb_tidak_adekuat: d.bb_tidak_adekuat ?? "tidak",
          murmur_edema: d.murmur_edema ?? "tidak",
          delayed_development: d.delayed_development ?? "tidak",
          wajah_dismorfik: d.wajah_dismorfik ?? "tidak",
          organomegali_limfadenopati: d.organomegali_limfadenopati ?? "tidak",
          ispa_cystitis: d.ispa_cystitis ?? "tidak",
          muntah_diare_berulang: d.muntah_diare_berulang ?? "tidak",
          diagnosa_penyakit_penyerta: d.diagnosa_penyakit_penyerta ?? "",
          keterangan_redflag: d.keterangan_redflag ?? "",
        });
      } catch (e: any) {
        setMsg(e.message || 'Gagal memuat data');
      }
    })();
  }, [params.id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values) return;
    setSaving(true);
    setMsg(null);
    const payload = {
      ...values,
      bb_lahir_kg: values.bb_lahir_kg === "" ? undefined : Number(values.bb_lahir_kg),
      tb_lahir_cm: values.tb_lahir_cm === "" ? undefined : Number(values.tb_lahir_cm),
    };
    // Sertakan token + cookies untuk stabilitas auth di production
    let authHeader: Record<string,string> = {};
    try {
      const { getSupabase } = await import('@/lib/supabase/client');
      const supabase = getSupabase();
      const { data } = await supabase.auth.getSession();
      let token = data.session?.access_token;
      if (!token) { try { token = window.localStorage.getItem('sb:access_token') || undefined as any; } catch {} }
      if (token) authHeader = { Authorization: `Bearer ${token}` };
    } catch {}
    const token = (authHeader.Authorization||'').replace('Bearer ','') || undefined;
    const res = await fetch(`/api/balita/update`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader }, credentials: 'include', body: JSON.stringify({ id: params.id, access_token: token, ...payload }) });
    setSaving(false);
    if (!res.ok) { const t = await res.text(); setMsg(t); toast.error(t); return; }
    toast.success('Perubahan disimpan');
    router.push('/balita');
  }

  if (!values) return <div className="p-4">Memuat…{msg? ` (${msg})`: ''}</div>;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold mb-6">Edit Balita</h1>
      {msg && <div className="mb-4 text-sm p-3 rounded bg-red-50 text-red-700">{msg}</div>}
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="text-sm">NIK</label>
          <input value={values.nik ?? ""} onChange={(e)=>set('nik', e.target.value)} className="input" /></div>
        <div><label className="text-sm">Nama Balita*</label>
          <input value={values.nama_balita} onChange={(e)=>set('nama_balita', e.target.value)} required className="input" /></div>
        <div><label className="text-sm">JK*</label>
          <select value={values.jk} onChange={(e)=>set('jk', e.target.value as 'L'|'P')} required className="input">
            <option value="L">L</option><option value="P">P</option>
          </select></div>
        <div><label className="text-sm">Tgl Lahir*</label>
          <input type="date" value={values.tgl_lahir} onChange={(e)=>set('tgl_lahir', e.target.value)} required className="input" /></div>

        <div><label className="text-sm">Nama Ortu</label><input value={values.nama_ortu ?? ""} onChange={(e)=>set('nama_ortu', e.target.value)} className="input" /></div>
        <div><label className="text-sm">Kab/Kota</label><input value={values.kab_kota ?? "MALANG"} readOnly className="input bg-gray-50" /></div>
        <div><label className="text-sm">Kecamatan</label>
          <input value={values.kec ?? ""} onChange={(e)=>set('kec', e.target.value)} className="input" />
        </div>
        <div><label className="text-sm">Desa/Kel</label>
          <input value={values.desa_kel ?? ""} onChange={(e)=>set('desa_kel', e.target.value)} className="input" />
        </div>
        <div><label className="text-sm">Posyandu</label><input value={values.posyandu ?? ""} onChange={(e)=>set('posyandu', e.target.value)} className="input" /></div>
        <div><label className="text-sm">RT</label><input value={values.rt ?? ""} onChange={(e)=>set('rt', e.target.value)} className="input" /></div>
        <div><label className="text-sm">RW</label><input value={values.rw ?? ""} onChange={(e)=>set('rw', e.target.value)} className="input" /></div>
        <div className="md:col-span-2"><label className="text-sm">Alamat</label><input value={values.alamat ?? ""} onChange={(e)=>set('alamat', e.target.value)} className="input" /></div>

        <div><label className="text-sm">BB Lahir (kg)</label><input type="number" step="0.01" value={values.bb_lahir_kg ?? ""} onChange={(e)=>set('bb_lahir_kg', e.target.value === '' ? '' : Number(e.target.value))} className="input" /></div>
        <div><label className="text-sm">TB Lahir (cm)</label><input type="number" step="0.1" value={values.tb_lahir_cm ?? ""} onChange={(e)=>set('tb_lahir_cm', e.target.value === '' ? '' : Number(e.target.value))} className="input" /></div>

        <div className="md:col-span-2 mt-2">
          <div className="font-medium mb-2">Redflag</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {([
              ['bb_tidak_adekuat','BB tidak adekuat'],
              ['murmur_edema','Murmur/Edema'],
              ['delayed_development','Delayed Development'],
              ['wajah_dismorfik','Wajah Dismorfik'],
              ['organomegali_limfadenopati','Organomegali / Limfadenopati'],
              ['ispa_cystitis','ISPA / Cystitis'],
              ['muntah_diare_berulang','Muntah / Diare berulang'],
            ] as const).map(([k,label])=> (
              <div key={k}><label className="text-sm">{label}</label>
                <select className="input" value={(values as any)[k] ?? 'tidak'} onChange={(e)=> set(k as any, e.target.value)}>
                  <option value="tidak">Tidak</option>
                  <option value="ya">Ya</option>
                </select>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div><label className="text-sm">Diagnosa Penyerta</label>
              <input className="input" value={values.diagnosa_penyakit_penyerta ?? ''} onChange={(e)=>set('diagnosa_penyakit_penyerta', e.target.value)} />
            </div>
            <div><label className="text-sm">Keterangan Redflag</label>
              <input className="input" value={values.keterangan_redflag ?? ''} onChange={(e)=>set('keterangan_redflag', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <button disabled={saving} className="px-4 py-2 bg-[var(--primary-600)] hover:bg-[var(--primary-700)] text-white rounded">{saving? 'Menyimpan...' : 'Simpan Perubahan'}</button>
        </div>
      </form>

      <style jsx>{`
        .input{width:100%;border:1px solid #d1d5db;border-radius:.5rem;padding:.5rem .75rem;}
      `}</style>
    </div>
  );
}
