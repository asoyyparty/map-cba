import React from 'react';

interface FuturisticFactoryCanvasProps {
  isDark?: boolean;
}

export const FuturisticFactoryCanvas: React.FC<FuturisticFactoryCanvasProps> = ({ isDark = true }) => {
  // Theme color tokens
  const c = {
    // Ground & Canvas
    canvasBg: isDark ? '#060B18' : '#F1F5F9',
    gridMinor: isDark ? 'rgba(0, 242, 254, 0.04)' : 'rgba(2, 132, 199, 0.05)',
    gridMajor: isDark ? 'rgba(0, 242, 254, 0.08)' : 'rgba(2, 132, 199, 0.10)',
    gridCrosshair: isDark ? 'rgba(0, 242, 254, 0.25)' : 'rgba(2, 132, 199, 0.25)',
    perimeterStroke: isDark ? 'rgba(0, 242, 254, 0.35)' : 'rgba(2, 132, 199, 0.45)',
    perimeterFill: isDark ? '#080E20' : '#EAEFF5',
    
    // Zoning
    zoneAdminBg: isDark ? 'rgba(6, 78, 59, 0.14)' : 'rgba(16, 185, 129, 0.08)',
    zoneAdminBorder: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.35)',
    zoneLogisticsBg: isDark ? 'rgba(30, 58, 138, 0.15)' : 'rgba(59, 130, 246, 0.08)',
    zoneLogisticsBorder: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.35)',
    zoneChemBg: isDark ? 'rgba(88, 28, 135, 0.15)' : 'rgba(147, 51, 234, 0.07)',
    zoneChemBorder: isDark ? 'rgba(168, 85, 247, 0.3)' : 'rgba(168, 85, 247, 0.35)',
    zoneWorkshopBg: isDark ? 'rgba(120, 53, 15, 0.16)' : 'rgba(245, 158, 11, 0.08)',
    zoneWorkshopBorder: isDark ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.35)',
    zoneUtilityBg: isDark ? 'rgba(19, 78, 74, 0.14)' : 'rgba(20, 184, 166, 0.08)',
    zoneUtilityBorder: isDark ? 'rgba(20, 184, 166, 0.3)' : 'rgba(20, 184, 166, 0.35)',

    // Roads & Pathways
    roadFill: isDark ? '#0A1329' : '#CBD5E1',
    roadEdge: isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(100, 116, 139, 0.4)',
    roadCenterline: isDark ? 'rgba(0, 242, 254, 0.45)' : 'rgba(255, 255, 255, 0.9)',
    crosswalk: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.85)',
    
    // Buildings
    bldShadow: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(15, 23, 42, 0.18)',
    bldBase: isDark ? '#0D1B36' : '#FFFFFF',
    bldRoofInner: isDark ? '#112244' : '#F8FAFC',
    bldStroke: isDark ? 'rgba(56, 189, 248, 0.45)' : 'rgba(2, 132, 199, 0.4)',
    bldAccent: isDark ? '#00f2fe' : '#0284c7',
    bldStencil: isDark ? 'rgba(148, 163, 184, 0.55)' : 'rgba(100, 116, 139, 0.65)',
    bldHvac: isDark ? '#1E3A5F' : '#E2E8F0',
    bldHvacStroke: isDark ? '#38BDF8' : '#94A3B8',
    solarPanel: isDark ? '#0C2A4A' : '#BAE6FD',
    solarGrid: isDark ? 'rgba(56, 189, 248, 0.4)' : 'rgba(2, 132, 199, 0.4)',

    // Tanks & Pipes
    tankLight: isDark ? '#334155' : '#E2E8F0',
    tankDark: isDark ? '#0F172A' : '#94A3B8',
    tankStroke: isDark ? '#38BDF8' : '#64748B',
    pipeColor: isDark ? '#38BDF8' : '#0284C7',

    // HUD Text & Telemetry
    hudText: isDark ? 'rgba(0, 242, 254, 0.7)' : 'rgba(2, 132, 199, 0.8)',
    hudMuted: isDark ? 'rgba(148, 163, 184, 0.4)' : 'rgba(100, 116, 139, 0.5)',
    hazardYellow: '#EAB308',
    hazardBlack: '#0F172A'
  };

  return (
    <g id="futuristic-factory-canvas" className="select-none pointer-events-none">
      {/* 1. EMBEDDED PATTERNS & GRADIENTS */}
      <defs>
        {/* Subtle Engineering Subgrid */}
        <pattern id="cba-eng-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="20" y2="0" stroke={c.gridMinor} strokeWidth="0.5" />
          <line x1="0" y1="0" x2="0" y2="20" stroke={c.gridMinor} strokeWidth="0.5" />
        </pattern>

        {/* Major 60px Tech Grid */}
        <pattern id="cba-major-grid" width="60" height="60" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="60" y2="0" stroke={c.gridMajor} strokeWidth="0.8" />
          <line x1="0" y1="0" x2="0" y2="60" stroke={c.gridMajor} strokeWidth="0.8" />
          {/* Intersection CAD Crosshair */}
          <path d="M -3 0 L 3 0 M 0 -3 L 0 3" stroke={c.gridCrosshair} strokeWidth="0.8" />
        </pattern>

        {/* Hazard Chevron Stripes for Loading Bays */}
        <pattern id="cba-hazard-stripes" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="10" stroke={c.hazardYellow} strokeWidth="4" />
          <line x1="5" y1="0" x2="5" y2="10" stroke={c.hazardBlack} strokeWidth="6" />
        </pattern>

        {/* Photovoltaic Solar Panel Texture */}
        <pattern id="cba-solar-texture" width="8" height="6" patternUnits="userSpaceOnUse">
          <rect x="0.5" y="0.5" width="7" height="5" fill={c.solarPanel} stroke={c.solarGrid} strokeWidth="0.4" rx="0.5" />
        </pattern>

        {/* 3D Metallic Radial Gradient for Cylindrical Tanks */}
        <radialGradient id="cba-tank-cyl" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor={isDark ? '#475569' : '#FFFFFF'} />
          <stop offset="50%" stopColor={isDark ? '#1E293B' : '#CBD5E1'} />
          <stop offset="100%" stopColor={isDark ? '#090D16' : '#64748B'} />
        </radialGradient>

        {/* Building Elevation Drop Shadow Filter */}
        <filter id="cba-bld-shadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="2" dy="3.5" stdDeviation="3" floodColor={c.bldShadow} />
        </filter>
      </defs>

      {/* 2. BASE GROUND & DIGITAL TWIN GRID */}
      <rect x="0" y="0" width="445" height="561" fill={c.canvasBg} />
      <rect x="0" y="0" width="445" height="561" fill="url(#cba-eng-grid)" />
      <rect x="0" y="0" width="445" height="561" fill="url(#cba-major-grid)" />

      {/* 3. PLANT MASTER PERIMETER FENCE & SECURITY BOUNDARY */}
      {/* Outer Industrial Boundary matching CBA Cikande layout */}
      <polygon
        points="14,190 14,310 160,310 160,545 428,545 428,65 170,65 170,190"
        fill={c.perimeterFill}
        stroke={c.perimeterStroke}
        strokeWidth="1.6"
        strokeDasharray="8 3 2 3"
      />

      {/* Tactical Corner Brackets & Telemetry */}
      <g stroke={c.bldAccent} strokeWidth="1.2" fill="none" opacity={isDark ? 0.8 : 0.6}>
        <path d="M 18 196 L 24 196 M 18 196 L 18 202" />
        <path d="M 424 69 L 418 69 M 424 69 L 424 75" />
        <path d="M 424 541 L 418 541 M 424 541 L 424 535" />
        <path d="M 164 541 L 170 541 M 164 541 L 164 535" />
      </g>

      {/* Telemetry Sector Labels */}
      <text x="20" y="202" fill={c.hudText} fontSize="5" fontFamily="monospace" fontWeight="bold">
        SEC-J // UTIL-W
      </text>
      <text x="175" y="78" fill={c.hudText} fontSize="5" fontFamily="monospace" fontWeight="bold">
        CBA INDUSTRIAL CHEMICAL // PLANT-08
      </text>
      <text x="422" y="78" fill={c.hudMuted} fontSize="4.5" fontFamily="monospace" textAnchor="end">
        NORTH ENTRANCE CORRIDOR
      </text>
      <text x="422" y="540" fill={c.hudMuted} fontSize="4.5" fontFamily="monospace" textAnchor="end">
        COORD: 06°01'44"S 106°21'18"E
      </text>

      {/* 4. FUNCTIONAL ZONING FOOTPRINTS */}
      {/* Zone 1: Administration & Management (SE) */}
      <rect
        x="315"
        y="405"
        width="105"
        height="132"
        rx="6"
        fill={c.zoneAdminBg}
        stroke={c.zoneAdminBorder}
        strokeWidth="1"
        strokeDasharray="4 2"
      />
      <text x="320" y="414" fill={c.bldAccent} fontSize="4.5" fontFamily="monospace" fontWeight="bold">
        ZONE 01: ADMINISTRATION & IT NOC
      </text>

      {/* Zone 2: Logistics & Central Warehouse (East/South) */}
      <rect
        x="270"
        y="435"
        width="46"
        height="102"
        rx="4"
        fill={c.zoneLogisticsBg}
        stroke={c.zoneLogisticsBorder}
        strokeWidth="1"
        strokeDasharray="4 2"
      />
      <rect
        x="180"
        y="78"
        width="82"
        height="124"
        rx="4"
        fill={c.zoneLogisticsBg}
        stroke={c.zoneLogisticsBorder}
        strokeWidth="1"
        strokeDasharray="4 2"
      />
      <text x="184" y="86" fill={c.bldAccent} fontSize="4.5" fontFamily="monospace" fontWeight="bold">
        ZONE 02: FINISHED GOODS LOGISTICS
      </text>

      {/* Zone 3: Chemical Synthesis & Processing Complex (Central/North) */}
      <rect
        x="165"
        y="202"
        width="232"
        height="190"
        rx="6"
        fill={c.zoneChemBg}
        stroke={c.zoneChemBorder}
        strokeWidth="1"
        strokeDasharray="4 2"
      />
      <text x="170" y="212" fill={c.bldAccent} fontSize="4.5" fontFamily="monospace" fontWeight="bold">
        ZONE 03: CHEMICAL SYNTHESIS & PACKAGING
      </text>

      {/* Zone 4: Workshop & Maintenance (Southwest) */}
      <rect
        x="225"
        y="428"
        width="46"
        height="50"
        rx="4"
        fill={c.zoneWorkshopBg}
        stroke={c.zoneWorkshopBorder}
        strokeWidth="1"
        strokeDasharray="4 2"
      />
      <text x="227" y="434" fill={c.bldAccent} fontSize="4" fontFamily="monospace" fontWeight="bold">
        ZONE 04: MTC
      </text>

      {/* Zone 5: Raw Materials & Utilities (West & Northeast) */}
      <rect
        x="20"
        y="194"
        width="86"
        height="110"
        rx="4"
        fill={c.zoneUtilityBg}
        stroke={c.zoneUtilityBorder}
        strokeWidth="1"
        strokeDasharray="4 2"
      />
      <rect
        x="254"
        y="96"
        width="72"
        height="126"
        rx="4"
        fill={c.zoneUtilityBg}
        stroke={c.zoneUtilityBorder}
        strokeWidth="1"
        strokeDasharray="4 2"
      />
      <text x="24" y="202" fill={c.bldAccent} fontSize="4.5" fontFamily="monospace" fontWeight="bold">
        ZONE 05: WATER & UTILITIES
      </text>

      {/* 5. ROADWAYS & TRANSPORT INFRASTRUCTURE */}
      <g id="plant-roadways">
        {/* Main Eastern Supply Roadway (North-South artery) */}
        <path
          d="M 398 65 L 415 65 L 415 545 L 398 545 Z"
          fill={c.roadFill}
          stroke={c.roadEdge}
          strokeWidth="0.8"
        />
        {/* Main Central Cross-Plant Highway */}
        <path
          d="M 160 216 L 398 216 L 398 226 L 160 226 Z"
          fill={c.roadFill}
          stroke={c.roadEdge}
          strokeWidth="0.8"
        />
        {/* Roadway separating KU and Gedung C / Factory */}
        <path
          d="M 306 385 L 415 385 L 415 400 L 306 400 Z"
          fill={c.roadFill}
          stroke={c.roadEdge}
          strokeWidth="0.8"
        />
        {/* Roadway connecting Gedung D, C, and KU */}
        <path
          d="M 308 226 L 318 226 L 318 545 L 308 545 Z"
          fill={c.roadFill}
          stroke={c.roadEdge}
          strokeWidth="0.8"
        />
        {/* Roadway connecting Gedung B, Gedung F, and West Yard */}
        <path
          d="M 96 238 L 200 238 L 200 248 L 96 248 Z"
          fill={c.roadFill}
          stroke={c.roadEdge}
          strokeWidth="0.8"
        />
        {/* Roadway between MTC and Gedung A */}
        <path
          d="M 268 436 L 276 436 L 276 545 L 268 545 Z"
          fill={c.roadFill}
          stroke={c.roadEdge}
          strokeWidth="0.8"
        />
        {/* Roadway between Gedung F and E */}
        <path
          d="M 230 226 L 240 226 L 240 330 L 230 330 Z"
          fill={c.roadFill}
          stroke={c.roadEdge}
          strokeWidth="0.8"
        />

        {/* Road Centerline Dashes */}
        <g stroke={c.roadCenterline} strokeWidth="0.8" strokeDasharray="5 4" fill="none">
          <line x1="406" y1="70" x2="406" y2="540" />
          <line x1="165" y1="221" x2="395" y2="221" />
          <line x1="313" y1="230" x2="313" y2="538" />
          <line x1="100" y1="243" x2="195" y2="243" />
          <line x1="310" y1="392" x2="405" y2="392" />
        </g>

        {/* Pedestrian Crosswalks (Zebra Crossings) */}
        <g stroke={c.crosswalk} strokeWidth="1.2" strokeDasharray="1.5 2">
          {/* KU entrance crosswalk */}
          <line x1="398" y1="425" x2="415" y2="425" />
          <line x1="398" y1="428" x2="415" y2="428" />
          {/* Main factory crosswalk */}
          <line x1="308" y1="260" x2="318" y2="260" />
          <line x1="308" y1="263" x2="318" y2="263" />
          {/* Gedung B crosswalk */}
          <line x1="220" y1="216" x2="220" y2="226" />
          <line x1="224" y1="216" x2="224" y2="226" />
        </g>

        {/* Loading Bay Hazard Stripes (Gedung A & Gedung B) */}
        <rect x="272" y="445" width="4" height="28" fill="url(#cba-hazard-stripes)" rx="0.5" />
        <rect x="184" y="140" width="4" height="24" fill="url(#cba-hazard-stripes)" rx="0.5" />
        {/* Loading Dock Staging Markings */}
        <g stroke={c.bldAccent} strokeWidth="0.5" fill="none" opacity="0.6">
          <rect x="264" y="480" width="7" height="12" strokeDasharray="1 1" />
          <rect x="264" y="496" width="7" height="12" strokeDasharray="1 1" />
          <rect x="264" y="512" width="7" height="12" strokeDasharray="1 1" />
        </g>

        {/* Gate 01 Security Guardhouse (South Main Entry) */}
        <g transform="translate(365, 528)">
          <rect x="0" y="0" width="16" height="10" rx="2" fill={c.bldBase} stroke={c.bldAccent} strokeWidth="0.8" filter="url(#cba-bld-shadow)" />
          <text x="8" y="7" fill={c.bldAccent} fontSize="3.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
            GATE-01
          </text>
        </g>
      </g>

      {/* 6. CYLINDRICAL CHEMICAL SILOS & UTILITY TANKS */}
      <g id="chemical-silos">
        {/* Tank Battery Alpha (East of Gedung D) */}
        <g transform="translate(398, 240)">
          <circle cx="8" cy="8" r="6.5" fill="url(#cba-tank-cyl)" stroke={c.tankStroke} strokeWidth="0.6" filter="url(#cba-bld-shadow)" />
          <circle cx="8" cy="24" r="6.5" fill="url(#cba-tank-cyl)" stroke={c.tankStroke} strokeWidth="0.6" filter="url(#cba-bld-shadow)" />
          <circle cx="8" cy="40" r="6.5" fill="url(#cba-tank-cyl)" stroke={c.tankStroke} strokeWidth="0.6" filter="url(#cba-bld-shadow)" />
          {/* Tank bund wall */}
          <rect x="-1" y="0" width="18" height="50" rx="3" fill="none" stroke={c.bldAccent} strokeWidth="0.6" strokeDasharray="3 2" opacity="0.5" />
          <text x="8" y="55" fill={c.hudMuted} fontSize="3" fontFamily="monospace" textAnchor="middle">SILO TANK A1-A3</text>
        </g>

        {/* Tank Battery Bravo (Raw Material Storage at Gedung H) */}
        <g transform="translate(262, 88)">
          <circle cx="7" cy="7" r="5.5" fill="url(#cba-tank-cyl)" stroke={c.tankStroke} strokeWidth="0.6" filter="url(#cba-bld-shadow)" />
          <circle cx="21" cy="7" r="5.5" fill="url(#cba-tank-cyl)" stroke={c.tankStroke} strokeWidth="0.6" filter="url(#cba-bld-shadow)" />
          <circle cx="35" cy="7" r="5.5" fill="url(#cba-tank-cyl)" stroke={c.tankStroke} strokeWidth="0.6" filter="url(#cba-bld-shadow)" />
          <rect x="0" y="0" width="42" height="14" rx="2" fill="none" stroke={c.bldAccent} strokeWidth="0.6" strokeDasharray="3 2" opacity="0.5" />
        </g>

        {/* Industrial Pipe Racks (Connecting C, D, E) */}
        <g stroke={c.pipeColor} strokeWidth="1" opacity={isDark ? 0.7 : 0.6} fill="none">
          {/* Pipe bridge between D and C */}
          <line x1="358" y1="316" x2="358" y2="324" />
          <line x1="362" y1="316" x2="362" y2="324" />
          {/* Pipe bridge between D and E */}
          <line x1="288" y1="280" x2="296" y2="280" />
          <line x1="288" y1="284" x2="296" y2="284" />
        </g>
      </g>

      {/* 7. ARCHITECTURAL 2.5D BUILDINGS WITH REALISTIC ROOFTOP GEOMETRY */}
      <g id="architectural-buildings">

        {/* ========================================================
            BUILDING KU: KANTOR UTAMA (Polygon: 322,414 -> 386,462)
            Main Executive Office, Server Room & Management NOC
            ======================================================== */}
        <g id="bld-ku-body" filter="url(#cba-bld-shadow)">
          {/* Outer Parapet Wall */}
          <polygon
            points="322,414 386,414 386,462 322,462"
            fill={c.bldBase}
            stroke={c.bldStroke}
            strokeWidth="1.2"
          />
          {/* Inner Recessed Roof Deck */}
          <polygon
            points="324,416 384,416 384,460 324,460"
            fill={c.bldRoofInner}
            stroke={c.bldStroke}
            strokeWidth="0.6"
          />
          {/* Executive Glass Atrium Skylight */}
          <rect x="340" y="420" width="28" height="12" rx="1.5" fill={isDark ? '#0C3558' : '#BAE6FD'} stroke={c.bldAccent} strokeWidth="0.8" />
          <line x1="347" y1="420" x2="347" y2="432" stroke={c.bldAccent} strokeWidth="0.5" />
          <line x1="354" y1="420" x2="354" y2="432" stroke={c.bldAccent} strokeWidth="0.5" />
          <line x1="361" y1="420" x2="361" y2="432" stroke={c.bldAccent} strokeWidth="0.5" />

          {/* Precision Server Room HVAC Cooling Chillers */}
          <rect x="328" y="445" width="10" height="7" rx="1" fill={c.bldHvac} stroke={c.bldHvacStroke} strokeWidth="0.5" />
          <circle cx="331.5" cy="448.5" r="1.8" fill="none" stroke={c.bldHvacStroke} strokeWidth="0.4" />
          <circle cx="334.5" cy="448.5" r="1.8" fill="none" stroke={c.bldHvacStroke} strokeWidth="0.4" />

          {/* Stencil ID */}
          <text x="378" y="454" fill={c.bldStencil} fontSize="4" fontFamily="monospace" fontWeight="bold" textAnchor="end">
            KU // ADMIN-NOC
          </text>
        </g>

        {/* ========================================================
            BUILDING MTC: KANTOR MTC (Polygon: 232,436 -> 268,472)
            Maintenance Workshop, Calibration & Tooling
            ======================================================== */}
        <g id="bld-mtc-body" filter="url(#cba-bld-shadow)">
          <polygon
            points="232,436 268,436 268,472 232,472"
            fill={c.bldBase}
            stroke={c.bldStroke}
            strokeWidth="1.2"
          />
          <polygon
            points="234,438 266,438 266,470 234,470"
            fill={c.bldRoofInner}
            stroke={c.bldStroke}
            strokeWidth="0.6"
          />
          {/* Workshop Skylight Louvers */}
          <line x1="238" y1="442" x2="262" y2="442" stroke={c.bldHvacStroke} strokeWidth="0.8" />
          <line x1="238" y1="446" x2="262" y2="446" stroke={c.bldHvacStroke} strokeWidth="0.8" />
          <line x1="238" y1="450" x2="262" y2="450" stroke={c.bldHvacStroke} strokeWidth="0.8" />

          {/* Heavy Exhaust Fan */}
          <circle cx="242" cy="462" r="3" fill={c.bldHvac} stroke={c.bldHvacStroke} strokeWidth="0.5" />
          <path d="M 240 462 L 244 462 M 242 460 L 242 464" stroke={c.bldHvacStroke} strokeWidth="0.4" />

          {/* Stencil */}
          <text x="264" y="466" fill={c.bldStencil} fontSize="3.5" fontFamily="monospace" fontWeight="bold" textAnchor="end">
            MTC
          </text>
        </g>

        {/* ========================================================
            BUILDING A: GEDUNG A (Polygon: 276,444 -> 312,532)
            Large Logistics Warehouse / CF Storage
            ======================================================== */}
        <g id="bld-a-body" filter="url(#cba-bld-shadow)">
          <polygon
            points="276,444 312,444 312,532 276,532"
            fill={c.bldBase}
            stroke={c.bldStroke}
            strokeWidth="1.2"
          />
          <polygon
            points="278,446 310,446 310,530 278,530"
            fill={c.bldRoofInner}
            stroke={c.bldStroke}
            strokeWidth="0.6"
          />
          {/* Massive Rooftop Photovoltaic Solar Array */}
          <rect x="281" y="450" width="24" height="40" fill="url(#cba-solar-texture)" rx="1" />

          {/* Ridge Vent & Stencil */}
          <line x1="294" y1="446" x2="294" y2="530" stroke={c.bldStroke} strokeWidth="0.6" strokeDasharray="3 3" />
          <text x="294" y="524" fill={c.bldStencil} fontSize="4" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
            GD-A // LOGISTICS
          </text>
        </g>

        {/* ========================================================
            BUILDING B: GEDUNG B (Polygon: 188,88 -> 255,196)
            Warehouse B & Finished Goods Logistics
            ======================================================== */}
        <g id="bld-b-body" filter="url(#cba-bld-shadow)">
          <polygon
            points="188,88 255,88 255,196 188,196"
            fill={c.bldBase}
            stroke={c.bldStroke}
            strokeWidth="1.2"
          />
          <polygon
            points="190,90 253,90 253,194 190,194"
            fill={c.bldRoofInner}
            stroke={c.bldStroke}
            strokeWidth="0.6"
          />
          {/* Dual Solar Panel Arrays */}
          <rect x="194" y="94" width="24" height="42" fill="url(#cba-solar-texture)" rx="1" />
          <rect x="223" y="94" width="24" height="42" fill="url(#cba-solar-texture)" rx="1" />

          {/* Central Ridge & Air Turbines */}
          <line x1="221" y1="90" x2="221" y2="194" stroke={c.bldStroke} strokeWidth="0.6" strokeDasharray="4 2" />
          <circle cx="206" cy="154" r="2.5" fill={c.bldHvac} stroke={c.bldHvacStroke} strokeWidth="0.4" />
          <circle cx="236" cy="154" r="2.5" fill={c.bldHvac} stroke={c.bldHvacStroke} strokeWidth="0.4" />

          <text x="221" y="186" fill={c.bldStencil} fontSize="4.2" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
            GD-B // FINISHED GOODS
          </text>
        </g>

        {/* ========================================================
            BUILDING H: GEDUNG H (Polygon: 258,106 -> 320,218)
            Raw Chemical Materials & Formulations
            ======================================================== */}
        <g id="bld-h-body" filter="url(#cba-bld-shadow)">
          <polygon
            points="258,106 320,106 320,218 258,218"
            fill={c.bldBase}
            stroke={c.bldStroke}
            strokeWidth="1.2"
          />
          <polygon
            points="260,108 318,108 318,216 260,216"
            fill={c.bldRoofInner}
            stroke={c.bldStroke}
            strokeWidth="0.6"
          />
          {/* Skylight Corridors */}
          <rect x="265" y="114" width="48" height="6" rx="1" fill={isDark ? '#0C3558' : '#BAE6FD'} stroke={c.bldAccent} strokeWidth="0.5" />
          <rect x="265" y="130" width="48" height="6" rx="1" fill={isDark ? '#0C3558' : '#BAE6FD'} stroke={c.bldAccent} strokeWidth="0.5" />

          {/* Roof Ridge */}
          <line x1="289" y1="108" x2="289" y2="216" stroke={c.bldStroke} strokeWidth="0.6" strokeDasharray="3 3" />
          <text x="289" y="196" fill={c.bldStencil} fontSize="4" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
            GD-H // RAW MATERIALS
          </text>
        </g>

        {/* ========================================================
            BUILDING J: GEDUNG J (Polygon: 26,200 -> 96,296)
            Utilities, Water Treatment & Environmental Systems
            ======================================================== */}
        <g id="bld-j-body" filter="url(#cba-bld-shadow)">
          <polygon
            points="26,200 96,200 96,296 26,296"
            fill={c.bldBase}
            stroke={c.bldStroke}
            strokeWidth="1.2"
          />
          <polygon
            points="28,202 94,202 94,294 28,294"
            fill={c.bldRoofInner}
            stroke={c.bldStroke}
            strokeWidth="0.6"
          />
          {/* Water Clarifier Basin (Round feature) */}
          <circle cx="50" cy="230" r="14" fill={isDark ? '#042F2E' : '#CCFBF1'} stroke={c.bldAccent} strokeWidth="0.8" />
          <circle cx="50" cy="230" r="4" fill={c.bldBase} stroke={c.bldAccent} strokeWidth="0.6" />
          <line x1="50" y1="216" x2="50" y2="244" stroke={c.bldAccent} strokeWidth="0.5" />
          <line x1="36" y1="230" x2="64" y2="230" stroke={c.bldAccent} strokeWidth="0.5" />

          {/* Electrical Transformer Pad */}
          <rect x="68" y="218" width="18" height="24" rx="1.5" fill={c.bldHvac} stroke={c.bldHvacStroke} strokeWidth="0.5" />
          <text x="77" y="232" fill={c.bldHvacStroke} fontSize="3.5" fontFamily="monospace" textAnchor="middle">XFRMR</text>

          <text x="61" y="284" fill={c.bldStencil} fontSize="4.2" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
            GD-J // UTILITIES & WTP
          </text>
        </g>

        {/* ========================================================
            BUILDING F: GEDUNG F (Polygon: 172,206 -> 234,308)
            Granulation & Special Formula Production
            ======================================================== */}
        <g id="bld-f-body" filter="url(#cba-bld-shadow)">
          <polygon
            points="172,206 234,206 234,308 172,308"
            fill={c.bldBase}
            stroke={c.bldStroke}
            strokeWidth="1.2"
          />
          <polygon
            points="174,208 232,208 232,306 174,306"
            fill={c.bldRoofInner}
            stroke={c.bldStroke}
            strokeWidth="0.6"
          />
          {/* Skylight louvers */}
          <rect x="180" y="214" width="46" height="6" rx="1" fill={isDark ? '#0C3558' : '#BAE6FD'} stroke={c.bldAccent} strokeWidth="0.5" />
          <rect x="180" y="276" width="46" height="6" rx="1" fill={isDark ? '#0C3558' : '#BAE6FD'} stroke={c.bldAccent} strokeWidth="0.5" />

          {/* Roof Ridge & Stencil */}
          <line x1="203" y1="208" x2="203" y2="306" stroke={c.bldStroke} strokeWidth="0.6" strokeDasharray="3 3" />
          <text x="203" y="296" fill={c.bldStencil} fontSize="4" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
            GD-F // GRANULATION
          </text>
        </g>

        {/* ========================================================
            BUILDING E: GEDUNG E (Polygon: 236,216 -> 288,326)
            Packaging & Bottling Production Hall
            ======================================================== */}
        <g id="bld-e-body" filter="url(#cba-bld-shadow)">
          <polygon
            points="236,216 288,216 288,326 236,326"
            fill={c.bldBase}
            stroke={c.bldStroke}
            strokeWidth="1.2"
          />
          <polygon
            points="238,218 286,218 286,324 238,324"
            fill={c.bldRoofInner}
            stroke={c.bldStroke}
            strokeWidth="0.6"
          />
          {/* Ventilation stacks */}
          <circle cx="250" cy="232" r="2.8" fill={c.bldHvac} stroke={c.bldHvacStroke} strokeWidth="0.5" />
          <circle cx="274" cy="232" r="2.8" fill={c.bldHvac} stroke={c.bldHvacStroke} strokeWidth="0.5" />

          {/* Central Ridge & Stencil */}
          <line x1="262" y1="218" x2="262" y2="324" stroke={c.bldStroke} strokeWidth="0.6" strokeDasharray="3 3" />
          <text x="262" y="316" fill={c.bldStencil} fontSize="4" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
            GD-E // PACKAGING
          </text>
        </g>

        {/* ========================================================
            BUILDING D: GEDUNG D (Polygon: 296,218 -> 390,316)
            Primary Chemical Synthesis & Reactor Hall (Massive)
            ======================================================== */}
        <g id="bld-d-body" filter="url(#cba-bld-shadow)">
          <polygon
            points="296,218 390,218 390,316 296,316"
            fill={c.bldBase}
            stroke={c.bldStroke}
            strokeWidth="1.2"
          />
          <polygon
            points="298,220 388,220 388,314 298,314"
            fill={c.bldRoofInner}
            stroke={c.bldStroke}
            strokeWidth="0.6"
          />
          {/* Triple Industrial Atrium Skylights */}
          <rect x="306" y="226" width="74" height="6" rx="1" fill={isDark ? '#0C3558' : '#BAE6FD'} stroke={c.bldAccent} strokeWidth="0.6" />
          <rect x="306" y="244" width="74" height="6" rx="1" fill={isDark ? '#0C3558' : '#BAE6FD'} stroke={c.bldAccent} strokeWidth="0.6" />
          <rect x="306" y="286" width="74" height="6" rx="1" fill={isDark ? '#0C3558' : '#BAE6FD'} stroke={c.bldAccent} strokeWidth="0.6" />

          {/* High-Capacity Chemical Scrubbers & Chillers */}
          <rect x="306" y="296" width="16" height="8" rx="1" fill={c.bldHvac} stroke={c.bldHvacStroke} strokeWidth="0.5" />
          <circle cx="310" cy="300" r="2" fill="none" stroke={c.bldHvacStroke} strokeWidth="0.4" />
          <circle cx="316" cy="300" r="2" fill="none" stroke={c.bldHvacStroke} strokeWidth="0.4" />

          <text x="343" y="306" fill={c.bldStencil} fontSize="4.2" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
            GD-D // REACTOR & SYNTHESIS
          </text>
        </g>

        {/* ========================================================
            BUILDING C: GEDUNG C (Polygon: 320,314 -> 372,380)
            Formulation & Quality Control Laboratory
            ======================================================== */}
        <g id="bld-c-body" filter="url(#cba-bld-shadow)">
          <polygon
            points="320,314 372,314 372,380 320,380"
            fill={c.bldBase}
            stroke={c.bldStroke}
            strokeWidth="1.2"
          />
          <polygon
            points="322,316 370,316 370,378 322,378"
            fill={c.bldRoofInner}
            stroke={c.bldStroke}
            strokeWidth="0.6"
          />
          {/* Cleanroom Skylights */}
          <rect x="328" y="322" width="36" height="8" rx="1" fill={isDark ? '#0C3558' : '#BAE6FD'} stroke={c.bldAccent} strokeWidth="0.6" />

          {/* Cleanroom Exhaust HEPA Filtration */}
          <circle cx="334" cy="368" r="3" fill={c.bldHvac} stroke={c.bldHvacStroke} strokeWidth="0.5" />
          <circle cx="358" cy="368" r="3" fill={c.bldHvac} stroke={c.bldHvacStroke} strokeWidth="0.5" />

          <text x="346" y="360" fill={c.bldStencil} fontSize="4" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
            GD-C // QC LAB & FORMULATION
          </text>
        </g>

      </g>

      {/* 8. TECHNICAL CORNER HUD METADATA */}
      <g id="plant-hud-meta" fill={c.hudText} fontFamily="monospace" fontSize="4.5" opacity={isDark ? 0.75 : 0.65}>
        <text x="12" y="16">PT. CBA CHEMICAL INDUSTRY</text>
        <text x="12" y="24" fill={c.hudMuted} fontSize="3.8">DIGITAL TWIN INFRASTRUCTURE // SCADA NOC</text>
        <text x="432" y="16" textAnchor="end">SYS STATUS: OPTIMAL</text>
        <text x="432" y="24" textAnchor="end" fill={c.hudMuted} fontSize="3.8">GRID REF: 445x561 VECTOR</text>
      </g>
    </g>
  );
};
