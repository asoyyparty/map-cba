import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  AlertTriangle, 
  Loader2, 
  ShieldAlert, 
  Network, 
  Activity, 
  Cable,
  Check
} from 'lucide-react';
import { Device } from '../../types';
import { deviceService, DeviceConnectionCheck } from '../../services/deviceService';

interface DeleteDeviceModalProps {
  isOpen: boolean;
  device: Device | null;
  onClose: () => void;
  onDeleted: (deviceId: string) => void;
}

export const DeleteDeviceModal: React.FC<DeleteDeviceModalProps> = ({
  isOpen,
  device,
  onClose,
  onDeleted
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [connections, setConnections] = useState<DeviceConnectionCheck | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !device) return;

    setAcknowledged(false);
    setDeleteError(null);
    setIsChecking(true);

    deviceService.checkDeviceConnections(device.id)
      .then(res => setConnections(res))
      .catch(err => {
        console.error('Failed checking device connections:', err);
        setConnections({
          hasConnections: false,
          cablesCount: 0,
          activePortsCount: 0,
          activeAlertsCount: 0,
          details: []
        });
      })
      .finally(() => setIsChecking(false));
  }, [isOpen, device]);

  if (!isOpen || !device) return null;

  const hasActiveConnections = Boolean(connections?.hasConnections);

  const handleDelete = async () => {
    if (hasActiveConnections && !acknowledged) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deviceService.deleteDevice(device.id);
      onDeleted(device.id);
      onClose();
    } catch (err: any) {
      setDeleteError(err.message || 'Gagal menghapus perangkat.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-[#0B132B] border border-red-200 dark:border-red-500/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 font-sans"
        role="dialog"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-red-50 dark:bg-red-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-mono">
                Hapus Perangkat Jaringan
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Konfirmasi penghapusan permanen dari inventaris.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Target Info */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 font-mono text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-500">Device Code:</span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">{device.code || device.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-500">Nama Perangkat:</span>
              <span className="text-slate-800 dark:text-slate-200">{device.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-500">IP Address:</span>
              <span className="text-emerald-600 dark:text-emerald-400">{device.ip}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-500">Gedung:</span>
              <span className="text-slate-700 dark:text-slate-300">{device.buildingName}</span>
            </div>
          </div>

          {/* Connection Check Loader */}
          {isChecking && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
              <Loader2 className="w-4 h-4 text-blue-500 dark:text-blue-400 animate-spin" />
              <span>Memeriksa ketergantungan koneksi aktif & port...</span>
            </div>
          )}

          {/* Warning Callout if Device Has Active Connections */}
          {!isChecking && hasActiveConnections && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/40 text-amber-800 dark:text-amber-200 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-xs font-mono">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>PERINGATAN: KONEKSI AKTIF TERDETEKSI</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-200/90">
                Perangkat ini masih memiliki ketergantungan aktif pada infrastruktur pabrik:
              </p>
              <ul className="text-[11px] list-disc list-inside space-y-1 text-amber-900 dark:text-amber-300 font-mono">
                {connections?.details.map((detail, i) => (
                  <li key={i}>{detail}</li>
                ))}
              </ul>
              <div className="pt-2 border-t border-amber-200 dark:border-amber-500/20">
                <label className="flex items-start gap-2 cursor-pointer text-xs text-amber-900 dark:text-amber-100 select-none">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={e => setAcknowledged(e.target.checked)}
                    className="mt-0.5 rounded bg-white dark:bg-slate-900 border-amber-500/60 text-amber-600 focus:ring-amber-400"
                  />
                  <span>Saya mengerti risikonya dan tetap ingin menghapus perangkat ini serta seluruh port-nya.</span>
                </label>
              </div>
            </div>
          )}

          {/* Safe message if no connections */}
          {!isChecking && !hasActiveConnections && (
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Apakah Anda yakin ingin menghapus <strong className="text-slate-800 dark:text-slate-200">{device.name}</strong>? Tindakan ini akan menghapus data konfigurasi, riwayat port, dan pemetaan dari sistem.
            </p>
          )}

          {/* Error Banner */}
          {deleteError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-500 dark:text-red-400" />
              <span>{deleteError}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50/80 dark:bg-slate-900/40">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting || (hasActiveConnections && !acknowledged)}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white text-xs font-semibold shadow-lg shadow-red-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menghapus...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Hapus Perangkat</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
