import { createClient } from "@/lib/supabase/server";

// Ensure this page always renders with auth cookies (no static caching)
export const dynamic = "force-dynamic";
export const revalidate = 0;

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export default async function BalitaDetail({ params, searchParams }: { params: { id: string }, searchParams: { nik?: string } }) {
  const supabase = await createClient();

  async function fetchById(id: string) {
    const r = await supabase.from('balita').select('*').eq('id', id).maybeSingle();
    if (r.error && r.error.code !== 'PGRST116') throw r.error;
    return r.data;
  }
  async function fetchByNik(nik: string) {
    const r = await supabase.from('balita').select('*').eq('nik', nik).maybeSingle();
    if (r.error && r.error.code !== 'PGRST116') throw r.error;
    return r.data;
  }

  let data: any = null;
  if (isUuid(params.id)) data = await fetchById(params.id);
  if (!data && searchParams?.nik) data = await fetchByNik(searchParams.nik);
  if (!data && !isUuid(params.id)) data = await fetchByNik(params.id);
  if (!data && searchParams?.nik) {
    const r = await supabase.from('balita').select('*').ilike('nik', `%${searchParams.nik}%`).maybeSingle();
    if (!r.error) data = r.data;
  }
  if (data?.puskesmas_id) {
    const p = await supabase.from('ref_puskesmas').select('nama').eq('id', data.puskesmas_id as any).maybeSingle();
    if (!p.error) (data as any).puskesmas_nama = p.data?.nama ?? null;
  }
  // If still not found, render a gentle empty state instead of 404
  if (!data) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-2xl font-semibold mb-4">Detail Balita</h1>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--muted-foreground)]">
          Data balita tidak ditemukan atau tidak dapat diakses.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold mb-4">Detail Balita</h1>
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 text-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xl font-semibold">{data.nama_balita}</div>
            <div className="text-[var(--muted-foreground)]">NIK: {data.nik ?? '-'}</div>
          </div>
          <div className="rounded-md border border-[var(--border)] px-3 py-1 bg-white text-[13px]">{data.jk}</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><span className="text-[var(--muted-foreground)]">Tanggal Lahir</span><div className="font-medium">{new Date(data.tgl_lahir as any).toLocaleDateString('id-ID')}</div></div>
          <div><span className="text-[var(--muted-foreground)]">BB Lahir (kg)</span><div className="font-medium">{data.bb_lahir_kg ?? '-'}</div></div>
          <div><span className="text-[var(--muted-foreground)]">TB Lahir (cm)</span><div className="font-medium">{data.tb_lahir_cm ?? '-'}</div></div>
          <div><span className="text-[var(--muted-foreground)]">Nama Ortu</span><div className="font-medium">{data.nama_ortu ?? '-'}</div></div>
          <div><span className="text-[var(--muted-foreground)]">Alamat</span><div className="font-medium">{[data.rt, data.rw, data.desa_kel, data.kec, data.kab_kota].filter(Boolean).join(', ') || '-'}</div></div>
          <div><span className="text-[var(--muted-foreground)]">Posyandu</span><div className="font-medium">{data.posyandu ?? '-'}</div></div>
          <div>
            <span className="text-[var(--muted-foreground)]">Puskesmas</span>
            <div className="font-medium">{data.puskesmas_nama ? `${data.puskesmas_nama}` : data.puskesmas_id}</div>
          </div>
          <div><span className="text-[var(--muted-foreground)]">Sumber Data</span><div className="font-medium">{data.sumber_data ?? '-'}</div></div>
        </div>

        <div className="mt-6">
          <div className="font-medium mb-2">Redflag</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Flag label="BB tidak adekuat" value={data.bb_tidak_adekuat} />
            <Flag label="Murmur/Edema" value={data.murmur_edema} />
            <Flag label="Delayed development" value={data.delayed_development} />
            <Flag label="Wajah dismorfik" value={data.wajah_dismorfik} />
            <Flag label="Organomegali / Limfadenopati" value={data.organomegali_limfadenopati} />
            <Flag label="ISPA / Cystitis" value={data.ispa_cystitis} />
            <Flag label="Muntah / Diare berulang" value={data.muntah_diare_berulang} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Flag({ label, value }: { label: string; value?: string | null }) {
  const v = (value || "-").toString().toLowerCase();
  const yes = v === "ya";
  const cls = yes ? "bg-emerald-50 text-emerald-700 border-emerald-200" : v === "tidak" ? "bg-gray-50 text-gray-700 border-gray-200" : "bg-yellow-50 text-yellow-700 border-yellow-200";
  const text = value ?? "-";
  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2">
      <span className="text-[var(--muted-foreground)]">{label}</span>
      <span className={`rounded px-2 py-0.5 text-xs border ${cls}`}>{text}</span>
    </div>
  );
}
