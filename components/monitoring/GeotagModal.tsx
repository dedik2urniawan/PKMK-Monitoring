"use client";

import React, { useState, useEffect } from "react";
import { X, MapPin, Navigation, Save, CheckCircle, Info, ExternalLink } from "lucide-react";
import { getAuthHeaders } from "@/lib/clientSession";
import { toast } from "sonner";

type Props = {
  balita: any;
  onClose: () => void;
  onSaveSuccess?: () => void;
};

export default function GeotagModal({ balita, onClose, onSaveSuccess }: Props) {
  const [latitude, setLatitude] = useState<string>(
    balita?.latitude != null ? String(balita.latitude) : ""
  );
  const [longitude, setLongitude] = useState<string>(
    balita?.longitude != null ? String(balita.longitude) : ""
  );
  const [detecting, setDetecting] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  // Auto detect location on load if not set yet
  useEffect(() => {
    if (!latitude && !longitude) {
      handleGetLocation();
    }
  }, []);

  function handleGetLocation() {
    if (!navigator.geolocation) {
      toast.error("Browser Anda tidak mendukung Geolocation.");
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(7));
        setLongitude(position.coords.longitude.toFixed(7));
        setAccuracy(Math.round(position.coords.accuracy));
        setDetecting(false);
        toast.success("Koordinat GPS berhasil diperoleh!");
      },
      (error) => {
        setDetecting(false);
        console.warn("Geolocation error:", error);
        toast.error("Gagal memperoleh lokasi GPS. Pastikan izin lokasi diaktifkan.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  async function handleSaveGeotag() {
    if (!latitude || !longitude) {
      toast.error("Latitude dan Longitude wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch("/api/balita/update", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        credentials: "include",
        body: JSON.stringify({
          id: balita.id,
          nik: balita.nik,
          latitude: Number(latitude),
          longitude: Number(longitude),
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        toast.error("Gagal menyimpan Geotag: " + err);
        return;
      }

      toast.success("Lokasi Geotag Balita berhasil disimpan!");
      if (onSaveSuccess) onSaveSuccess();
      onClose();
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  const latNum = Number(latitude);
  const lngNum = Number(longitude);
  const hasValidCoords = !isNaN(latNum) && !isNaN(lngNum) && latNum !== 0 && lngNum !== 0;

  // OpenStreetMap embed URL
  const osmEmbedUrl = hasValidCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lngNum - 0.005},${latNum - 0.005},${lngNum + 0.005},${latNum + 0.005}&layer=mapnik&marker=${latNum},${lngNum}`
    : null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-700 px-6 py-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center font-bold">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Geotag Lokasi Tempat Tinggal Balita
              </h2>
              <p className="text-xs text-blue-100/90 mt-0.5">
                {balita?.nama_balita} • Desa: {balita?.desa_kel || '-'} • NIK: {balita?.nik || '-'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-700 text-sm">
          
          {/* Action Button: Detect GPS */}
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-blue-900 text-sm flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-blue-600" />
                Deteksi Koordinat GPS Otomatis
              </h4>
              <p className="text-xs text-blue-700 mt-0.5">
                Gunakan sensor GPS perangkat browser Anda saat berada di lokasi tempat tinggal balita.
              </p>
            </div>
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={detecting}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-md shadow-blue-500/20 transition shrink-0 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Navigation className={`w-3.5 h-3.5 ${detecting ? 'animate-spin' : ''}`} />
              {detecting ? "Mendeteksi..." : "Ambil GPS"}
            </button>
          </div>

          {/* Form Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Latitude (Garis Lintang) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="Contoh: -8.1333500"
                className="w-full h-11 px-3.5 bg-white border border-slate-300 rounded-lg font-mono font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Longitude (Garis Bujur) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="Contoh: 112.5667200"
                className="w-full h-11 px-3.5 bg-white border border-slate-300 rounded-lg font-mono font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs"
              />
            </div>
          </div>

          {accuracy && (
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              Akurasi GPS Perangkat: ±{accuracy} meter
            </p>
          )}

          {/* Interactive Map Preview */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100 h-52 relative">
            {osmEmbedUrl ? (
              <iframe
                title="Geotag Location Map Preview"
                src={osmEmbedUrl}
                className="w-full h-full border-none"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                <MapPin className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs font-medium">Map Preview Belum Tersedia</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Masukkan koordinat Latitude & Longitude atau klik "Ambil GPS"</p>
              </div>
            )}
          </div>

          {hasValidCoords && (
            <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="font-mono">
                📍 {latNum.toFixed(6)}, {lngNum.toFixed(6)}
              </span>
              <a
                href={`https://www.google.com/maps?q=${latNum},${lngNum}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 font-bold hover:underline flex items-center gap-1"
              >
                Buka di Google Maps <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-slate-300 font-semibold text-slate-600 text-sm hover:bg-slate-100 transition"
          >
            Batal
          </button>
          <button
            onClick={handleSaveGeotag}
            disabled={saving || !hasValidCoords}
            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? "Menyimpan..." : "Simpan Geotag Lokasi"}
          </button>
        </div>

      </div>
    </div>
  );
}
