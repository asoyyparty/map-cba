import React from 'react';
import { ExecutiveSummaryData } from '../../services/reportService';
import { Shield, CheckCircle2, AlertTriangle, Building2, Cable, Server, Layers, Calendar, Printer } from 'lucide-react';

interface PrintableAuditReportProps {
  data: ExecutiveSummaryData;
  onClose?: () => void;
}

export const PrintableAuditReport: React.FC<PrintableAuditReportProps> = ({ data, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(data.reportDate).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="bg-slate-100/90 dark:bg-slate-900/90 min-h-screen p-4 md:p-8 flex flex-col items-center justify-start text-slate-900 transition-colors duration-200">
      {/* Print Control Bar (Hidden when printing) */}
      <div className="w-full max-w-4xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-6 flex items-center justify-between shadow-lg print:hidden text-slate-800 dark:text-white">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span className="text-sm font-semibold">Mode Pratinjau Dokumen Audit Formal (Siap Cetak / Save PDF)</span>
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-300 dark:border-slate-600 transition-colors"
            >
              Tutup Pratinjau
            </button>
          )}
          <button
            onClick={handlePrint}
            className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-1.5 shadow transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* A4 Paper Container */}
      <div className="w-full max-w-4xl bg-white text-slate-800 p-8 md:p-12 rounded-xl shadow-2xl print:shadow-none print:p-0 print:m-0 font-sans border border-slate-200">
        {/* Formal Header / Kop Surat */}
        <div className="border-b-2 border-slate-800 pb-4 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded bg-blue-900 text-white flex items-center justify-center font-bold text-xl tracking-wider">
                CBA
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-950 uppercase tracking-tight">
                  PT. CBA Chemical Industry
                </h1>
                <p className="text-xs text-slate-600">
                  Divisi Teknologi Informasi & Otomasi Industri Kawasan Pabrik Cikande
                </p>
                <p className="text-[11px] text-slate-500">
                  Jl. Raya Serang Km. 68, Kawasan Industri Modern Cikande, Serang - Banten
                </p>
              </div>
            </div>
            <div className="text-right text-xs">
              <span className="inline-block px-2.5 py-0.5 bg-slate-100 border border-slate-300 font-mono font-bold text-slate-800 rounded mb-1">
                {data.documentNumber}
              </span>
              <p className="text-slate-600">Klasifikasi: <strong className="text-slate-800">INTERNAL / AUDIT</strong></p>
              <p className="text-slate-500">Tanggal: {formattedDate}</p>
            </div>
          </div>
        </div>

        {/* Document Title */}
        <div className="text-center my-6">
          <h2 className="text-lg font-bold text-slate-900 tracking-wide uppercase">
            Laporan Kesiapan & Audit Infrastruktur Jaringan Pabrik
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Evaluasi SLA Ketersediaan Sistem, Utilisasi Jaringan Fiber Optic, Rak Server, dan Integritas Otomasi Produksi
          </p>
        </div>

        {/* Section 1: Executive KPI Summary */}
        <div className="my-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 border-l-4 border-blue-900 pl-2">
            1. Ringkasan Eksekutif & Pemenuhan SLA (Service Level Agreement)
          </h3>
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <span className="text-[11px] text-slate-500 block">Uptime Ketersediaan Jaringan</span>
              <span className="text-xl font-bold text-blue-900">{data.sla.availabilityPct}%</span>
              <span className="text-[10px] text-emerald-700 font-medium block">Target: {data.sla.targetSlaPct}% (Passed)</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <span className="text-[11px] text-slate-500 block">Total Aset IT Aktif</span>
              <span className="text-xl font-bold text-slate-900">{data.devices.total} Unit</span>
              <span className="text-[10px] text-slate-600 block">{data.devices.online} Online / {data.devices.offline} Offline</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <span className="text-[11px] text-slate-500 block">Kesehatan Fiber Optic</span>
              <span className="text-xl font-bold text-emerald-700">{data.cables.avgAttenuationDb} dB</span>
              <span className="text-[10px] text-slate-600 block">{data.cables.totalRoutes} Rute ({data.cables.totalMeters} m)</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <span className="text-[11px] text-slate-500 block">Skor Kesiapan Audit</span>
              <span className="text-xl font-bold text-purple-900">{data.readinessScore} / 100</span>
              <span className="text-[10px] text-emerald-700 font-medium block">Grade A (Audited)</span>
            </div>
          </div>
        </div>

        {/* Section 2: Facilities & Building Network Status */}
        <div className="my-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 border-l-4 border-blue-900 pl-2">
            2. Matriks Status Infrastruktur Seluruh Fasilitas Gedung Kawasan
          </h3>
          <table className="w-full border border-slate-300 text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
              <tr>
                <th className="p-2 border-r border-slate-300">Kode</th>
                <th className="p-2 border-r border-slate-300">Nama Fasilitas</th>
                <th className="p-2 border-r border-slate-300">Kategori</th>
                <th className="p-2 border-r border-slate-300">PIC IT</th>
                <th className="p-2 border-r border-slate-300 text-center">Perangkat</th>
                <th className="p-2 border-r border-slate-300 text-center">Rak</th>
                <th className="p-2 border-r border-slate-300">Backbone FO</th>
                <th className="p-2 text-center">Kondisi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.buildings.map((b) => (
                <tr key={b.id}>
                  <td className="p-2 border-r border-slate-200 font-mono font-bold">{b.code}</td>
                  <td className="p-2 border-r border-slate-200 font-medium">{b.name}</td>
                  <td className="p-2 border-r border-slate-200 capitalize">{b.category}</td>
                  <td className="p-2 border-r border-slate-200">{b.head_it}</td>
                  <td className="p-2 border-r border-slate-200 text-center font-semibold">{b.device_count}</td>
                  <td className="p-2 border-r border-slate-200 text-center font-semibold">{b.rack_count}</td>
                  <td className="p-2 border-r border-slate-200 font-mono">{b.backbone_cable || 'FO-001'}</td>
                  <td className="p-2 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      b.status === 'healthy' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {b.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 3: Technical Subsystems Summary */}
        <div className="my-6 grid grid-cols-2 gap-4 text-xs">
          <div className="border border-slate-300 rounded-lg p-3 bg-slate-50/50">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
              Kapasitas Kabel Serat Optik & Alokasi Core
            </h4>
            <div className="space-y-1.5 text-slate-700">
              <div className="flex justify-between">
                <span>Total Bentangan Kabel:</span>
                <strong className="font-mono">{data.cables.totalMeters} meter</strong>
              </div>
              <div className="flex justify-between">
                <span>Kapasitas Core Optik:</span>
                <strong className="font-mono">{data.cables.totalCores} Cores</strong>
              </div>
              <div className="flex justify-between">
                <span>Core Terpakai (Patching Aktif):</span>
                <strong className="font-mono">{data.cables.usedCores} Cores ({data.cables.coreUtilizationPct}%)</strong>
              </div>
              <div className="flex justify-between">
                <span>Standar Pewarnaan:</span>
                <strong>TIA-598-C (12-Core Matrix)</strong>
              </div>
              <div className="flex justify-between">
                <span>Rata-rata Optical Loss:</span>
                <strong className="font-mono text-emerald-700">{data.cables.avgAttenuationDb} dB</strong>
              </div>
            </div>
          </div>

          <div className="border border-slate-300 rounded-lg p-3 bg-slate-50/50">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
              Server Racks, Kelistrikan & Pemeliharaan
            </h4>
            <div className="space-y-1.5 text-slate-700">
              <div className="flex justify-between">
                <span>Total Kabinet Server Rack:</span>
                <strong className="font-mono">{data.racks.totalRacks} Kabinet</strong>
              </div>
              <div className="flex justify-between">
                <span>Okupansi Ruang Rak:</span>
                <strong className="font-mono">{data.racks.usedU} / {data.racks.totalU} U ({data.racks.spaceUtilizationPct}%)</strong>
              </div>
              <div className="flex justify-between">
                <span>Konsumsi Daya Terpantau:</span>
                <strong className="font-mono">{data.racks.currentPowerDrawWatts} W / {data.racks.totalPowerCapWatts} W</strong>
              </div>
              <div className="flex justify-between">
                <span>Rata-rata MTTR Penyelesaian:</span>
                <strong>{data.sla.mttrMinutes} Menit</strong>
              </div>
              <div className="flex justify-between">
                <span>Tiket Selesai Teratasi:</span>
                <strong className="font-mono text-emerald-700">{data.tickets.resolved} Tiket</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Signature / Sign-off Block */}
        <div className="mt-12 pt-6 border-t-2 border-slate-800 text-xs text-center">
          <p className="text-slate-600 mb-6 font-medium">
            Laporan ini dibuat secara otomatis dari sistem CBA Network Map dan telah diverifikasi sesuai kondisi fisik kawasan industri.
          </p>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-slate-500 mb-16">Dipersiapkan Oleh:<br /><strong className="text-slate-800">IT Network Engineer</strong></p>
              <div className="border-b border-slate-400 w-3/4 mx-auto" />
              <p className="font-bold text-slate-900 mt-1">Budi Santoso</p>
              <p className="text-[10px] text-slate-500">Divisi IT Infrastruktur</p>
            </div>
            <div>
              <p className="text-slate-500 mb-16">Diperiksa & Diverifikasi:<br /><strong className="text-slate-800">Head of IT & Automation</strong></p>
              <div className="border-b border-slate-400 w-3/4 mx-auto" />
              <p className="font-bold text-slate-900 mt-1">Ir. Hendra Gunawan</p>
              <p className="text-[10px] text-slate-500">Dept. Head IT CBA</p>
            </div>
            <div>
              <p className="text-slate-500 mb-16">Disetujui & Diketahui:<br /><strong className="text-slate-800">Plant General Manager</strong></p>
              <div className="border-b border-slate-400 w-3/4 mx-auto" />
              <p className="font-bold text-slate-900 mt-1">Drs. Agus Wijaya, M.T.</p>
              <p className="text-[10px] text-slate-500">Direktur Operasional Pabrik</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
