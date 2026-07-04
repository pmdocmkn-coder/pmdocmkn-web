import React from "react";
import { motion } from "framer-motion";
import { Github, Mail, FileText, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Footer: React.FC = () => {
  const navigate = useNavigate();

  const footerLinks = [
    { label: "Panduan", icon: FileText, action: () => navigate("/docs") },
    { label: "Profil", icon: User, action: () => navigate("/profile") },
    {
      label: "Kontak",
      icon: Mail,
      action: () => window.open("mailto:support@pm-dashboard.app", "_blank"),
    },
  ];

  return (
    <footer className="mt-auto border-t border-gray-200 bg-white/50 backdrop-blur-md hidden md:block">
      <div className="max-w-7xl mx-auto px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-gray-600">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-center md:text-left"
        >
          <div className="flex items-center justify-center md:justify-start space-x-2 mb-1">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1B3A6B, #2B6CB0)' }}>
              <span className="text-white text-[10px] font-bold">PM</span>
            </div>
            <p className="font-bold text-gray-900">PM Dashboard</p>
          </div>
          <p className="text-xs text-gray-500">
            © 2025 PM Dashboard MKN
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            Developed by J.E.P
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap justify-center gap-6"
        >
          {footerLinks.map((link, i) => (
            <button
              key={i}
              onClick={link.action}
              className="flex items-center font-medium text-gray-500 hover:text-[#2B6CB0] transition-colors"
            >
              <link.icon className="w-4 h-4 mr-2" />
              {link.label}
            </button>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-4"
        >
          <a
            href=""
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-all"
            title="Source Code"
          >
            <Github className="w-5 h-5" />
          </a>
          <div className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            v1.0.0
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default React.memo(Footer);
