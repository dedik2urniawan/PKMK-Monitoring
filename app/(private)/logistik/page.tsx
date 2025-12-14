"use client";
import { Package, Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ManajemenLogistikPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-2xl w-full">
                {/* Card Container */}
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                    {/* Header with gradient */}
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-8 text-white text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                            <Package size={40} className="text-white" />
                        </div>
                        <h1 className="text-3xl font-bold mb-2">Manajemen Logistik</h1>
                        <p className="text-emerald-50 text-lg">Fitur Segera Hadir</p>
                    </div>

                    {/* Content */}
                    <div className="p-8 space-y-6">
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                <Calendar size={20} />
                                Status Pengembangan
                            </h3>
                            <p className="text-blue-800 text-sm">
                                Fitur Manajemen Logistik saat ini dalam tahap pengembangan aktif.
                                Tim kami sedang bekerja keras untuk menghadirkan sistem manajemen
                                stok PKMK yang komprehensif dan mudah digunakan.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h3 className="font-bold text-gray-800 text-lg">Fitur yang Akan Tersedia:</h3>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-3">
                                    <span className="inline-flex items-center justify-center w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold flex-shrink-0 mt-0.5">✓</span>
                                    <span className="text-gray-700">Pencatatan stok masuk dan keluar PKMK</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="inline-flex items-center justify-center w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold flex-shrink-0 mt-0.5">✓</span>
                                    <span className="text-gray-700">Monitoring stok real-time per puskesmas</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="inline-flex items-center justify-center w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold flex-shrink-0 mt-0.5">✓</span>
                                    <span className="text-gray-700">Notifikasi otomatis untuk stok menipis</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="inline-flex items-center justify-center w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold flex-shrink-0 mt-0.5">✓</span>
                                    <span className="text-gray-700">Riwayat transaksi logistik lengkap</span>
                                </li>
                            </ul>
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
                                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium shadow-sm w-full justify-center"
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
