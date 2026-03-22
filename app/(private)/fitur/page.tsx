"use client";

import Link from "next/link";
import { 
  Search, Users, UserPlus, FileUp, 
  Scale, Utensils, HeartHandshake, 
  PieChart, FileText, Activity, 
  BarChart3, Package, ClipboardList
} from "lucide-react";
import { useState } from "react";

const fiturCategories = [
  {
    title: "Data Balita",
    items: [
      { href: "/balita", label: "Daftar Balita", icon: Users, color: "text-blue-500", bg: "bg-blue-100" },
      { href: "/balita/new", label: "Tambah Balita", icon: UserPlus, color: "text-teal-500", bg: "bg-teal-100", badge: "Baru" },
      { href: "/import/balita", label: "Import Excel", icon: FileUp, color: "text-indigo-500", bg: "bg-indigo-100" },
    ]
  },
  {
    title: "Monitoring PKMK",
    items: [
      { href: "/monitoring", label: "Input Antropometri", icon: Scale, color: "text-orange-500", bg: "bg-orange-100" },
      { href: "/monitoring", label: "Input Konsumsi", icon: Utensils, color: "text-rose-500", bg: "bg-rose-100" },
      { href: "/monitoring", label: "Input Pemberian", icon: HeartHandshake, color: "text-pink-500", bg: "bg-pink-100" },
    ]
  },
  {
    title: "Determinan Stunting",
    items: [
      { href: "/determinan/daftar-balita", label: "Daftar Survey", icon: Users, color: "text-violet-500", bg: "bg-violet-100" },
      { href: "/determinan/analisis", label: "Analisis", icon: PieChart, color: "text-emerald-500", bg: "bg-emerald-100" },
      { href: "/determinan/rekap", label: "Rekap Hasil", icon: FileText, color: "text-cyan-500", bg: "bg-cyan-100" },
    ]
  },
  {
    title: "Laporan & Logistik",
    items: [
      { href: "/riwayat", label: "Riwayat Intervensi", icon: Activity, color: "text-fuchsia-500", bg: "bg-fuchsia-100" },
      { href: "/rekap-laporan", label: "Laporan Tatalaksana", icon: BarChart3, color: "text-amber-500", bg: "bg-amber-100" },
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
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  return (
    <>
      <style>{`
        .fitur-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 16px 16px 32px 16px;
          min-height: 100vh;
          background: #ffffff;
        }
        .search-wrapper {
          position: sticky;
          top: 0;
          z-index: 20;
          background: white;
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
          font-size: 15px;
          outline: none;
          transition: all 0.2s;
        }
        .search-input:focus {
          border-color: #14b8a6;
          box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
          background-color: #ffffff;
        }
        .category-title {
          font-size: 15px;
          font-weight: 700;
          color: #334155;
          margin: 24px 0 16px 8px;
        }
        .grid-container {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px 8px;
        }
        .icon-wrapper {
          width: 56px;
          height: 56px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 8px auto;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .icon-btn:active .icon-wrapper {
          transform: scale(0.92);
        }
        .icon-label {
          font-size: 11px;
          text-align: center;
          color: #475569;
          font-weight: 500;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .badge {
          position: absolute;
          top: -6px;
          right: 2px;
          background: #ef4444;
          color: white;
          font-size: 9px;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 10px;
          border: 2px solid white;
          z-index: 2;
        }
      `}</style>
      
      <div className="fitur-container pb-24 md:pb-10">
        <div className="search-wrapper">
          <div className="search-input-container">
            <Search size={20} className="search-icon" />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Cari Fitur" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {filteredCategories.length > 0 ? (
          filteredCategories.map((category, idx) => (
            <div key={idx}>
              <h3 className="category-title">{category.title}</h3>
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
            <p>Fitur tidak ditemukan.</p>
          </div>
        )}
      </div>
    </>
  );
}
