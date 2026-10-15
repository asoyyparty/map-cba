import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cba_network_map',
  charset: 'utf8mb4'
});

async function run() {
  console.log('--- Reseeding MySQL cba_network_map with Section 22 Demo Data ---');

  // Truncate existing data to cleanly reseed
  await pool.query('DELETE FROM buildings;');
  await pool.query('DELETE FROM devices;');
  await pool.query('DELETE FROM cable_routes;');
  await pool.query('DELETE FROM racks;');
  await pool.query('DELETE FROM alerts;');

  // Buildings (KU, MTC, A, B, C, D, E, F, H, J)
  const buildings = [
    {
      id: 'bld-ku',
      name: 'Kantor Utama',
      code: 'KU',
      category: 'office',
      coords: [{ x: 320, y: 410 }, { x: 382, y: 410 }, { x: 382, y: 445 }, { x: 320, y: 445 }],
      center: { x: 351, y: 428 },
      status: 'healthy',
      head_it: 'Budi Santoso (Head IT)',
      total_devices: 12,
      racks_count: 2,
      description: 'Kantor Direksi, Server Room Utama & Manajemen PT. CBA Chemical Industry.',
      lokasi: 'Area Administrasi Depan',
      koordinat: 'X: 351, Y: 428',
      main_switch: 'SW-KU-01',
      ap_count: 6,
      port_count: 48,
      connected_users: 45,
      backbone_from: 'ISP Primary Fiber (Drop In)',
      backbone_cable: 'FO-ISP-01',
      backbone_core: '24 Core',
      backbone_speed: '10 Gbps',
      backbone_status: 'Active',
      image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'bld-mtc',
      name: 'Kantor MTC',
      code: 'MTC',
      category: 'office',
      coords: [{ x: 232, y: 440 }, { x: 268, y: 440 }, { x: 268, y: 480 }, { x: 232, y: 480 }],
      center: { x: 250, y: 460 },
      status: 'healthy',
      head_it: 'Tim MTC IT',
      total_devices: 4,
      racks_count: 1,
      description: 'Kantor Divisi Maintenance, Kalibrasi Alat & Workshop Mekanik Pabrik.',
      lokasi: 'Area Workshop Selatan',
      koordinat: 'X: 250, Y: 460',
      main_switch: 'SW-MTC-01',
      ap_count: 2,
      port_count: 16,
      connected_users: 8,
      backbone_from: 'Kantor Utama (SW-KU-01)',
      backbone_cable: 'UTP-MTC-01',
      backbone_core: '8 Core',
      backbone_speed: '1 Gbps',
      backbone_status: 'Active',
      image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'bld-a',
      name: 'Gedung A',
      code: 'A',
      category: 'production',
      coords: [{ x: 275, y: 445 }, { x: 312, y: 445 }, { x: 312, y: 525 }, { x: 275, y: 525 }],
      center: { x: 294, y: 485 },
      status: 'healthy',
      head_it: 'Agus P.',
      total_devices: 6,
      racks_count: 1,
      description: 'Gudang barang jadi & lini pengemasan formulasi herbisida/pestisida.',
      lokasi: 'Area Produksi Selatan',
      koordinat: 'X: 294, Y: 485',
      main_switch: 'SW-A-01',
      ap_count: 4,
      port_count: 24,
      connected_users: 18,
      backbone_from: 'Kantor Utama (SW-KU-01)',
      backbone_cable: 'FO-001',
      backbone_core: '12 Core',
      backbone_speed: '10 Gbps',
      backbone_status: 'Active',
      image_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'bld-b',
      name: 'Gedung B',
      code: 'B',
      category: 'warehouse',
      coords: [{ x: 190, y: 88 }, { x: 254, y: 88 }, { x: 254, y: 195 }, { x: 190, y: 195 }],
      center: { x: 222, y: 142 },
      status: 'healthy',
      head_it: 'Bambang S.',
      total_devices: 6,
      racks_count: 1,
      description: 'Gudang Bahan Baku Utama & Transit Raw Material Kimia.',
      lokasi: 'Area Gudang Utara',
      koordinat: 'X: 222, Y: 142',
      main_switch: 'SW-B-01',
      ap_count: 3,
      port_count: 24,
      connected_users: 14,
      backbone_from: 'Kantor Utama (SW-KU-01)',
      backbone_cable: 'FO-002',
      backbone_core: '12 Core',
      backbone_speed: '10 Gbps',
      backbone_status: 'Active',
      image_url: 'https://images.unsplash.com/photo-1586528116493-a029325540fa?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'bld-c',
      name: 'Gedung C',
      code: 'C',
      category: 'production',
      coords: [{ x: 320, y: 315 }, { x: 372, y: 315 }, { x: 372, y: 375 }, { x: 320, y: 375 }],
      center: { x: 346, y: 345 },
      status: 'healthy',
      head_it: 'Ahmad Fauzi',
      total_devices: 6,
      racks_count: 1,
      description: 'Line ekstrusi & produksi plastik mulsa pertanian modern.',
      lokasi: 'Area Produksi Mulsa',
      koordinat: 'X: 346, Y: 345',
      main_switch: 'SW-C-01',
      ap_count: 3,
      port_count: 24,
      connected_users: 16,
      backbone_from: 'Gedung D (SW-D-01)',
      backbone_cable: 'FO-005',
      backbone_core: '12 Core',
      backbone_speed: '10 Gbps',
      backbone_status: 'Active',
      image_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'bld-d',
      name: 'Gedung D',
      code: 'D',
      category: 'production',
      coords: [{ x: 295, y: 228 }, { x: 395, y: 228 }, { x: 395, y: 310 }, { x: 295, y: 310 }],
      center: { x: 345, y: 269 },
      status: 'warning',
      head_it: 'Dedi Kurniawan',
      total_devices: 8,
      racks_count: 1,
      description: 'Pabrik blowing botol kemasan pestisida & laboratorium QC.',
      lokasi: 'Area Formulasi Timur',
      koordinat: 'X: 345, Y: 269',
      main_switch: 'SW-D-01',
      ap_count: 4,
      port_count: 24,
      connected_users: 22,
      backbone_from: 'Kantor Utama (SW-KU-01)',
      backbone_cable: 'FO-003',
      backbone_core: '12 Core',
      backbone_speed: '10 Gbps',
      backbone_status: 'Warning',
      image_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'bld-e',
      name: 'Gedung E',
      code: 'E',
      category: 'production',
      coords: [{ x: 236, y: 220 }, { x: 288, y: 220 }, { x: 288, y: 325 }, { x: 236, y: 325 }],
      center: { x: 262, y: 272 },
      status: 'healthy',
      head_it: 'Syaiful R.',
      total_devices: 7,
      racks_count: 1,
      description: 'Area pencampuran & formulasi produk fungisida dan herbisida cair.',
      lokasi: 'Area Mixing Pestisida',
      koordinat: 'X: 262, Y: 272',
      main_switch: 'SW-E-01',
      ap_count: 3,
      port_count: 24,
      connected_users: 16,
      backbone_from: 'Gedung D (SW-D-01)',
      backbone_cable: 'FO-003-Ext',
      backbone_core: '12 Core',
      backbone_speed: '10 Gbps',
      backbone_status: 'Active',
      image_url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'bld-f',
      name: 'Gedung F',
      code: 'F',
      category: 'warehouse',
      coords: [{ x: 180, y: 215 }, { x: 234, y: 215 }, { x: 234, y: 305 }, { x: 180, y: 305 }],
      center: { x: 207, y: 260 },
      status: 'healthy',
      head_it: 'Hendra S.',
      total_devices: 5,
      racks_count: 1,
      description: 'Gudang penyimpanan stok hasil kemasan produk siap distribusi.',
      lokasi: 'Area Pergudangan Tengah',
      koordinat: 'X: 207, Y: 260',
      main_switch: 'SW-F-01',
      ap_count: 2,
      port_count: 24,
      connected_users: 10,
      backbone_from: 'Gedung B (SW-B-01)',
      backbone_cable: 'FO-004',
      backbone_core: '12 Core',
      backbone_speed: '10 Gbps',
      backbone_status: 'Active',
      image_url: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'bld-h',
      name: 'Gedung H',
      code: 'H',
      category: 'production',
      coords: [{ x: 260, y: 115 }, { x: 310, y: 115 }, { x: 310, y: 215 }, { x: 260, y: 215 }],
      center: { x: 285, y: 165 },
      status: 'healthy',
      head_it: 'Bambang S.',
      total_devices: 7,
      racks_count: 1,
      description: 'Area perakitan sprayer & komponen alsintan pertanian CBA.',
      lokasi: 'Area Assembling Utara',
      koordinat: 'X: 285, Y: 165',
      main_switch: 'SW-H-01',
      ap_count: 4,
      port_count: 24,
      connected_users: 20,
      backbone_from: 'Kantor Utama (SW-KU-01)',
      backbone_cable: 'FO-003',
      backbone_core: '12 Core',
      backbone_speed: '10 Gbps',
      backbone_status: 'Active',
      image_url: 'https://images.unsplash.com/photo-1516937941344-00b4e0337589?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'bld-j',
      name: 'Gedung J',
      code: 'J',
      category: 'warehouse',
      coords: [{ x: 30, y: 195 }, { x: 95, y: 195 }, { x: 95, y: 290 }, { x: 30, y: 290 }],
      center: { x: 62, y: 242 },
      status: 'healthy',
      head_it: 'Rudi H.',
      total_devices: 5,
      racks_count: 1,
      description: 'Gudang logistik barat & terminal bongkar muat armada truk pabrik.',
      lokasi: 'Area Logistik Barat',
      koordinat: 'X: 62, Y: 242',
      main_switch: 'SW-J-01',
      ap_count: 3,
      port_count: 16,
      connected_users: 9,
      backbone_from: 'Gedung F (SW-F-01)',
      backbone_cable: 'UTP-002',
      backbone_core: '8 Core',
      backbone_speed: '1 Gbps',
      backbone_status: 'Active',
      image_url: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=600&auto=format&fit=crop&q=80'
    }
  ];

  for (const b of buildings) {
    await pool.query(`
      INSERT INTO buildings 
      (id, name, code, category, coords_json, center_json, status, head_it, total_devices, racks_count, description, lokasi, koordinat, main_switch, ap_count, port_count, connected_users, backbone_from, backbone_cable, backbone_core, backbone_speed, backbone_status, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      b.id, b.name, b.code, b.category,
      JSON.stringify(b.coords), JSON.stringify(b.center),
      b.status, b.head_it, b.total_devices, b.racks_count,
      b.description, b.lokasi, b.koordinat, b.main_switch,
      b.ap_count, b.port_count, b.connected_users,
      b.backbone_from, b.backbone_cable, b.backbone_core, b.backbone_speed, b.backbone_status,
      b.image_url
    ]);
  }

  // Devices (FW-KU-01, SW-KU-01, SW-A-01, SW-B-01, SW-C-01, SW-D-01, SW-E-01, SW-F-01, SW-H-01, SW-J-01)
  const devices = [
    { id: 'dev-fw-ku-01', name: 'FW-KU-01', ip: '192.168.1.1', mac: '74:83:C2:10:AF:01', type: 'firewall', building_id: 'bld-ku', building_name: 'Kantor Utama', rack_id: 'rack-ku-01', status: 'online', brand: 'Fortinet', model: 'FortiGate 100F', ports_total: 16, ports_active: 12, firmware: '7.4.3', uptime: '154 days' },
    { id: 'dev-sw-ku-01', name: 'SW-KU-01', ip: '192.168.1.2', mac: '00:2A:10:99:BB:01', type: 'core-switch', building_id: 'bld-ku', building_name: 'Kantor Utama', rack_id: 'rack-ku-01', status: 'online', brand: 'Cisco', model: 'Catalyst 9300 48P SFP+', ports_total: 48, ports_active: 38, firmware: '17.6.5', uptime: '154 days' },
    { id: 'dev-sw-mtc-01', name: 'SW-MTC-01', ip: '192.168.1.10', mac: '00:2A:10:99:MM:10', type: 'dist-switch', building_id: 'bld-mtc', building_name: 'Kantor MTC', rack_id: 'rack-mtc-01', status: 'online', brand: 'Cisco', model: 'Catalyst 2960X-16TS-L', ports_total: 16, ports_active: 8, firmware: '15.2.7', uptime: '90 days' },
    { id: 'dev-sw-a-01', name: 'SW-A-01', ip: '192.168.1.11', mac: '00:2A:10:99:AA:01', type: 'dist-switch', building_id: 'bld-a', building_name: 'Gedung A', rack_id: 'rack-a-01', status: 'online', brand: 'Cisco', model: 'Catalyst 2960X-24PD-L', ports_total: 24, ports_active: 18, firmware: '15.2.7', uptime: '110 days' },
    { id: 'dev-sw-b-01', name: 'SW-B-01', ip: '192.168.1.12', mac: '00:2A:10:99:BB:12', type: 'dist-switch', building_id: 'bld-b', building_name: 'Gedung B', rack_id: 'rack-b-01', status: 'online', brand: 'Cisco', model: 'Catalyst 2960X-24TS-L', ports_total: 24, ports_active: 16, firmware: '15.2.7', uptime: '98 days' },
    { id: 'dev-sw-c-01', name: 'SW-C-01', ip: '192.168.1.13', mac: '00:2A:10:99:CC:13', type: 'dist-switch', building_id: 'bld-c', building_name: 'Gedung C', rack_id: 'rack-c-01', status: 'online', brand: 'Cisco', model: 'Catalyst 2960X-24PD-L', ports_total: 24, ports_active: 18, firmware: '15.2.7', uptime: '65 days' },
    { id: 'dev-sw-d-01', name: 'SW-D-01', ip: '192.168.1.14', mac: '00:2A:10:99:DD:14', type: 'dist-switch', building_id: 'bld-d', building_name: 'Gedung D', rack_id: 'rack-d-01', status: 'warning', brand: 'Cisco', model: 'Catalyst 2960X-24TS-L', ports_total: 24, ports_active: 16, firmware: '15.2.7', uptime: '45 days' },
    { id: 'dev-sw-e-01', name: 'SW-E-01', ip: '192.168.1.15', mac: '00:2A:10:99:EE:15', type: 'dist-switch', building_id: 'bld-e', building_name: 'Gedung E', rack_id: null, status: 'online', brand: 'Cisco', model: 'Catalyst 2960X-24PD-L', ports_total: 24, ports_active: 19, firmware: '15.2.7', uptime: '82 days' },
    { id: 'dev-sw-f-01', name: 'SW-F-01', ip: '192.168.1.16', mac: '00:2A:10:99:FF:16', type: 'dist-switch', building_id: 'bld-f', building_name: 'Gedung F', rack_id: null, status: 'online', brand: 'Cisco', model: 'Catalyst 2960X-24TS-L', ports_total: 24, ports_active: 14, firmware: '15.2.7', uptime: '91 days' },
    { id: 'dev-sw-h-01', name: 'SW-H-01', ip: '192.168.1.18', mac: '00:2A:10:99:HH:18', type: 'dist-switch', building_id: 'bld-h', building_name: 'Gedung H', rack_id: null, status: 'online', brand: 'Cisco', model: 'Catalyst 2960X-24TS-L', ports_total: 24, ports_active: 17, firmware: '15.2.7', uptime: '77 days' },
    { id: 'dev-sw-j-01', name: 'SW-J-01', ip: '192.168.1.19', mac: '00:2A:10:99:JJ:19', type: 'access-switch', building_id: 'bld-j', building_name: 'Gedung J', rack_id: null, status: 'online', brand: 'Cisco', model: 'Catalyst 2960X-16TS-L', ports_total: 16, ports_active: 11, firmware: '15.2.7', uptime: '40 days' }
  ];

  for (const d of devices) {
    await pool.query(`
      INSERT INTO devices
      (id, name, ip, mac, type, building_id, building_name, rack_id, status, brand, model, ports_total, ports_active, firmware, uptime)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      d.id, d.name, d.ip, d.mac, d.type, d.building_id, d.building_name, d.rack_id,
      d.status, d.brand, d.model, d.ports_total, d.ports_active, d.firmware, d.uptime
    ]);
  }

  // Cable Routes (FO-001 to FO-005 + auxiliaries)
  const cables = [
    {
      id: 'cab-fo-001',
      code: 'FO-001',
      name: 'Backbone FO: Kantor Utama → Gedung A',
      type: 'fiber',
      from_building_id: 'bld-ku',
      from_building_name: 'Kantor Utama',
      to_building_id: 'bld-a',
      to_building_name: 'Gedung A',
      path: [{ x: 351, y: 428 }, { x: 312, y: 428 }, { x: 312, y: 485 }, { x: 294, y: 485 }],
      total_cores: 12,
      used_cores: 8,
      status: 'active',
      length_meters: 95.0,
      bandwidth: '10 Gbps',
      attenuation_db: 0.35
    },
    {
      id: 'cab-fo-002',
      code: 'FO-002',
      name: 'Backbone FO: Kantor Utama → Gedung B',
      type: 'fiber',
      from_building_id: 'bld-ku',
      from_building_name: 'Kantor Utama',
      to_building_id: 'bld-b',
      to_building_name: 'Gedung B',
      path: [{ x: 351, y: 428 }, { x: 312, y: 395 }, { x: 308, y: 220 }, { x: 222, y: 220 }, { x: 222, y: 142 }],
      total_cores: 12,
      used_cores: 8,
      status: 'active',
      length_meters: 280.0,
      bandwidth: '10 Gbps',
      attenuation_db: 0.42
    },
    {
      id: 'cab-fo-003',
      code: 'FO-003',
      name: 'Backbone FO: Kantor Utama → Gedung D',
      type: 'fiber',
      from_building_id: 'bld-ku',
      from_building_name: 'Kantor Utama',
      to_building_id: 'bld-d',
      to_building_name: 'Gedung D',
      path: [{ x: 351, y: 428 }, { x: 312, y: 395 }, { x: 312, y: 269 }, { x: 345, y: 269 }],
      total_cores: 12,
      used_cores: 6,
      status: 'degraded',
      length_meters: 195.0,
      bandwidth: '10 Gbps',
      attenuation_db: 0.85
    },
    {
      id: 'cab-fo-004',
      code: 'FO-004',
      name: 'Dist Link: Gedung B → Gedung F',
      type: 'fiber',
      from_building_id: 'bld-b',
      from_building_name: 'Gedung B',
      to_building_id: 'bld-f',
      to_building_name: 'Gedung F',
      path: [{ x: 222, y: 142 }, { x: 222, y: 220 }, { x: 207, y: 220 }, { x: 207, y: 260 }],
      total_cores: 12,
      used_cores: 6,
      status: 'active',
      length_meters: 140.0,
      bandwidth: '10 Gbps',
      attenuation_db: 0.38
    },
    {
      id: 'cab-fo-005',
      code: 'FO-005',
      name: 'Distribution FO: Gedung D → Gedung C',
      type: 'fiber',
      from_building_id: 'bld-d',
      from_building_name: 'Gedung D',
      to_building_id: 'bld-c',
      to_building_name: 'Gedung C',
      path: [{ x: 345, y: 269 }, { x: 308, y: 269 }, { x: 308, y: 345 }, { x: 346, y: 345 }],
      total_cores: 12,
      used_cores: 8,
      status: 'active',
      length_meters: 125.0,
      bandwidth: '10 Gbps',
      attenuation_db: 0.32
    },
    {
      id: 'cab-utp-001',
      code: 'UTP-001',
      name: 'UTP Link: Gedung F → Gedung J',
      type: 'utp',
      from_building_id: 'bld-f',
      from_building_name: 'Gedung F',
      to_building_id: 'bld-j',
      to_building_name: 'Gedung J',
      path: [{ x: 207, y: 260 }, { x: 135, y: 260 }, { x: 62, y: 242 }],
      total_cores: 8,
      used_cores: 8,
      status: 'active',
      length_meters: 175.0,
      bandwidth: '1 Gbps',
      attenuation_db: 0.45
    },
    {
      id: 'cab-utp-mtc',
      code: 'UTP-MTC-01',
      name: 'UTP MTC Link: Gedung A → Kantor MTC',
      type: 'utp',
      from_building_id: 'bld-a',
      from_building_name: 'Gedung A',
      to_building_id: 'bld-mtc',
      to_building_name: 'Kantor MTC',
      path: [{ x: 294, y: 485 }, { x: 275, y: 485 }, { x: 275, y: 460 }, { x: 250, y: 460 }],
      total_cores: 8,
      used_cores: 8,
      status: 'active',
      length_meters: 80.0,
      bandwidth: '1 Gbps',
      attenuation_db: 0.40
    },
    {
      id: 'cab-internet-in',
      code: 'FO-ISP-01',
      name: 'Internet Drop Line ISP Primary',
      type: 'fiber',
      from_building_id: 'internet-drop',
      from_building_name: 'ISP Gate',
      to_building_id: 'bld-ku',
      to_building_name: 'Kantor Utama',
      path: [{ x: 412, y: 72 }, { x: 405, y: 280 }, { x: 375, y: 395 }, { x: 351, y: 428 }],
      total_cores: 24,
      used_cores: 12,
      status: 'active',
      length_meters: 450.0,
      bandwidth: '10 Gbps',
      attenuation_db: 0.28
    }
  ];

  for (const c of cables) {
    await pool.query(`
      INSERT INTO cable_routes
      (id, code, name, type, from_building_id, from_building_name, to_building_id, to_building_name, path_coords_json, total_cores, used_cores, status, length_meters, bandwidth, attenuation_db)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      c.id, c.code, c.name, c.type,
      c.from_building_id, c.from_building_name,
      c.to_building_id, c.to_building_name,
      JSON.stringify(c.path),
      c.total_cores, c.used_cores, c.status,
      c.length_meters, c.bandwidth, c.attenuation_db
    ]);
  }

  // Racks
  const racks = [
    { id: 'rack-ku-01', name: 'Rack Server Utama (HQ 42U)', code: 'RACK-KU-01', building_id: 'bld-ku', room: 'Core Server Room', u_capacity: 42, used_u: 24, device_ids: ['dev-fw-ku-01', 'dev-sw-ku-01'] },
    { id: 'rack-a-01', name: 'Rack Distribution A (24U)', code: 'RACK-A-01', building_id: 'bld-a', room: 'Panel Gudang CF', u_capacity: 24, used_u: 8, device_ids: ['dev-sw-a-01'] },
    { id: 'rack-b-01', name: 'Rack Distribution B (24U)', code: 'RACK-B-01', building_id: 'bld-b', room: 'Panel Gudang Bahan Baku', u_capacity: 24, used_u: 6, device_ids: ['dev-sw-b-01'] },
    { id: 'rack-c-01', name: 'Rack Mulsa C (24U)', code: 'RACK-MULSA-C', building_id: 'bld-c', room: 'Panel IT Mulsa', u_capacity: 24, used_u: 6, device_ids: ['dev-sw-c-01'] },
    { id: 'rack-d-01', name: 'Rack Gedung D (24U)', code: 'RACK-D-01', building_id: 'bld-d', room: 'Panel IT Ekstrusi', u_capacity: 24, used_u: 8, device_ids: ['dev-sw-d-01'] }
  ];

  for (const r of racks) {
    await pool.query(`
      INSERT INTO racks (id, name, code, building_id, room, u_capacity, used_u, device_ids_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [r.id, r.name, r.code, r.building_id, r.room, r.u_capacity, r.used_u, JSON.stringify(r.device_ids)]);
  }

  // Alerts
  await pool.query(`
    INSERT INTO alerts (id, title, message, severity, status, building_id, building_name, time_ago) VALUES
    ('alt-1', 'Access Point Gedung D tidak merespons', 'Access Point AP-D-02 di lini ekstrusi Gedung D mengalami packet loss.', 'medium', 'open', 'bld-d', 'Gedung D', '2 jam yang lalu'),
    ('alt-2', 'Kabel FO-003 redaman meningkat', 'Jalur kabel optik FO-003 (Kantor Utama → Gedung D) terdeteksi atenuasi 0.85 dB.', 'high', 'open', 'bld-d', 'Gedung D', '3 jam yang lalu');
  `);

  console.log('--- Successfully seeded Section 22 Demo Data into MySQL! ---');
  await pool.end();
}

run().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
