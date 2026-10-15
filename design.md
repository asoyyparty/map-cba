# Design System — CBA Network Map (PT. CBA Chemical Industry)

A locked design system for this app. Every page redesign reads this file before emitting code. Do not regenerate per page — extend or amend this file when the system needs to grow.

## Genre
modern-minimal (Enterprise Industrial Infrastructure & NOC Operations)

## Macrostructure Family
- App pages: Top Breadcrumb + Header bar, Left Collapsible Sidebar, Main Viewport with contextual KPI Cards + Dense Tabular / Grid views + Slide-over Drawers.
- Topology & Layout: Full-viewport interactive vector canvases (React Flow & SVG Map) with floating glassmorphism HUD controls.

## Themes (Light & Dark Mode)

### Light Mode (`html:not(.dark)`)
- `--color-paper`:      #f8fafc (slate-50 - main app background)
- `--color-paper-card`: #ffffff (pure white - card & surface background)
- `--color-paper-hover`: #f1f5f9 (slate-100 - active/hover background)
- `--color-ink`:        #0f172a (slate-900 - primary text & headings)
- `--color-ink-muted`:  #64748b (slate-500 - secondary / muted text)
- `--color-rule`:       #e2e8f0 (slate-200 - borders & hairlines)
- `--color-accent`:     #2563eb (blue-600 - primary action & active links)
- `--color-accent-soft`: #eff6ff (blue-50 - active pill tint)
- `--color-sidebar`:    #ffffff (clean white sidebar with slate-200 border)
- `--color-header`:     #ffffff (clean white header with slate-200 border)

### Dark Mode (`html.dark`)
- `--color-paper`:      #080d1a (deep navy-slate - main app background)
- `--color-paper-card`: #0e172a (dark navy card - surface background)
- `--color-paper-hover`: #1e293b (slate-800 - active/hover background)
- `--color-ink`:        #f8fafc (slate-50 - primary text & headings)
- `--color-ink-muted`:  #94a3b8 (slate-400 - secondary / muted text)
- `--color-rule`:       #1e293b (slate-800 - borders & hairlines)
- `--color-accent`:     #3b82f6 (blue-500 - primary action & active links)
- `--color-accent-soft`: #1e3a8a33 (blue-950/50 - active pill tint)
- `--color-sidebar`:    #0b132b (deep industrial navy sidebar with slate-800 border)
- `--color-header`:     #0b132b (deep industrial navy header with slate-800 border)

## Typography
- Display: Inter, system-ui, -apple-system, sans-serif; weight: 600/700; style: normal (no italic headers)
- Body: Inter, system-ui, -apple-system, sans-serif; weight: 400/500
- Mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace (for IP, MAC, VLAN, Core Numbers, Serials)

## Spacing & Density
4-point named scale via Tailwind (`p-4`, `p-6`, `gap-3`, `gap-4`). Dense, high-information-density layout optimized for industrial plant network monitoring.

## Motion
- Transitions: duration 200ms ease-out (`transition-all duration-200 ease-out`).
- Reduced motion: fallback to instant visibility switches.

## Sidebar & Header Guidelines
- The Sidebar and Header MUST adapt synchronously to the active Theme (`light` vs `dark`).
- In Light mode:
  - Header: `bg-white/95 backdrop-blur-md border-b border-slate-200/80 text-slate-800`. Search bar is `bg-slate-100 border-slate-200 text-slate-900`.
  - Sidebar: `bg-white border-r border-slate-200/80 text-slate-700`. Active menu pill is `bg-blue-50 text-blue-700 border border-blue-200/80 font-semibold`.
- In Dark mode:
  - Header: `bg-[#0B132B] border-b border-slate-800 text-slate-100`. Search bar is `bg-[#111A33] border-slate-700 text-slate-200`.
  - Sidebar: `bg-[#0B132B] border-r border-slate-800 text-slate-300`. Active menu pill is `bg-blue-600/20 text-blue-400 border border-blue-500/40 font-semibold`.

## Page-level Light/Dark Support
Every page (Dashboard, Devices, Topology, Cables, Buildings, Monitoring, Maintenance, Alerts, Reports, Settings, Racks) MUST utilize Tailwind dark mode (`dark:` prefixes or semantic CSS classes) so that:
- Backgrounds switch smoothly (`bg-slate-50 dark:bg-[#080D1A]` or `bg-white dark:bg-slate-900`).
- Cards switch smoothly (`bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80`).
- Text switches smoothly (`text-slate-900 dark:text-slate-100` and `text-slate-500 dark:text-slate-400`).
- Form controls switch smoothly (`bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100`).
- Modals, drawers, and popups switch smoothly.
