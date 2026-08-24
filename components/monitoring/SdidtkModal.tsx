"use client";

import React, { useState, useMemo, useEffect } from "react";
import { X, Brain, CheckCircle, AlertTriangle, Info, Save, Activity, Eye, Ear, Heart, ShieldAlert, Sparkles, ChevronDown, ChevronUp, Check, AlertCircle, RefreshCw, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { getAuthHeaders } from "@/lib/clientSession";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { 
  MCHAT_QUESTIONS, 
  INVERTED_ITEM_NUMBERS, 
  getDefaultSafeResponses, 
  evaluateMchat, 
  MchatClinicalIndications 
} from "@/lib/mchatEngine";

type Props = {
  balita: any;
  onClose: () => void;
  onSaveSuccess?: () => void;
};

export type KpspSector = 'GK' | 'GH' | 'BB' | 'SK';

export interface KpspQuestion {
  id: string;
  sector: KpspSector;
  text: string;
}

// Complete KPSP Question Database (3 to 60 Months)
const KPSP_DATABASE: Record<number, KpspQuestion[]> = {
  3: [
    { id: "3_1", sector: "GK", text: "Pada posisi telungkup, apakah bayi dapat mengangkat kepala setinggi 45°?" },
    { id: "3_2", sector: "GK", text: "Pada posisi telungkup, apakah bayi dapat mengangkat kepala hingga 90°?" },
    { id: "3_3", sector: "GK", text: "Pada posisi telentang, apakah bayi dapat mempertahankan posisi kepala di tengah saat digerakkan?" },
    { id: "3_4", sector: "GH", text: "Apakah bayi dapat membalas senyuman pemeriksa/ibu saat diajak bicara/tersenyum?" },
    { id: "3_5", sector: "GH", text: "Apakah bayi dapat mengamati tangannya sendiri?" },
    { id: "3_6", sector: "GH", text: "Apakah bayi dapat memegang mainan kerincingan (rattle) yang diletakkan di telapak tangannya?" },
    { id: "3_7", sector: "BB", text: "Apakah bayi mengeluarkan suara-suara lain selain menangis (mengoceh/cooing)?" },
    { id: "3_8", sector: "BB", text: "Apakah bayi menolehkan kepala atau mengarahkan pandangan ke sumber suara/bel?" },
    { id: "3_9", sector: "SK", text: "Apakah bayi menatap mata ibu/pemeriksa dengan penuh perhatian?" },
    { id: "3_10", sector: "SK", text: "Apakah bayi dapat tertawa spontan atau memekik gembira saat diajak bercanda?" }
  ],
  6: [
    { id: "6_1", sector: "GK", text: "Apakah bayi dapat membalikkan badan sendiri dari telentang ke telungkup atau sebaliknya?" },
    { id: "6_2", sector: "GK", text: "Pada posisi telungkup, apakah bayi dapat menopang dada dengan kedua tangannya bertumpu pada matras?" },
    { id: "6_3", sector: "GK", text: "Apakah bayi dapat duduk tegak tanpa ditopang selama beberapa detik saat didudukkan?" },
    { id: "6_4", sector: "GH", text: "Apakah bayi dapat meraih mainan/benda yang diletakkan di depannya?" },
    { id: "6_5", sector: "GH", text: "Apakah bayi dapat memindahkan mainan/benda dari satu tangan ke tangan lainnya?" },
    { id: "6_6", sector: "GH", text: "Apakah bayi berusaha memungut remah-remah biskuit/benda kecil dengan telapak tangannya?" },
    { id: "6_7", sector: "BB", text: "Apakah bayi dapat mengeluarkan suara seperti 'ba-ba', 'da-da', atau 'ma-ma' (babbling)?" },
    { id: "6_8", sector: "BB", text: "Apakah bayi menoleh langsung ke arah datangnya suara bisikan atau panggilan namanya?" },
    { id: "6_9", sector: "SK", text: "Apakah bayi tersenyum saat melihat bayangannya di cermin?" },
    { id: "6_10", sector: "SK", text: "Apakah bayi menunjukkan rasa takut/cemas terhadap orang asing yang belum dikenal?" }
  ],
  9: [
    { id: "9_1", sector: "GK", text: "Apakah anak dapat bangkit sendiri ke posisi duduk dari posisi telungkup atau telentang?" },
    { id: "9_2", sector: "GK", text: "Apakah anak dapat berdiri dengan berpegangan pada perabot/kursi (cruising)?" },
    { id: "9_3", sector: "GK", text: "Apakah anak dapat merangkak atau merayap ke depan secara aktif?" },
    { id: "9_4", sector: "GH", text: "Apakah anak dapat menjepit benda kecil (remah makanan) menggunakan ibu jari dan telunjuk?" },
    { id: "9_5", sector: "GH", text: "Apakah anak dapat memukulkan dua mainan/kubus yang dipegang di kedua tangan?" },
    { id: "9_6", sector: "GH", text: "Apakah anak berusaha mencari benda yang sengaja disembunyikan di bawah kain?" },
    { id: "9_7", sector: "BB", text: "Apakah anak mengulang suku kata ganda bermakna saat berinteraksi ('pa-pa', 'ma-ma')?" },
    { id: "9_8", sector: "BB", text: "Apakah anak merespons saat dipanggil namanya dari sisi samping atau belakang?" },
    { id: "9_9", sector: "SK", text: "Apakah anak dapat bermain cilukba (peek-a-boo) dengan ekspresi antusias?" },
    { id: "9_10", sector: "SK", text: "Apakah anak dapat melambaikan tangan saat ditinggal pergi (da-dah)?" }
  ],
  12: [
    { id: "12_1", sector: "GK", text: "Apakah anak dapat berdiri sendiri tanpa berpegangan selama minimal 30 detik?" },
    { id: "12_2", sector: "GK", text: "Apakah anak dapat berjalan beberapa langkah tanpa bantuan/berpegangan?" },
    { id: "12_3", sector: "GK", text: "Dari posisi berdiri, apakah anak dapat membungkuk mengambil mainan di lantai lalu berdiri kembali?" },
    { id: "12_4", sector: "GH", text: "Apakah anak dapat memasukkan balok/mainan ke dalam wadah dan mengeluarkannya kembali?" },
    { id: "12_5", sector: "GH", text: "Apakah anak dapat menjepit benda sangat kecil menggunakan ujung ibu jari dan telunjuk?" },
    { id: "12_6", sector: "GH", text: "Apakah anak dapat membolak-balik halaman buku tebal (board book)?" },
    { id: "12_7", sector: "BB", text: "Apakah anak dapat menyebut minimal 1 kata bermakna selain mama dan papa (misal: 'cucu', 'bola')?" },
    { id: "12_8", sector: "BB", text: "Apakah anak memahami instruksi sederhana (seperti 'berikan pada mama') tanpa bantuan isyarat?" },
    { id: "12_9", sector: "SK", text: "Apakah anak dapat memperlihatkan apa yang diinginkannya dengan menunjuk menggunakan jari telunjuk?" },
    { id: "12_10", sector: "SK", text: "Apakah anak dapat minum dari cangkir dengan kedua tangannya sendiri?" }
  ],
  15: [
    { id: "15_1", sector: "GK", text: "Apakah anak dapat berjalan mundur beberapa langkah tanpa terjatuh?" },
    { id: "15_2", sector: "GK", text: "Apakah anak dapat berjalan lancar tanpa terhuyung-huyung?" },
    { id: "15_3", sector: "GK", text: "Apakah anak dapat menaiki tangga dengan merangkak atau dipapah?" },
    { id: "15_4", sector: "GH", text: "Apakah anak dapat menyusun 2 tumpukan kubus ke atas tanpa jatuh?" },
    { id: "15_5", sector: "GH", text: "Apakah anak dapat mencoret-coret kertas menggunakan krayon/pensil secara spontan?" },
    { id: "15_6", sector: "GH", text: "Apakah anak dapat memasukkan kelereng/biji-bijian ke dalam lubang botol kecil?" },
    { id: "15_7", sector: "BB", text: "Apakah anak dapat mengucapkan minimal 3-5 kata yang memiliki arti jelas?" },
    { id: "15_8", sector: "BB", text: "Apakah anak dapat menunjuk 1 gambar benda yang disebutkan pemeriksa?" },
    { id: "15_9", sector: "SK", text: "Apakah anak dapat membantu memegang sendok dan memasukkan makanan ke mulutnya?" },
    { id: "15_10", sector: "SK", text: "Apakah anak dapat memeluk orang tua atau boneka kesayangannya saat bermain?" }
  ],
  18: [
    { id: "18_1", sector: "GH", text: "Apakah anak dapat mencoret-coret kertas tanpa bantuan atau petunjuk?" },
    { id: "18_2", sector: "GH", text: "Apakah anak dapat menyusun menara dari 3 buah kubus?" },
    { id: "18_3", sector: "GK", text: "Apakah anak dapat menaiki tangga dengan berpegangan pada dinding/drel tangga?" },
    { id: "18_4", sector: "GK", text: "Apakah anak dapat menendang bola ke depan tanpa berpegangan?" },
    { id: "18_5", sector: "BB", text: "Apakah anak dapat menyebutkan sedikitnya 3 kata yang bermakna?" },
    { id: "18_6", sector: "BB", text: "Dapatkah anak menunjuk minimal 1 bagian tubuhnya saat ditanya ('Mana hidungmu?')?" },
    { id: "18_7", sector: "SK", text: "Apakah anak dapat menunjukkan apa yang diinginkannya tanpa menangis atau merengek?" },
    { id: "18_8", sector: "SK", text: "Apakah anak dapat meniru aktivitas rumah tangga sederhana (menyapu, mengelap)?" },
    { id: "18_9", sector: "SK", text: "Apakah anak dapat melepas kaos kakinya sendiri?" },
    { id: "18_10", sector: "GH", text: "Apakah anak dapat memutar tutup botol kecil atau membalik buku berhalaman tipis?" }
  ],
  24: [
    { id: "24_1", sector: "GH", text: "Apakah anak dapat mencoret-coret kertas tanpa bantuan/petunjuk?" },
    { id: "24_2", sector: "GH", text: "Apakah anak dapat menyusun minimal 4 kubus ke atas?" },
    { id: "24_3", sector: "GH", text: "Apakah anak dapat membuka bungkus permen/biskuit kecil secara mandiri?" },
    { id: "24_4", sector: "GK", text: "Apakah anak dapat berjalan naik tangga sendiri tanpa berpegangan?" },
    { id: "24_5", sector: "GK", text: "Apakah anak dapat berlari stabil tanpa terjatuh?" },
    { id: "24_6", sector: "GK", text: "Apakah anak dapat melompat ke atas dengan kedua kaki terangkat dari lantai?" },
    { id: "24_7", sector: "BB", text: "Tanpa bantuan, dapatkah anak menunjuk paling sedikit 2 bagian tubuhnya dengan benar?" },
    { id: "24_8", sector: "BB", text: "Apakah anak mampu merangkai 2 kata menjadi kalimat sederhana ('Mama jalan', 'Mau susu')?" },
    { id: "24_9", sector: "SK", text: "Apakah anak dapat melepas pakaiannya sendiri (baju terbuka, celana pendek)?" },
    { id: "24_10", sector: "SK", text: "Apakah anak dapat mencuci dan mengeringkan kedua tangannya sendiri setelah makan?" }
  ],
  36: [
    { id: "36_1", sector: "GH", text: "Dapatkah anak menyusun 6 buah kubus satu persatu di atas kubus lain tanpa jatuh?" },
    { id: "36_2", sector: "GH", text: "Dapatkah anak meniru menggambar garis lurus di samping contoh garis?" },
    { id: "36_3", sector: "GH", text: "Apakah anak dapat memegang pensil dengan posisi jempol dan telunjuk (bukan digenggam)?" },
    { id: "36_4", sector: "GK", text: "Apakah anak dapat melompati lebar kertas atau rintangan rendah dengan kedua kaki?" },
    { id: "36_5", sector: "GK", text: "Apakah anak dapat berdiri di atas 1 kaki tanpa berpegangan selama minimal 3 detik?" },
    { id: "36_6", sector: "BB", text: "Tanpa bantuan, dapatkah anak menyebut 4 gambar binatang (kucing, burung, kuda, anjing)?" },
    { id: "36_7", sector: "BB", text: "Apakah anak dapat menyebutkan nama lengkap dirinya sendiri?" },
    { id: "36_8", sector: "BB", text: "Apakah anak dapat memahami 2 kata sifat berlawanan ('gajah besar, tikus...')?" },
    { id: "36_9", sector: "SK", text: "Apakah anak dapat mengenakan celana panjang/kaos sendiri dengan benar?" },
    { id: "36_10", sector: "SK", text: "Apakah anak dapat bermain peran sederhana bersama teman sebaya (bermain masak-masakan)?" }
  ],
  48: [
    { id: "48_1", sector: "GH", text: "Dapatkah anak meniru membuat jembatan dari 3 kubus?" },
    { id: "48_2", sector: "GH", text: "Mintalah anak meniru menggambar lingkaran di kertas (garis kurva tertutup utuh)?" },
    { id: "48_3", sector: "GH", text: "Apakah anak dapat memotong kertas menjadi 2 bagian menggunakan gunting anak?" },
    { id: "48_4", sector: "GK", text: "Apakah anak dapat berdiri di atas satu kaki selama >= 4 detik tanpa goyang?" },
    { id: "48_5", sector: "GK", text: "Apakah anak dapat melompat maju sejauh >= 30 cm dengan kedua kaki bertumpu serentak?" },
    { id: "48_6", sector: "BB", text: "Dapatkah anak mengambil tepat 1 kubus dari 5 kubus di meja saat diminta?" },
    { id: "48_7", sector: "BB", text: "Dapatkah anak menyebutkan sedikitnya 4 warna dasar (Merah, Kuning, Hijau, Biru)?" },
    { id: "48_8", sector: "BB", text: "Apakah ucapan anak sudah dapat dipahami sepenuhnya oleh orang lain/orang asing?" },
    { id: "48_9", sector: "SK", text: "Apakah anak dapat mengancingkan kancing bajunya sendiri (minimal 1 kancing besar)?" },
    { id: "48_10", sector: "SK", text: "Apakah anak dapat mengikuti aturan sederhana dalam permainan kelompok bersama teman?" }
  ],
  60: [
    { id: "60_1", sector: "GH", text: "Apakah anak dapat menunjuk garis yang lebih panjang sebanyak 3 kali berturut-turut?" },
    { id: "60_2", sector: "GH", text: "Apakah anak dapat menggambar orang dengan sedikitnya 3 bagian tubuh terpisah?" },
    { id: "60_3", sector: "GH", text: "Dapatkah anak menyebutkan 4 warna dasar (Merah, Kuning, Hijau, Biru) dengan benar?" },
    { id: "60_4", sector: "GK", text: "Apakah anak dapat berdiri di atas 1 kaki selama minimal 6 detik?" },
    { id: "60_5", sector: "GK", text: "Apakah anak dapat melompat dengan 1 kaki berturut-turut >= 3 kali tanpa jatuh?" },
    { id: "60_6", sector: "GK", text: "Apakah anak dapat menangkap bola tenis yang dilempar dari jarak 1.5 meter?" },
    { id: "60_7", sector: "BB", text: "Dapatkah anak menjawab 3 pertanyaan terkait kata sifat (kedinginan, kelelahan, lapar)?" },
    { id: "60_8", sector: "BB", text: "Dapatkah anak melakukan 3 perintah kata depan (di atas, di bawah, di depan, di belakang)?" },
    { id: "60_9", sector: "SK", text: "Apakah anak dapat berpakaian sendiri secara mandiri dari awal hingga selesai?" },
    { id: "60_10", sector: "SK", text: "Apakah anak bereaksi tenang saat berpisah dengan orang tua di lingkungan aman (PAUD)?" }
  ]
};

export default function SdidtkModal({ balita, onClose, onSaveSuccess }: Props) {
  const [gestationalWeeks, setGestationalWeeks] = useState<number>(40);
  const [assessmentDate, setAssessmentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  
  // Antropometri snapshot
  const [weightKg, setWeightKg] = useState<string>("");
  const [heightCm, setHeightCm] = useState<string>("");
  const [headCircCm, setHeadCircCm] = useState<string>("");

  // KPSP responses (key: questionId, value: boolean)
  const [kpspAnswers, setKpspAnswers] = useState<Record<string, boolean>>({});
  
  // TDD & Skrining Khusus
  const [tddNormal, setTddNormal] = useState<boolean>(true);
  const [leukocoriaNormal, setLeukocoriaNormal] = useState<boolean>(true);
  const [tdlScore, setTdlScore] = useState<number>(5);

  // M-CHAT-R (16-30 bln / Atas Indikasi)
  const [mchatExpanded, setMchatExpanded] = useState<boolean>(false);
  const [mchatIndications, setMchatIndications] = useState<MchatClinicalIndications>({
    hasSpeechDelay: false,
    hasSocialCommunicationIssue: false,
    hasRepetitiveBehavior: false,
  });
  const [mchatResponses, setMchatResponses] = useState<Record<number, boolean>>(getDefaultSafeResponses());
  
  // KMPE (36-60 bln)
  const [kmpeYesCount, setKmpeYesCount] = useState<number>(0);

  // GPPH (>=36 bln)
  const [gpphTotalScore, setGpphTotalScore] = useState<number>(0);

  const [saving, setSaving] = useState<boolean>(false);

  // Compute Precise Age & Prematurity Correction
  const ageAnalysis = useMemo(() => {
    const birthDateStr = balita?.tgl_lahir || "2023-01-01";
    const birthD = new Date(birthDateStr);
    const evalD = new Date(assessmentDate);

    const diffMs = evalD.getTime() - birthD.getTime();
    const chronoDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    const chronoMonths = chronoDays / 30.4375;

    let isPrematureCorrected = false;
    let correctedDays = chronoDays;

    if (chronoMonths < 24.0 && gestationalWeeks < 37) {
      isPrematureCorrected = true;
      const deficitDays = (40 - gestationalWeeks) * 7;
      correctedDays = Math.max(0, chronoDays - deficitDays);
    }

    const correctedMonths = correctedDays / 30.4375;
    const effectiveMonths = isPrematureCorrected ? correctedMonths : chronoMonths;

    // KPSP snap bracket calculation: if remDays >= 16, round up +1 month
    const remDays = chronoDays % 30;
    const roundedAge = Math.floor(effectiveMonths) + (remDays >= 16 ? 1 : 0);

    const brackets = [3, 6, 9, 12, 15, 18, 21, 24, 30, 36, 42, 48, 54, 60];
    let selectedBracket = 3;
    for (const b of brackets) {
      if (roundedAge >= b) selectedBracket = b;
      else break;
    }

    return {
      chronoDays,
      chronoMonths: Math.round(chronoMonths * 10) / 10,
      correctedMonths: Math.round(correctedMonths * 10) / 10,
      effectiveMonths: Math.round(effectiveMonths * 10) / 10,
      isPrematureCorrected,
      selectedBracket,
    };
  }, [balita, assessmentDate, gestationalWeeks]);

  // Questions for active KPSP bracket
  const activeQuestions = useMemo(() => {
    const bracket = ageAnalysis.selectedBracket;
    return KPSP_DATABASE[bracket] || KPSP_DATABASE[36] || KPSP_DATABASE[3];
  }, [ageAnalysis.selectedBracket]);

  // Auto-fill all KPSP questions to 'Ya' by default for convenience
  useEffect(() => {
    const initial: Record<string, boolean> = {};
    activeQuestions.forEach((q) => {
      initial[q.id] = true;
    });
    setKpspAnswers(initial);
  }, [activeQuestions]);

  // M-CHAT-R Evaluation & Trigger state
  const isMchatTargetAge = ageAnalysis.effectiveMonths >= 16 && ageAnalysis.effectiveMonths <= 30;
  const hasAnyMchatIndication = mchatIndications.hasSpeechDelay || mchatIndications.hasSocialCommunicationIssue || mchatIndications.hasRepetitiveBehavior;
  const isMchatActive = isMchatTargetAge || hasAnyMchatIndication;

  const mchatEvaluation = useMemo(() => {
    return evaluateMchat(mchatResponses, ageAnalysis.effectiveMonths);
  }, [mchatResponses, ageAnalysis.effectiveMonths]);

  // KPSP Evaluation & Sectoral Breakdown
  const kpspEvaluation = useMemo(() => {
    let yesCount = 0;
    const failedSectorsSet = new Set<KpspSector>();
    const sectorStats: Record<KpspSector, { total: number; passed: number }> = {
      GK: { total: 0, passed: 0 },
      GH: { total: 0, passed: 0 },
      BB: { total: 0, passed: 0 },
      SK: { total: 0, passed: 0 },
    };

    activeQuestions.forEach((q) => {
      const isYes = kpspAnswers[q.id] ?? true;
      sectorStats[q.sector].total += 1;
      if (isYes) {
        yesCount += 1;
        sectorStats[q.sector].passed += 1;
      } else {
        failedSectorsSet.add(q.sector);
      }
    });

    let status: 'SESUAI_UMUR' | 'MERAGUKAN' | 'PENYIMPANGAN' = 'SESUAI_UMUR';
    if (yesCount >= 9) status = 'SESUAI_UMUR';
    else if (yesCount >= 7) status = 'MERAGUKAN';
    else status = 'PENYIMPANGAN';

    // Radar Chart Data (0 to 100%)
    const radarData = (['GK', 'GH', 'BB', 'SK'] as KpspSector[]).map((sec) => {
      const stat = sectorStats[sec];
      const pct = stat.total > 0 ? Math.round((stat.passed / stat.total) * 100) : 100;
      const labels: Record<KpspSector, string> = {
        GK: 'Gerak Kasar (GK)',
        GH: 'Gerak Halus (GH)',
        BB: 'Bicara & Bahasa (BB)',
        SK: 'Sosialisasi & Kemandirian (SK)',
      };
      return {
        sector: labels[sec],
        score: pct,
        fullMark: 100,
      };
    });

    return {
      yesCount,
      status,
      failedSectors: Array.from(failedSectorsSet),
      radarData,
    };
  }, [activeQuestions, kpspAnswers]);

  // Decision & Referral Engine
  const clinicalDecision = useMemo(() => {
    const triggers: string[] = [];
    let urgency: 'ROUTINE' | 'SPECIALIST_LEVEL_1' | 'EMERGENCY' = 'ROUTINE';

    if (!leukocoriaNormal) {
      triggers.push("Curiga Leukokoria / Pupil Putih (Mata)");
      urgency = 'EMERGENCY';
    }

    if (kpspEvaluation.status === 'PENYIMPANGAN') {
      triggers.push(`KPSP Penyimpangan (${kpspEvaluation.yesCount}/10 Ya)`);
      if (urgency !== 'EMERGENCY') urgency = 'SPECIALIST_LEVEL_1';
    }

    if (!tddNormal) {
      triggers.push("Skrining TDD Gagal / Suspek Pendengaran");
      if (urgency !== 'EMERGENCY') urgency = 'SPECIALIST_LEVEL_1';
    }

    if (tdlScore < 4 && ageAnalysis.effectiveMonths >= 36) {
      triggers.push("Tes Daya Lihat (TDL) Kurang");
      if (urgency !== 'EMERGENCY') urgency = 'SPECIALIST_LEVEL_1';
    }

    if (isMchatActive && mchatEvaluation.totalRiskScore >= 3) {
      const failedItemsSummary = mchatEvaluation.failedItemNumbers.length > 0
        ? ` (Butir: ${mchatEvaluation.failedItemNumbers.join(', ')})`
        : '';
      triggers.push(`M-CHAT-R Risiko Autisme (Skor ${mchatEvaluation.totalRiskScore}/20${failedItemsSummary})`);
      if (urgency !== 'EMERGENCY') urgency = 'SPECIALIST_LEVEL_1';
    }

    if (gpphTotalScore >= 13 && ageAnalysis.effectiveMonths >= 36) {
      triggers.push(`Skrining GPPH Positif (Skor ${gpphTotalScore})`);
      if (urgency !== 'EMERGENCY') urgency = 'SPECIALIST_LEVEL_1';
    }

    const referralRequired = triggers.length > 0;

    let actionCode = "STIMULASI_RUTIN";
    let destination = "Posyandu / Rumah Tangga";

    if (urgency === 'EMERGENCY') {
      actionCode = "EMERGENCY_RUJUKAN";
      destination = "Spesialis Mata / RS Rujukan Tersier";
    } else if (urgency === 'SPECIALIST_LEVEL_1') {
      actionCode = "RUJUK_RS_LEVEL_1";
      destination = "RS Rujukan Tumbuh Kembang Level 1 / Dokter Spesialis Anak";
    } else if (kpspEvaluation.status === 'MERAGUKAN' || kmpeYesCount >= 1) {
      actionCode = "EVALUASI_2_MINGGU";
      destination = "Puskesmas (Konseling Stimulasi 2 Minggu)";
    }

    return {
      actionCode,
      referralRequired,
      urgency,
      destination,
      triggers,
    };
  }, [leukocoriaNormal, kpspEvaluation, tddNormal, tdlScore, isMchatActive, mchatEvaluation, gpphTotalScore, kmpeYesCount, ageAnalysis.effectiveMonths]);

  async function handleSaveAssessment() {
    setSaving(true);
    try {
      const authHeaders = await getAuthHeaders();
      const payload = {
        balita_id: balita.id,
        assessment_date: assessmentDate,
        birth_date: balita.tgl_lahir || "2023-01-01",
        gestational_weeks: gestationalWeeks,
        chronological_age_months: ageAnalysis.chronoMonths,
        corrected_age_months: ageAnalysis.isPrematureCorrected ? ageAnalysis.correctedMonths : undefined,
        is_premature_corrected: ageAnalysis.isPrematureCorrected,
        weight_kg: weightKg ? Number(weightKg) : undefined,
        height_cm: heightCm ? Number(heightCm) : undefined,
        head_circ_cm: headCircCm ? Number(headCircCm) : undefined,
        kpsp_age_bracket: ageAnalysis.selectedBracket,
        kpsp_yes_count: kpspEvaluation.yesCount,
        kpsp_status: kpspEvaluation.status,
        kpsp_failed_sectors: kpspEvaluation.failedSectors,
        kpsp_answers: kpspAnswers,
        tdd_status: tddNormal ? "NORMAL" : "SUSPEK_GANGGUAN_DENGAR",
        leukocoria_status: leukocoriaNormal ? "NORMAL" : "CURIGA_LEUKOKORIA",
        tdl_status: ageAnalysis.effectiveMonths >= 36 ? (tdlScore >= 4 ? "DAYA_LIHAT_BAIK" : "DAYA_LIHAT_KURANG") : undefined,
        mchat_score: isMchatActive ? mchatEvaluation.totalRiskScore : undefined,
        mchat_risk: isMchatActive ? mchatEvaluation.riskClassification : undefined,
        mchat_indications: mchatIndications,
        mchat_answers: isMchatActive ? mchatResponses : {},
        mchat_failed_items: isMchatActive ? mchatEvaluation.failedItemNumbers : [],
        kmpe_yes_count: ageAnalysis.effectiveMonths >= 36 ? kmpeYesCount : undefined,
        kmpe_status: ageAnalysis.effectiveMonths >= 36 ? (kmpeYesCount > 0 ? "MASALAH_EMOSIONAL" : "NORMAL") : undefined,
        gpph_total_score: ageAnalysis.effectiveMonths >= 36 ? gpphTotalScore : undefined,
        gpph_status: ageAnalysis.effectiveMonths >= 36 ? (gpphTotalScore >= 13 ? "KEMUNGKINAN_GPPH" : "NORMAL") : undefined,
        clinical_action: clinicalDecision.actionCode,
        referral_required: clinicalDecision.referralRequired,
        referral_urgency: clinicalDecision.urgency,
        referral_reasons: clinicalDecision.triggers,
        referral_destination: clinicalDecision.destination,
      };

      const res = await fetch("/api/sdidtk", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        toast.error("Gagal menyimpan asesmen SDIDTK: " + errText);
        return;
      }

      toast.success("🎉 Asesmen SDIDTK Terintegrasi Berhasil Disimpan!");
      if (onSaveSuccess) onSaveSuccess();
      onClose();
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-cyan-800 px-6 py-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center font-bold">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Modul SDIDTK Terintegrasi (0–60 Bulan)
                <span className="text-xs bg-emerald-400/30 text-emerald-100 border border-emerald-300/30 px-2 py-0.5 rounded-full font-medium">
                  Kemenkes RI 2022
                </span>
              </h2>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                {balita?.nama_balita} • NIK: {balita?.nik || '-'} • Tgl Lahir: {balita?.tgl_lahir || '-'}
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-sm">
          
          {/* Section 1: Komputasi Umur & Koreksi Prematuritas */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <span>👶 Komputasi Umur & Koreksi Prematuritas</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Perhitungan umur presisi dan otomatis penentuan jadwal kuesioner KPSP baku.
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="bg-white border border-slate-300 rounded-lg p-2 text-center">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Umur Kronologis</span>
                  <span className="text-sm font-extrabold text-slate-800">{ageAnalysis.chronoMonths} Bln</span>
                </div>
                {ageAnalysis.isPrematureCorrected && (
                  <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-2 text-center">
                    <span className="text-[10px] font-bold uppercase text-emerald-600 block">Umur Terkoreksi</span>
                    <span className="text-sm font-extrabold text-emerald-700">{ageAnalysis.correctedMonths} Bln</span>
                  </div>
                )}
                <div className="bg-teal-50 border border-teal-300 rounded-lg p-2 text-center">
                  <span className="text-[10px] font-bold uppercase text-teal-600 block">Jadwal KPSP Baku</span>
                  <span className="text-sm font-extrabold text-teal-800">{ageAnalysis.selectedBracket} Bulan</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-200">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Usia Gestasi Lahir (Minggu)</label>
                <input
                  type="number"
                  min={24}
                  max={42}
                  value={gestationalWeeks}
                  onChange={(e) => setGestationalWeeks(Number(e.target.value))}
                  className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Prematur jika &lt; 37 minggu</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Tanggal Asesmen</label>
                <input
                  type="date"
                  value={assessmentDate}
                  onChange={(e) => setAssessmentDate(e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                />
              </div>

              <div className="flex items-center">
                {ageAnalysis.isPrematureCorrected ? (
                  <div className="bg-emerald-100/80 border border-emerald-300 text-emerald-800 p-2.5 rounded-lg text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Koreksi Aktif:</strong> Usia gestasi {gestationalWeeks} minggu (&lt;37m). Evaluasi KPSP disesuaikan umur koreksi.</span>
                  </div>
                ) : (
                  <div className="bg-slate-100 text-slate-600 p-2.5 rounded-lg text-xs">
                    <span>Lahir cukup bulan (&ge;37m). Menggunakan umur kronologis standar.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: KPSP & Sectoral Radar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* KPSP Question Form (Left 2 cols) */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    Kuesioner Pra Skrining Perkembangan (KPSP {ageAnalysis.selectedBracket} Bulan)
                  </h3>
                  <p className="text-xs text-slate-400">Jawab 10 pertanyaan perkembangan anak (Ya = Sesuai, Tidak = Gagal)</p>
                </div>
                <div className="text-xs font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
                  Skor: {kpspEvaluation.yesCount} / 10 Ya
                </div>
              </div>

              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {activeQuestions.map((q, idx) => {
                  const isYes = kpspAnswers[q.id] ?? true;
                  return (
                    <div
                      key={q.id}
                      className={`p-3 rounded-lg border flex items-center justify-between gap-3 text-xs transition ${
                        isYes ? 'bg-slate-50 border-slate-200' : 'bg-rose-50/80 border-rose-200'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase shrink-0 mt-0.5 ${
                          q.sector === 'GK' ? 'bg-blue-100 text-blue-800' :
                          q.sector === 'GH' ? 'bg-emerald-100 text-emerald-800' :
                          q.sector === 'BB' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {q.sector}
                        </span>
                        <span className="text-slate-700 font-medium leading-relaxed">
                          <strong>{idx + 1}.</strong> {q.text}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setKpspAnswers((prev) => ({ ...prev, [q.id]: true }))}
                          className={`px-3 py-1.5 rounded-md font-bold text-xs transition ${
                            isYes ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          Ya
                        </button>
                        <button
                          type="button"
                          onClick={() => setKpspAnswers((prev) => ({ ...prev, [q.id]: false }))}
                          className={`px-3 py-1.5 rounded-md font-bold text-xs transition ${
                            !isYes ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          Tidak
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Radar Performance Chart (Right 1 col) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  Radar Performansi 4 Sektor
                </h4>
                <p className="text-[11px] text-slate-400">Visualisasi kelulusan per domain perkembangan.</p>
              </div>

              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={kpspEvaluation.radarData}>
                    <PolarGrid stroke="#cbd5e1" />
                    <PolarAngleAxis dataKey="sector" tick={{ fontSize: 9, fill: '#475569' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                    <Radar name="Skor Sektor" dataKey="score" stroke="#059669" fill="#10b981" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Status Badge */}
              <div className={`p-3 rounded-xl border text-center ${
                kpspEvaluation.status === 'SESUAI_UMUR' ? 'bg-emerald-100 border-emerald-300 text-emerald-800' :
                kpspEvaluation.status === 'MERAGUKAN' ? 'bg-amber-100 border-amber-300 text-amber-800' :
                'bg-rose-100 border-rose-300 text-rose-800'
              }`}>
                <span className="text-[10px] uppercase font-bold tracking-wider block">Status KPSP</span>
                <span className="text-base font-extrabold block mt-0.5">
                  {kpspEvaluation.status === 'SESUAI_UMUR' ? '✅ Sesuai Umur (Ds)' :
                   kpspEvaluation.status === 'MERAGUKAN' ? '⚠️ Meragukan (Dm)' : '🚨 Penyimpangan (Dp)'}
                </span>
                {kpspEvaluation.failedSectors.length > 0 && (
                  <span className="text-[10px] font-semibold block mt-1">
                    Gagal Sektor: {kpspEvaluation.failedSectors.join(', ')}
                  </span>
                )}
              </div>
            </div>

          </div>

          {/* Section 3: Adaptive Sensorik & Behavioral Screening */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-600" />
              Skrining Khusus Sensorik (TDD/TDL) & Perilaku Emosional
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              
              {/* TDD Pendengaran */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Ear className="w-4 h-4 text-blue-600" /> Tes Daya Dengar (TDD)
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tddNormal ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {tddNormal ? 'Normal' : 'Suspek Gagal'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">Respon terhadap suara keras & panggilan nama.</p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setTddNormal(true)}
                    className={`flex-1 py-1 rounded font-bold text-[11px] ${tddNormal ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                  >
                    Lolos (Normal)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTddNormal(false)}
                    className={`flex-1 py-1 rounded font-bold text-[11px] ${!tddNormal ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                  >
                    Tidak Lolos
                  </button>
                </div>
              </div>

              {/* Leukokoria / Pupil Putih Mata */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-purple-600" /> Skrining Mata (Pupil Putih)
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${leukocoriaNormal ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {leukocoriaNormal ? 'Normal' : 'Curiga Leukokoria'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">Refleks merah fundus simetris bilateral.</p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setLeukocoriaNormal(true)}
                    className={`flex-1 py-1 rounded font-bold text-[11px] ${leukocoriaNormal ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeukocoriaNormal(false)}
                    className={`flex-1 py-1 rounded font-bold text-[11px] ${!leukocoriaNormal ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                  >
                    Abnormal (Pupil Putih)
                  </button>
                </div>
              </div>

              {/* M-CHAT-R (16-30 Bulan / Indikasi Klinis) */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-rose-600" /> M-CHAT-R (Autisme)
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isMchatTargetAge ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {isMchatTargetAge ? '16–30 Bulan' : 'Atas Indikasi'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Deteksi dini spektrum autisme 20 butir terstandardisasi.</p>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 font-medium">Skor Risiko Poin:</span>
                    <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {mchatEvaluation.totalRiskScore} / 20 Poin
                    </span>
                  </div>
                  <span className={`block text-[10px] font-bold text-center py-1 rounded border ${
                    mchatEvaluation.riskClassification === 'RISIKO_SEDANG_TINGGI'
                      ? 'bg-rose-100 text-rose-700 border-rose-300'
                      : 'bg-emerald-100 text-emerald-700 border-emerald-300'
                  }`}>
                    {mchatEvaluation.riskClassification === 'RISIKO_SEDANG_TINGGI'
                      ? '🚨 Risiko Sedang / Tinggi'
                      : '✅ Risiko Rendah'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setMchatExpanded((prev) => !prev)}
                  className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border shadow-sm ${
                    mchatExpanded
                      ? 'bg-slate-800 text-white border-slate-900'
                      : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  {mchatExpanded ? "Tutup Kuesioner (20 Butir)" : "Expand Modul M-CHAT-R (20 Butir)"}
                  {mchatExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

            </div>

            {/* Expandable M-CHAT-R Comprehensive Sub-Assessment Section */}
            {mchatExpanded && (
              <div className="bg-white border-2 border-rose-200 rounded-2xl p-5 space-y-5 shadow-lg animate-in fade-in zoom-in-95 duration-200 mt-4">
                
                {/* M-CHAT-R Header & Instructions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-rose-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
                        <Heart className="w-5 h-5" />
                      </span>
                      <h4 className="font-extrabold text-slate-800 text-base">
                        Kuesioner Lengkap Deteksi Dini Autisme (M-CHAT-R/F)
                      </h4>
                      <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full border border-rose-200">
                        20 Butir Standar Kemenkes RI
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Petunjuk: Jawablah berdasarkan perilaku kebiasaan anak sehari-hari. Jika anak hanya pernah melakukan beberapa kali/tidak konsisten, pilih <strong>"Tidak"</strong>.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMchatResponses(getDefaultSafeResponses())}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Set Semua Normal (0 Poin)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMchatExpanded(false)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-600 rounded-lg text-xs font-bold transition"
                    >
                      Tutup
                    </button>
                  </div>
                </div>

                {/* Indikasi Klinis Skrining (Speech delay / Perilaku khusus) */}
                <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-4 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-rose-600" />
                    Skrining Atas Indikasi Klinis (Keluhan Spesifik Orang Tua/Nakes)
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                    <label className="flex items-start gap-2 text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-rose-100 cursor-pointer hover:bg-rose-50/30">
                      <input
                        type="checkbox"
                        checked={mchatIndications.hasSpeechDelay}
                        onChange={(e) => setMchatIndications((prev) => ({ ...prev, hasSpeechDelay: e.target.checked }))}
                        className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                      />
                      <span><strong>Terlambat Bicara:</strong> <em>Speech delay</em> atau kehilangan kemampuan bicara.</span>
                    </label>

                    <label className="flex items-start gap-2 text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-rose-100 cursor-pointer hover:bg-rose-50/30">
                      <input
                        type="checkbox"
                        checked={mchatIndications.hasSocialCommunicationIssue}
                        onChange={(e) => setMchatIndications((prev) => ({ ...prev, hasSocialCommunicationIssue: e.target.checked }))}
                        className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                      />
                      <span><strong>Hambatan Sosial:</strong> Kontak mata minim / tidak menoleh saat dipanggil.</span>
                    </label>

                    <label className="flex items-start gap-2 text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-rose-100 cursor-pointer hover:bg-rose-50/30">
                      <input
                        type="checkbox"
                        checked={mchatIndications.hasRepetitiveBehavior}
                        onChange={(e) => setMchatIndications((prev) => ({ ...prev, hasRepetitiveBehavior: e.target.checked }))}
                        className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                      />
                      <span><strong>Perilaku Berulang:</strong> Gerakan stereotipik jari/tangan atau minat kaku.</span>
                    </label>
                  </div>
                </div>

                {/* 20 Questionnaire Items */}
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
                  {MCHAT_QUESTIONS.map((q) => {
                    const ans = mchatResponses[q.id] ?? !q.isInverted;
                    // Risk triggered calculation
                    const isRiskTriggered = q.isInverted ? ans === true : ans === false;

                    return (
                      <div
                        key={q.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isRiskTriggered
                            ? 'bg-rose-50/90 border-rose-300 shadow-sm'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                                {q.id}
                              </span>
                              <span className="font-semibold text-slate-800 text-xs sm:text-sm">
                                {q.questionText}
                              </span>
                              {q.isInverted && (
                                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200 shrink-0">
                                  ⚠️ Inversi (Risiko jika YA)
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 italic pl-8">
                              💡 {q.explanation}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 sm:self-center pl-8 sm:pl-0">
                            {isRiskTriggered && (
                              <span className="text-[10px] font-extrabold text-rose-700 bg-rose-100 px-2 py-1 rounded border border-rose-200 animate-pulse">
                                🚨 +1 Poin Risiko
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => setMchatResponses((prev) => ({ ...prev, [q.id]: true }))}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                ans === true
                                  ? q.isInverted
                                    ? 'bg-rose-600 text-white shadow'
                                    : 'bg-emerald-600 text-white shadow'
                                  : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              {ans === true && <Check className="w-3.5 h-3.5" />}
                              Ya
                            </button>
                            <button
                              type="button"
                              onClick={() => setMchatResponses((prev) => ({ ...prev, [q.id]: false }))}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                ans === false
                                  ? !q.isInverted
                                    ? 'bg-rose-600 text-white shadow'
                                    : 'bg-emerald-600 text-white shadow'
                                  : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              {ans === false && <Check className="w-3.5 h-3.5" />}
                              Tidak
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Score & Stratification Diagnostic Summary Bar */}
                <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  mchatEvaluation.riskClassification === 'RISIKO_SEDANG_TINGGI'
                    ? 'bg-rose-100/90 border-rose-300 text-rose-900'
                    : 'bg-emerald-100/90 border-emerald-300 text-emerald-900'
                }`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider">Hasil Analisis M-CHAT-R:</span>
                      <span className="text-sm font-extrabold px-2.5 py-0.5 rounded-full bg-white/80 border">
                        Skor {mchatEvaluation.totalRiskScore} dari 20 Butir ({mchatEvaluation.riskClassification.replace(/_/g, ' ')})
                      </span>
                    </div>
                    <p className="text-xs font-medium">
                      {mchatEvaluation.recommendation.description}
                    </p>
                    {mchatEvaluation.failedItemNumbers.length > 0 && (
                      <p className="text-[11px] font-bold text-rose-800 pt-1">
                        Butir yang Memicu Risiko: #{mchatEvaluation.failedItemNumbers.join(', #')}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="text-[10px] uppercase font-bold tracking-wider block opacity-75">Tindakan Klinis</span>
                    <span className="text-xs font-extrabold underline block">
                      {mchatEvaluation.recommendation.title}
                    </span>
                  </div>
                </div>

              </div>
            )}
          </div>


          {/* Section 4: Automatic Clinical Decision Card */}
          <div className={`p-5 rounded-xl border ${
            clinicalDecision.urgency === 'EMERGENCY' ? 'bg-rose-50 border-rose-300' :
            clinicalDecision.urgency === 'SPECIALIST_LEVEL_1' ? 'bg-amber-50 border-amber-300' :
            'bg-emerald-50 border-emerald-300'
          }`}>
            <div className="flex items-start gap-3">
              {clinicalDecision.urgency === 'EMERGENCY' && <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />}
              {clinicalDecision.urgency === 'SPECIALIST_LEVEL_1' && <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />}
              {clinicalDecision.urgency === 'ROUTINE' && <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />}

              <div className="space-y-1">
                <h4 className="font-extrabold text-base text-slate-800">
                  Keputusan Klinis Sistem: {clinicalDecision.actionCode.replace(/_/g, ' ')}
                </h4>
                <p className="text-xs text-slate-700">
                  Tujuan Rujukan / Evaluasi: <strong>{clinicalDecision.destination}</strong>
                </p>
                {clinicalDecision.triggers.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-200 text-xs">
                    <span className="font-bold text-slate-800 block mb-1">Pemicu Rujukan Sistem:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                      {clinicalDecision.triggers.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-slate-300 font-semibold text-slate-600 text-sm hover:bg-slate-100 transition"
          >
            Tutup
          </button>
          <button
            onClick={handleSaveAssessment}
            disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm shadow-md shadow-emerald-500/20 hover:from-emerald-700 hover:to-teal-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Memproses..." : "Simpan Asesmen SDIDTK"}
          </button>
        </div>

      </div>
    </div>
  );
}
