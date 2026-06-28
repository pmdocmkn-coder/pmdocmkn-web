module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  safelist: [
    // KPC Brand gradient (use sparingly - only for hero banner)
    "bg-gradient-to-br",
    "from-kpc-navy", "via-kpc-blue", "to-kpc-orange",
    // Status indicators (minimal use - 3-4 colors max per design rules)
    "bg-emerald-100", "border-emerald-400", "text-emerald-800", // Success
    "bg-amber-100", "border-amber-400", "text-amber-800", // Warning
    "bg-red-100", "border-red-400", "text-red-800", // Danger
    "bg-blue-100", "border-blue-400", "text-blue-800", // Info
    // Badge colors (limited palette)
    "bg-blue-100", "text-blue-700", "border-blue-200",
    "bg-emerald-100", "text-emerald-700", "border-emerald-200",
    "bg-red-100", "text-red-700", "border-red-200",
    "bg-slate-100", "text-slate-600", "border-slate-200",
  ],
  theme: {
    extend: {
      maxWidth: {
        "8xl": "88rem",
        "9xl": "96rem",
      },
      screens: {
        xs: "475px",
        // Dual rendering breakpoints from DESIGN.md
        mobile: { max: "767px" },
        tablet: { min: "768px", max: "1023px" },
        desktop: { min: "1024px" },
      },
      borderRadius: {
        // Custom radius tokens from DESIGN.md
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "20px", // Hero banner, sidebar header
      },
      spacing: {
        // 4px base unit from DESIGN.md
        18: "4.5rem", // 72px
        22: "5.5rem", // 88px
      },
      colors: {
        // KPC Brand Colors from DESIGN.md
        "kpc-navy": "#1B3A6B", // Primary
        "kpc-blue": "#2B6CB0", // Primary mid
        "kpc-orange": "#D94F2B", // Accent
        "kpc-coral": "#E86547", // Accent light
        
        // shadcn/ui semantic tokens
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))", // Will map to KPC Navy
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))", // Will map to KPC Blue
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))", // Will map to KPC Orange
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Roboto Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
