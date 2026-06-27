# Taste Skill Setup — PM Dashboard MKN

Taste Skill adalah toolset untuk membuat mockup design visual (image-only, no code) yang bisa digunakan untuk iterasi desain sebelum implementasi.

---

## Apa itu Taste Skill?

**Taste Skill** dari [tasteskill.dev](https://tasteskill.dev) adalah koleksi skills untuk AI agents yang menghasilkan **gambar mockup** desain frontend. Output berupa **image reference** (bukan kode), cocok untuk:
- Design review dengan stakeholders
- Alignment visual sebelum development
- Iterasi cepat berdasarkan feedback
- Handoff ke developer dengan reference jelas

---

## Skills yang Tersedia

| Skill | Install Command | Fungsi |
|-------|-----------------|--------|
| **imagegen-frontend-web** | `npx skills add Leonxlnx/taste-skill --skill imagegen-frontend-web` | Mockup website desktop (horizontal sections, dashboard layouts, table views) |
| **imagegen-frontend-mobile** | `npx skills add Leonxlnx/taste-skill --skill imagegen-frontend-mobile` | Mockup mobile screens (iOS/Android, vertical flows, bottom sheets, FAB) |
| **high-end-visual-design** | `npx skills add https://github.com/Leonxlnx/taste-skill --skill "high-end-visual-design"` | High-end mockups dengan polish tinggi, detail visual lebih baik |
| **redesign-existing-projects** | `npx skills add https://github.com/Leonxlnx/taste-skill --skill "redesign-existing-projects"` | Iterasi redesign berdasarkan feedback visual |
| **brandkit** | `npx skills add Leonxlnx/taste-skill --skill brandkit` | Brand board (logo directions, color palettes, typography scales) |

**Catatan Penting:** Skill names dengan spaces (seperti "high-end-visual-design") HARUS menggunakan full GitHub URL dan diapit quotes.

---

## Instalasi

### Correct Installation Commands

**For skills with simple names (no spaces):**
```bash
npx skills add Leonxlnx/taste-skill --skill imagegen-frontend-web
npx skills add Leonxlnx/taste-skill --skill imagegen-frontend-mobile
```

**For skills with spaces in name, use full GitHub URL:**
```bash
npx skills add https://github.com/Leonxlnx/taste-skill --skill "high-end-visual-design"
npx skills add https://github.com/Leonxlnx/taste-skill --skill "redesign-existing-projects"
```

**Output:**
- ✅ `imagegen-frontend-web` → mockup desktop
- ✅ `imagegen-frontend-mobile` → mockup mobile
- ✅ `high-end-visual-design` → high-end mockups dengan polish lebih tinggi
- ✅ `redesign-existing-projects` → iterasi redesign

**Note:** Skill names with spaces HARUS menggunakan full GitHub URL dan quotes.

---

## Cara Pakai

### Prerequisites
Taste Skill **tidak generate kode**. Dia generate **gambar mockup**.

**Compatible dengan:**
- ChatGPT (dengan image generation enabled)
- Claude (dengan artifact image mode)
- Codex (dengan image mode)
- AI agent lain yang bisa generate images

**Tidak compatible dengan:**
- Code-only agents (tanpa image generation capability)
- Terminal-only workflows

---

## Workflow Design dengan Taste Skill

### Step 1: Define Requirements
Edit `PRODUCT.md` dan `DESIGN.md` untuk menentukan:
- Color palette
- Typography scale
- Component rules (button, card, navigation)
- Responsive breakpoints

### Step 2: Generate Desktop Mockup

**Prompt untuk agent dengan image generation:**
```
Read c:\Users\jupri.eka\CODE PM\Frontend\pmdocmkn-web\PRODUCT.md and 
c:\Users\jupri.eka\CODE PM\Frontend\pmdocmkn-web\DESIGN.md for complete context.

Using imagegen-frontend-web skill, create a desktop mockup for PM Dashboard MKN:

Brand context from PRODUCT.md:
- Professional operational tool for MKN internal staff (PM & Documentation)
- Serious and structured, trustworthy, efficient
- Task-completion focus (not consumer/marketing style)

Design specs from DESIGN.md:
- Layout: sidebar navigation (220px, navy #1B3A6B) + main content area (white)
- Sidebar: logo at top with gradient strip, 7 nav groups, Settings pinned bottom
- Main content: welcome banner with gradient, 6 module cards
- Colors: navy #1B3A6B, blue #2B6CB0, orange #D94F2B, white, gray
- Typography: Inter, clean hierarchy
- Style: operational tool (density over empty space)

Navigation groups: Main, PM Management, Radio & Fleet, Monitoring, Warehouse, 
Call Records, Administration

Output: horizontal desktop dashboard mockup
```

**Output:** Image mockup dashboard desktop view

### Step 3: Generate Mobile Mockup

**Prompt:**
```
Read c:\Users\jupri.eka\CODE PM\Frontend\pmdocmkn-web\PRODUCT.md and 
c:\Users\jupri.eka\CODE PM\Frontend\pmdocmkn-web\DESIGN.md for complete context.

Using imagegen-frontend-mobile skill, create mobile mockup for PM Dashboard MKN:

Product context from PRODUCT.md:
- Field workers use mobile for: radio tracking, warehouse submissions, on-site records
- Touch-optimized, minimal taps, immediate access to key modules
- Professional operational tool (not consumer app)

Design specs from DESIGN.md:
- Layout: mobile integrated header + vertical card list + bottom navigation
- Header: hamburger icon (left), "Dashboard" title (center), notification (right), 56px height
- Cards: Radio KPC, Warehouse, PM Schedule (vertical stack, 12px gap, touch-friendly 44px min)
- Bottom nav: 5 items (Dashboard, PM, Radio, Warehouse, More) with icons + labels, 64px height
- Colors: orange accent #D94F2B for active nav, gray #718096 inactive
- Style: iOS/Android compatible, clean, operational

Output: mobile screen mockup (portrait)
```

**Output:** Image mockup mobile view

### Step 4: Iterate dengan Redesign Skill

Setelah review dengan team:

**Prompt:**
```
Read c:\Users\jupri.eka\CODE PM\Frontend\pmdocmkn-web\PRODUCT.md and 
c:\Users\jupri.eka\CODE PM\Frontend\pmdocmkn-web\DESIGN.md for context.

Using redesign-existing-projects skill, iterate on the previous desktop mockup:

Feedback from stakeholders:
- Sidebar nav groups too cramped, increase spacing between groups
- Module cards on dashboard need to show preview data (e.g., "12 radio aktif", "3 PM pending")
- Welcome banner gradient too dominant, reduce height from 140px to 100px
- Active nav item left border should be thicker (5px instead of 3px)

Maintain brand identity from PRODUCT.md (professional, trustworthy, efficient).
Keep color system from DESIGN.md unchanged.

Generate revised mockup with these changes.
```

**Output:** Updated image mockup

### Step 5: Handoff to Implementation

Setelah mockup final approved:
1. Export image mockups
2. Share dengan developer
3. Implement dengan React + TailwindCSS + shadcn/ui
4. Reference `DESIGN.md` untuk token values (colors, spacing, radius)

---

## Tips & Best Practices

### 1. **Satu skill, satu viewport**
- `imagegen-frontend-web` → desktop/tablet horizontal layouts
- `imagegen-frontend-mobile` → mobile vertical screens
- Jangan mix viewport dalam satu prompt

### 2. **Reference DESIGN.md di prompt**
Selalu mention:
- Color hex codes (#1B3A6B, #D94F2B, dll)
- Component specs (button height, card radius, dll)
- Typography scale (Inter, weights, sizes)

### 3. **Iterasi cepat dengan redesign-skill**
- Jangan regenerate from scratch untuk perubahan kecil
- Gunakan `redesign-skill` dengan feedback spesifik
- Lebih cepat dan maintain konsistensi visual

### 4. **Taste Skill ≠ Code Generator**
- Output adalah **gambar**, bukan komponen React
- Gunakan sebagai **design reference** untuk development
- Developer tetap perlu implement manual dengan shadcn/ui

---

## Common Use Cases

### Use Case 1: Stakeholder Review
**Problem:** Perlu approval visual sebelum development
**Solution:**
1. Generate mockup desktop + mobile dengan Taste Skill
2. Share image ke stakeholder (PM, team lead)
3. Collect feedback
4. Iterate dengan `redesign-skill`
5. Approve final design
6. Mulai development dengan reference jelas

### Use Case 2: Responsive Design Validation
**Problem:** Perlu validasi bahwa design work di mobile dan desktop
**Solution:**
1. Generate desktop mockup dengan `imagegen-frontend-web`
2. Generate mobile mockup dengan `imagegen-frontend-mobile`
3. Compare side-by-side
4. Ensure consistency (colors, typography, branding)
5. Adjust breakpoint behavior di `DESIGN.md`

### Use Case 3: Component Library Documentation
**Problem:** Developer perlu visual reference untuk custom components
**Solution:**
1. Generate component showcase dengan Taste Skill
2. Show variants: FAB, bottom sheet, pill filters, mobile cards
3. Annotate dengan specs (size, spacing, colors)
4. Include in component library docs

---

## Troubleshooting

### "Command not found: npx skills"
**Solution:** Install Node.js dan npm terlebih dahulu. `npx` adalah package runner dari npm.

### "Skill added but not working"
**Check:**
1. Apakah agent yang Anda gunakan support image generation?
2. Apakah Anda sudah invoke skill dengan benar? (mention skill name di prompt)
3. Apakah skill path benar? (`Leonxlnx/taste-skill`)

### "Output is code, not image"
**Problem:** Agent tidak recognize Taste Skill sebagai image generator
**Solution:** 
- Explicitly mention "generate image mockup" di prompt
- Pastikan agent dalam image generation mode (bukan code mode)
- Coba agent lain yang support image output

---

## Resources

- **Taste Skill Docs:** https://tasteskill.dev
- **Source Repository:** https://github.com/Leonxlnx/taste-skill
- **PM Dashboard Design Docs:**
  - `DESIGN.md` — visual system, components, responsive rules
  - `PRODUCT.md` — product context, user needs, navigation structure

---

## FAQ

**Q: Apakah Taste Skill generate React components?**
A: Tidak. Taste Skill generate **image mockups** untuk design reference. Developer tetap perlu implement manual dengan React + shadcn/ui.

**Q: Apakah bisa customize output style?**
A: Ya. Mention brand guidelines, color palette, typography di prompt. Reference `DESIGN.md` untuk consistency.

**Q: Berapa lama proses generate image?**
A: Tergantung agent yang digunakan. Biasanya 5-15 detik per mockup.

**Q: Apakah output bisa di-export sebagai Figma/Sketch?**
A: Tidak langsung. Output adalah image (PNG/JPG). Bisa di-import ke Figma sebagai reference layer, tapi bukan vector/editable component.

**Q: Apakah perlu install di project?**
A: Tidak. `npx skills add` adalah global command untuk AI agent, bukan dependency project. Tidak ada package yang masuk `package.json`.

---

**Last Updated:** 2026-06-26
