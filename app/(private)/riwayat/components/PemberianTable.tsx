"use client";
import Link from "next/link";
import { Activity, Coffee, Pill } from "lucide-react";

type PemberianItem = {
    balita_id: string;
    nama_balita: string;
    nik: string;
    jk: string;
    tgl_lahir: string;
    kec: string;
    puskesmas: string;
    desa_kel: string;
    tanggal_pemberian_awal: string;
    weeks: any;
    status_intervensi: string;
    current_week: number;
};

export function PemberianTable({ data }: { data: PemberianItem[] }) {
    return (
        <div className="overflow-x-auto rounded-xl border-2 border-gray-200 shadow-sm">
            <table className="w-full text-sm min-w-max border-collapse">
                <thead className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b-2 border-emerald-200 sticky top-0 z-10">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 sticky left-0 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-r border border-gray-200">No</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 sticky left-12 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-r border border-gray-200">Nama Balita</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 sticky left-48 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-r border border-gray-200">NIK</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 border border-gray-200">JK</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 border border-gray-200">Tgl Lahir</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 border border-gray-200">Kec</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 border border-gray-200">Puskesmas</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 border border-gray-200">Desa/Kel</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 bg-blue-50 border border-gray-200">Tgl Awal</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 bg-blue-100 border border-gray-200">Dosis Awal (ml)</th>
                        {[...Array(12)].map((_, idx) => (
                            <th key={idx + 1} className="px-4 py-3 text-center text-xs font-bold text-gray-700 bg-purple-50 border border-gray-200">
                                Week {idx + 1} (ml)
                            </th>
                        ))}
                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 bg-emerald-50 border border-gray-200">Status Intervensi</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 border border-gray-200">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {data.map((item, idx) => (
                        <tr key={item.balita_id} className="hover:bg-emerald-50/30 transition-colors duration-150 even:bg-gray-50/50">
                            <td className="px-4 py-3 sticky left-0 bg-white even:bg-gray-50/50 shadow-r border border-gray-200">{idx + 1}</td>
                            <td className="px-4 py-3 font-semibold text-gray-900 sticky left-12 bg-white even:bg-gray-50/50 shadow-r border border-gray-200">{item.nama_balita}</td>
                            <td className="px-4 py-3 text-gray-600 sticky left-48 bg-white even:bg-gray-50/50 shadow-r border border-gray-200">{item.nik || '-'}</td>
                            <td className="px-4 py-3 text-center border border-gray-200">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-semibold text-xs">
                                    {item.jk}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600 border border-gray-200">{new Date(item.tgl_lahir).toLocaleDateString('id-ID')}</td>
                            <td className="px-4 py-3 text-gray-600 border border-gray-200">{item.kec}</td>
                            <td className="px-4 py-3 text-gray-600 border border-gray-200">{item.puskesmas}</td>
                            <td className="px-4 py-3 text-gray-600 border border-gray-200">{item.desa_kel}</td>
                            <td className="px-4 py-3 text-center text-xs text-gray-500 border border-gray-200">
                                {item.tanggal_pemberian_awal ? new Date(item.tanggal_pemberian_awal).toLocaleDateString('id-ID') : '-'}
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-blue-900 bg-blue-50 border border-gray-200">
                                {item.weeks[0]?.jumlah_dosis_ml || '-'}
                            </td>
                            {[...Array(12)].map((_, weekIdx) => {
                                const weekNum = weekIdx + 1;
                                const weekData = item.weeks[weekNum];
                                return (
                                    <td key={weekNum} className="px-4 py-3 text-center font-semibold bg-purple-50/30 border border-gray-200">
                                        {weekData?.jumlah_dosis_ml || '-'}
                                    </td>
                                );
                            })}
                            <td className="px-4 py-3 text-center border border-gray-200">
                                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold shadow-lg whitespace-nowrap ${item.status_intervensi === "Intervensi Selesai"
                                    ? 'bg-gradient-to-r from-emerald-600 to-green-700 text-white'
                                    : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
                                    }`}>
                                    {item.status_intervensi === "Intervensi Selesai" ? "Selesai" : "Proses"}
                                </span>
                            </td>
                            <td className="px-4 py-3 border border-gray-200">
                                <div className="flex items-center gap-2 justify-center">
                                    <Link
                                        href={`/monitoring/${item.balita_id}/antropometri/new`}
                                        title="Antropometri"
                                        className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors inline-block"
                                    >
                                        <Activity size={14} />
                                    </Link>
                                    <Link
                                        href={`/monitoring/${item.balita_id}/konsumsi/new`}
                                        title="Konsumsi PKMK"
                                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors inline-block"
                                    >
                                        <Coffee size={14} />
                                    </Link>
                                    <Link
                                        href={`/monitoring/${item.balita_id}/pemberian/new`}
                                        title="Pemberian PKMK"
                                        className="p-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-colors inline-block"
                                    >
                                        <Pill size={14} />
                                    </Link>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <style jsx>{`
        .shadow-r {
          box-shadow: 2px 0 4px rgba(0,0,0,0.1);
        }
      `}</style>
        </div>
    );
}
