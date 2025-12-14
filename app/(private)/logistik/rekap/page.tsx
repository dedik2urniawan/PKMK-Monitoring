"use client";
import { BarChart3, Calendar, ArrowLeft, FileSpreadsheet } from "lucide-react";
import Link from "next/link";

export default function RekapLogistikPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-2xl w-full">
                {/* Card Container */}
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                    {/* Header with gradient */}
                    <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-8 text-white text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                            <BarChart3 size={40} className="text-white" />
                        </div>
                        <h1 className="text-3xl font-bold mb-2">Rekap Logistik</h1>
                        <p className="text-purple-50 text-lg">Fitur Segera Hadir</p>
                    </div>

                    {/* Content */}
                    <div className="p-8 space-y-6">
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                <Calendar size={20} />
                                Status Pengembangan
                            </h3>
                            <p className="text-blue-800 text-sm">
                                Fitur Rekap Logistik sedang dalam pengembangan untuk memberikan
                                laporan komprehensif mengenai distribusi dan penggunaan PKMK
                                di seluruh puskesmas.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h3 className="font-bold text-gray-800 text-lg">Fitur yang Akan Tersedia:</h3>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-3">
                                    <span className="inline-flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-700 rounded-full text-xs font-bold flex-shrink-0 mt-0.5">✓</span>
                                    <span className="text-gray-700">Laporan stok PKMK per periode</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="inline-flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-700 rounded-full text-xs font-bold flex-shrink-0 mt-0.5">✓</span>
                                    <span className="text-gray-700">Grafik distribusi logistik antar puskesmas</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="inline-flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-700 rounded-full text-xs font-bold flex-shrink-0 mt-0.5">✓</span>
                                    <span className="text-gray-700">Analisis penggunaan PKMK bulanan</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="inline-flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-700 rounded-full text-xs font-bold flex-shrink-0 mt-0.5">✓</span>
                                    <span className="text-gray-700">Export laporan ke Excel dan PDF</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="inline-flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-700 rounded-full text-xs font-bold flex-shrink-0 mt-0.5">✓</span>
                                    <span className="text-gray-700">Dashboard visualisasi stok real-time</span>
                                </li>
                            </ul>
                        </div>

                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <FileSpreadsheet className="text-purple-600" size={24} />
                                <h4 className="font-bold text-purple-900">Integrasi Otomatis</h4>
                            </div>
                            <p className="text-purple-800 text-sm">
                                Rekap logistik akan terintegrasi otomatis dengan data pemberian PKMK
                                dari modul monitoring, sehingga laporan selalu akurat dan real-time.
                            </p>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <p className="text-amber-800 text-sm text-center">
                                <strong>Perkiraan Peluncuran:</strong> Akan diinformasikan lebih lanjut
                            </p>
                        </div>

                        {/* Back Button */}
                        <div className="pt-4 border-t border-gray-200">
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium shadow-sm w-full justify-center"
                            >
                                <ArrowLeft size={18} />
                                Kembali ke Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
