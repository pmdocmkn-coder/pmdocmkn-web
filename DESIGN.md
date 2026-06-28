# DESIGN.md — PM Dashboard MKN

Derived from the **Synergy MKN Onwards** brand identity: navy blue as the structural foundation, coral-orange as the action accent, supported by neutral surfaces for content density.

**Design System:** Dual rendering strategy — same data, adaptive presentation for mobile and desktop.

**Stack:** React 18 + Vite + TypeScript + TailwindCSS + shadcn/ui (custom theme)

---

## Responsive Strategy

### Breakpoints
- Mobile: `< 768px` (smartphones, portrait tablets)
- Tablet: `768px - 1024px` (landscape tablets)
- Desktop: `> 1024px` (laptop, desktop monitors)

### Dual Rendering Rules

**Mobile renders:**
- Bottom Sheet Dialog (replaces standard modal)
- FAB (Floating Action Button) for primary actions
- Bottom navigation or hamburger menu
- Card layout for data lists
- Pill filters (horizontal scrollable chips)
- Mobile integrated header (combines breadcrumb + actions)
- Touch-optimized spacing (min 44px touch targets)

**Desktop renders:**
- Standard modal dialog
- Sidebar navigation (220px fixed)
- Table view for data lists
- Select dropdown filters
- Separate header + breadcrumb
- Mouse-optimized spacing (min 36px clickable areas)

### Component Adaptation Matrix

| Component | Mobile (<768px) | Desktop (>1024px) |
|-----------|-----------------|-------------------|
| Navigation | Bottom nav / Hamburger | Sidebar (220px) |
| Dialog/Modal | Bottom Sheet | Modal |
| Primary Action | FAB (bottom-right) | Button in header |
| Data Display | Cards (vertical stack) | Table |
| Filters | Pill chips (horizontal) | Select dropdown |
| Header | Mobile integrated | Top bar + breadcrumb |
| Forms | Full-screen sheet | Modal or inline |

---

## Color Palette

| Role           | Name            | Hex       | Usage                                              |
|----------------|-----------------|-----------|----------------------------------------------------|
| Primary        | MKN Navy        | `#1B3A6B` | Sidebar, headers, primary buttons                  |
| Primary mid    | MKN Blue        | `#2B6CB0` | Links, active states, icon fills                   |
| Accent         | MKN Orange      | `#D94F2B` | CTAs, badges, alert indicators, hover accents      |
| Accent light   | MKN Coral       | `#E86547` | Hover states on accent, secondary highlights       |
| Surface        | White           | `#FFFFFF` | Card backgrounds, main content area                |
| Surface alt    | Cool Gray 50    | `#F7F8FA` | Page background, table row alternates              |
| Border         | Cool Gray 200   | `#E2E8F0` | Dividers, card borders, input borders              |
| Text primary   | Slate 900       | `#1A202C` | Headings, body copy                                |
| Text secondary | Slate 500       | `#718096` | Captions, metadata, placeholder text               |
| Success        | Emerald 600     | `#059669` | Status: connected, active, OK                      |
| Warning        | Amber 500       | `#F59E0B` | Status: warning, pending                           |
| Danger         | Red 600         | `#DC2626` | Status: error, critical, logout                    |

### Gradient (use sparingly — only for hero banner or sidebar header)
```
linear-gradient(135deg, #1B3A6B 0%, #2B6CB0 60%, #D94F2B 100%)
```
Maximum one gradient element per page. All other surfaces are flat.

---

## Typography

| Role         | Family                          | Weight    | Notes                                      |
|--------------|---------------------------------|-----------|--------------------------------------------|
| Display      | Inter / Plus Jakarta Sans       | 700       | Page titles, welcome banner headline       |
| Body         | Inter                           | 400 / 500 | All body text, labels, descriptions        |
| Data / Mono  | JetBrains Mono / Roboto Mono    | 400       | IDs, timestamps, code values               |
| UI labels    | Inter                           | 500 / 600 | Navigation items, button labels, table headers |

**Scale (rem):**
- xs: 0.75rem
- sm: 0.875rem
- base: 1rem
- lg: 1.125rem
- xl: 1.25rem
- 2xl: 1.5rem
- 3xl: 1.875rem

---

## Spacing & Radius

| Token     | Value  | Usage                                      |
|-----------|--------|--------------------------------------------|
| radius-sm | 6px    | Badges, tags, small chips                  |
| radius-md | 10px   | Cards, inputs, dropdowns                   |
| radius-lg | 14px   | Modals, large panels                       |
| radius-xl | 20px   | Hero banner, sidebar header                |

Spacing scale: 4px base unit (4, 8, 12, 16, 20, 24, 32, 40, 48, 64)

---

## Component Rules

### Navigation

#### Desktop: Sidebar Navigation
- Background: `#1B3A6B` (MKN Navy)
- Active item: `#2B6CB0` background, white text, left border `#D94F2B` 3px
- Inactive item: white text at 70% opacity
- Width: 220px; icons + text labels
- Logo area: gradient accent strip at top
- User profile card at bottom: slightly lighter navy `#243F73`

**Layout structure (top to bottom):**
```
┌─────────────────────┐
│  Logo / App Name    │  ← gradient strip
├─────────────────────┤
│  Scrollable nav     │  ← semua group menu
│                     │
│  [Main]             │
│  [PM Management]    │
│  [Radio & Fleet]    │
│  [Monitoring]       │
│  [Warehouse]        │
│  [Call Records]     │
│  [Administration]   │
├─────────────────────┤
│  ⚙ Settings         │  ← pinned, tidak ikut scroll
│  [User Profile]     │  ← pinned di paling bawah
└─────────────────────┘
```

**Navigation group rules:**
- Group label: uppercase, 11px, `rgba(255,255,255,0.45)`, letter-spacing 0.08em, padding 16px 12px 4px
- Group items: 36px height, padding 0 12px 0 16px, font-size 13px
- Indented sub-items (jika ada): padding-left 32px, font-size 12px
- Divider antara scrollable area dan Settings: `rgba(255,255,255,0.12)` 1px horizontal line

**Settings — pinned bottom, standalone:**
- Tidak masuk group manapun
- Posisi: fixed di bawah scrollable nav, di atas user profile card
- Fungsi: konfigurasi sistem-wide — Role & Permission, akses user, tipe dokumen, dll
- Visual: sama dengan nav item biasa tapi ada subtle divider di atasnya
- Jangan pernah collapse atau sembunyikan Settings di dalam group lain

**Sidebar navigation structure (final):**

| Group | Menu Items |
|-------|-----------|
| Main | Dashboard, Docs |
| PM Management | KPI Tracking, PM Schedule, Inspeksi MKN, NEC History, Link Internal, SWR Signal |
| Radio & Fleet | Radio MKN, Radio Contractor, Radio Unit, Radio Scrap, Dashboard Perbaikan, Serah Terima Radio, Radio Masuk WH, Fleet Statistics |
| Monitoring | CCTV MKN |
| Warehouse | Histori Peminjaman, Ajuan Pinjam Tools, Supervisi Warehouse, Master Data Tools |
| Call Records | View Records, Upload CSV, Export Data, Print Report |
| Administration | Letter Numbers, Companies, Document Types |
| *(standalone, pinned)* | ⚙ Settings |

#### Mobile: Bottom Navigation (< 768px)
- Background: white, top border `#E2E8F0` 1px, subtle shadow
- Height: 64px (safe area aware)
- Max 5 primary items: Dashboard, PM, Radio, Warehouse, More
- Active item: `#D94F2B` icon fill, `#D94F2B` text, 3px top indicator
- Inactive: `#718096` icon and text
- Icons: 24px, centered above label (8px, weight 500)
- "More" item opens bottom sheet with remaining nav groups

**Mobile hamburger menu (alternative to bottom nav):**
- Trigger: top-left hamburger icon (24px)
- Opens: left-side drawer (280px width, slide-in animation)
- Same structure as desktop sidebar, but full-height overlay
- Backdrop: `rgba(0,0,0,0.4)`, tap to close

### Mobile Components

#### FAB (Floating Action Button)
- Position: fixed bottom-right, 16px from edges
- Size: 56px circle
- Background: `#D94F2B` (MKN Orange)
- Icon: white, 24px
- Shadow: `0 4px 12px rgba(217, 79, 43, 0.3)`
- Tap ripple: white at 20% opacity
- Use only for primary screen action (e.g., "Tambah Radio", "Submit PM")

#### Bottom Sheet Dialog
- Backdrop: `rgba(0,0,0,0.4)`
- Sheet background: white
- Drag handle: 32px wide, 4px tall, `#CBD5E0`, centered, 8px from top
- Border radius: 16px top corners only
- Default height: 60% viewport, draggable to 90%
- Animation: slide up 300ms ease-out
- Use for: forms, filters, details, confirmations

#### Mobile Integrated Header
- Height: 56px
- Background: white, bottom border `#E2E8F0`
- Left: back arrow or hamburger (44x44 touch target)
- Center: page title (16px, weight 600)
- Right: action icons (44x44 each, max 2 icons)
- Safe area aware (iOS notch, Android status bar)

#### Pill Filters (Mobile)
- Container: horizontal scroll, no scrollbar visible
- Padding: 16px horizontal, 12px vertical
- Pill: height 36px, padding 0 16px, radius 18px
- Inactive: white background, `#E2E8F0` border, `#1A202C` text
- Active: `#D94F2B` background, white text, no border
- Gap: 8px between pills
- First/last pill: 16px margin from screen edge

#### Mobile Cards
- Width: 100% (minus 16px padding each side)
- Background: white
- Border: 1px `#E2E8F0`
- Radius: 12px (slightly larger than desktop)
- Padding: 16px
- Shadow: `0 1px 3px rgba(0,0,0,0.08)`
- Min touch target for interactive elements: 44px
- Stack vertically with 12px gap

#### Desktop Cards
- Background: white
- Border: 1px `#E2E8F0`
- Shadow: `0 1px 3px rgba(0,0,0,0.08)` resting, `0 4px 12px rgba(0,0,0,0.12)` hover
- Radius: `radius-md` (10px)
- Module icon: colored rounded square, 48px, use accent colors per category (not random)
- CTA link: `#2B6CB0`, weight 500, with `→` arrow, no underline by default

### Buttons
- Primary: `#D94F2B` background, white text — for main CTAs only
- Secondary: `#2B6CB0` background, white text — for secondary actions
- Ghost: transparent, `#1B3A6B` border and text — for tertiary actions
- Danger: `#DC2626` — for destructive actions (logout, delete)
- Radius: `radius-md`
- Height: 36px (sm), 40px (default), 44px (lg)
- Mobile: min height 44px for all interactive buttons (touch target)

### Dialogs & Modals
- Desktop: centered modal, max-width 600px (form) or 900px (content), backdrop `rgba(0,0,0,0.5)`
- Mobile: bottom sheet (see Mobile Components above)
- Close action: X icon (top-right desktop, drag handle mobile)

### Data Tables (Desktop Only)
- Header: background `#F7F8FA`, text `#1A202C`, weight 600, 12px uppercase
- Row height: 48px, hover `#F7F8FA`
- Border: horizontal only, `#E2E8F0` 1px
- Actions column: right-aligned, icon buttons 36px
- Pagination: bottom-right, ghost buttons
- Empty state: centered, icon + text + CTA

### Data Lists (Mobile)
- Replace tables with vertical card stack
- Each card = one row
- Show 3-4 key fields max, "Lihat Detail" link for full info
- Pull to refresh supported

### Welcome Banner
- Use gradient sparingly: `linear-gradient(135deg, #1B3A6B, #2B6CB0)`
- Text: white
- Role badge: semi-transparent white background, radius-lg
- Max height: 140px — keep it compact, not dominant

### Status Indicators
- Use colored dots (8px circle) + short text label
- Success: `#059669` • Warning: `#F59E0B` • Error: `#DC2626`
- No colored background blocks for status — keep it minimal

### Top Navigation Bar (Desktop)
- Top bar: white background, subtle bottom border `#E2E8F0`
- Height: 64px
- Search: ghost input, no border, placeholder only
- User info: right-aligned, avatar circle 36px

---

## Design Rules

1. **Mobile-first, desktop-enhanced** — design for mobile touch, adapt for desktop precision
2. **One gradient per page** — hero banner only. Everything else flat
3. **No rainbow icon colors** — module icons use 3–4 defined colors max (navy, blue, orange, teal)
4. **Sidebar is the brand anchor** — keep it navy on desktop. Don't lighten it to gray
5. **Orange is for action, not decoration** — only on primary CTAs, active badges, and critical indicators
6. **Content density over empty space** — this is a work tool. Cards should show useful info, not be half-empty
7. **Consistent type scale** — never more than 3 font sizes visible at once in a section
8. **Table on desktop, cards on mobile** — tables for data > 6 items on desktop; cards for module entry points and mobile lists
9. **Motion: subtle only** — max 200ms transitions on hover/focus. No page-load animations
10. **Touch targets on mobile: min 44x44px** — follow iOS and Android HIG standards
11. **Dual rendering is invisible to users** — same content, different presentation, no feature parity issues

---

## Design Iteration Workflow

We use **Taste Skill** for visual design mockups and iteration:

### Tools
- **imagegen-frontend-web**: Generate desktop/web mockups (horizontal sections, dashboard views)
- **imagegen-frontend-mobile**: Generate mobile screen mockups (iOS/Android flows, responsive views)
- **brandkit**: Generate brand boards (logo usage, color palettes, typography scales)

### Workflow
1. Define requirements in PRODUCT.md and DESIGN.md
2. Use `imagegen-frontend-web` to create desktop reference designs
3. Use `imagegen-frontend-mobile` to create mobile reference designs
4. Review mockups with stakeholders
5. Iterate with `redesign-skill` based on feedback
6. Handoff final image references to implementation (React + shadcn/ui)

### Installation
```bash
npx skills add Leonxlnx/taste-skill --skill imagegen-frontend-web
npx skills add Leonxlnx/taste-skill --skill imagegen-frontend-mobile
npx skills add https://github.com/Leonxlnx/taste-skill --skill "high-end-visual-design"
npx skills add https://github.com/Leonxlnx/taste-skill --skill "redesign-existing-projects"
```

**Note:** Taste Skills generate **images only** (no code). Use with ChatGPT Images, Claude image artifacts, or any agent with image generation capability. Output is visual reference for implementation.

---

## shadcn/ui Customization

Our shadcn/ui theme follows the brand color system:

```typescript
// tailwind.config.ts
theme: {
  colors: {
    primary: {
      DEFAULT: '#1B3A6B', // MKN Navy
      foreground: '#FFFFFF',
    },
    secondary: {
      DEFAULT: '#2B6CB0', // MKN Blue
      foreground: '#FFFFFF',
    },
    accent: {
      DEFAULT: '#D94F2B', // MKN Orange
      foreground: '#FFFFFF',
    },
    destructive: {
      DEFAULT: '#DC2626',
      foreground: '#FFFFFF',
    },
  },
  radius: {
    sm: '6px',
    md: '10px',
    lg: '14px',
    xl: '20px',
  },
}
```

Components extended:
- **Sheet** → Bottom Sheet with drag handle (mobile)
- **Dialog** → Standard modal (desktop), Bottom Sheet (mobile)
- **Button** → FAB variant added for mobile
- **Select** → Pill filter variant for mobile
- **Table** → Responsive card layout fallback for mobile
