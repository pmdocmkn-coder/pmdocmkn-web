# PRODUCT.md — PM Dashboard MKN

## What is this product?

An internal operational web dashboard for **MKN (Multi Kontrol Nusantara)**, built for the **PM & Documentation** division. It centralizes daily operational tools across 7 functional areas: PM management, radio & fleet, monitoring, warehouse, call records, administration, and system settings.

**Platform:** Progressive web app with dual rendering strategy
- **Tech stack:** React 18 + Vite + TypeScript + TailwindCSS + shadcn/ui (custom theme)
- **Backend:** .NET 8 ASP.NET Core API
- **Access:** Browser-based (desktop and mobile)

**Rendering strategy:**
- Desktop (>1024px): Sidebar navigation, table views, standard modals
- Mobile (<768px): Bottom nav/hamburger, card layouts, bottom sheets, FAB

## Who uses it?

MKN internal staff — primarily the PM & Documentation team and related operational roles across divisions.

**Access devices:**
- **Desktop** (primary): Browser (Chrome, Edge) on Windows laptops/desktops
  - Used in office for: data entry, reporting, configuration, bulk operations
  - Features: sidebar navigation, table views, multi-column layouts
  
- **Mobile** (field work): Browser (iOS Safari, Android Chrome) on smartphones
  - Used on-site for: quick record lookups, radio tracking, warehouse submissions, photo uploads
  - Features: bottom navigation, card layouts, touch-optimized forms, FAB for quick actions

Users are **not technical** — they need efficient task completion without friction across devices. The primary language is **Bahasa Indonesia**.

Role-based access is enforced — each user sees only the modules their permission level allows. Super Admin sees all.

## What is the product trying to do?

- Give staff fast access to the right module for their role and permission level — **on any device**
- Reduce friction in daily operational reporting and record-keeping — **whether in office or on-site**
- Centralize tools that were previously scattered across different systems
- Provide visibility into operational status (fleet, radio, CCTV, KPI) from a single place
- Support field workers with mobile-optimized interfaces for common tasks (radio handover, warehouse submissions, record lookups)
- Maintain feature parity across devices — same data, adaptive presentation

**Use case examples:**
- **Desktop**: Admin configures PM schedules, exports bulk reports, manages user roles
- **Mobile**: Technician submits radio handover form on-site, checks warehouse inventory, uploads inspection photos

## Register

**Product surface** — this is a task-completion tool, not a marketing or brand page. Users are configuring, monitoring, searching records, and submitting data. 

- **Desktop:** Density and clarity matter — multi-column layouts, tables with sortable columns, bulk actions, keyboard navigation
- **Mobile:** Immediacy and thumb-reachability matter — single-column cards, FAB for primary action, bottom sheet forms, minimal taps to complete task

Same data, different presentation. A technician should be able to submit a radio repair record from their phone in the field, and a supervisor should be able to review and approve it in table view from their desk.

**Interaction model:**
- Desktop: mouse/keyboard, precision input, multi-tasking (multiple tabs/windows)
- Mobile: touch/swipe, quick actions, single-task focus (FAB, bottom sheets)

Both experiences follow the same brand identity and design principles, adapted for their input method.

## Brand feel

Professional, trustworthy, efficient. Reflects the Synergy MKN Onwards identity — serious and structured, but not cold. The visual anchor is the brand color system: navy blue as foundation, coral-orange as action accent. The product should feel like a well-run operation: clean, organized, purposeful.

## Voice and tone

- Bahasa Indonesia, semi-formal
- Direct and action-oriented ("Mulai Sekarang", "Simpan", "Lihat Detail", "Export Data")
- No jargon beyond what the team already uses internally
- Errors explain what happened and how to fix it — never vague
- Empty states are invitations to act, not dead ends
- Mobile: shorter labels, icon-first when space constrained ("Tambah" vs "Tambah Radio Baru")
- Desktop: full descriptive labels, tooltips for additional context

## Device-Specific Navigation

### Desktop (>1024px)
Sidebar with 7 groups + 1 standalone pinned item:

| Group | Isi |
|-------|-----|
| Main | Dashboard, Docs |
| PM Management | KPI Tracking, PM Schedule, Inspeksi KPC, NEC History, Link Internal, SWR Signal |
| Radio & Fleet | Radio KPC, Radio Contractor, Radio Unit, Radio Scrap, Dashboard Perbaikan, Serah Terima Radio, Radio Masuk WH, Fleet Statistics |
| Monitoring | CCTV KPC |
| Warehouse | Histori Peminjaman, Ajuan Pinjam Tools, Supervisi Warehouse, Master Data Tools |
| Call Records | View Records, Upload CSV, Export Data, Print Report |
| Administration | Letter Numbers, Companies, Document Types |
| *(standalone, pinned bawah)* | ⚙ Settings |

Settings adalah konfigurasi sistem-wide (role, permission, akses user) — bukan bagian dari Administration. Selalu tampil pinned di bawah sidebar, tidak ikut scroll.

### Mobile (<768px)
Two navigation patterns (chosen based on screen complexity):

**Option A: Bottom Navigation** (preferred for main modules)
- 5 items max: Dashboard, PM, Radio, Warehouse, More
- Icons + short labels
- "More" opens bottom sheet with remaining groups

**Option B: Hamburger Menu** (for full navigation)
- Top-left hamburger icon
- Left drawer (280px) with same structure as desktop sidebar
- Overlay with backdrop

Field workers typically access 2-3 modules frequently (e.g., Radio + Warehouse), so bottom nav is primary pattern.

---

## Design & Development Workflow

### Tech Stack
- **Frontend:** React 18 + Vite + TypeScript
- **Styling:** TailwindCSS + shadcn/ui (custom theme)
- **Backend:** .NET 8 ASP.NET Core Web API
- **Dual Rendering:** Component-level responsive adaptation (not separate codebases)

### Design Iteration Process

We use **Taste Skill** for visual design mockups:

**Tools:**
- `imagegen-frontend-web`: Desktop dashboard mockups (horizontal layouts, table views, modals)
- `imagegen-frontend-mobile`: Mobile screen mockups (vertical flows, bottom sheets, FAB patterns)
- `redesign-skill`: Iterate on feedback, refine visual direction

**Workflow:**
1. Define functional requirements in PRODUCT.md
2. Define visual system in DESIGN.md
3. Generate desktop mockups with `imagegen-frontend-web`
4. Generate mobile mockups with `imagegen-frontend-mobile`
5. Review with PM & Documentation team
6. Iterate with `redesign-skill` based on feedback
7. Handoff final image references to React implementation

**Installation:**
```bash
npx skills add Leonxlnx/taste-skill --skill imagegen-frontend-web
npx skills add Leonxlnx/taste-skill --skill imagegen-frontend-mobile
npx skills add https://github.com/Leonxlnx/taste-skill --skill "high-end-visual-design"
npx skills add https://github.com/Leonxlnx/taste-skill --skill "redesign-existing-projects"
```

**Note:** Taste Skills produce **image-only output** (no code). Used for design alignment before implementation. Compatible with ChatGPT Images, Claude artifacts, or any AI agent with image generation.

### Component Implementation
- shadcn/ui base components customized with brand colors
- Responsive variants: `<Dialog>` → desktop modal, mobile bottom sheet
- Custom components: FAB, pill filters, mobile integrated header
- TailwindCSS breakpoints: `md:` (desktop), default (mobile)

## Anti-references

- Avoid overly consumer-style dashboards (too playful, too colorful)
- Avoid heavy gradients as primary backgrounds — gradient hanya boleh di welcome banner
- Avoid dark mode only — primary is light mode with good contrast
- Avoid cluttered sidebars with too many competing visual weights
- Avoid rainbow icon colors — maksimal 3-4 warna icon di seluruh dashboard
- Avoid generic SaaS template look — gunakan color system dari brand Synergy MKN Onwards
- **Mobile:** Avoid cramming desktop table into mobile viewport — use cards. Avoid tiny touch targets — min 44px. Avoid "download desktop app" copouts — make mobile web work fully.
- **Desktop:** Avoid hiding functionality in hamburger menus — use persistent sidebar. Avoid mobile-only patterns (FAB, bottom sheets) on large screens where modals and toolbars make more sense.
- **Avoid mobile-hostile patterns:** tiny touch targets, desktop-only interactions, non-scrollable tables
- **Avoid separate mobile/desktop codebases:** use responsive components, not platform-specific apps
- **Avoid feature fragmentation:** same capabilities on both platforms, different UI patterns
