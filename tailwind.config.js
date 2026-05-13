module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  safelist: [
    // Gradient backgrounds for stat cards
    "bg-gradient-to-br",
    "from-violet-600", "via-purple-600", "to-indigo-700",
    "from-sky-500", "via-blue-600", "to-blue-700",
    "from-rose-500", "via-red-600", "to-red-700",
    "from-amber-500", "via-orange-500", "to-orange-600",
    "from-emerald-600", "to-emerald-800",
    "from-sky-500", "to-blue-700",
    "from-rose-500", "to-red-700",
    "from-amber-500", "to-orange-600",
    "from-red-600", "to-red-800",
    "from-slate-500", "to-slate-700",
    // Fleet chip colors
    "bg-emerald-100", "border-emerald-400", "text-emerald-800",
    "bg-pink-100", "border-pink-400", "text-pink-800",
    "bg-sky-100", "border-sky-400", "text-sky-800",
    "bg-amber-100", "border-amber-400", "text-amber-800",
    "bg-violet-100", "border-violet-400", "text-violet-800",
    "bg-rose-100", "border-rose-400", "text-rose-800",
    "bg-teal-100", "border-teal-400", "text-teal-800",
    "bg-orange-100", "border-orange-400", "text-orange-800",
    "bg-indigo-100", "border-indigo-400", "text-indigo-800",
    "bg-lime-100", "border-lime-400", "text-lime-800",
    "bg-fuchsia-100", "border-fuchsia-400", "text-fuchsia-800",
    "bg-cyan-100", "border-cyan-400", "text-cyan-800",
    // Avatar colors
    "bg-violet-500", "bg-blue-500", "bg-emerald-500",
    "bg-amber-500", "bg-rose-500", "bg-cyan-500",
    "bg-indigo-500", "bg-teal-500", "bg-pink-500", "bg-orange-500",
    // Badge colors
    "bg-blue-100", "text-blue-700", "border-blue-200",
    "bg-green-100", "text-green-700", "border-green-200",
    "bg-red-100", "text-red-700", "border-red-200",
    "bg-emerald-100", "text-emerald-700", "border-emerald-200",
    "bg-violet-100", "text-violet-700", "border-violet-200",
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
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
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
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
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
    },
  },
  plugins: [require("tailwindcss-animate")],
};
