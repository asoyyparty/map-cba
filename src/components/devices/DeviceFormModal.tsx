import React, { useState, useEffect } from 'react';
import { 
  X, 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Building2, 
  HardDrive,
  Hash,
  Globe,
  Radio,
  Cpu,
  Calendar,
  FileText
} from 'lucide-react';
import { Device, DeviceType, DeviceStatus, Building, Rack } from '../../types';
import { deviceService } from '../../services/deviceService';
import { buildingService } from '../../services/buildingService';

interface DeviceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (device: Device) => void;
  deviceToEdit?: Device | null;
  initialBuildingId?: string;
}

const DEVICE_TYPES: { value: DeviceType; label: string }[] = [
  { value: 'firewall', label: 'Firewall' },
  { value: 'router', label: 'Router' },
  { value: 'core-switch', label: 'Core Switch' },
  { value: 'dist-switch', label: 'Distribution Switch' },
  { value: 'access-switch', label: 'Access Switch' },
  { value: 'server', label: 'Server' },
  { value: 'access-point', label: 'Access Point' },
  { value: 'cctv', label: 'CCTV' },
  { value: 'odf', label: 'ODF (Optical Distribution Frame)' },
  { value: 'patch-panel', label: 'Patch Panel' },
  { value: 'ups', label: 'UPS (Uninterruptible Power Supply)' },
  { value: 'other', label: 'Other' }
];

const COMMON_VENDORS = [
  'Cisco',
  'Fortinet',
  'Mikrotik',
  'Ruijie',
  'Ubiquiti Networks',
  'HPE Aruba',
  'Dell EMC',
  'Schneider Electric / APC',
  'Hikvision',
  'D-Link',
  'Huawei',
  'Other'
];

const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const MAC_REGEX = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

export const DeviceFormModal: React.FC<DeviceFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  deviceToEdit,
  initialBuildingId
}) => {
  const isEdit = !!deviceToEdit;

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<DeviceType>('access-switch');
  const [vendor, setVendor] = useState('Cisco');
  const [customVendor, setCustomVendor] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [ip, setIp] = useState('');
  const [mac, setMac] = useState('');
  const [hostname, setHostname] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const [room, setRoom] = useState('Panel IT');
  const [rackId, setRackId] = useState('');
  const [installationDate, setInstallationDate] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<DeviceStatus>('online');

  // Metadata states
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [racks, setRacks] = useState<Rack[]>([]);
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Field validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load buildings on open
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setIsLoadingBuildings(true);
      try {
        const bList = await buildingService.getBuildings();
        setBuildings(bList);

        if (deviceToEdit) {
          setCode(deviceToEdit.code || deviceToEdit.name);
          setName(deviceToEdit.name);
          setType(deviceToEdit.type);
          const v = deviceToEdit.vendor || deviceToEdit.brand || 'Cisco';
          if (COMMON_VENDORS.includes(v)) {
            setVendor(v);
            setCustomVendor('');
          } else {
            setVendor('Other');
            setCustomVendor(v);
          }
          setModel(deviceToEdit.model || '');
          setSerialNumber(deviceToEdit.serialNumber || '');
          setIp(deviceToEdit.ip || '');
          setMac(deviceToEdit.mac || '');
          setHostname(deviceToEdit.hostname || '');
          setBuildingId(deviceToEdit.buildingId || (bList[0]?.id ?? ''));
          setRoom(deviceToEdit.room || 'Panel IT');
          setRackId(deviceToEdit.rackId || '');
          setInstallationDate(deviceToEdit.installationDate || new Date().toISOString().split('T')[0]);
          setDescription(deviceToEdit.description || '');
          setStatus(deviceToEdit.status || 'online');
        } else {
          // Reset for new creation
          const defBld = initialBuildingId || bList[0]?.id || 'bld-ku';
          setCode('');
          setName('');
          setType('access-switch');
          setVendor('Cisco');
          setCustomVendor('');
          setModel('');
          setSerialNumber('');
          setIp('192.168.1.');
          setMac('');
          setHostname('');
          setBuildingId(defBld);
          setRoom('Panel IT');
          setRackId('');
          setInstallationDate(new Date().toISOString().split('T')[0]);
          setDescription('');
          setStatus('online');
        }
      } catch (e) {
        console.error('Failed loading buildings in modal:', e);
      } finally {
        setIsLoadingBuildings(false);
      }
    };

    loadData();
    setErrors({});
    setSubmitError(null);
  }, [isOpen, deviceToEdit, initialBuildingId]);

  // Load racks when building changes
  useEffect(() => {
    if (!buildingId) {
      setRacks([]);
      return;
    }
    buildingService.getRacksByBuilding(buildingId).then(rList => {
      setRacks(rList);
      if (!isEdit && rList.length > 0) {
        setRackId(rList[0].id);
      }
    });
  }, [buildingId, isEdit]);

  // Auto-generate hostname from code if empty
  const handleCodeChange = (val: string) => {
    setCode(val);
    if (!hostname || hostname.endsWith('.cba-chemical.local')) {
      setHostname(val ? `${val.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}.cba-chemical.local` : '');
    }
    if (!name || name === code) {
      setName(val);
    }
  };

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!code.trim()) {
      newErrors.code = 'Device Code wajib diisi.';
    } else if (code.trim().length < 2) {
      newErrors.code = 'Device Code minimal 2 karakter.';
    }

    if (!name.trim()) {
      newErrors.name = 'Device Name wajib diisi.';
    }

    if (!ip.trim()) {
      newErrors.ip = 'IP Address wajib diisi.';
    } else if (!IPV4_REGEX.test(ip.trim())) {
      newErrors.ip = 'Format IP Address tidak valid (gunakan format IPv4: 192.168.x.x).';
    }

    if (mac.trim() && !MAC_REGEX.test(mac.trim())) {
      newErrors.mac = 'Format MAC Address tidak valid (contoh: 00:1A:2B:3C:4D:5E).';
    }

    if (!buildingId) {
      newErrors.buildingId = 'Pilih lokasi gedung perangkat.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const effectiveVendor = vendor === 'Other' ? (customVendor.trim() || 'Generic') : vendor;
    const selectedBld = buildings.find(b => b.id === buildingId);

    const payload: Partial<Device> = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      type,
      vendor: effectiveVendor,
      brand: effectiveVendor,
      model: model.trim() || 'Enterprise Hardware',
      serialNumber: serialNumber.trim(),
      ip: ip.trim(),
      mac: mac.trim().toUpperCase(),
      hostname: hostname.trim(),
      buildingId,
      buildingName: selectedBld ? selectedBld.name : '',
      room: room.trim() || 'Panel IT',
      rackId: rackId || undefined,
      installationDate: installationDate || new Date().toISOString().split('T')[0],
      description: description.trim(),
      status
    };

    try {
      let savedDevice: Device;
      if (isEdit && deviceToEdit) {
        savedDevice = await deviceService.updateDevice(deviceToEdit.id, payload);
      } else {
        savedDevice = await deviceService.createDevice(payload);
      }

      onSuccess(savedDevice);
      onClose();
    } catch (err: any) {
      setSubmitError(err.message || 'Terjadi kesalahan saat menyimpan perangkat.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-700/80 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-900 dark:text-slate-100 font-sans"
        role="dialog"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 font-mono">
                {isEdit ? `Edit Perangkat: ${deviceToEdit?.code || deviceToEdit?.name}` : 'Tambah Perangkat Baru'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEdit 
                  ? 'Perbarui konfigurasi dan lokasi fisik perangkat IT di kawasan industri.' 
                  : 'Registrasikan perangkat keras IT baru ke dalam topologi jaringan CBA.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {submitError && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Section 1: Identifikasi Perangkat */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5" /> Identifikasi Perangkat
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Device Code */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Device Code <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={e => handleCodeChange(e.target.value)}
                  placeholder="e.g. SW-KU-02, AP-D-03"
                  className={`w-full px-3 py-2 bg-white dark:bg-slate-900/90 border rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all ${
                    errors.code ? 'border-red-500 bg-red-50 dark:bg-red-500/5' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {errors.code && <p className="text-[11px] text-red-500 dark:text-red-400 mt-1">{errors.code}</p>}
              </div>

              {/* Device Name */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Device Name <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Switch Server Kantor Utama"
                  className={`w-full px-3 py-2 bg-white dark:bg-slate-900/90 border rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all ${
                    errors.name ? 'border-red-500 bg-red-50 dark:bg-red-500/5' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {errors.name && <p className="text-[11px] text-red-500 dark:text-red-400 mt-1">{errors.name}</p>}
              </div>

              {/* Device Type */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Device Type <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as DeviceType)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  {DEVICE_TYPES.map(t => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Status Operasional <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as DeviceStatus)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="online">Online (Normal)</option>
                  <option value="warning">Warning (Degraded / Packet Loss)</option>
                  <option value="offline">Offline (Down)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Spesifikasi Hardware & Vendor */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" /> Spesifikasi Hardware & Vendor
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Vendor */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Vendor / Brand</label>
                <select
                  value={vendor}
                  onChange={e => setVendor(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  {COMMON_VENDORS.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
                {vendor === 'Other' && (
                  <input
                    type="text"
                    value={customVendor}
                    onChange={e => setCustomVendor(e.target.value)}
                    placeholder="Nama vendor..."
                    className="w-full mt-2 px-3 py-1.5 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
                  />
                )}
              </div>

              {/* Model */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Model / Seri</label>
                <input
                  type="text"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  placeholder="e.g. Catalyst 2960X-24PD-L"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Serial Number */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Serial Number</label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={e => setSerialNumber(e.target.value)}
                  placeholder="e.g. FOC22340A1B"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Konfigurasi Jaringan (IP, MAC, Hostname) */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Konfigurasi Jaringan
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* IP Address */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  IP Address <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={ip}
                  onChange={e => setIp(e.target.value)}
                  placeholder="192.168.1.10"
                  className={`w-full px-3 py-2 bg-white dark:bg-slate-900/90 border rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all ${
                    errors.ip ? 'border-red-500 bg-red-50 dark:bg-red-500/5' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {errors.ip && <p className="text-[11px] text-red-500 dark:text-red-400 mt-1">{errors.ip}</p>}
              </div>

              {/* MAC Address */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">MAC Address</label>
                <input
                  type="text"
                  value={mac}
                  onChange={e => setMac(e.target.value)}
                  placeholder="00:2A:10:99:AA:01"
                  className={`w-full px-3 py-2 bg-white dark:bg-slate-900/90 border rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all ${
                    errors.mac ? 'border-red-500 bg-red-50 dark:bg-red-500/5' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {errors.mac && <p className="text-[11px] text-red-500 dark:text-red-400 mt-1">{errors.mac}</p>}
              </div>

              {/* Hostname */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Hostname (FQDN)</label>
                <input
                  type="text"
                  value={hostname}
                  onChange={e => setHostname(e.target.value)}
                  placeholder="sw-ku-01.cba-chemical.local"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Lokasi Fisik & Rak */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Lokasi Fisik & Penempatan
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Building */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Gedung <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <select
                  value={buildingId}
                  onChange={e => setBuildingId(e.target.value)}
                  disabled={isLoadingBuildings}
                  className={`w-full px-3 py-2 bg-white dark:bg-slate-900/90 border rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all ${
                    errors.buildingId ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {buildings.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
                {errors.buildingId && <p className="text-[11px] text-red-500 dark:text-red-400 mt-1">{errors.buildingId}</p>}
              </div>

              {/* Room */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Ruangan</label>
                <input
                  type="text"
                  value={room}
                  onChange={e => setRoom(e.target.value)}
                  placeholder="Ruang Server / Panel IT"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Rack */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Kabinet Server Rack</label>
                <select
                  value={rackId}
                  onChange={e => setRackId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="">-- Tidak Terpasang di Rak / Wallmount --</option>
                  {racks.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.uCapacity}U)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 5: Tanggal & Deskripsi */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Instalasi & Catatan
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Installation Date */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Tanggal Instalasi</label>
                <input
                  type="date"
                  value={installationDate}
                  onChange={e => setInstallationDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Deskripsi / Catatan Teknis</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Catatan penempatan port uplink, lisensi firmware, dll..."
                  rows={2}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isEdit ? 'Simpan Perubahan' : 'Tambah Perangkat'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
