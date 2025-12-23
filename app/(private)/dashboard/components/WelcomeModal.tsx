"use client";

import { useState, useEffect } from "react";
import { X, AlertTriangle, CheckCircle, Info, Lightbulb, ArrowRight } from "lucide-react";

export default function WelcomeModal() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // sessionStorage resets ketika tab/browser ditutup
        // Jadi modal akan muncul setiap kali login baru
        const shownThisSession = sessionStorage.getItem("pkmk_welcome_shown");

        if (shownThisSession !== "true") {
            const timer = setTimeout(() => {
                setIsOpen(true);
                sessionStorage.setItem("pkmk_welcome_shown", "true");
            }, 300);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setIsOpen(false);
    };

    if (!isOpen) return null;

    // Inline Styles untuk guarantee rendering yang benar
    const overlayStyle: React.CSSProperties = {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        zIndex: 99999,
    };

    const modalStyle: React.CSSProperties = {
        position: "relative",
        width: "100%",
        maxWidth: "640px",
        maxHeight: "90vh",
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
    };

    const headerStyle: React.CSSProperties = {
        background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
    };

    const contentStyle: React.CSSProperties = {
        padding: "24px",
        overflowY: "auto",
        maxHeight: "calc(90vh - 180px)",
    };

    const footerStyle: React.CSSProperties = {
        padding: "16px 24px",
        backgroundColor: "#f9fafb",
        borderTop: "1px solid #e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
    };

    const warningBoxStyle: React.CSSProperties = {
        backgroundColor: "#fffbeb",
        border: "1px solid #fcd34d",
        borderRadius: "12px",
        padding: "16px",
        marginBottom: "20px",
        display: "flex",
        gap: "12px",
    };

    const ruleCardStyle = (bgColor: string, borderColor: string): React.CSSProperties => ({
        display: "flex",
        gap: "12px",
        padding: "12px",
        backgroundColor: bgColor,
        borderRadius: "8px",
        border: `1px solid ${borderColor}`,
        marginBottom: "10px",
    });

    const numberBadgeStyle = (bgColor: string): React.CSSProperties => ({
        flexShrink: 0,
        width: "24px",
        height: "24px",
        backgroundColor: bgColor,
        color: "white",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px",
        fontWeight: "bold",
    });

    const buttonStyle: React.CSSProperties = {
        padding: "10px 24px",
        background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
        color: "white",
        fontWeight: 600,
        borderRadius: "8px",
        border: "none",
        cursor: "pointer",
        fontSize: "14px",
    };

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                {/* Header */}
                <div style={headerStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                            padding: "8px",
                            backgroundColor: "rgba(255,255,255,0.2)",
                            borderRadius: "8px"
                        }}>
                            <Lightbulb style={{ height: "24px", width: "24px", color: "white" }} />
                        </div>
                        <div>
                            <h2 style={{
                                fontSize: "18px",
                                fontWeight: "bold",
                                color: "white",
                                margin: 0
                            }}>
                                Selamat Datang di PKMK Monitoring
                            </h2>
                            <p style={{
                                fontSize: "13px",
                                color: "rgba(255,255,255,0.8)",
                                margin: "4px 0 0 0"
                            }}>
                                Panduan penting sebelum menggunakan aplikasi
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        style={{
                            padding: "8px",
                            background: "rgba(255,255,255,0.1)",
                            border: "none",
                            borderRadius: "50%",
                            cursor: "pointer",
                        }}
                    >
                        <X style={{ height: "20px", width: "20px", color: "white" }} />
                    </button>
                </div>

                {/* Content */}
                <div style={contentStyle}>
                    {/* Warning Box */}
                    <div style={warningBoxStyle}>
                        <AlertTriangle style={{
                            height: "20px",
                            width: "20px",
                            color: "#d97706",
                            flexShrink: 0,
                            marginTop: "2px"
                        }} />
                        <div>
                            <h3 style={{
                                fontWeight: 600,
                                color: "#92400e",
                                margin: "0 0 6px 0",
                                fontSize: "14px"
                            }}>
                                ⚠️ Penting: Urutan Pengisian Data
                            </h3>
                            <p style={{ color: "#b45309", fontSize: "13px", margin: "0 0 8px 0" }}>
                                Untuk mencegah error, ikuti alur berikut:
                            </p>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                <span style={{
                                    backgroundColor: "#fef3c7",
                                    padding: "4px 8px",
                                    borderRadius: "4px",
                                    fontSize: "12px",
                                    fontWeight: 500,
                                    color: "#92400e"
                                }}>1. Daftar Balita</span>
                                <ArrowRight style={{ height: "14px", width: "14px", color: "#d97706" }} />
                                <span style={{
                                    backgroundColor: "#fef3c7",
                                    padding: "4px 8px",
                                    borderRadius: "4px",
                                    fontSize: "12px",
                                    fontWeight: 500,
                                    color: "#92400e"
                                }}>2. Input Kohort</span>
                                <ArrowRight style={{ height: "14px", width: "14px", color: "#d97706" }} />
                                <span style={{
                                    backgroundColor: "#fef3c7",
                                    padding: "4px 8px",
                                    borderRadius: "4px",
                                    fontSize: "12px",
                                    fontWeight: 500,
                                    color: "#92400e"
                                }}>3. Monitoring</span>
                            </div>
                        </div>
                    </div>

                    {/* Guidelines Title */}
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "12px"
                    }}>
                        <Info style={{ height: "18px", width: "18px", color: "#2563eb" }} />
                        <h4 style={{ fontWeight: 600, color: "#1f2937", margin: 0, fontSize: "14px" }}>
                            Panduan Penggunaan
                        </h4>
                    </div>

                    {/* Rules */}
                    <div style={ruleCardStyle("#eff6ff", "#bfdbfe")}>
                        <div style={numberBadgeStyle("#2563eb")}>1</div>
                        <div>
                            <p style={{ fontWeight: 500, color: "#1f2937", margin: 0, fontSize: "13px" }}>
                                Kohort Wajib Sebelum Monitoring
                            </p>
                            <p style={{ color: "#6b7280", fontSize: "12px", margin: "4px 0 0 0", lineHeight: 1.4 }}>
                                Balita <strong>harus</strong> didaftarkan ke Kohort dahulu sebelum input monitoring.
                            </p>
                        </div>
                    </div>

                    <div style={ruleCardStyle("#f0fdf4", "#bbf7d0")}>
                        <div style={numberBadgeStyle("#16a34a")}>2</div>
                        <div>
                            <p style={{ fontWeight: 500, color: "#1f2937", margin: 0, fontSize: "13px" }}>
                                Kohort Cukup 1x per Siklus
                            </p>
                            <p style={{ color: "#6b7280", fontSize: "12px", margin: "4px 0 0 0", lineHeight: 1.4 }}>
                                Hanya perlu <strong>1 kali pendaftaran kohort</strong> untuk 1 siklus (12 minggu).
                            </p>
                        </div>
                    </div>

                    <div style={ruleCardStyle("#faf5ff", "#e9d5ff")}>
                        <div style={numberBadgeStyle("#9333ea")}>3</div>
                        <div>
                            <p style={{ fontWeight: 500, color: "#1f2937", margin: 0, fontSize: "13px" }}>
                                Tanggal Tidak Boleh Melebihi Hari Ini
                            </p>
                            <p style={{ color: "#6b7280", fontSize: "12px", margin: "4px 0 0 0", lineHeight: 1.4 }}>
                                Tanggal monitoring <strong>tidak boleh lebih dari tanggal hari ini</strong>.
                            </p>
                        </div>
                    </div>

                    <div style={ruleCardStyle("#eef2ff", "#c7d2fe")}>
                        <div style={numberBadgeStyle("#4f46e5")}>4</div>
                        <div>
                            <p style={{ fontWeight: 500, color: "#1f2937", margin: 0, fontSize: "13px" }}>
                                NIK Harus 16 Digit
                            </p>
                            <p style={{ color: "#6b7280", fontSize: "12px", margin: "4px 0 0 0", lineHeight: 1.4 }}>
                                NIK balita harus <strong>tepat 16 digit angka</strong>.
                            </p>
                        </div>
                    </div>

                    {/* Tips */}
                    <div style={{
                        marginTop: "16px",
                        backgroundColor: "#f9fafb",
                        borderRadius: "8px",
                        padding: "12px",
                        display: "flex",
                        gap: "10px"
                    }}>
                        <CheckCircle style={{
                            height: "18px",
                            width: "18px",
                            color: "#16a34a",
                            flexShrink: 0
                        }} />
                        <div>
                            <p style={{ fontWeight: 500, color: "#1f2937", margin: 0, fontSize: "13px" }}>
                                💡 Tips
                            </p>
                            <ul style={{
                                color: "#6b7280",
                                fontSize: "12px",
                                margin: "6px 0 0 0",
                                paddingLeft: "16px",
                                lineHeight: 1.6
                            }}>
                                <li>Gunakan <strong>Import Excel</strong> untuk input data massal</li>
                                <li>Cek <strong>Dashboard Analytics</strong> untuk progress monitoring</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={footerStyle}>
                    <span style={{ fontSize: "12px", color: "#9ca3af", marginRight: "16px" }}>
                        Informasi ini muncul setiap kali login
                    </span>
                    <button onClick={handleClose} style={buttonStyle}>
                        Mengerti, Lanjutkan
                    </button>
                </div>
            </div>
        </div>
    );
}
