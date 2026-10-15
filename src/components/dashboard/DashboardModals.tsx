import React, { useState } from 'react';
import { 
  X, 
  Server, 
  Network, 
  Wrench, 
  CheckCircle2, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { dashboardRepository } from '../../services/dashboardRepository';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

import { getDeviceTypeInfo } from '../devices/DeviceIconHelper';
import { Building, Point } from '../../types';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

interface AddDeviceModalProps extends ModalProps {
  initialBuildingCode?: string;
  targetBuilding?: Building | null;
  targetPoint?: Point | null;
  buildingsList?: Building[];
}

// 1. Modal Add Device
export const AddDeviceModal: React.FC<AddDeviceModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  initialBuildingCode,
  targetBuilding,
  targetPoint,
  buildingsList = []
}) => {
  const [name, setName] = useState('CAM-IP-OUTDOOR-01');
  const [type, setType] = useState('cctv');
  const [ip, setIp] = useState('192.168.1.50');
  const [buildingId, setBuildingId] = useState('');
  const [room, setRoom] = useState('Panel IT / Outdoor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    setErrorMessage(null);

    // Auto-generate realistic valid default IP if default/incomplete
    if (!ip || ip === '192.168.1.') {
      const randomLastOctet = Math.floor(Math.random() * 150) + 20;
      setIp(`192.168.1.${randomLastOctet}`);
    }

    if (targetBuilding) {
      setBuildingId(targetBuilding.id);
    } else if (initialBuildingCode) {
      const match = buildingsList.find(b => b.code.toLowerCase() === initialBuildingCode.toLowerCase());
      setBuildingId(match ? match.id : `bld-${initialBuildingCode.toLowerCase()}`);
    } else if (buildingsList.length > 0) {
      setBuildingId(buildingsList[0].id);
    }
  }, [initialBuildingCode, targetBuilding, buildingsList, isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;
    const randomNum = Math.floor(Math.random() * 89) + 10;
    if (type === 'cctv') {
      setName(`CAM-IP-OUTDOOR-${randomNum}`);
    } else if (type === 'computer') {
      setName(`PC-WORKSTATION-${randomNum}`);
    } else if (type === 'access-switch' || type === 'switch' || type === 'core-switch' || type === 'dist-switch') {
      setName(`SW-ACC-${randomNum}`);
    } else if (type === 'access-point') {
      setName(`AP-WIFI-${randomNum}`);
    } else if (type === 'router') {
      setName(`RT-GATEWAY-${randomNum}`);
    }
  }, [type, isOpen]);

  if (!isOpen) return null;

  const currentBuilding = buildingsList.find(b => b.id === buildingId) || targetBuilding;
  const activeTypeInfo = getDeviceTypeInfo(type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedIp = (ip || '').trim();
    const trimmedName = (name || '').trim();

    // Client-side IPv4 Validation
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipv4Regex.test(trimmedIp)) {
      setErrorMessage('Format IP Address tidak valid. Masukkan format IPv4 lengkap (contoh: 192.168.1.50)');
      return;
    }

    if (!trimmedName) {
      setErrorMessage('Nama perangkat wajib diisi.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await dashboardRepository.addDevice({
        name: trimmedName,
        type,
        ip: trimmedIp,
        buildingId: buildingId || (currentBuilding?.id || 'bld-outdoor'),
        buildingName: currentBuilding?.name || 'Kawasan Pabrik (Outdoor)',
        room: room || 'Panel IT / Outdoor',
        status: 'online',
        x: targetPoint ? targetPoint.x : undefined,
        y: targetPoint ? targetPoint.y : undefined
      });

      setIsSubmitting(false);

      if (res.success) {
        onSuccess(res.message);
        onClose();
      } else {
        setErrorMessage(res.message || 'Gagal mendaftarkan perangkat. Periksa koneksi atau nama perangkat.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Terjadi kesalahan sistem saat menyimpan perangkat.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in select-none">
      <div className="bg-white dark:bg-[#0E172A] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 relative text-slate-900 dark:text-slate-100">
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${activeTypeInfo.bgClass}`}>
            {activeTypeInfo.icon}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Registrasi Perangkat Baru</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {targetPoint ? `Lokasi koordinat X: ${Math.round(targetPoint.x)}, Y: ${Math.round(targetPoint.y)}` : 'Tambahkan switch, komputer, CCTV, atau AP ke denah'}
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 mb-3.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Nama Perangkat</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: CAM-CCTV-01 / PC-ADMIN-01"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 font-mono text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Tipe Hardware / Ikon</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 font-semibold"
              >
                <option value="access-switch">🔌 Switch (Access Switch)</option>
                <option value="core-switch">🔌 Switch (Core Switch)</option>
                <option value="dist-switch">🔌 Switch (Distribution)</option>
                <option value="computer">💻 Komputer / PC Workstation</option>
                <option value="cctv">📷 CCTV / Kamera IP</option>
                <option value="access-point">📶 Access Point (WiFi)</option>
                <option value="router">📡 Router / Gateway</option>
                <option value="firewall">🛡️ Firewall</option>
                <option value="server">🖥️ Server Rack</option>
                <option value="ups">⚡ UPS Power</option>
                <option value="other">⚙️ Perangkat Lainnya</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Gedung / Lokasi</label>
              <select
                value={buildingId}
                onChange={(e) => setBuildingId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800"
              >
                {buildingsList.length > 0 ? (
                  buildingsList.map(b => (
                    <option key={b.id} value={b.id}>{b.code} - {b.name}</option>
                  ))
                ) : (
                  <>
                    <option value="bld-ku">KU - Kantor Utama</option>
                    <option value="bld-mtc">MTC - Workshop</option>
                    <option value="bld-outdoor">Outdoor / Kawasan Pabrik</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">IP Address</label>
              <input
                type="text"
                required
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                placeholder="192.168.1.50"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 font-mono text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Ruangan / Keterangan</label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="Pos Satpam / Ruang Staff"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-2 cursor-pointer shadow-xs shadow-blue-600/30 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Simpan Perangkat</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 2. Modal Add Cable Route
export const AddCableRouteModal: React.FC<ModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [code, setCode] = useState('FO-KU-PLTA-02');
  const [type, setType] = useState('fiber');
  const [fromBuilding, setFromBuilding] = useState('Kantor Utama (KU)');
  const [toBuilding, setToBuilding] = useState('Plant A Synthesis');
  const [cores, setCores] = useState('12');
  const [lengthMeters, setLengthMeters] = useState('240');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const res = await dashboardRepository.addCableRoute({
      code,
      type,
      fromBuildingName: fromBuilding,
      toBuildingName: toBuilding,
      totalCores: Number(cores),
      lengthMeters: Number(lengthMeters),
      status: 'active'
    });

    setIsSubmitting(false);
    if (res.success) {
      onSuccess(res.message);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white dark:bg-[#0E172A] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 relative text-slate-900 dark:text-slate-100">
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 border border-cyan-100 dark:border-cyan-800/50 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Tambah Jalur Rute Kabel</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Daftarkan koneksi serat optik atau kabel backbone antar gedung</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Kode / Nama Kabel</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Contoh: FO-KU-PLTA-02"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-cyan-500 font-mono text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Tipe Jalur</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-cyan-500 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800"
              >
                <option value="fiber">Fiber Optic (Singlemode)</option>
                <option value="backbone">Fiber Backbone 40G</option>
                <option value="utp">UTP Industrial Cat6A</option>
                <option value="wireless">Point-to-Point Wireless</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Jumlah Core / Pair</label>
              <input
                type="number"
                value={cores}
                onChange={(e) => setCores(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-cyan-500 font-mono text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Dari Gedung</label>
              <input
                type="text"
                value={fromBuilding}
                onChange={(e) => setFromBuilding(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-cyan-500 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Ke Gedung</label>
              <input
                type="text"
                value={toBuilding}
                onChange={(e) => setToBuilding(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-cyan-500 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Estimasi Panjang Jalur (Meter)</label>
            <input
              type="number"
              value={lengthMeters}
              onChange={(e) => setLengthMeters(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-cyan-500 font-mono text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold flex items-center gap-2 cursor-pointer shadow-xs shadow-cyan-600/30 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Daftarkan Rute</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 3. Modal Create Maintenance
export const CreateMaintenanceModal: React.FC<ModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [asset, setAsset] = useState('');
  const [building, setBuilding] = useState('Utility (H)');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [assignedTo, setAssignedTo] = useState('Budi Santoso');
  const [dueDate, setDueDate] = useState('22 Sept 2026');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const res = await dashboardRepository.createMaintenanceTicket({
      asset: asset || 'Network Infrastructure Check',
      building,
      priority,
      assignedTo,
      dueDate
    });

    setIsSubmitting(false);
    if (res.success) {
      onSuccess(res.message);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white dark:bg-[#0E172A] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 relative text-slate-900 dark:text-slate-100">
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/30 border border-violet-100 dark:border-violet-800/50 flex items-center justify-center text-violet-600 dark:text-violet-400">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Buat Tiket Maintenance Baru</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Jadwalkan perbaikan atau perawatan preventif infrastruktur</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Aset / Perangkat Yang Diperbaiki</label>
            <input
              type="text"
              required
              value={asset}
              onChange={(e) => setAsset(e.target.value)}
              placeholder="Contoh: Switch Utility SUB01 atau FO Backbone"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-violet-500 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Gedung / Lokasi</label>
              <select
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-violet-500 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800"
              >
                <option value="Kantor Utama (KU)">Kantor Utama (KU)</option>
                <option value="Maintenance (MTC)">Maintenance (MTC)</option>
                <option value="Plant A Synthesis">Plant A Synthesis</option>
                <option value="Plant B Formulasi">Plant B Formulasi</option>
                <option value="Plant C Packaging">Plant C Packaging</option>
                <option value="Warehouse (D & E)">Warehouse (D & E)</option>
                <option value="Laboratorium (F)">Laboratorium (F)</option>
                <option value="Utility & Substation (H)">Utility & Substation (H)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Prioritas</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-violet-500 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800"
              >
                <option value="High">Tinggi (High)</option>
                <option value="Medium">Sedang (Medium)</option>
                <option value="Low">Rendah (Low)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Teknisi Ditugaskan</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-violet-500 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800"
              >
                <option value="Budi Santoso">Budi Santoso (IT Engineer)</option>
                <option value="Ahmad Fauzi">Ahmad Fauzi (Fiber Tech)</option>
                <option value="Rian Pratama">Rian Pratama (Network Support)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Batas Waktu (Due Date)</label>
              <input
                type="text"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="22 Sept 2026"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-violet-500 font-mono text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold flex items-center gap-2 cursor-pointer shadow-xs shadow-violet-600/30 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Buat Tiket</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
