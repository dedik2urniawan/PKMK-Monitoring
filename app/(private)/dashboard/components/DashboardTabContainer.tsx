"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, FileText, Calendar, Zap, ClipboardList, MapPin, LayoutDashboard, Microscope, Sparkles } from "lucide-react";
import AnalyticsSection from "./AnalyticsSection";
import WelcomeModal from "./WelcomeModal";
import UserInfoBadge from "@/components/UserInfoBadge";
import DashboardStats from "./DashboardStats";
import AnalysisGeoAI from "./AnalysisGeoAI";
import AnalyticalScientific from "./AnalyticalScientific";

export default function DashboardTabContainer() {
  const [activeTab, setActiveTab] = useState<'geo_ai' | 'kpi_pkmk' | 'scientific'>('kpi_pkmk');

  const today = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="dashboard-container">
      <WelcomeModal />

      {/* Top Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-3">
            Dashboard SIGMA PKMK
            <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2.5 py-1 rounded-full">
              v2.0 System
            </span>
          </h1>
          <p className="page-subtitle">
            <UserInfoBadge fallbackText="Ringkasan data pemantauan, analisis Geo AI, dan riset intervensi gizi." />
          </p>
        </div>
        <div className="date-badge">
          <Calendar size={16} />
          <span>Update Terakhir: {today}</span>
        </div>
      </div>

      {/* Sub Tab Navigation Bar */}
      <div className="bg-slate-100/80 p-1.5 rounded-xl border border-slate-200 mb-8 grid grid-cols-1 md:grid-cols-3 gap-2">
        {/* Sub Tab 1: Analysis Geo AI */}
        <button
          onClick={() => setActiveTab('geo_ai')}
          className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-lg font-bold text-xs md:text-sm transition ${
            activeTab === 'geo_ai'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <MapPin className={`w-4 h-4 ${activeTab === 'geo_ai' ? 'text-blue-600' : 'text-slate-400'}`} />
          <span>Analysis Geo AI</span>
        </button>

        {/* Sub Tab 2: Dashboard KPI PKMK */}
        <button
          onClick={() => setActiveTab('kpi_pkmk')}
          className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-lg font-bold text-xs md:text-sm transition ${
            activeTab === 'kpi_pkmk'
              ? 'bg-white text-teal-600 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <LayoutDashboard className={`w-4 h-4 ${activeTab === 'kpi_pkmk' ? 'text-teal-600' : 'text-slate-400'}`} />
          <span>Dashboard KPI PKMK</span>
        </button>

        {/* Sub Tab 3: Analytical Scientific PKMK */}
        <button
          onClick={() => setActiveTab('scientific')}
          className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-lg font-bold text-xs md:text-sm transition ${
            activeTab === 'scientific'
              ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Microscope className={`w-4 h-4 ${activeTab === 'scientific' ? 'text-indigo-600' : 'text-slate-400'}`} />
          <span>Analytical Scientific PKMK</span>
        </button>
      </div>

      {/* Sub Tab Content 1: Analysis Geo AI */}
      {activeTab === 'geo_ai' && <AnalysisGeoAI />}

      {/* Sub Tab Content 2: Dashboard KPI PKMK */}
      {activeTab === 'kpi_pkmk' && (
        <div className="space-y-8">
          {/* Statistics Grid */}
          <DashboardStats />

          {/* Quick Actions */}
          <section className="quick-actions-section">
            <h3 className="section-title">
              <Zap size={20} className="section-title-icon" />
              Quick Actions
            </h3>
            <div className="quick-actions-card">
              <div className="quick-actions-grid">
                <Link href="/balita/new" className="action-btn-primary">
                  <Plus size={20} />
                  Tambah Balita
                </Link>
                <Link href="/kohort/new" className="action-btn-outline">
                  <ClipboardList size={20} />
                  Buat Kohort
                </Link>
                <Link href="/rekap-laporan" className="action-btn-secondary">
                  <FileText size={20} />
                  Download Laporan Bulanan
                </Link>
              </div>
            </div>
          </section>

          {/* Analytics Section */}
          <AnalyticsSection />

          {/* Info Panel - Tentang Sistem PKMK */}
          <div className="info-panel">
            <div className="info-icon">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="info-title">Tentang Sistem PKMK</h3>
              <p className="info-text">
                Aplikasi Intervensi Stunting dan Monitoring Evaluasi menggunakan formula ONS (Oral Nutrition Supplement)
                atau PKMK (Pangan Olahan untuk Keperluan Medis Khusus) dengan pendampingan dan asistensi medis oleh
                Dokter Pediatrik Dinas Kesehatan Kabupaten Malang.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sub Tab Content 3: Analytical Scientific PKMK */}
      {activeTab === 'scientific' && <AnalyticalScientific />}

    </div>
  );
}
