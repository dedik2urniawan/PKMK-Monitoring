export default function TutorialPage() {
  return (
    <>
      <style>{`
        .tutorial-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 24px 16px;
          min-height: 100vh;
          background: #f8fafc;
        }
        .page-title {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 8px;
        }
        .page-desc {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 24px;
        }
        .video-wrapper {
          position: relative;
          padding-bottom: 56.25%; /* 16:9 Aspect Ratio */
          height: 0;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          background: #000;
        }
        .video-wrapper iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: 0;
        }
        .info-card {
          margin-top: 24px;
          background: white;
          border-radius: 16px;
          padding: 20px;
          border: 1px solid #e2e8f0;
        }
        .info-card h4 {
          font-weight: 700;
          color: #334155;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>
      <div className="tutorial-container pb-24 md:pb-10">
        <h1 className="page-title">Video Tutorial</h1>
        <p className="page-desc">
          Panduan lengkap penggunaan Sistem Pelaporan PKMK Intervensi Stunting Kabupaten Malang.
        </p>

        <div className="video-wrapper">
          <iframe 
            src="https://www.youtube.com/embed/6gs1IjrDwcI" 
            title="Tutorial Penggunaan PKMK Monitoring" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
          ></iframe>
        </div>

        <div className="info-card">
          <h4>💡 Tips Penggunaan</h4>
          <ul className="text-sm text-slate-600 space-y-2 list-disc pl-5">
            <li>Pastikan koneksi internet stabil saat melakukan sinkronisasi data pertama kali.</li>
            <li>Gunakan fitur "Cari Fitur" di menu Navigasi untuk akses cepat.</li>
            <li>Anda dapat menyimpan aplikasi ini ke layar utama HP Anda dengan menekan tombol instalasi yang muncul.</li>
          </ul>
        </div>
      </div>
    </>
  );
}
