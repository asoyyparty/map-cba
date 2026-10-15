-- ==============================================================================
-- CBA NETWORK MAP - Supabase / PostgreSQL Enterprise Database Schema
-- PT. CBA Chemical Industry - IT Infrastructure & Network Visualization System
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Sites Table
CREATE TABLE IF NOT EXISTS sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_code VARCHAR(50) UNIQUE NOT NULL,
    site_name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Buildings Table
CREATE TABLE IF NOT EXISTS buildings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    building_code VARCHAR(50) UNIQUE NOT NULL,
    building_name VARCHAR(255) NOT NULL,
    description TEXT,
    location_x NUMERIC DEFAULT 0,
    location_y NUMERIC DEFAULT 0,
    width NUMERIC DEFAULT 0,
    height NUMERIC DEFAULT 0,
    polygon_coordinates JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'operational', -- 'operational', 'warning', 'critical'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Rooms Table
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
    room_code VARCHAR(50) NOT NULL,
    room_name VARCHAR(255) NOT NULL,
    room_type VARCHAR(100), -- 'server_room', 'office', 'control_room', 'warehouse'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Racks Table
CREATE TABLE IF NOT EXISTS racks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    rack_code VARCHAR(50) UNIQUE NOT NULL,
    rack_name VARCHAR(255) NOT NULL,
    rack_size_u INTEGER DEFAULT 42,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Devices Table
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID REFERENCES buildings(id) ON DELETE SET NULL,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    rack_id UUID REFERENCES racks(id) ON DELETE SET NULL,
    device_code VARCHAR(100) UNIQUE NOT NULL,
    device_name VARCHAR(255) NOT NULL,
    device_type VARCHAR(100) NOT NULL, -- 'core-switch', 'dist-switch', 'access-switch', 'router', 'firewall', 'server', 'access-point', 'cctv', 'ups'
    vendor VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    ip_address VARCHAR(45) NOT NULL,
    mac_address VARCHAR(17),
    hostname VARCHAR(255),
    rack_u_position INTEGER,
    status VARCHAR(50) DEFAULT 'online', -- 'online', 'warning', 'offline'
    installed_at TIMESTAMPTZ,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Device Ports Table
CREATE TABLE IF NOT EXISTS device_ports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    port_name VARCHAR(50) NOT NULL, -- e.g. 'GigabitEthernet1/0/1', 'SFP+'
    port_type VARCHAR(50) DEFAULT 'RJ45', -- 'RJ45', 'SFP', 'SFP+', 'QSFP'
    speed VARCHAR(50) DEFAULT '1 Gbps', -- '100 Mbps', '1 Gbps', '10 Gbps', '40 Gbps'
    status VARCHAR(50) DEFAULT 'up', -- 'up', 'down', 'disabled'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Network Interfaces Table
CREATE TABLE IF NOT EXISTS network_interfaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    interface_name VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45),
    subnet_mask VARCHAR(45),
    gateway VARCHAR(45),
    vlan_id INTEGER DEFAULT 1,
    mac_address VARCHAR(17),
    status VARCHAR(50) DEFAULT 'up',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Cable Routes Table
CREATE TABLE IF NOT EXISTS cable_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    route_code VARCHAR(100) UNIQUE NOT NULL,
    route_name VARCHAR(255) NOT NULL,
    cable_type VARCHAR(100) NOT NULL, -- 'Fiber Optic', 'UTP', 'STP', 'Underground Fiber', 'Aerial Fiber'
    cable_category VARCHAR(100) DEFAULT 'Single Mode', -- 'Single Mode OS2', 'Multi Mode OM4', 'Cat6A'
    core_count INTEGER DEFAULT 12,
    used_cores INTEGER DEFAULT 6,
    length_meter NUMERIC DEFAULT 0,
    installation_type VARCHAR(100) DEFAULT 'Underground Conduit', -- 'Underground Conduit', 'Aerial Pole', 'Cable Tray'
    from_building_id UUID REFERENCES buildings(id) ON DELETE SET NULL,
    to_building_id UUID REFERENCES buildings(id) ON DELETE SET NULL,
    route_coordinates JSONB NOT NULL DEFAULT '[]'::jsonb,
    color VARCHAR(20) DEFAULT '#06b6d4',
    line_style VARCHAR(50) DEFAULT 'solid', -- 'solid', 'dashed', 'dotted'
    line_width INTEGER DEFAULT 3,
    attenuation_db NUMERIC DEFAULT 0.5,
    status VARCHAR(50) DEFAULT 'Active', -- 'Active', 'Inactive', 'Damaged', 'Under Maintenance', 'Planned'
    installed_at TIMESTAMPTZ,
    last_inspected_at TIMESTAMPTZ,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Cable Connections Table
CREATE TABLE IF NOT EXISTS cable_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cable_route_id UUID REFERENCES cable_routes(id) ON DELETE CASCADE,
    from_device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    from_port_id UUID REFERENCES device_ports(id) ON DELETE SET NULL,
    to_device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    to_port_id UUID REFERENCES device_ports(id) ON DELETE SET NULL,
    connection_type VARCHAR(100) DEFAULT 'Core 1-2 Tx/Rx',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Network Links Table
CREATE TABLE IF NOT EXISTS network_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    source_port_id UUID REFERENCES device_ports(id) ON DELETE SET NULL,
    target_device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    target_port_id UUID REFERENCES device_ports(id) ON DELETE SET NULL,
    link_type VARCHAR(100) DEFAULT 'Trunk', -- 'Access', 'Trunk', 'LACP'
    bandwidth VARCHAR(50) DEFAULT '10 Gbps',
    vlan_id INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'up',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Maintenance Tickets Table
CREATE TABLE IF NOT EXISTS maintenance_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(100) UNIQUE NOT NULL,
    device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    cable_route_id UUID REFERENCES cable_routes(id) ON DELETE SET NULL,
    building_id UUID REFERENCES buildings(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    issue_description TEXT NOT NULL,
    priority VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'pending', 'completed', 'cancelled'
    reported_by VARCHAR(100),
    assigned_to VARCHAR(100),
    scheduled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    resolution TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    cable_route_id UUID REFERENCES cable_routes(id) ON DELETE SET NULL,
    building_id UUID REFERENCES buildings(id) ON DELETE SET NULL,
    alert_type VARCHAR(100) NOT NULL, -- 'Device Offline', 'Cable Issue', 'High Latency', 'Packet Loss', 'Maintenance Due'
    severity VARCHAR(50) NOT NULL, -- 'critical', 'high', 'medium', 'low'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'resolved'
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 13. Attachments Table
CREATE TABLE IF NOT EXISTS attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    cable_route_id UUID REFERENCES cable_routes(id) ON DELETE CASCADE,
    building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
    maintenance_id UUID REFERENCES maintenance_tickets(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(100), -- 'image/png', 'application/pdf', 'application/json'
    description TEXT,
    uploaded_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_buildings_code ON buildings(building_code);
CREATE INDEX IF NOT EXISTS idx_devices_ip ON devices(ip_address);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_cables_code ON cable_routes(route_code);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON maintenance_tickets(status);

-- ==============================================================================
-- Demo Seed Data
-- ==============================================================================
INSERT INTO sites (id, site_code, site_name, description, address)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'SITE-CBA-01',
    'PT. CBA Chemical Industry - Factory Site',
    'Pabrik & Pusat Produksi Formulasi Bahan Kimia Pertanian',
    'Kawasan Industri CBA, Cikande, Banten'
) ON CONFLICT (site_code) DO NOTHING;
