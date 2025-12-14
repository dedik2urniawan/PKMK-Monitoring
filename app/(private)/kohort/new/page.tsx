"use client";
import { useEffect, useState } from "react";
import { ensureServerSession, getAuthHeaders } from "@/lib/clientSession";
import { AlertCircle, CheckCircle, Clock, Filter, User, MapPin, Calendar, Inbox } from "lucide-react";

type Balita = { id: string; nama_balita: string };
type Pkm = { id: string; nama: string };
type Desa = { id: string; desa_kel: string };

export default function NewKohort() {
  const [loading, setLoading] = useState(true);
  const [balita, setBalita] = useState<Balita[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [start, setStart] = useState<string>("");

  // filter state
  const [kecList, setKecList] = useState<string[]>([]);
  const [pkmList, setPkmList] = useState<Pkm[]>([]);
  const [desaList, setDesaList] = useState<Desa[]>([]);
  const [kec, setKec] = useState("");
  const [puskesmasId, setPuskesmasId] = useState("");
  const [desa, setDesa] = useState("");

  useEffect(() => {
    (async () => {
      try {
        await ensureServerSession();
        const authHeaders = await getAuthHeaders();
        const res = await fetch("/api/ref/kecamatan", { credentials: 'include', headers: authHeaders });
        const data = await res.json();
        setKecList(data.items || []);
      } catch { }
      const r = await fetch("/api/monitoring/balita", { credentials: 'include' });
      const d = await r.json();
      setBalita(d.items || []);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!kec) return;
    (async () => {
      await ensureServerSession();
      await ensureServerSession();
      const authHeaders = await getAuthHeaders();
      const rp = await fetch(`/api/ref/puskesmas?kecamatan=${encodeURIComponent(kec)}`, { credentials: 'include', headers: authHeaders });
      const p = await rp.json();
      setPkmList((p.items || []).map((r: any) => ({ id: r.id, nama: r.nama })));
      setDesaList([]); setDesa(""); setPuskesmasId("");
    })();
  }, [kec]);

  useEffect(() => {
    if (!puskesmasId) return;
    (async () => {
      await ensureServerSession();
      await ensureServerSession();
      const authHeaders = await getAuthHeaders();
      const rd = await fetch(`/api/ref/desa?puskesmas_id=${encodeURIComponent(puskesmasId)}`, { credentials: 'include', headers: authHeaders });
      const d = await rd.json();
      setDesaList((d.items || []).map((r: any) => ({ id: r.id, desa_kel: r.desa_kel })));
    })();
  }, [puskesmasId]);

  async function applyFilter(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (puskesmasId) params.set("puskesmas_id", puskesmasId);
    if (desa) params.set("desa_kel", desa);
    await ensureServerSession();
    const authHeaders = await getAuthHeaders();
    const r = await fetch(`/api/monitoring/balita?${params.toString()}`, { credentials: 'include', headers: authHeaders });
    const d = await r.json();
    setBalita(d.items || []);
    setSelected("");
  }

  async function createKohort() {
    await ensureServerSession();
    const authHeaders = await getAuthHeaders();
    const res = await fetch("/api/kohort", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      credentials: "include",
      body: JSON.stringify({ balita_id: selected, periode_mulai: start }),
    });
    if (!res.ok) return alert(await res.text());
    alert("Kohort dimulai!");
  }

  if (loading) return <div>Memuat…</div>;

  // Helper to check redflag
  const getRedflag = (b: any) => {
    // Check all cohorts, find latest monitoring with any redflag
    if (!b.kohort || b.kohort.length === 0) return "-";
    // Flatten all monitoring records from all cohorts
    const monitorings = b.kohort.flatMap((k: any) => k.monitoring_antropometri || []);
    if (monitorings.length === 0) return "Tidak";

    // Sort by date/id if possible, but here we just check if ANY recent one has redflag? 
    // Usually we care about the LATEST status.
    // Let's assume the API returns them in some order or we just check existence.
    // For now, check if ANY active redflag exists in the latest monitoring.
    // We'll take the last one in the list (assuming append order).
    const last = monitorings[monitorings.length - 1];
    if (!last) return "Tidak";

    const flags = [
      last.bb_tidak_adekuat, last.murmur_edema, last.delayed_development,
      last.wajah_dismorfik, last.organomegali_limfadenopati, last.ispa_cystitis,
      last.muntah_diare_berulang, last.diagnosa_penyakit_penyerta,
      last.subjective, last.objective, last.assesment, last.plan
    ].filter(Boolean);

    return flags.length > 0 ? "Ya" : "Tidak";
  };

  const getCohortStatus = (b: any) => {
    if (!b.kohort || b.kohort.length === 0) return { status: "Belum", date: "-" };
    // Assuming the last one is the active one
    const last = b.kohort[b.kohort.length - 1];
    return {
      status: "Ya",
      date: new Date(last.periode_mulai).toLocaleDateString('id-ID')
    };
  };

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-semibold mb-4">Mulai Kohort (12 minggu)</h1>

      <form onSubmit={applyFilter} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl border-2 border-emerald-100 shadow-md">
        <div className="col-span-full">
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Filter size={16} className="text-emerald-600" />
            Filter Data Balita
          </h3>
        </div>
        <select className="input" value={kec} onChange={(e) => setKec(e.target.value)}>
          <option value="">-- Kecamatan --</option>
          {kecList.map((k) => (<option key={k} value={k}>{k}</option>))}
        </select>
        <select className="input" value={puskesmasId} onChange={(e) => setPuskesmasId(e.target.value)}>
          <option value="">-- Puskesmas --</option>
          {pkmList.map((p) => (<option key={p.id} value={p.id}>{p.nama}</option>))}
        </select>
        <select className="input" value={desa} onChange={(e) => setDesa(e.target.value)}>
          <option value="">-- Desa/Kel --</option>
          {desaList.map((d) => (<option key={d.id} value={d.desa_kel}>{d.desa_kel}</option>))}
        </select>
        <div>
          <button className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium shadow-sm">Filter</button>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Mulai Kohort */}
        <div className="md:col-span-1 space-y-4 bg-white p-4 rounded-lg border shadow-sm h-fit">
          <h2 className="font-semibold text-lg">Formulir Kohort</h2>
          <div>
            <label className="text-sm font-medium mb-1 block">Pilih Balita</label>
            <select className="input" value={selected} onChange={(e) => setSelected(e.target.value)}>
              <option value="">-- Pilih Balita --</option>
              {balita.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.nama_balita}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Tanggal Mulai</label>
            <input className="input" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <button
            className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded disabled:opacity-60 transition-colors font-medium"
            onClick={createKohort}
            disabled={!selected || !start}
          >
            Mulai Kohort
          </button>
        </div>

        {/* Tabel Daftar Balita */}
        <div className="md:col-span-2 overflow-x-auto bg-white rounded-lg border shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-gradient-to-r from-emerald-50 to-teal-50 text-gray-800 font-bold border-b-2 border-emerald-200">
              <tr>
                <th className="px-4 py-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide font-bold text-gray-700">
                    <User size={14} className="text-emerald-600" />
                    Nama Balita
                  </div>
                </th>
                <th className="px-4 py-4">
                  <div className="text-xs uppercase tracking-wide font-bold text-gray-700">JK</div>
                </th>
                <th className="px-4 py-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide font-bold text-gray-700">
                    <Calendar size={14} className="text-emerald-600" />
                    Tgl Lahir
                  </div>
                </th>
                <th className="px-4 py-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide font-bold text-gray-700">
                    <MapPin size={14} className="text-emerald-600" />
                    Lokasi
                  </div>
                </th>
                <th className="px-4 py-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-wide font-bold text-gray-700">
                    <AlertCircle size={14} className="text-emerald-600" />
                    Redflag
                  </div>
                </th>
                <th className="px-4 py-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-wide font-bold text-gray-700">
                    <CheckCircle size={14} className="text-emerald-600" />
                    Kohort
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {balita.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Inbox size={48} className="mb-3 opacity-50" />
                      <p className="text-sm font-medium text-gray-500">Tidak ada data balita</p>
                      <p className="text-xs text-gray-400 mt-1">Gunakan filter untuk mencari balita</p>
                    </div>
                  </td>
                </tr>
              ) : (
                balita.map((b: any) => {
                  const cohort = getCohortStatus(b);
                  const redflag = getRedflag(b);
                  return (
                    <tr key={b.id} className="hover:bg-emerald-50/30 transition-colors duration-150 even:bg-gray-50/50">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-gray-900">{b.nama_balita}</div>
                        <div className="text-xs text-gray-500 mt-0.5">NIK: {b.nik || '-'}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-semibold text-xs">
                          {b.jk}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-gray-700">{new Date(b.tgl_lahir).toLocaleDateString('id-ID')}</td>
                      <td className="px-4 py-4">
                        <div className="text-xs text-gray-500 font-medium">{b.kec}</div>
                        <div className="text-sm text-gray-700 font-medium">{b.desa_kel}</div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold shadow-lg hover:scale-105 transition-transform duration-200 ${redflag === 'Ya'
                          ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white'
                          : redflag === 'Tidak'
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                            : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                          }`}>
                          {redflag === 'Ya' && <AlertCircle size={14} className="font-bold animate-pulse" />}
                          {redflag === 'Tidak' && <CheckCircle size={14} className="font-bold" />}
                          {redflag}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold shadow-lg hover:scale-105 transition-transform duration-200 ${cohort.status === 'Ya'
                            ? 'bg-gradient-to-r from-emerald-600 to-green-700 text-white'
                            : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
                            }`}>
                            {cohort.status === 'Ya' ? <CheckCircle size={14} className="font-bold" /> : <Clock size={14} className="font-bold animate-pulse" />}
                            {cohort.status}
                          </span>
                          {cohort.status === 'Ya' && (
                            <span className="text-xs text-white font-bold bg-gradient-to-r from-gray-600 to-gray-700 px-3 py-1 rounded-full shadow-md">
                              {cohort.date}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`.input{width:100%;border:1px solid #d1d5db;border-radius:.5rem;padding:.5rem .75rem;}`}</style>
    </div>
  );
}
