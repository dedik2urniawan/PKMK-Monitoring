"use client";

import React, { useEffect, useState, useRef } from "react";
import { 
  X, QrCode, Copy, Check, ExternalLink, Printer, ShieldCheck, 
  Baby, Sparkles, Heart, Award, Calendar, MapPin, Building2, Lock
} from "lucide-react";
import QRCode from "qrcode";

type BalitaData = {
  id: string;
  nik: string | null;
  nama_balita: string;
  desa_kel: string | null;
  puskesmas_id?: string | null;
  tgl_lahir?: string | null;
  nama_ortu?: string | null;
  jk?: string | null;
};

type RaporQrModalProps = {
  isOpen: boolean;
  onClose: () => void;
  balita: BalitaData | null;
};

export default function RaporQrModal({ isOpen, onClose, balita }: RaporQrModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [raporUrl, setRaporUrl] = useState<string>("");
  const printCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && balita) {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const url = `${origin}/rapor/${balita.id}`;
      setRaporUrl(url);

      QRCode.toDataURL(url, {
        width: 320,
        margin: 2,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      })
        .then((dataUrl) => setQrDataUrl(dataUrl))
        .catch((err) => console.error("QR Code Error:", err));
    }
  }, [isOpen, balita]);

  if (!isOpen || !balita) return null;

  // Format PIN (Tanggal Lahir DDMMYYYY)
  const formatPin = (tgl?: string | null) => {
    if (!tgl) return "DDMMYYYY";
    const parts = tgl.split("-");
    if (parts.length === 3) {
      return `${parts[2]}${parts[1]}${parts[0]}`; // YYYY-MM-DD -> DDMMYYYY
    }
    return tgl;
  };

  const formattedDob = balita.tgl_lahir
    ? new Date(balita.tgl_lahir).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

  const pinAccess = formatPin(balita.tgl_lahir);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(raporUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrintCard = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-inner">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full border border-white/30 inline-block mb-1">
                E-KMS Digital Interaktif
              </span>
              <h3 className="text-xl font-black text-white">Rapor Tumbuh Kembang</h3>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5" ref={printCardRef}>
          
          {/* Child Identity Snippet */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-800 text-base">{balita.nama_balita}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  balita.jk === "L" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"
                }`}>
                  {balita.jk === "L" ? "♂ Laki-laki" : "♀ Perempuan"}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Lahir: <strong>{formattedDob}</strong>
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Desa: <strong>{balita.desa_kel || "-"}</strong>
              </p>
            </div>
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-5 bg-gradient-to-b from-rose-50/50 to-amber-50/50 rounded-2xl border-2 border-dashed border-rose-200 text-center space-y-3">
            {qrDataUrl ? (
              <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-100 inline-block">
                <img
                  src={qrDataUrl}
                  alt={`QR Code Rapor ${balita.nama_balita}`}
                  className="w-48 h-48 rounded-xl object-contain mx-auto"
                />
              </div>
            ) : (
              <div className="w-48 h-48 bg-slate-100 rounded-2xl animate-pulse flex items-center justify-center text-xs text-slate-400">
                Membuat QR Code...
              </div>
            )}

            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-700">
                Pindai QR dengan Kamera HP / Google Lens
              </p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Orang tua dapat mengakses buku rapor KMS digital, grafik Z-score, dan pemantauan PKMK mingguan secara langsung.
              </p>
            </div>

            {/* PIN Security Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-amber-300 shadow-sm text-xs text-amber-900 font-bold">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Kunci Akses Ortu (PIN): <code className="font-mono bg-amber-100 px-1.5 py-0.5 rounded text-amber-950 font-black">{pinAccess}</code></span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                onClick={handleCopyLink}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-200"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                <span>{copied ? "Tautan Tersalin!" : "Salin Link WA"}</span>
              </button>

              <a
                href={`/rapor/${balita.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-rose-500/20"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Buka Rapor</span>
              </a>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Integrasi Terenkripsi SIGMA PKMK
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
