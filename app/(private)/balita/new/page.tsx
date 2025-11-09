"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";

type FormVals = {
  nik?: string;
  nama_balita: string;
  jk: "L" | "P";
  tgl_lahir: string; // yyyy-mm-dd
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
  // redflag fields
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

export default function NewBalitaPage() {
  const [values, setValues] = useState<FormVals>({
    nama_balita: "",
    jk: "L",
    tgl_lahir: "",
    nik: "",
    nama_ortu: "",
    kab_kota: "MALANG",
    kec: "",
    desa_kel: "",
    posyandu: "",
    rt: "",
    rw: "",
    alamat: "",
    bb_lahir_kg: "",
    tb_lahir_cm: "",
    bb_tidak_adekuat: "tidak",
    murmur_edema: "tidak",
    delayed_development: "tidak",
    wajah_dismorfik: "tidak",
    organomegali_limfadenopati: "tidak",
    ispa_cystitis: "tidak",
    muntah_diare_berulang: "tidak",
    diagnosa_penyakit_penyerta: "",
    keterangan_redflag: "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [kecList, setKecList] = useState<string[]>([]);
  const [pkmList, setPkmList] = useState<Array<{ id: string; nama: string }>>([]);
  const [desaList, setDesaList] = useState<Array<{ id: string; desa_kel: string }>>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  function set<K extends keyof FormVals>(key: K, val: FormVals[K]) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  // Load kecamatan
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/ref/kecamatan");
        const data = await res.json();
        setKecList(data.items || []);
      } catch (e: any) {
        setLoadErr("Gagal memuat referensi kecamatan");
      }
    })();
  }, []);

  // Prefill puskesmas_id dari metadata user (jika ada)
  useEffect(() => {
    (async () => {
      try {
        const supabase = getSupabase();
        const { data } = await supabase.auth.getUser();
        const meta: any = data.user?.user_metadata || {};
        if (meta.puskesmas_id && !values.puskesmas_id) {
          set("puskesmas_id", meta.puskesmas_id);
        }
        if (meta.kec && !values.kec) {
          set("kec", meta.kec);
        }
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload puskesmas when kec changes
  useEffect(() => {
    if (!values.kec) return;
    (async () => {
      try {
        const rp = await fetch(`/api/ref/puskesmas?kecamatan=${encodeURIComponent(values.kec || '')}`);
        const p = await rp.json();
        setPkmList((p.items || []).map((r: any) => ({ id: r.id, nama: r.nama })));
        setDesaList([]);
        set("desa_kel", "");
      } catch (e: any) {
        setLoadErr("Gagal memuat Puskesmas/Desa");
      }
    })();
  }, [values.kec]);

  // Reload desa when puskesmas changes
  useEffect(() => {
    if (!values.puskesmas_id) return;
    (async () => {
      try {
        const rd = await fetch(`/api/ref/desa?puskesmas_id=${encodeURIComponent(values.puskesmas_id || '')}`);
        const d = await rd.json();
        setDesaList((d.items || []).map((r: any) => ({ id: r.id, desa_kel: r.desa_kel })));
      } catch (e: any) {
        setLoadErr("Gagal memuat daftar desa");
      }
    })();
  }, [values.puskesmas_id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const payload = {
      ...values,
      bb_lahir_kg: values.bb_lahir_kg === "" ? undefined : Number(values.bb_lahir_kg),
      tb_lahir_cm: values.tb_lahir_cm === "" ? undefined : Number(values.tb_lahir_cm),
      puskesmas_id: !values.puskesmas_id ? undefined : values.puskesmas_id,
    };
    const res = await fetch("/api/balita", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
    setSaving(false);
    if (!res.ok) {
      const t = await res.text();
      setMsg(`Gagal: ${t}`);
      return;
    }
    setMsg("Berhasil menambahkan balita.");
    setValues({
      nama_balita: "",
      jk: "L",
      tgl_lahir: "",
      nik: "",
      nama_ortu: "",
      kab_kota: "MALANG",
      kec: "",
      desa_kel: "",
      posyandu: "",
      rt: "",
      rw: "",
      alamat: "",
      bb_lahir_kg: "",
      tb_lahir_cm: "",
      bb_tidak_adekuat: "tidak",
      murmur_edema: "tidak",
      delayed_development: "tidak",
      wajah_dismorfik: "tidak",
      organomegali_limfadenopati: "tidak",
      ispa_cystitis: "tidak",
      muntah_diare_berulang: "tidak",
      diagnosa_penyakit_penyerta: "",
      keterangan_redflag: "",
    });
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-6">Tambah Balita</h1>
      {msg && <div className="mb-4 text-sm p-3 rounded bg-blue-50">{msg}</div>}
      {loadErr && <div className="mb-4 text-sm p-3 rounded bg-red-50 text-red-700">{loadErr}</div>}
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="text-sm">NIK</label>
          <input value={values.nik ?? ""} onChange={(e)=>set("nik", e.target.value)} className="input" /></div>
        <div><label className="text-sm">Nama Balita*</label>
          <input value={values.nama_balita} onChange={(e)=>set("nama_balita", e.target.value)} required className="input" /></div>
        <div><label className="text-sm">JK*</label>
          <select value={values.jk} onChange={(e)=>set("jk", e.target.value as "L"|"P")} required className="input">
            <option value="L">L</option><option value="P">P</option>
          </select></div>
        <div><label className="text-sm">Tgl Lahir*</label>
          <input type="date" value={values.tgl_lahir} onChange={(e)=>set("tgl_lahir", e.target.value)} required className="input" /></div>

        <div><label className="text-sm">Nama Ortu</label><input value={values.nama_ortu ?? ""} onChange={(e)=>set("nama_ortu", e.target.value)} className="input" /></div>
        <div><label className="text-sm">Kab/Kota</label><input value={values.kab_kota ?? "MALANG"} readOnly className="input bg-gray-50" /></div>
        <div><label className="text-sm">Kecamatan</label>
          <select className="input" value={values.kec ?? ""} onChange={(e)=>set("kec", e.target.value)}>
            <option value="">-- Pilih Kecamatan --</option>
            {kecList.map((k)=> (<option key={k} value={k}>{k}</option>))}
          </select>
        </div>
        <div><label className="text-sm">Puskesmas</label>
          <select className="input" value={values.puskesmas_id ?? ""} onChange={(e)=>set("puskesmas_id", e.target.value)} required>
            <option value="">-- Pilih Puskesmas --</option>
            {pkmList.length === 0 && <option value="" disabled>(Belum ada data)</option>}
            {pkmList.map((p)=> (<option key={p.id} value={p.id}>{p.nama}</option>))}
          </select>
        </div>
        <div><label className="text-sm">Desa/Kel</label>
          <select className="input" value={values.desa_kel ?? ""} onChange={(e)=>set("desa_kel", e.target.value)}>
            <option value="">-- Pilih Desa/Kel --</option>
            {desaList.length === 0 && <option value="" disabled>(Belum ada data)</option>}
            {desaList.map((d)=> (<option key={d.id} value={d.desa_kel}>{d.desa_kel}</option>))}
          </select>
        </div>
        <div><label className="text-sm">Posyandu</label><input value={values.posyandu ?? ""} onChange={(e)=>set("posyandu", e.target.value)} className="input" /></div>
        <div><label className="text-sm">RT</label><input value={values.rt ?? ""} onChange={(e)=>set("rt", e.target.value)} className="input" /></div>
        <div><label className="text-sm">RW</label><input value={values.rw ?? ""} onChange={(e)=>set("rw", e.target.value)} className="input" /></div>
        <div className="md:col-span-2"><label className="text-sm">Alamat</label><input value={values.alamat ?? ""} onChange={(e)=>set("alamat", e.target.value)} className="input" /></div>

        <div><label className="text-sm">BB Lahir (kg)</label><input type="number" step="0.01" value={values.bb_lahir_kg ?? ""} onChange={(e)=>set("bb_lahir_kg", e.target.value === "" ? "" : Number(e.target.value))} className="input" /></div>
        <div><label className="text-sm">TB Lahir (cm)</label><input type="number" step="0.1" value={values.tb_lahir_cm ?? ""} onChange={(e)=>set("tb_lahir_cm", e.target.value === "" ? "" : Number(e.target.value))} className="input" /></div>

        <div className="md:col-span-2 mt-2">
          <div className="font-medium mb-2">Redflag (isi 'ya' atau 'tidak')</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm">BB tidak adekuat</label>
              <select className="input" value={values.bb_tidak_adekuat ?? "tidak"} onChange={(e)=>set("bb_tidak_adekuat", e.target.value)}>
                <option value="tidak">Tidak</option>
                <option value="ya">Ya</option>
              </select>
            </div>
            <div>
              <label className="text-sm">Murmur/Edema</label>
              <select className="input" value={values.murmur_edema ?? "tidak"} onChange={(e)=>set("murmur_edema", e.target.value)}>
                <option value="tidak">Tidak</option>
                <option value="ya">Ya</option>
              </select>
            </div>
            <div>
              <label className="text-sm">Delayed Development</label>
              <select className="input" value={values.delayed_development ?? "tidak"} onChange={(e)=>set("delayed_development", e.target.value)}>
                <option value="tidak">Tidak</option>
                <option value="ya">Ya</option>
              </select>
            </div>
            <div>
              <label className="text-sm">Wajah Dismorfik</label>
              <select className="input" value={values.wajah_dismorfik ?? "tidak"} onChange={(e)=>set("wajah_dismorfik", e.target.value)}>
                <option value="tidak">Tidak</option>
                <option value="ya">Ya</option>
              </select>
            </div>
            <div>
              <label className="text-sm">Organomegali / Limfadenopati</label>
              <select className="input" value={values.organomegali_limfadenopati ?? "tidak"} onChange={(e)=>set("organomegali_limfadenopati", e.target.value)}>
                <option value="tidak">Tidak</option>
                <option value="ya">Ya</option>
              </select>
            </div>
            <div>
              <label className="text-sm">ISPA / Cystitis berulang</label>
              <select className="input" value={values.ispa_cystitis ?? "tidak"} onChange={(e)=>set("ispa_cystitis", e.target.value)}>
                <option value="tidak">Tidak</option>
                <option value="ya">Ya</option>
              </select>
            </div>
            <div>
              <label className="text-sm">Muntah / Diare berulang</label>
              <select className="input" value={values.muntah_diare_berulang ?? "tidak"} onChange={(e)=>set("muntah_diare_berulang", e.target.value)}>
                <option value="tidak">Tidak</option>
                <option value="ya">Ya</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="text-sm">Diagnosa Penyakit Penyerta</label>
              <input className="input" value={values.diagnosa_penyakit_penyerta ?? ""} onChange={(e)=>set("diagnosa_penyakit_penyerta", e.target.value)} />
            </div>
            <div>
              <label className="text-sm">Keterangan Redflag</label>
              <input className="input" value={values.keterangan_redflag ?? ""} onChange={(e)=>set("keterangan_redflag", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <button disabled={saving} className="px-4 py-2 bg-[var(--primary-600)] hover:bg-[var(--primary-700)] text-white rounded">
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>

      <style jsx>{`
        .input { width:100%; border:1px solid #d1d5db; border-radius:.5rem; padding:.5rem .75rem; }
        label { display:block; margin-bottom:.25rem; color:#374151; }
      `}</style>
    </div>
  );
}




