import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ComplianceData {
    totalBalita: number;
    kohortInput: number;
    compliancePercentage: number;
    groupedData: any[];
    level: string;
}

interface NutritionData {
    avgBBU: number;
    avgTBU: number;
    avgBBTB: number;
    avgDeltaBB: number;
    redFlagPercentage: number;
    locations: any[];
}

export function exportAnalyticsToPDF(
    complianceData: ComplianceData | null,
    nutritionData: NutritionData | null,
    year: number,
    month: number
) {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Laporan Analytics PKMK", 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    doc.text(`Periode: ${monthNames[month - 1]} ${year}`, 105, 28, { align: "center" });
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString("id-ID")}`, 105, 34, { align: "center" });

    // Add line separator
    doc.setLineWidth(0.5);
    doc.line(20, 38, 190, 38);

    let yPos = 45;

    // === COMPLIANCE SECTION ===
    if (complianceData) {
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("📊 Analisis Compliance Kohort", 20, yPos);
        yPos += 8;

        // Compliance Summary Box
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");

        const summaryData = [
            ["Total Balita (Stunting + Red Flag)", complianceData.totalBalita.toString()],
            ["Kohort Terinput", complianceData.kohortInput.toString()],
            ["Tingkat Compliance", `${complianceData.compliancePercentage.toFixed(1)}%`],
        ];

        autoTable(doc, {
            startY: yPos,
            head: [["Metrik", "Nilai"]],
            body: summaryData,
            theme: "grid",
            headStyles: { fillColor: [20, 184, 166], fontStyle: "bold" },
            styles: { fontSize: 10 },
            margin: { left: 20, right: 20 },
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;

        // Compliance by Location Table
        if (complianceData.groupedData && complianceData.groupedData.length > 0) {
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text(`Breakdown per ${complianceData.level === "puskesmas" ? "Puskesmas" : "Desa"}:`, 20, yPos);
            yPos += 5;

            const locationData = complianceData.groupedData.map((loc) => [
                loc.name,
                loc.total.toString(),
                loc.kohort.toString(),
                `${loc.percentage.toFixed(1)}%`,
                loc.percentage >= 75 ? "✓ Baik" : loc.percentage >= 50 ? "⚠ Sedang" : "✗ Rendah",
            ]);

            autoTable(doc, {
                startY: yPos,
                head: [["Lokasi", "Total", "Kohort", "Compliance", "Status"]],
                body: locationData,
                theme: "striped",
                headStyles: { fillColor: [20, 184, 166], fontStyle: "bold" },
                styles: { fontSize: 9 },
                margin: { left: 20, right: 20 },
                didParseCell: (data) => {
                    if (data.column.index === 4 && data.section === "body") {
                        const status = data.cell.text[0];
                        if (status.includes("Baik")) {
                            data.cell.styles.textColor = [16, 185, 129];
                        } else if (status.includes("Sedang")) {
                            data.cell.styles.textColor = [245, 158, 11];
                        } else if (status.includes("Rendah")) {
                            data.cell.styles.textColor = [239, 68, 68];
                        }
                    }
                },
            });

            yPos = (doc as any).lastAutoTable.finalY + 15;
        }
    }

    // Add new page for nutrition section
    doc.addPage();
    yPos = 20;

    // === NUTRITION SECTION ===
    if (nutritionData) {
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("💚 Analisis Status Gizi", 20, yPos);
        yPos += 8;

        // Nutrition Summary
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");

        const nutritionSummary = [
            ["Rata-rata Z-Score BB/U", nutritionData.avgBBU.toFixed(2)],
            ["Rata-rata Z-Score TB/U", nutritionData.avgTBU.toFixed(2)],
            ["Rata-rata Z-Score BB/TB", nutritionData.avgBBTB.toFixed(2)],
            ["Rata-rata ΔBB", `${nutritionData.avgDeltaBB.toFixed(3)} kg`],
            ["Red Flags Terdeteksi", `${nutritionData.redFlagPercentage.toFixed(1)}%`],
        ];

        autoTable(doc, {
            startY: yPos,
            head: [["Metrik Gizi", "Nilai"]],
            body: nutritionSummary,
            theme: "grid",
            headStyles: { fillColor: [236, 72, 153], fontStyle: "bold" },
            styles: { fontSize: 10 },
            margin: { left: 20, right: 20 },
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;

        // Z-Score Interpretation Guide
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Interpretasi Z-Score:", 20, yPos);
        yPos += 5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text("• > -1 SD: Normal", 25, yPos);
        yPos += 5;
        doc.text("• -2 to -1 SD: Kurang", 25, yPos);
        yPos += 5;
        doc.text("• -3 to -2 SD: Buruk", 25, yPos);
        yPos += 5;
        doc.text("• < -3 SD: Sangat Buruk", 25, yPos);
        yPos += 10;

        // Red Flag Status
        if (nutritionData.redFlagPercentage > 20) {
            doc.setFillColor(254, 226, 226);
            doc.rect(20, yPos - 3, 170, 10, "F");
            doc.setTextColor(185, 28, 28);
            doc.setFont("helvetica", "bold");
            doc.text("⚠ PERHATIAN: Tingkat red flag tinggi - perlu tindakan segera", 25, yPos + 3);
            doc.setTextColor(0, 0, 0);
        } else if (nutritionData.redFlagPercentage > 10) {
            doc.setFillColor(254, 243, 199);
            doc.rect(20, yPos - 3, 170, 10, "F");
            doc.setTextColor(146, 64, 14);
            doc.setFont("helvetica", "bold");
            doc.text("⚠ Tingkat red flag sedang - monitoring diperlukan", 25, yPos + 3);
            doc.setTextColor(0, 0, 0);
        } else {
            doc.setFillColor(220, 252, 231);
            doc.rect(20, yPos - 3, 170, 10, "F");
            doc.setTextColor(21, 128, 61);
            doc.setFont("helvetica", "bold");
            doc.text("✓ Tingkat red flag rendah - kondisi terkendali", 25, yPos + 3);
            doc.setTextColor(0, 0, 0);
        }
    }

    // Footer on all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.text(
            `Halaman ${i} dari ${pageCount} | PKMK Monitoring System © ${new Date().getFullYear()}`,
            105,
            290,
            { align: "center" }
        );
    }

    // Save PDF
    const fileName = `Analytics_PKMK_${monthNames[month - 1]}_${year}.pdf`;
    doc.save(fileName);
}
