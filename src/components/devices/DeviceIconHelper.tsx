import React from 'react';
import { 
  Server, 
  Monitor, 
  Camera, 
  Wifi, 
  Radio, 
  ShieldCheck, 
  HardDrive, 
  BatteryCharging, 
  Cpu,
  Layers,
  Network
} from 'lucide-react';
import { DeviceType } from '../../types';

export interface DeviceTypeInfo {
  type: DeviceType;
  label: string;
  icon: React.ReactNode;
  smallIcon: React.ReactNode;
  color: string;
  bgClass: string;
}

export function getDeviceTypeInfo(type: string | undefined): DeviceTypeInfo {
  const normalized = (type || '').toLowerCase();

  if (normalized.includes('cctv') || normalized.includes('camera') || normalized.includes('kamera')) {
    return {
      type: 'cctv',
      label: 'CCTV (Kamera IP)',
      icon: <Camera className="w-4 h-4 text-rose-400" />,
      smallIcon: <Camera className="w-3 h-3 text-rose-400" />,
      color: '#f43f5e',
      bgClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30'
    };
  }

  if (normalized.includes('computer') || normalized.includes('pc') || normalized.includes('workstation') || normalized.includes('komputer') || normalized.includes('laptop') || normalized.includes('desktop')) {
    return {
      type: 'computer' as DeviceType,
      label: 'Komputer / PC Workstation',
      icon: <Monitor className="w-4 h-4 text-emerald-400" />,
      smallIcon: <Monitor className="w-3 h-3 text-emerald-400" />,
      color: '#10b981',
      bgClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    };
  }

  if (normalized.includes('ap') || normalized.includes('wifi') || normalized.includes('access-point') || normalized.includes('access point')) {
    return {
      type: 'access-point',
      label: 'Access Point (WiFi)',
      icon: <Wifi className="w-4 h-4 text-amber-400" />,
      smallIcon: <Wifi className="w-3 h-3 text-amber-400" />,
      color: '#f59e0b',
      bgClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    };
  }

  if (normalized.includes('router') || normalized.includes('gateway')) {
    return {
      type: 'router',
      label: 'Router / Gateway',
      icon: <Radio className="w-4 h-4 text-purple-400" />,
      smallIcon: <Radio className="w-3 h-3 text-purple-400" />,
      color: '#a855f7',
      bgClass: 'bg-purple-500/10 text-purple-400 border-purple-500/30'
    };
  }

  if (normalized.includes('firewall')) {
    return {
      type: 'firewall',
      label: 'Firewall / Security',
      icon: <ShieldCheck className="w-4 h-4 text-red-400" />,
      smallIcon: <ShieldCheck className="w-3 h-3 text-red-400" />,
      color: '#ef4444',
      bgClass: 'bg-red-500/10 text-red-400 border-red-500/30'
    };
  }

  if (normalized.includes('server')) {
    return {
      type: 'server',
      label: 'Server Rack',
      icon: <HardDrive className="w-4 h-4 text-indigo-400" />,
      smallIcon: <HardDrive className="w-3 h-3 text-indigo-400" />,
      color: '#6366f1',
      bgClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
    };
  }

  if (normalized.includes('ups')) {
    return {
      type: 'ups',
      label: 'UPS Power Supply',
      icon: <BatteryCharging className="w-4 h-4 text-yellow-400" />,
      smallIcon: <BatteryCharging className="w-3 h-3 text-yellow-400" />,
      color: '#eab308',
      bgClass: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
    };
  }

  if (normalized.includes('dist')) {
    return {
      type: 'dist-switch',
      label: 'Distribution Switch',
      icon: <Layers className="w-4 h-4 text-blue-400" />,
      smallIcon: <Layers className="w-3 h-3 text-blue-400" />,
      color: '#3b82f6',
      bgClass: 'bg-blue-500/10 text-blue-400 border-blue-500/30'
    };
  }

  if (normalized.includes('core')) {
    return {
      type: 'core-switch',
      label: 'Core Switch',
      icon: <Network className="w-4 h-4 text-cyan-400" />,
      smallIcon: <Network className="w-3 h-3 text-cyan-400" />,
      color: '#06b6d4',
      bgClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
    };
  }

  // Default: Access / General Switch
  return {
    type: 'access-switch',
    label: 'Switch Network',
    icon: <Server className="w-4 h-4 text-cyan-400" />,
    smallIcon: <Server className="w-3 h-3 text-cyan-400" />,
    color: '#06b6d4',
    bgClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
  };
}

export const DeviceIconBadge: React.FC<{ type: string; className?: string }> = ({ type, className = 'w-4 h-4' }) => {
  const info = getDeviceTypeInfo(type);
  return <span className={`inline-flex items-center justify-center ${className}`}>{info.icon}</span>;
};
