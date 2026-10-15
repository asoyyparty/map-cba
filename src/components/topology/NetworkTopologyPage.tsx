import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { TopologyView } from '../TopologyView';
import { Device, CableRoute, Building } from '../../types';
import { Loader2 } from 'lucide-react';

export const NetworkTopologyPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const buildingParam = searchParams.get('building') || searchParams.get('buildingId');

  const [devices, setDevices] = useState<Device[]>([]);
  const [cableRoutes, setCableRoutes] = useState<CableRoute[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [devRes, cableRes, bldRes] = await Promise.all([
          fetch('/api/devices'),
          fetch('/api/cables'),
          fetch('/api/buildings')
        ]);

        if (devRes.ok) {
          const devJson = await devRes.json();
          if (Array.isArray(devJson.data) && isMounted) {
            setDevices(devJson.data.map((d: any) => ({
              ...d,
              totalPorts: d.portsTotal || 24,
              activePorts: d.portsActive || 0
            })));
          }
        }

        if (cableRes.ok) {
          const cableJson = await cableRes.json();
          if (Array.isArray(cableJson.data) && isMounted) {
            setCableRoutes(cableJson.data);
          }
        }

        if (bldRes.ok) {
          const bldJson = await bldRes.json();
          if (Array.isArray(bldJson.data) && isMounted) {
            setBuildings(bldJson.data);
          }
        }
      } catch (err) {
        console.warn('[TopologyPage] API fetch error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleNavigateView = (view: string) => {
    if (view === 'map') navigate('/network-layout');
    else if (view === 'devices') navigate('/devices');
    else if (view === 'dashboard') navigate('/dashboard');
  };

  const handleViewOnMap = (device: Device) => {
    if (device.buildingId) {
      navigate(`/network-layout?buildingId=${device.buildingId}`);
    } else {
      navigate('/network-layout');
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-[#080D1A] text-slate-700 dark:text-slate-300 font-sans">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <p className="text-sm font-medium">Memuat Topologi Jaringan PT. CBA...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-64px)] bg-slate-50 dark:bg-[#080D1A] overflow-hidden">
      <TopologyView
        devices={devices}
        cableRoutes={cableRoutes}
        buildings={buildings}
        initialBuildingFilter={buildingParam}
        onNavigateView={handleNavigateView as any}
        onViewOnMap={handleViewOnMap}
      />
    </div>
  );
};
