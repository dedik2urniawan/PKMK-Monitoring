"use client";

import Link from "next/link";
import { 
  Search, Users, UserPlus, FileUp, 
  Scale, Utensils, HeartHandshake, 
  PieChart, FileText, Activity, 
  BarChart3, Package, ClipboardList,
  Dna, MapPin, Brain, QrCode,
  Flame, Cpu, Microscope, LayoutDashboard,
  Sparkles, BookOpen
} from "lucide-react";
import { useState } from "react";

const fiturCategories = [
  {
    title: "Data Balita",
    items: [
      { href: "/balita", label: "Daftar Balita", icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
      { href: "/balita/new", label: "Tambah Balita", icon: UserPlus, color: "text-teal-600", bg: "bg-teal-100", badge: "Baru" },
      { href: "/import/balita", label: "Import Excel", icon: FileUp, color: "text-indigo-600", bg: "bg-indigo-100" },
    ]
  },
  {
    title: "Monitoring PKMK & Inovasi Klinis",
    items: [
      { href: "/monitoring", label: "Input Antropometri", icon: Scale, color: "text-orange-600", bg: "bg-orange-100" },
      { href: "/monitoring", label: "Input Konsumsi", icon: Utensils, color: "text-emerald-600", bg: "bg-emerald-100" },
      { href: "/monitoring", label: "Input Pemberian", icon: HeartHandshake, color: "text-purple-600", bg: "bg-purple-100" },
      { href: "/monitoring", label: "Rapor E-KMS (QR Ortu)", icon: QrCode, color: "text-rose-600", bg: "bg-rose-100", badge: "New" },
      { href: "/monitoring", label: "Asesmen SDIDTK", icon: Brain, color: "text-violet-600", bg: "bg-violet-100", badge: "New" },
      { href: "/monitoring", label: "Analisis TPG", icon: Dna, color: "text-teal-600", bg: "bg-teal-100", badge: "New" },
      { href: "/monitoring", label: "Geotag Lokasi GPS", icon: MapPin, color: "text-sky-600", bg: "bg-sky-100", badge: "New" },
    ]
  },
  {
    title: "Dashboard & AI Analytics",
    items: [
      { href: "/dashboard", label: "Dashboard Utama", icon: LayoutDashboard, color: "text-cyan-600", bg: "bg-cyan-100" },
      { href: "/dashboard", label: "Geo AI Hotspot", icon: Flame, color: "text-amber-600", bg: "bg-amber-100", badge: "New" },
      { href: "/dashboard", label: "Scientific PKMK", icon: Microscope, color: "text-indigo-600", bg: "bg-indigo-100", badge: "New" },
      { href: "/dashboard", label: "AI Advisor Resume", icon: Cpu, color: "text-fuchsia-600", bg: "bg-fuchsia-100", badge: "New" },
    ]
  },
  {
    title: "Determinan Stunting",
    items: [
      { href: "/determinan/daftar-balita", label: "Daftar Survey", icon: Users, color: "text-violet-600", bg: "bg-violet-100" },
      { href: "/determinan/analisis", label: "Analisis Determinan", icon: PieChart, color: "text-emerald-600", bg: "bg-emerald-100" },
      { href: "/determinan/rekap", label: "Rekap Hasil", icon: FileText, color: "text-cyan-600", bg: "bg-cyan-100" },
    ]
  },
  {
    title: "Laporan & Logistik",
    items: [
      { href: "/riwayat", label: "Riwayat Intervensi", icon: Activity, color: "text-pink-600", bg: "bg-pink-100" },
      { href: "/rekap-laporan", label: "Laporan Tatalaksana", icon: BarChart3, color: "text-amber-600", bg: "bg-amber-100" },
      { href: "/logistik", label: "Manajemen Logistik", icon: Package, color: "text-lime-600", bg: "bg-lime-100" },
      { href: "/logistik/rekap", label: "Rekap Logistik", icon: ClipboardList, color: "text-stone-600", bg: "bg-stone-100" },
    ]
  }
];

export default function FiturPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = fiturCategories.map(category => ({
    ...category,
    items: category.items.filter(item => 
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  return (
    <>
      <style>{`
        .fitur-container {
          max-width: 680px;
          margin: 0 auto;
          padding: 16px 16px 100px 16px;
          min-height: 100vh;
          background: #ffffff;
        }
        .search-wrapper {
          position: sticky;
          top: 0;
          z-index: 20;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(8px);
          padding: 8px 0 16px 0;
          margin-bottom: 8px;
        }
        .search-input-container {
          position: relative;
          display: flex;
          align-items: center;
        }
        .search-icon {
          position: absolute;
          left: 16px;
          color: #94a3b8;
        }
        .search-input {
          width: 100%;
          padding: 12px 16px 12px 48px;
          border-radius: 999px;
          border: 1px solid #e2e8f0;
          background-color: #f8fafc;
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
        }
        .search-input:focus {
          border-color: #0d9488;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.12);
          background-color: #ffffff;
        }
        .category-title {
          font-size: 14px;
          font-weight: 800;
          color: #1e293b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 24px 0 14px 4px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .grid-container {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px 8px;
        }
        .icon-wrapper {
          width: 58px;
          height: 58px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 8px auto;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 2px 6px rgba(0,0,0,0.04);
        }
        .icon-btn:active .icon-wrapper {
          transform: scale(0.92);
        }
        .icon-label {
          font-size: 11px;
          text-align: center;
          color: #334155;
          font-weight: 600;
          line-height: 1.25;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          padding: 0 2px;
        }
        .badge {
          position: absolute;
          top: -6px;
          right: 4px;
          background: linear-gradient(135deg, #ef4444, #f43f5e);
          color: white;
          font-size: 9px;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 9999px;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(239, 68, 68, 0.35);
          z-index: 2;
          letter-spacing: 0.02em;
        }
      `}</style>
      
      <div className="fitur-container">
        <div className="search-wrapper">
          <div className="search-input-container">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Cari Menu & Fitur..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {filteredCategories.length > 0 ? (
          filteredCategories.map((category, idx) => (
            <div key={idx} className="mb-2">
              <h3 className="category-title">
                <span>{category.title}</span>
              </h3>
              <div className="grid-container">
                {category.items.map((item, itemIdx) => (
                  <Link href={item.href} key={itemIdx} className="icon-btn relative block text-center no-underline">
                    {item.badge && <span className="badge">{item.badge}</span>}
                    <div className={`icon-wrapper ${item.bg}`}>
                      <item.icon size={26} className={item.color} />
                    </div>
                    <span className="icon-label">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Search size={40} className="mx-auto text-gray-300 mb-4" />
            <p className="text-sm font-medium">Fitur &quot;{searchQuery}&quot; tidak ditemukan.</p>
          </div>
        )}
      </div>
    </>
  );
}
