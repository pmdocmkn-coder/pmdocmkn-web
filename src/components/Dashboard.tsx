import React from "react";
import { motion, cubicBezier } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  TrendingUp,
  FileText,
  HelpCircle,
  ArrowRight,
  Shield,
  Cpu,
  Wifi,
  Sparkles,
  Layers,
  Radio,
  ClipboardList,
  Phone,
  Link2,
  Settings,
  BookOpen
} from "lucide-react";
import { Variants } from "framer-motion";

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

const hasPermission = (permission: string): boolean => {
  const permissions = localStorage.getItem("permissions");
  if (!permissions) return false;
  try {
    const permList: string[] = JSON.parse(permissions);
    return permList.includes(permission);
  } catch {
    return false;
  }
};

const Dashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdmin = user?.roleId === 1 || user?.roleId === 2;

  // 🎬 Framer Motion Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: cubicBezier(0.25, 0.46, 0.45, 0.94),
      },
    },
  };

  const cardHoverVariants: Variants = {
    rest: {
      scale: 1,
      y: 0,
    },
    hover: {
      scale: 1.02,
      y: -5,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
  };

  const floatingVariants: Variants = {
    float: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const handleActionClick = (tab: string) => {
    setActiveTab(tab);
    navigate(`/${tab}`);
  };

  // 📊 Mappings between modules, icons, roles and permissions
  const allModules = [
    {
      id: "callrecords",
      icon: Phone,
      title: "Call Records",
      description: "Analisis dan riwayat panggilan.",
      color: "from-blue-500 to-cyan-500",
      tab: "callrecords",
      permission: "callrecord.view",
    },
    {
      id: "radio-management",
      icon: Radio,
      title: "Radio Management",
      description: "Manajemen Trunking, Konvensional, dll.",
      color: "from-purple-500 to-pink-500",
      tab: "radio-trunking",
      forAll: true,
      permission: "radio.view",
    },
    {
      id: "letter-numbers",
      icon: FileText,
      title: "Letter Management",
      description: "Penomoran persuratan dan dokumen.",
      color: "from-amber-500 to-orange-500",
      tab: "letter-numbers",
      permission: "letter.view", // Requires Letter Menu Permission
    },
    {
      id: "inspeksi-kpc",
      icon: ClipboardList,
      title: "Inspeksi KPC",
      description: "Laporan data Inspeksi KPC.",
      color: "from-green-500 to-emerald-500",
      tab: "inspeksi-kpc",
      permission: "inspeksi.menu",
    },
    {
      id: "fleet-statistics",
      icon: TrendingUp,
      title: "Fleet Statistics",
      description: "Pemantauan performa Fleet.",
      color: "from-indigo-500 to-blue-500",
      tab: "fleet-statistics",
      permission: "fleet.menu",
    },
    {
      id: "nec-history",
      icon: TrendingUp, // Keeping consistent with sidebar
      title: "NEC History",
      description: "Histori dari data NEC.",
      color: "from-rose-500 to-red-500",
      tab: "nec-history",
      permission: "nec.histori.menu",
    },
    {
      id: "link-internal",
      icon: Link2,
      title: "Link Internal",
      description: "Tautan Link Internal jaringan.",
      color: "from-lime-500 to-green-500",
      tab: "link-internal",
      permission: "internal.link.menu",
    },
    {
      id: "swr-signal",
      icon: Radio,
      title: "SWR Signal",
      description: "Monitoring performa SWR.",
      color: "from-sky-500 to-cyan-500",
      tab: "swr-signal",
      permission: "swr.signal.menu",
    },
    {
      id: "docs",
      icon: BookOpen,
      title: "Dokumentasi",
      description: "Panduan cara penggunaan.",
      color: "from-slate-500 to-gray-500",
      tab: "docs",
      permission: "docs.view",
    },
    {
      id: "settings",
      icon: Settings,
      title: "Pengaturan",
      description: "Pengaturan sistem dan akun.",
      color: "from-fuchsia-500 to-pink-500",
      tab: "settings",
      checkCustomPermission: () => {
        return hasPermission("system.permission.view") ||
          hasPermission("system.role.view") ||
          hasPermission("system.role.permission.view") ||
          hasPermission("system.user.management.view") ||
          hasPermission("system.division.view") ||
          hasPermission("system.audit.view");
      }
    }
  ];

  // Logic to determine available menus based on User Permissions
  const currentActions = allModules.filter((item) => {
    if (item.forAll) return true;
    if (item.checkCustomPermission) return item.checkCustomPermission();
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  const platformOverview = [
    {
      icon: Layers,
      title: "Modul Tersedia",
      desc: `${currentActions.length} Modul Aktif`,
      color: "bg-indigo-100 text-indigo-700",
    },
    {
      icon: Wifi,
      title: "Koneksi Stabil",
      desc: "Terhubung ke server utama",
      color: "bg-green-100 text-green-700",
    },
    {
      icon: Cpu,
      title: "Kinerja Optimal",
      desc: "Sistem berjalan tanpa hambatan",
      color: "bg-blue-100 text-blue-700",
    },
  ];

  const features = [
    {
      icon: TrendingUp,
      title: "Analisis Trend",
      description: "Temukan pola dan insight data.",
    },
    {
      icon: FileText,
      title: "Export Laporan",
      description: "Download laporan Excel/CSV.",
    },
    {
      icon: Shield,
      title: "Keamanan Data",
      description: "Data tersimpan dengan aman.",
    },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6 md:space-y-8"
    >
      {/* 🏁 Banner */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl shadow-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 text-white"
      >
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
        <div className="relative z-10 p-6 md:p-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <motion.h1
              variants={itemVariants}
              className="text-2xl md:text-5xl font-extrabold mb-3 md:mb-4 flex items-center justify-center md:justify-start gap-2 md:gap-3"
            >
              <motion.div variants={floatingVariants} animate="float" className="flex-shrink-0">
                <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-yellow-300" />
              </motion.div>
              Selamat Datang, {user?.fullName?.split(" ")[0] || "User"}!
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="text-blue-100 text-sm md:text-lg max-w-2xl"
            >
              Akses cepat segala kebutuhan operasional Anda. Sistem secara otomatis menampilkan modul yang sesuai dengan perizinan akun Anda.
            </motion.p>
          </div>

          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.05, rotate: 2 }}
            className="hidden md:block bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl min-w-[200px] text-center"
          >
            <p className="text-xs uppercase tracking-widest text-white/70 mb-2">
              Role Anda
            </p>
            <div className="text-xl font-bold bg-white/20 rounded-xl py-2 px-4 inline-block">
              {user?.roleName || (isAdmin ? "Administrator" : "User")}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* 🔧 Content Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Left Column (Actions & Features) */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">

          {/* Menu Sections container */}
          <motion.div
            variants={itemVariants}
            className="md:bg-white md:rounded-3xl md:p-8 md:shadow-sm md:border md:border-gray-100"
          >
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6 pl-2 md:pl-0">
              Menu Tersedia
            </h3>

            {/* Desktop Card View Map */}
            <div className="hidden md:grid grid-cols-1 xl:grid-cols-2 gap-6">
              {currentActions.map((action, i) => (
                <motion.button
                  key={action.id}
                  variants={cardHoverVariants}
                  initial="rest"
                  whileHover="hover"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleActionClick(action.tab)}
                  className="p-6 rounded-2xl bg-gray-50 hover:bg-white shadow-sm hover:shadow-xl border border-transparent hover:border-blue-100 text-left transition-all group relative overflow-hidden flex flex-col h-full"
                >
                  <div
                    className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${action.color} opacity-5 -mr-8 -mt-8 rounded-full`}
                  />
                  <div
                    className={`p-4 rounded-xl inline-flex bg-gradient-to-r ${action.color} shadow-lg mb-4 self-start`}
                  >
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-bold text-xl text-gray-900 mb-2">
                    {action.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-4 flex-grow">
                    {action.description}
                  </p>
                  <div className="flex items-center text-blue-600 font-bold text-sm mt-auto">
                    Mulai Sekarang
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Mobile App-Drawer View Map */}
            <div className="grid md:hidden grid-cols-2 sm:grid-cols-3 gap-4">
              {currentActions.map((action, i) => (
                <motion.button
                  key={action.id}
                  variants={cardHoverVariants}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleActionClick(action.tab)}
                  className="p-5 rounded-3xl bg-white shadow-sm hover:shadow-md border border-gray-100/50 flex flex-col items-center justify-center text-center gap-3 transition-all relative overflow-hidden"
                >
                  {/* subtle backdrop color */}
                  <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${action.color} opacity-5 -mr-10 -mt-10 rounded-full pointer-events-none`} />

                  <div className={`p-4 rounded-2xl bg-gradient-to-br ${action.color} shadow-md`}>
                    <action.icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="font-bold text-sm text-gray-800 leading-tight line-clamp-2">
                    {action.title}
                  </span>
                </motion.button>
              ))}
            </div>

          </motion.div>

          {/* Features - Hide on mobile if preferred, or keep it cleaner */}
          <motion.div
            variants={itemVariants}
            className="hidden md:block bg-white rounded-3xl p-8 shadow-sm border border-gray-100"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Fitur Utama
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -5 }}
                  className="p-5 bg-gray-50 rounded-2xl border border-transparent hover:border-blue-50 transition-all"
                >
                  <div className="p-3 bg-blue-100 rounded-xl w-fit mb-4">
                    <f.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">{f.title}</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {f.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6 md:space-y-8">
          {/* Platform Overview */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100"
          >
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6">
              Status Sistem
            </h3>
            <div className="space-y-4">
              {platformOverview.map((item, i) => (
                <motion.div
                  key={i}
                  whileHover={{ x: 5 }}
                  className="flex items-center space-x-4 p-3 md:p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-blue-50 transition-all"
                >
                  <div className={`p-3 rounded-xl ${item.color} shadow-sm`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Help Section */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -5 }}
            className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 -mr-16 -mt-16 rounded-full" />
            <div className="relative z-10">
              <div className="bg-white/20 p-3 rounded-xl w-fit mb-4 md:mb-6 backdrop-blur-sm">
                <HelpCircle className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-lg md:text-xl font-bold mb-2">Butuh Bantuan?</h4>
              <p className="text-blue-100 text-xs md:text-sm mb-6 leading-relaxed">
                Pelajari panduan lengkap untuk manajemen data dan menggunakan fitur-fitur dengan maksimal.
              </p>
              <button
                onClick={() => handleActionClick("docs")}
                className="w-full bg-white text-indigo-600 py-3 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors shadow-lg"
              >
                Buka Dokumentasi
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default React.memo(Dashboard);
