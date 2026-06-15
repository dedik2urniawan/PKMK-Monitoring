"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ensureServerSession, getAuthHeaders } from "@/lib/clientSession";

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

  // pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  async function fetchBalita(currentPage: number = 1, currentKec = kec, currentPkm = puskesmasId, currentDesa = desa) {
    const params = new URLSearchParams();
    if (currentPkm) params.set("puskesmas_id", currentPkm);
    if (currentDesa) params.set("desa_kel", currentDesa);
    if (currentKec) params.set("kecamatan", currentKec);
    params.set("page", currentPage.toString());
    params.set("limit", limit.toString());

    await ensureServerSession();
    const authHeaders = await getAuthHeaders();
    const r = await fetch(`/api/monitoring/balita?${params.toString()}`, { credentials: 'include', headers: authHeaders });
    const d = await r.json();
    setBalita(d.items || []);
    setTotalPages(d.pages || 1);
    setTotalItems(d.total || 0);
  }

  useEffect(() => {
    (async () => {
      try {
        await ensureServerSession();
        const authHeaders = await getAuthHeaders();

        // Fetch kecamatan with auth
        const res = await fetch("/api/ref/kecamatan", { credentials: 'include', headers: authHeaders });
        const data = await res.json();
        setKecList(data.items || []);

        // Fetch balita with pagination
        await fetchBalita(1, "", "", "");
      } catch (e) {
        console.error('[kohort/new] Error fetching initial data:', e);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!kec) return;
    (async () => {
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
      const authHeaders = await getAuthHeaders();
      const rd = await fetch(`/api/ref/desa?puskesmas_id=${encodeURIComponent(puskesmasId)}`, { credentials: 'include', headers: authHeaders });
      const d = await rd.json();
      setDesaList((d.items || []).map((r: any) => ({ id: r.id, desa_kel: r.desa_kel })));
    })();
  }, [puskesmasId]);

  async function applyFilter(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setPage(1);
    await fetchBalita(1, kec, puskesmasId, desa);
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
    fetchBalita(page, kec, puskesmasId, desa); // Refresh data current page
  }

  // Helper to check redflag
  const getRedflag = (b: any) => {
    if (!b.kohort || b.kohort.length === 0) return "-";
    const monitorings = b.kohort.flatMap((k: any) => k.monitoring_antropometri || []);
    if (monitorings.length === 0) return "Tidak";
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
    const last = b.kohort[b.kohort.length - 1];
    return {
      status: "Ya",
      date: new Date(last.periode_mulai).toLocaleDateString('id-ID')
    };
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <div style={{ width: 40, height: 40, border: '4px solid #10b981', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 32px' }}>
      {/* Breadcrumbs */}
      <nav style={{ display: 'flex', gap: 8, fontSize: 14, marginBottom: 20 }}>
        <Link href="/dashboard" style={{ color: '#61897c', fontWeight: 500, textDecoration: 'none' }}>Home</Link>
        <span style={{ color: '#d1d5db' }}>/</span>
        <Link href="/kohort/new" style={{ color: '#61897c', fontWeight: 500, textDecoration: 'none' }}>Kohort</Link>
        <span style={{ color: '#d1d5db' }}>/</span>
        <span style={{ color: '#111816', fontWeight: 600 }}>Daftar Intervensi</span>
      </nav>

      {/* Page Heading */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#111816', display: 'flex', alignItems: 'center', gap: 12, margin: 0 }}>
            <span style={{ fontSize: 36 }}>📅</span> Daftar Kohort Intervensi
          </h1>
          <p style={{ color: '#61897c', fontSize: 15, marginTop: 8 }}>Kelola periode intervensi 12 minggu untuk setiap balita yang terindikasi stunting</p>
        </div>
        <Link href="/import/kohort" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)', transition: 'all 0.3s' }}>
          <span style={{ fontSize: 18 }}>📥</span> Import Excel Kohort
        </Link>
      </div>

      {/* Filter Section - Stitch Style */}
      <form onSubmit={applyFilter} style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #dbe6e2', padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 20 }}>🔍</span>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111816', margin: 0 }}>Filter Data Balita</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, alignItems: 'flex-end' }} className="filter-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kecamatan</label>
            <select value={kec} onChange={(e) => setKec(e.target.value)} style={{ width: '100%', height: 44, borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', padding: '0 12px', fontSize: 14, color: '#111816' }}>
              <option value="">Semua Kecamatan</option>
              {kecList.map((k) => (<option key={k} value={k}>{k}</option>))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Puskesmas</label>
            <select value={puskesmasId} onChange={(e) => setPuskesmasId(e.target.value)} style={{ width: '100%', height: 44, borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', padding: '0 12px', fontSize: 14, color: '#111816' }}>
              <option value="">Semua Puskesmas</option>
              {pkmList.map((p) => (<option key={p.id} value={p.id}>{p.nama}</option>))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Desa/Kelurahan</label>
            <select value={desa} onChange={(e) => setDesa(e.target.value)} style={{ width: '100%', height: 44, borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', padding: '0 12px', fontSize: 14, color: '#111816' }}>
              <option value="">Semua Desa</option>
              {desaList.map((d) => (<option key={d.id} value={d.desa_kel}>{d.desa_kel}</option>))}
            </select>
          </div>
          <button type="submit" style={{ height: 44, background: '#10b981', color: 'white', borderRadius: 8, border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 2px 8px rgba(16,185,129,0.3)' }}>
            🔎 Terapkan Filter
          </button>
        </div>
      </form>

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24 }} className="main-grid">

        {/* Left Column: Form Card - Stitch Style */}
        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #dbe6e2', overflow: 'hidden', height: 'fit-content', position: 'sticky', top: 24 }}>
          <div style={{ background: 'linear-gradient(to right, #f9fafb, white)', borderBottom: '1px solid #f3f4f6', padding: '16px 20px' }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111816', display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
              📝 Formulir Mulai Kohort
            </h2>
          </div>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ fontSize: 14, fontWeight: 600, color: '#111816', marginBottom: 8, display: 'block' }}>Pilih Balita</label>
              <select value={selected} onChange={(e) => setSelected(e.target.value)} style={{ width: '100%', height: 44, borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', padding: '0 12px', fontSize: 14, color: '#111816' }}>
                <option value="">-- Pilih Balita --</option>
                {balita.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.nama_balita}</option>
                ))}
              </select>
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>Hanya menampilkan balita dengan status stunting.</p>
            </div>
            <div>
              <label style={{ fontSize: 14, fontWeight: 600, color: '#111816', marginBottom: 8, display: 'block' }}>Tanggal Mulai</label>
              <input type="date" value={start} onChange={(e) => setStart(e.target.value)} style={{ width: '100%', height: 44, borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', padding: '0 12px', fontSize: 14, color: '#111816' }} />
            </div>
            <div style={{ background: '#eff6ff', borderRadius: 8, padding: 12, border: '1px solid #dbeafe', display: 'flex', gap: 10 }}>
              <span style={{ fontSize: 18 }}>ℹ️</span>
              <p style={{ fontSize: 12, color: '#1e40af', lineHeight: 1.5, margin: 0 }}>
                Program intervensi akan berlangsung selama <strong>12 minggu</strong>. Pastikan data balita sudah benar sebelum memulai.
              </p>
            </div>
            <button
              onClick={createKohort}
              disabled={!selected || !start}
              style={{
                width: '100%', height: 48, borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 14, cursor: !selected || !start ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: !selected || !start ? '#e5e7eb' : '#10b981',
                color: !selected || !start ? '#9ca3af' : 'white',
                boxShadow: !selected || !start ? 'none' : '0 2px 8px rgba(16,185,129,0.3)'
              }}
            >
              ▶️ Mulai Kohort (12 Minggu)
            </button>
          </div>
        </div>

        {/* Right Column: Data Table - Stitch Style */}
        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #dbe6e2', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ overflowX: 'auto', flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(to right, #10b981, #14b8a6)', color: 'white' }}>
                  <th style={{ padding: '16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>Nama Balita</th>
                  <th style={{ padding: '16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>JK</th>
                  <th style={{ padding: '16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>Tgl Lahir</th>
                  <th style={{ padding: '16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>Lokasi</th>
                  <th style={{ padding: '16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Redflag</th>
                  <th style={{ padding: '16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>Kohort Status</th>
                </tr>
              </thead>
              <tbody>
                {balita.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 64, textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#9ca3af' }}>
                        <div style={{ width: 64, height: 64, borderRadius: 999, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                          <span style={{ fontSize: 32 }}>📭</span>
                        </div>
                        <p style={{ fontWeight: 700, fontSize: 16, color: '#374151', margin: 0 }}>Tidak ada data balita</p>
                        <p style={{ fontSize: 14, color: '#9ca3af', marginTop: 4 }}>Coba sesuaikan filter lokasi untuk menemukan data yang Anda cari.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  balita.map((b: any) => {
                    const cohort = getCohortStatus(b);
                    const redflag = getRedflag(b);
                    return (
                      <tr key={b.id} style={{ borderBottom: '1px solid #f3f4f6' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(16,185,129,0.03)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: 16 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#111816' }}>{b.nama_balita}</div>
                          <div style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'monospace', marginTop: 2 }}>{b.nik || '-'}</div>
                        </td>
                        <td style={{ padding: 16, textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 999,
                            background: b.jk === 'L' ? '#dbeafe' : '#fce7f3',
                            color: b.jk === 'L' ? '#1d4ed8' : '#be185d',
                            fontWeight: 700, fontSize: 12
                          }}>{b.jk}</span>
                        </td>
                        <td style={{ padding: 16 }}>
                          <div style={{ fontSize: 14, color: '#374151' }}>{new Date(b.tgl_lahir).toLocaleDateString('id-ID')}</div>
                        </td>
                        <td style={{ padding: 16 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#111816' }}>{b.desa_kel}</div>
                          <div style={{ fontSize: 12, color: '#9ca3af' }}>Kec. {b.kec}</div>
                        </td>
                        <td style={{ padding: 16, textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                            background: redflag === 'Ya' ? 'linear-gradient(to right, #fef2f2, #fee2e2)' : redflag === 'Tidak' ? 'linear-gradient(to right, #f0fdf4, #dcfce7)' : '#f3f4f6',
                            color: redflag === 'Ya' ? '#b91c1c' : redflag === 'Tidak' ? '#15803d' : '#6b7280',
                            border: redflag === 'Ya' ? '1px solid #fecaca' : redflag === 'Tidak' ? '1px solid #bbf7d0' : '1px solid #e5e7eb',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                          }}>
                            {redflag === 'Ya' && '⚠️'} {redflag === 'Tidak' && '✓'} {redflag}
                          </span>
                        </td>
                        <td style={{ padding: 16 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{
                              display: 'inline-flex', width: 'fit-content', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                              background: cohort.status === 'Ya' ? 'linear-gradient(to right, #ecfdf5, #d1fae5)' : 'linear-gradient(to right, #fffbeb, #fef3c7)',
                              color: cohort.status === 'Ya' ? '#047857' : '#b45309',
                              border: cohort.status === 'Ya' ? '1px solid #a7f3d0' : '1px solid #fcd34d',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}>
                              {cohort.status === 'Ya' ? '✓ Aktif' : '⏱️ Belum'}
                            </span>
                            {cohort.status === 'Ya' && (
                              <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500 }}>Sejak {cohort.date}</span>
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
          {/* Footer Info with Pagination */}
          <div style={{ borderTop: '1px solid #f3f4f6', padding: '16px 20px', background: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
              Menampilkan <strong>{balita.length > 0 ? (page - 1) * limit + 1 : 0}</strong> - <strong>{Math.min(page * limit, totalItems)}</strong> dari <strong>{totalItems}</strong> balita
            </p>
            
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: 6 }}>
                <button 
                  onClick={() => { const p = page - 1; setPage(p); fetchBalita(p, kec, puskesmasId, desa); }} 
                  disabled={page <= 1}
                  style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: page <= 1 ? '#f3f4f6' : 'white', color: page <= 1 ? '#9ca3af' : '#374151', fontSize: 13, fontWeight: 600, cursor: page <= 1 ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
                >
                  Sebelumnya
                </button>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 40, height: 36, background: '#10b981', color: 'white', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
                  {page}
                </div>
                
                <button 
                  onClick={() => { const p = page + 1; setPage(p); fetchBalita(p, kec, puskesmasId, desa); }} 
                  disabled={page >= totalPages}
                  style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: page >= totalPages ? '#f3f4f6' : 'white', color: page >= totalPages ? '#9ca3af' : '#374151', fontSize: 13, fontWeight: 600, cursor: page >= totalPages ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
                >
                  Selanjutnya
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 1024px) {
          .main-grid { grid-template-columns: 1fr !important; }
          .filter-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .filter-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
