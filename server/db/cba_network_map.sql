-- CBA Network Map Database Dump (MySQL / MariaDB XAMPP)
-- Updated: Section 22 Demo Data Alignment
-- Database: cba_network_map

CREATE DATABASE IF NOT EXISTS `cba_network_map` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `cba_network_map`;

DROP TABLE IF EXISTS `alerts`;
DROP TABLE IF EXISTS `cable_routes`;
DROP TABLE IF EXISTS `devices`;
DROP TABLE IF EXISTS `racks`;
DROP TABLE IF EXISTS `maintenance_tickets`;
DROP TABLE IF EXISTS `monitoring_metrics`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `buildings`;

CREATE TABLE `users` (
  `id` VARCHAR(64) PRIMARY KEY,
  `username` VARCHAR(64) UNIQUE NOT NULL,
  `full_name` VARCHAR(128) NOT NULL,
  `role` VARCHAR(32) NOT NULL DEFAULT 'viewer',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `users` (`id`, `username`, `full_name`, `role`) VALUES
('usr-1', 'admin', 'Admin IT CBA', 'admin'),
('usr-2', 'engineer', 'Budi Santoso', 'engineer'),
('usr-3', 'viewer', 'Operator Pabrik', 'viewer');

CREATE TABLE `buildings` (
  `id` VARCHAR(64) PRIMARY KEY,
  `name` VARCHAR(128) NOT NULL,
  `code` VARCHAR(32) NOT NULL,
  `category` VARCHAR(64) NOT NULL,
  `coords_json` LONGTEXT NOT NULL,
  `center_json` LONGTEXT NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'healthy',
  `head_it` VARCHAR(128),
  `total_devices` INT DEFAULT 0,
  `racks_count` INT DEFAULT 0,
  `description` TEXT,
  `lokasi` VARCHAR(128),
  `koordinat` VARCHAR(64),
  `main_switch` VARCHAR(64),
  `ap_count` INT DEFAULT 0,
  `port_count` INT DEFAULT 0,
  `connected_users` INT DEFAULT 0,
  `backbone_from` VARCHAR(128),
  `backbone_cable` VARCHAR(64),
  `backbone_core` VARCHAR(64),
  `backbone_speed` VARCHAR(64),
  `backbone_status` VARCHAR(64),
  `image_url` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `buildings` (`id`, `name`, `code`, `category`, `coords_json`, `center_json`, `status`, `head_it`, `total_devices`, `racks_count`, `description`, `lokasi`, `koordinat`, `main_switch`, `ap_count`, `port_count`, `connected_users`, `backbone_from`, `backbone_cable`, `backbone_core`, `backbone_speed`, `backbone_status`, `image_url`) VALUES
('bld-ku', 'Kantor Utama', 'KU', 'office', '[{"x":320,"y":410},{"x":382,"y":410},{"x":382,"y":445},{"x":320,"y":445}]', '{"x":351,"y":428}', 'healthy', 'Budi Santoso (Head IT)', 12, 2, 'Kantor Direksi, Server Room Utama & Manajemen PT. CBA Chemical Industry.', 'Area Administrasi Depan', 'X: 351, Y: 428', 'SW-KU-01', 6, 48, 45, 'ISP Primary Fiber (Drop In)', 'FO-ISP-01', '24 Core', '10 Gbps', 'Active', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=80'),
('bld-mtc', 'Kantor MTC', 'MTC', 'office', '[{"x":232,"y":440},{"x":268,"y":440},{"x":268,"y":480},{"x":232,"y":480}]', '{"x":250,"y":460}', 'healthy', 'Tim MTC IT', 4, 1, 'Kantor Divisi Maintenance, Kalibrasi Alat & Workshop Mekanik Pabrik.', 'Area Workshop Selatan', 'X: 250, Y: 460', 'SW-MTC-01', 2, 16, 8, 'Kantor Utama (SW-KU-01)', 'UTP-MTC-01', '8 Core', '1 Gbps', 'Active', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80'),
('bld-a', 'Gedung A', 'A', 'production', '[{"x":275,"y":445},{"x":312,"y":445},{"x":312,"y":525},{"x":275,"y":525}]', '{"x":294,"y":485}', 'healthy', 'Agus P.', 6, 1, 'Gudang barang jadi & lini pengemasan formulasi herbisida/pestisida.', 'Area Produksi Selatan', 'X: 294, Y: 485', 'SW-A-01', 4, 24, 18, 'Kantor Utama (SW-KU-01)', 'FO-001', '12 Core', '10 Gbps', 'Active', 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80'),
('bld-b', 'Gedung B', 'B', 'warehouse', '[{"x":190,"y":88},{"x":254,"y":88},{"x":254,"y":195},{"x":190,"y":195}]', '{"x":222,"y":142}', 'healthy', 'Bambang S.', 6, 1, 'Gudang Bahan Baku Utama & Transit Raw Material Kimia.', 'Area Gudang Utara', 'X: 222, Y: 142', 'SW-B-01', 3, 24, 14, 'Kantor Utama (SW-KU-01)', 'FO-002', '12 Core', '10 Gbps', 'Active', 'https://images.unsplash.com/photo-1586528116493-a029325540fa?w=600&auto=format&fit=crop&q=80'),
('bld-c', 'Gedung C', 'C', 'production', '[{"x":320,"y":315},{"x":372,"y":315},{"x":372,"y":375},{"x":320,"y":375}]', '{"x":346,"y":345}', 'healthy', 'Ahmad Fauzi', 6, 1, 'Line ekstrusi & produksi plastik mulsa pertanian modern.', 'Area Produksi Mulsa', 'X: 346, Y: 345', 'SW-C-01', 3, 24, 16, 'Gedung D (SW-D-01)', 'FO-005', '12 Core', '10 Gbps', 'Active', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&auto=format&fit=crop&q=80'),
('bld-d', 'Gedung D', 'D', 'production', '[{"x":295,"y":228},{"x":395,"y":228},{"x":395,"y":310},{"x":295,"y":310}]', '{"x":345,"y":269}', 'warning', 'Dedi Kurniawan', 8, 1, 'Pabrik blowing botol kemasan pestisida & laboratorium QC.', 'Area Formulasi Timur', 'X: 345, Y: 269', 'SW-D-01', 4, 24, 22, 'Kantor Utama (SW-KU-01)', 'FO-003', '12 Core', '10 Gbps', 'Warning', 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&auto=format&fit=crop&q=80'),
('bld-e', 'Gedung E', 'E', 'production', '[{"x":236,"y":220},{"x":288,"y":220},{"x":288,"y":325},{"x":236,"y":325}]', '{"x":262,"y":272}', 'healthy', 'Syaiful R.', 7, 1, 'Area pencampuran & formulasi produk fungisida dan herbisida cair.', 'Area Mixing Pestisida', 'X: 262, Y: 272', 'SW-E-01', 3, 24, 16, 'Gedung D (SW-D-01)', 'FO-003-Ext', '12 Core', '10 Gbps', 'Active', 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80'),
('bld-f', 'Gedung F', 'F', 'warehouse', '[{"x":180,"y":215},{"x":234,"y":215},{"x":234,"y":305},{"x":180,"y":305}]', '{"x":207,"y":260}', 'healthy', 'Hendra S.', 5, 1, 'Gudang penyimpanan stok hasil kemasan produk siap distribusi.', 'Area Pergudangan Tengah', 'X: 207, Y: 260', 'SW-F-01', 2, 24, 10, 'Gedung B (SW-B-01)', 'FO-004', '12 Core', '10 Gbps', 'Active', 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=600&auto=format&fit=crop&q=80'),
('bld-h', 'Gedung H', 'H', 'production', '[{"x":260,"y":115},{"x":310,"y":115},{"x":310,"y":215},{"x":260,"y":215}]', '{"x":285,"y":165}', 'healthy', 'Bambang S.', 7, 1, 'Area perakitan sprayer & komponen alsintan pertanian CBA.', 'Area Assembling Utara', 'X: 285, Y: 165', 'SW-H-01', 4, 24, 20, 'Kantor Utama (SW-KU-01)', 'FO-003', '12 Core', '10 Gbps', 'Active', 'https://images.unsplash.com/photo-1516937941344-00b4e0337589?w=600&auto=format&fit=crop&q=80'),
('bld-j', 'Gedung J', 'J', 'warehouse', '[{"x":30,"y":195},{"x":95,"y":195},{"x":95,"y":290},{"x":30,"y":290}]', '{"x":62,"y":242}', 'healthy', 'Rudi H.', 5, 1, 'Gudang logistik barat & terminal bongkar muat armada truk pabrik.', 'Area Logistik Barat', 'X: 62, Y: 242', 'SW-J-01', 3, 16, 9, 'Gedung F (SW-F-01)', 'UTP-002', '8 Core', '1 Gbps', 'Active', 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=600&auto=format&fit=crop&q=80');

CREATE TABLE `devices` (
  `id` VARCHAR(64) PRIMARY KEY,
  `name` VARCHAR(128) NOT NULL,
  `ip` VARCHAR(45) NOT NULL,
  `mac` VARCHAR(32) NOT NULL,
  `type` VARCHAR(64) NOT NULL,
  `building_id` VARCHAR(64),
  `building_name` VARCHAR(128),
  `rack_id` VARCHAR(64),
  `status` VARCHAR(32) NOT NULL DEFAULT 'online',
  `brand` VARCHAR(64),
  `model` VARCHAR(64),
  `ports_total` INT DEFAULT 24,
  `ports_active` INT DEFAULT 0,
  `firmware` VARCHAR(64),
  `uptime` VARCHAR(64),
  `vlan` VARCHAR(64),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `devices` (`id`, `name`, `ip`, `mac`, `type`, `building_id`, `building_name`, `rack_id`, `status`, `brand`, `model`, `ports_total`, `ports_active`, `firmware`, `uptime`) VALUES
('dev-fw-ku-01', 'FW-KU-01', '192.168.1.1', '74:83:C2:10:AF:01', 'firewall', 'bld-ku', 'Kantor Utama', 'rack-ku-01', 'online', 'Fortinet', 'FortiGate 100F', 16, 12, '7.4.3', '154 days'),
('dev-sw-ku-01', 'SW-KU-01', '192.168.1.2', '00:2A:10:99:BB:01', 'core-switch', 'bld-ku', 'Kantor Utama', 'rack-ku-01', 'online', 'Cisco', 'Catalyst 9300 48P SFP+', 48, 38, '17.6.5', '154 days'),
('dev-sw-a-01', 'SW-A-01', '192.168.1.11', '00:2A:10:99:AA:01', 'dist-switch', 'bld-a', 'Gedung A', 'rack-a-01', 'online', 'Cisco', 'Catalyst 2960X-24PD-L', 24, 18, '15.2.7', '110 days'),
('dev-sw-b-01', 'SW-B-01', '192.168.1.12', '00:2A:10:99:BB:12', 'dist-switch', 'bld-b', 'Gedung B', 'rack-b-01', 'online', 'Cisco', 'Catalyst 2960X-24TS-L', 24, 16, '15.2.7', '98 days'),
('dev-sw-c-01', 'SW-C-01', '192.168.1.13', '00:2A:10:99:CC:13', 'dist-switch', 'bld-c', 'Gedung C', 'rack-c-01', 'online', 'Cisco', 'Catalyst 2960X-24PD-L', 24, 18, '15.2.7', '65 days'),
('dev-sw-d-01', 'SW-D-01', '192.168.1.14', '00:2A:10:99:DD:14', 'dist-switch', 'bld-d', 'Gedung D', 'rack-d-01', 'warning', 'Cisco', 'Catalyst 2960X-24TS-L', 24, 16, '15.2.7', '45 days'),
('dev-sw-e-01', 'SW-E-01', '192.168.1.15', '00:2A:10:99:EE:15', 'dist-switch', 'bld-e', 'Gedung E', NULL, 'online', 'Cisco', 'Catalyst 2960X-24PD-L', 24, 19, '15.2.7', '82 days'),
('dev-sw-f-01', 'SW-F-01', '192.168.1.16', '00:2A:10:99:FF:16', 'dist-switch', 'bld-f', 'Gedung F', NULL, 'online', 'Cisco', 'Catalyst 2960X-24TS-L', 24, 14, '15.2.7', '91 days'),
('dev-sw-h-01', 'SW-H-01', '192.168.1.18', '00:2A:10:99:HH:18', 'dist-switch', 'bld-h', 'Gedung H', NULL, 'online', 'Cisco', 'Catalyst 2960X-24TS-L', 24, 17, '15.2.7', '77 days'),
('dev-sw-j-01', 'SW-J-01', '192.168.1.19', '00:2A:10:99:JJ:19', 'access-switch', 'bld-j', 'Gedung J', NULL, 'online', 'Cisco', 'Catalyst 2960X-16TS-L', 16, 11, '15.2.7', '40 days');

CREATE TABLE `cable_routes` (
  `id` VARCHAR(64) PRIMARY KEY,
  `code` VARCHAR(64) UNIQUE NOT NULL,
  `name` VARCHAR(128) NOT NULL,
  `type` VARCHAR(32) NOT NULL DEFAULT 'fiber',
  `from_building_id` VARCHAR(64),
  `from_building_name` VARCHAR(128),
  `to_building_id` VARCHAR(64),
  `to_building_name` VARCHAR(128),
  `path_coords_json` LONGTEXT NOT NULL,
  `total_cores` INT DEFAULT 12,
  `used_cores` INT DEFAULT 6,
  `status` VARCHAR(32) NOT NULL DEFAULT 'active',
  `length_meters` DECIMAL(10, 2) DEFAULT 0.00,
  `bandwidth` VARCHAR(32) DEFAULT '10 Gbps',
  `attenuation_db` DECIMAL(5, 2) DEFAULT 0.35,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `cable_routes` (`id`, `code`, `name`, `type`, `from_building_id`, `from_building_name`, `to_building_id`, `to_building_name`, `path_coords_json`, `total_cores`, `used_cores`, `status`, `length_meters`, `bandwidth`, `attenuation_db`) VALUES
('cab-fo-001', 'FO-001', 'Backbone FO: Kantor Utama → Gedung A', 'fiber', 'bld-ku', 'Kantor Utama', 'bld-a', 'Gedung A', '[{"x":351,"y":428},{"x":312,"y":428},{"x":312,"y":485},{"x":294,"y":485}]', 12, 8, 'active', 95.00, '10 Gbps', 0.35),
('cab-fo-002', 'FO-002', 'Backbone FO: Kantor Utama → Gedung B', 'fiber', 'bld-ku', 'Kantor Utama', 'bld-b', 'Gedung B', '[{"x":351,"y":428},{"x":312,"y":395},{"x":308,"y":220},{"x":222,"y":220},{"x":222,"y":142}]', 12, 8, 'active', 280.00, '10 Gbps', 0.42),
('cab-fo-003', 'FO-003', 'Backbone FO: Kantor Utama → Gedung D', 'fiber', 'bld-ku', 'Kantor Utama', 'bld-d', 'Gedung D', '[{"x":351,"y":428},{"x":312,"y":395},{"x":312,"y":269},{"x":345,"y":269}]', 12, 6, 'degraded', 195.00, '10 Gbps', 0.85),
('cab-fo-004', 'FO-004', 'Dist Link: Gedung B → Gedung F', 'fiber', 'bld-b', 'Gedung B', 'bld-f', 'Gedung F', '[{"x":222,"y":142},{"x":222,"y":220},{"x":207,"y":220},{"x":207,"y":260}]', 12, 6, 'active', 140.00, '10 Gbps', 0.38),
('cab-fo-005', 'FO-005', 'Distribution FO: Gedung D → Gedung C', 'fiber', 'bld-d', 'Gedung D', 'bld-c', 'Gedung C', '[{"x":345,"y":269},{"x":308,"y":269},{"x":308,"y":345},{"x":346,"y":345}]', 12, 8, 'active', 125.00, '10 Gbps', 0.32),
('cab-utp-001', 'UTP-001', 'UTP Link: Gedung F → Gedung J', 'utp', 'bld-f', 'Gedung F', 'bld-j', 'Gedung J', '[{"x":207,"y":260},{"x":135,"y":260},{"x":62,"y":242}]', 8, 8, 'active', 175.00, '1 Gbps', 0.45),
('cab-utp-mtc', 'UTP-MTC-01', 'UTP MTC Link: Gedung A → Kantor MTC', 'utp', 'bld-a', 'Gedung A', 'bld-mtc', 'Kantor MTC', '[{"x":294,"y":485},{"x":275,"y":485},{"x":275,"y":460},{"x":250,"y":460}]', 8, 8, 'active', 80.00, '1 Gbps', 0.40),
('cab-internet-in', 'FO-ISP-01', 'Internet Drop Line ISP Primary', 'fiber', 'internet-drop', 'ISP Gate', 'bld-ku', 'Kantor Utama', '[{"x":412,"y":72},{"x":405,"y":280},{"x":375,"y":395},{"x":351,"y":428}]', 24, 12, 'active', 450.00, '10 Gbps', 0.28);

CREATE TABLE `racks` (
  `id` VARCHAR(64) PRIMARY KEY,
  `name` VARCHAR(128) NOT NULL,
  `code` VARCHAR(64) NOT NULL,
  `building_id` VARCHAR(64),
  `room` VARCHAR(128),
  `u_capacity` INT DEFAULT 42,
  `used_u` INT DEFAULT 0,
  `device_ids_json` LONGTEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `racks` (`id`, `name`, `code`, `building_id`, `room`, `u_capacity`, `used_u`, `device_ids_json`) VALUES
('rack-ku-01', 'Rack Server Utama (HQ 42U)', 'RACK-KU-01', 'bld-ku', 'Core Server Room', 42, 24, '["dev-fw-ku-01","dev-sw-ku-01"]'),
('rack-a-01', 'Rack Distribution A (24U)', 'RACK-A-01', 'bld-a', 'Panel Gudang CF', 24, 8, '["dev-sw-a-01"]'),
('rack-b-01', 'Rack Distribution B (24U)', 'RACK-B-01', 'bld-b', 'Panel Gudang Bahan Baku', 24, 6, '["dev-sw-b-01"]'),
('rack-c-01', 'Rack Mulsa C (24U)', 'RACK-MULSA-C', 'bld-c', 'Panel IT Mulsa', 24, 6, '["dev-sw-c-01"]'),
('rack-d-01', 'Rack Gedung D (24U)', 'RACK-D-01', 'bld-d', 'Panel IT Ekstrusi', 24, 8, '["dev-sw-d-01"]');

CREATE TABLE `alerts` (
  `id` VARCHAR(64) PRIMARY KEY,
  `title` VARCHAR(128) NOT NULL,
  `message` TEXT NOT NULL,
  `severity` VARCHAR(32) NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'open',
  `building_id` VARCHAR(64),
  `building_name` VARCHAR(128),
  `device_id` VARCHAR(64),
  `time_ago` VARCHAR(64),
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `alerts` (`id`, `title`, `message`, `severity`, `status`, `building_id`, `building_name`, `time_ago`) VALUES
('alt-1', 'Access Point Gedung D tidak merespons', 'Access Point AP-D-02 di lini ekstrusi Gedung D mengalami packet loss.', 'medium', 'open', 'bld-d', 'Gedung D', '2 jam yang lalu'),
('alt-2', 'Kabel FO-003 redaman meningkat', 'Jalur kabel optik FO-003 (Kantor Utama → Gedung D) terdeteksi atenuasi 0.85 dB.', 'high', 'open', 'bld-d', 'Gedung D', '3 jam yang lalu');

CREATE TABLE `maintenance_tickets` (
  `id` VARCHAR(64) PRIMARY KEY,
  `ticket_no` VARCHAR(64) UNIQUE NOT NULL,
  `title` VARCHAR(128) NOT NULL,
  `description` TEXT NOT NULL,
  `priority` VARCHAR(32) NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'open',
  `building_id` VARCHAR(64),
  `device_id` VARCHAR(64),
  `assigned_to` VARCHAR(128),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `maintenance_tickets` (`id`, `ticket_no`, `title`, `description`, `priority`, `status`, `building_id`, `device_id`, `assigned_to`) VALUES
('tkt-1', 'TKT-2026-001', 'Splicing Ulang Core 5 FO-003', 'Penurunan sinyal optik pada core 5 FO-003 memerlukan re-splicing di ODF Kantor Utama.', 'high', 'open', 'bld-ku', 'dev-sw-ku-01', 'Budi Santoso'),
('tkt-2', 'TKT-2026-002', 'Pembersihan Filter Udara Rack-A-01', 'Jadwal pembersihan rutin modul fan filter di Rack Gudang A.', 'low', 'in-progress', 'bld-a', 'dev-sw-a-01', 'Agus P.');
