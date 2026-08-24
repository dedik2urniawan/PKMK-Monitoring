/**
 * M-CHAT-R (Modified Checklist for Autism in Toddlers, Revised) Engine
 * Standard: Buku Bagan SDIDTK Kemenkes RI & M-CHAT-R/F
 * System: SIGMA PKMK Platform v3.0
 */

export interface MchatQuestion {
  id: number;
  questionText: string;
  explanation: string;
  isInverted: boolean; // Inverted items: No 2, 5, 12 -> Risk point if answer is YA (true)
}

export const MCHAT_QUESTIONS: MchatQuestion[] = [
  {
    id: 1,
    questionText: "Jika Anda menunjuk sesuatu di ruangan, apakah anak Anda melihatnya?",
    explanation: "Misalnya, jika Anda menunjuk seekor hewan atau mainan di sudut ruangan, apakah anak Anda menoleh dan melihat ke arah objek yang Anda tunjuk?",
    isInverted: false,
  },
  {
    id: 2,
    questionText: "Pernahkah Anda berpikir bahwa anak Anda tuli / sulit mendengar?",
    explanation: "Orang tua merasa anak tidak mendengar karena sering tidak merespons suara, meskipun fungsi organ telinga normal.",
    isInverted: true,
  },
  {
    id: 3,
    questionText: "Apakah anak Anda pernah bermain pura-pura (pretend play)?",
    explanation: "Misalnya, berpura-pura minum dari cangkir kosong, berbicara menggunakan gagang telepon mainan, atau menyuapi boneka.",
    isInverted: false,
  },
  {
    id: 4,
    questionText: "Apakah anak Anda suka memanjat benda-benda?",
    explanation: "Misalnya, memanjat perabot rumah tangga, tangga, atau alat permainan di taman.",
    isInverted: false,
  },
  {
    id: 5,
    questionText: "Apakah anak Anda membuat gerakan jari yang tidak biasa di dekat matanya?",
    explanation: "Misalnya, melambai-lambaikan atau memutar-mutar jari di depan matanya sendiri secara berulang-ulang (stereotypic finger movement).",
    isInverted: true,
  },
  {
    id: 6,
    questionText: "Apakah anak Anda menunjuk dengan satu jari untuk meminta sesuatu atau meminta tolong?",
    explanation: "Misalnya, menunjuk kue atau mainan di rak tinggi yang tidak dapat ia jangkau (protoimperative pointing).",
    isInverted: false,
  },
  {
    id: 7,
    questionText: "Apakah anak Anda menunjuk dengan satu jari untuk memperlihatkan sesuatu yang menarik?",
    explanation: "Misalnya, menunjuk pesawat terbang di langit atau truk lewat untuk berbagi ketertarikan, bukan untuk memintanya (protodeclarative pointing).",
    isInverted: false,
  },
  {
    id: 8,
    questionText: "Apakah anak Anda tertarik pada anak-anak lain?",
    explanation: "Misalnya, memperhatikan anak lain, tersenyum pada mereka, atau berusaha berjalan mendekati anak sebayanya.",
    isInverted: false,
  },
  {
    id: 9,
    questionText: "Apakah anak Anda pernah memperlihatkan suatu benda dengan membawa atau mengangkatnya kepada Anda?",
    explanation: "Tujuannya murni untuk berbagi (joint attention), bukan untuk meminta tolong (misalnya membawa bunga atau mobil mainan lalu menunjukkannya kepada orang tua).",
    isInverted: false,
  },
  {
    id: 10,
    questionText: "Apakah anak Anda memberikan respons jika namanya dipanggil?",
    explanation: "Misalnya menoleh, menatap mata pemanggil, bersuara/bergumam, atau menghentikan sejenak apa yang sedang dilakukannya saat namanya dipanggil.",
    isInverted: false,
  },
  {
    id: 11,
    questionText: "Saat Anda tersenyum pada anak Anda, apakah anak Anda tersenyum balik?",
    explanation: "Respons senyuman sosial dua arah (social smile) terhadap interaksi wajah orang tua.",
    isInverted: false,
  },
  {
    id: 12,
    questionText: "Apakah anak Anda pernah marah/menangis saat mendengar suara bising sehari-hari?",
    explanation: "Misalnya berteriak, menangis ketakutan, atau menutup telinga saat mendengar suara vacuum cleaner, blender, atau musik keras (sensory auditory hypersensitivity).",
    isInverted: true,
  },
  {
    id: 13,
    questionText: "Apakah anak Anda bisa berjalan mandiri?",
    explanation: "Menilai perkembangan motorik kasar dasar.",
    isInverted: false,
  },
  {
    id: 14,
    questionText: "Apakah anak Anda menatap mata Anda saat Anda bicara padanya, bermain bersamanya, atau saat memakaikan pakaian?",
    explanation: "Mempertahankan kontak mata (eye contact) secara konsisten selama interaksi tatap muka.",
    isInverted: false,
  },
  {
    id: 15,
    questionText: "Apakah anak Anda mencoba meniru apa yang Anda lakukan?",
    explanation: "Misalnya menirukan lambaian tangan (dadah), tepuk tangan, atau menirukan suara lucu yang Anda buat.",
    isInverted: false,
  },
  {
    id: 16,
    questionText: "Jika Anda memutar kepala untuk melihat sesuatu, apakah anak Anda melihat sekeliling untuk melihat apa yang Anda lihat?",
    explanation: "Mengikuti arah pandangan orang tua (gaze following).",
    isInverted: false,
  },
  {
    id: 17,
    questionText: "Apakah anak Anda mencoba membuat Anda melihat kepadanya?",
    explanation: "Misalnya mencari pujian, menatap Anda sambil berkata 'lihat' atau menarik perhatian agar Anda memperhatikannya.",
    isInverted: false,
  },
  {
    id: 18,
    questionText: "Apakah anak Anda mengerti saat Anda memintanya melakukan sesuatu tanpa bantuan gestur?",
    explanation: "Misalnya memahami instruksi 'taruh buku di atas kursi' atau 'ambilkan sepatu' murni dari instruksi lisan tanpa Anda menunjuk ke arah benda tersebut.",
    isInverted: false,
  },
  {
    id: 19,
    questionText: "Jika sesuatu yang baru terjadi, apakah anak Anda menatap wajah Anda untuk melihat perasaan Anda tentang hal tersebut?",
    explanation: "Social referencing: menatap wajah orang tua saat mendengar suara aneh atau melihat benda asing untuk mengecek apakah situasi aman.",
    isInverted: false,
  },
  {
    id: 20,
    questionText: "Apakah anak Anda menyukai aktivitas fisik yang dinamis?",
    explanation: "Misalnya merasa senang saat diayun-ayun atau dihentak-hentakkan perlahan di atas lutut orang tua (vestibular stimulation).",
    isInverted: false,
  },
];

export const INVERTED_ITEM_NUMBERS = [2, 5, 12];

export interface MchatClinicalIndications {
  hasSpeechDelay: boolean;
  hasSocialCommunicationIssue: boolean;
  hasRepetitiveBehavior: boolean;
}

export type MchatRiskClassification = 'RISIKO_RENDAH' | 'RISIKO_SEDANG_TINGGI';

export interface MchatEvaluationResult {
  totalRiskScore: number;
  riskClassification: MchatRiskClassification;
  failedItemNumbers: number[];
  recommendation: {
    actionCode: 'STIMULASI_RUTIN' | 'RETEST_AFTER_24M' | 'RUJUK_RS_LEVEL_1';
    title: string;
    description: string;
    referralRequired: boolean;
    referralTarget?: string;
  };
}

/**
 * Returns default safe responses (0 risk score):
 * Inverted items (2, 5, 12) -> false ("Tidak")
 * Regular items -> true ("Ya")
 */
export function getDefaultSafeResponses(): Record<number, boolean> {
  const safe: Record<number, boolean> = {};
  for (let i = 1; i <= 20; i++) {
    safe[i] = !INVERTED_ITEM_NUMBERS.includes(i);
  }
  return safe;
}

/**
 * Evaluate M-CHAT-R answers according to clinical guidelines
 */
export function evaluateMchat(
  responses: Record<number, boolean>,
  ageInMonths: number
): MchatEvaluationResult {
  let totalRiskScore = 0;
  const failedItemNumbers: number[] = [];

  for (let i = 1; i <= 20; i++) {
    const val = responses[i];
    if (val === undefined) continue;

    if (INVERTED_ITEM_NUMBERS.includes(i)) {
      // Inverted: Risk if answered "Ya" (true)
      if (val === true) {
        totalRiskScore += 1;
        failedItemNumbers.push(i);
      }
    } else {
      // Regular: Risk if answered "Tidak" (false)
      if (val === false) {
        totalRiskScore += 1;
        failedItemNumbers.push(i);
      }
    }
  }

  if (totalRiskScore <= 2) {
    const isUnder24Months = ageInMonths < 24.0;
    return {
      totalRiskScore,
      riskClassification: 'RISIKO_RENDAH',
      failedItemNumbers,
      recommendation: isUnder24Months
        ? {
            actionCode: 'RETEST_AFTER_24M',
            title: 'Risiko Rendah (Re-evaluasi Usia 24 Bulan)',
            description: 'Lanjutkan stimulasi rutin. Jadwalkan pemeriksaan ulang saat anak berusia 24 bulan.',
            referralRequired: false,
          }
        : {
            actionCode: 'STIMULASI_RUTIN',
            title: 'Risiko Rendah Spektrum Autisme',
            description: 'Interaksi sosial dan komunikasi dalam batas normal. Lanjutkan stimulasi rutin sesuai usia.',
            referralRequired: false,
          },
    };
  }

  return {
    totalRiskScore,
    riskClassification: 'RISIKO_SEDANG_TINGGI',
    failedItemNumbers,
    recommendation: {
      actionCode: 'RUJUK_RS_LEVEL_1',
      title: 'Risiko Sedang - Tinggi Spektrum Autisme',
      description: `Ditemukan ${totalRiskScore} butir risiko. Diperlukan rujukan ke Rumah Sakit Rujukan Tumbuh Kembang Level 1 / Dokter Spesialis Anak Konsultan Tumbuh Kembang.`,
      referralRequired: true,
      referralTarget: 'RS Rujukan Tumbuh Kembang Level 1 / Sp.A(K) Tumbuh Kembang',
    },
  };
}
