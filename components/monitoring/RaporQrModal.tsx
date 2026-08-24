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

  const handleShareWhatsApp = () => {
    // Copy link to clipboard for convenience
    if (navigator.clipboard) {
      navigator.clipboard.writeText(raporUrl);
    }

    const textMessage = 
`*BUKU RAPOR TUMBUH KEMBANG & E-KMS DIGITAL*
Halo Ayah/Ibu dari Ananda *${balita.nama_balita}*,

Berikut tautan resmi Buku Rapor Pertumbuhan & KMS Digital untuk memantau grafik BB/TB, status gizi, dan perkembangan formula PKMK dari Dinas Kesehatan Kabupaten Malang:

🔗 *Buka Rapor KMS Digital:*
${raporUrl}

🔑 *Kunci Akses (PIN):* *${pinAccess}*
_(Gunakan Tanggal Lahir Ananda format DDMMYYYY sebagai PIN verifikasi)_

Terima kasih telah bersama-sama memantau tumbuh kembang optimal Ananda tercinta.`;

    const encoded = encodeURIComponent(textMessage);
    const waUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(raporUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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
            {/* Primary Action: Direct Share to WhatsApp */}
            <button
              onClick={handleShareWhatsApp}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-extrabold transition shadow-lg shadow-emerald-600/20 active:scale-[0.99]"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.316 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.818-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              <span>Kirim Rapor via WhatsApp</span>
            </button>

            {/* Secondary Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleCopyLink}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-200"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                <span>{copied ? "Tersalin!" : "Salin Link"}</span>
              </button>

              <a
                href={`/rapor/${balita.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-rose-500/20"
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
