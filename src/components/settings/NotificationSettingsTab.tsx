import React, { useEffect, useState } from 'react';
import { Mail, Plus, X, Send, Save, Loader2 } from 'lucide-react';
import { notificationSettingApi, HelpdeskNotificationSetting } from '../../services/notificationApi';
import { useToast } from '../../hooks/use-toast';

export default function NotificationSettingsTab() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [testTargetEmail, setTestTargetEmail] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await notificationSettingApi.getHelpdeskSetting();
      setEnabled(data.helpdeskEmailEnabled);
      setRecipients(data.helpdeskEmailRecipients || []);
      if (data.helpdeskEmailRecipients && data.helpdeskEmailRecipients.length > 0) {
        setTestTargetEmail(data.helpdeskEmailRecipients[0]);
      }
    } catch (error: any) {
      toast({
        title: 'Gagal Memuat Pengaturan',
        description: error?.response?.data?.message || error.message || 'Terjadi kesalahan saat memuat data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmail = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = emailInput.trim();
    if (!trimmed) return;

    // Email format validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      toast({
        title: 'Format Email Salah',
        description: 'Mohon masukkan alamat email yang valid (contoh: helpdesk@company.com).',
        variant: 'destructive',
      });
      return;
    }

    if (recipients.some(r => r.toLowerCase() === trimmed.toLowerCase())) {
      toast({
        title: 'Email Duplikat',
        description: 'Alamat email ini sudah ada di dalam daftar.',
        variant: 'destructive',
      });
      return;
    }

    const updated = [...recipients, trimmed];
    setRecipients(updated);
    setEmailInput('');
    if (!testTargetEmail) {
      setTestTargetEmail(trimmed);
    }
  };

  const handleRemoveEmail = (index: number) => {
    const updated = recipients.filter((_, i) => i !== index);
    setRecipients(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedData: HelpdeskNotificationSetting = {
        helpdeskEmailEnabled: enabled,
        helpdeskEmailRecipients: recipients,
      };
      await notificationSettingApi.updateHelpdeskSetting(updatedData);
      toast({
        title: 'Pengaturan Disimpan',
        description: 'Pengaturan notifikasi email helpdesk berhasil diperbarui.',
      });
    } catch (error: any) {
      toast({
        title: 'Gagal Menyimpan',
        description: error?.response?.data?.message || error.message || 'Gagal menyimpan perubahan.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testTargetEmail.trim()) {
      toast({
        title: 'Email Uji Coba Kosong',
        description: 'Pilih atau masukkan email tujuan uji coba terlebih dahulu.',
        variant: 'destructive',
      });
      return;
    }

    setTesting(true);
    try {
      const success = await notificationSettingApi.sendTestEmail(testTargetEmail.trim());
      if (success) {
        toast({
          title: 'Email Uji Coba Terkirim! 📧',
          description: `Email uji coba berhasil dikirim ke ${testTargetEmail}. Silakan periksa inbox.`,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Gagal Kirim Email Test',
        description: error?.response?.data?.message || error.message || 'Periksa koneksi SMTP pada server backend.',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-[14px] border border-[#E2E8F0] p-8 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 text-[#2B6CB0] animate-spin mb-3" />
        <p className="text-[14px] text-[#718096] font-medium">Memuat pengaturan notifikasi...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Info Card */}
      <div className="bg-white rounded-[14px] border border-[#E2E8F0] p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-[12px] bg-[#EBF4FF] flex items-center justify-center text-[#2B6CB0] flex-shrink-0">
            <Mail className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-[18px] font-bold text-[#1A202C]">Notifikasi Email Helpdesk (Radio Ready)</h2>
            <p className="text-[13px] text-[#718096] mt-1 leading-relaxed">
              Konfigurasi pengiriman email otomatis ke tim Helpdesk seketika saat radio telah selesai diperbaiki oleh teknisi workshop dan memasuki status <strong>Radio Masuk WH</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white rounded-[14px] border border-[#E2E8F0] p-6 shadow-sm space-y-6">
        {/* Toggle Enable/Disable */}
        <div className="flex items-center justify-between pb-6 border-b border-[#E2E8F0]">
          <div>
            <span className="text-[15px] font-bold text-[#1A202C] block">Aktifkan Notifikasi Email</span>
            <span className="text-[13px] text-[#718096] mt-0.5 block">
              Kirim email otomatis setiap ada radio siap di Warehouse.
            </span>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2B6CB0]"></div>
          </label>
        </div>

        {/* Recipients Configuration */}
        <div className="space-y-4">
          <div>
            <label className="text-[14px] font-bold text-[#1A202C] block mb-1">
              Daftar Email Penerima Notifikasi Helpdesk
            </label>
            <p className="text-[12px] text-[#718096]">
              Masukkan alamat email perorangan atau grup (mailing list) yang bertugas menangani Helpdesk.
            </p>
          </div>

          {/* Add Email Input */}
          <form onSubmit={handleAddEmail} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Masukkan email (contoh: helpdesk@company.com)..."
                className="w-full h-10 px-3.5 rounded-[10px] border border-[#E2E8F0] bg-white text-[13px] text-[#1A202C] focus:outline-none focus:border-[#2B6CB0] focus:ring-1 focus:ring-[#2B6CB0]"
              />
            </div>
            <button
              type="submit"
              disabled={!emailInput.trim()}
              className="h-10 px-4 bg-[#1B3A6B] hover:bg-[#2B6CB0] disabled:opacity-50 text-white text-[13px] font-semibold rounded-[10px] transition-colors flex items-center gap-1.5 flex-shrink-0"
            >
              <Plus className="w-4 h-4" /> Tambah Email
            </button>
          </form>

          {/* Email Chips List */}
          <div className="min-h-[60px] p-3 rounded-[10px] bg-[#F7F8FA] border border-[#E2E8F0]">
            {recipients.length === 0 ? (
              <p className="text-[13px] text-[#A0AEC0] italic text-center py-2">
                Belum ada email penerima yang terdaftar. Tambahkan email di atas.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {recipients.map((email, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-white border border-[#CBD5E0] text-[13px] font-medium text-[#2D3748] shadow-sm"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#2B6CB0]" />
                    <span>{email}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(idx)}
                      className="text-[#A0AEC0] hover:text-[#DC2626] transition-colors ml-1"
                      title="Hapus Email"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Save Button Bar */}
        <div className="pt-4 border-t border-[#E2E8F0] flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 h-11 bg-[#2B6CB0] hover:bg-[#1B3A6B] text-white text-[14px] font-semibold rounded-[10px] transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan Pengaturan
          </button>
        </div>
      </div>

      {/* Test Email Section */}
      <div className="bg-[#EBF4FF]/60 rounded-[14px] border border-[#2B6CB0]/20 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-[#2B6CB0] text-white flex items-center justify-center flex-shrink-0">
            <Send className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-[#1B3A6B]">Uji Coba Pengiriman Email (Test Email)</h3>
            <p className="text-[12px] text-[#4A5568]">
              Kirim email uji coba untuk memverifikasi server SMTP dan memastikan email tidak masuk ke folder SPAM.
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 pt-2">
          <select
            value={testTargetEmail}
            onChange={(e) => setTestTargetEmail(e.target.value)}
            className="h-10 px-3 rounded-[10px] border border-[#CBD5E0] bg-white text-[13px] text-[#1A202C] focus:outline-none focus:border-[#2B6CB0] flex-1"
          >
            <option value="">-- Pilih dari daftar email penerima --</option>
            {recipients.map((email, idx) => (
              <option key={idx} value={email}>
                {email}
              </option>
            ))}
          </select>

          <input
            type="email"
            value={testTargetEmail}
            onChange={(e) => setTestTargetEmail(e.target.value)}
            placeholder="Atau ketik email target manual..."
            className="h-10 px-3.5 rounded-[10px] border border-[#CBD5E0] bg-white text-[13px] text-[#1A202C] focus:outline-none focus:border-[#2B6CB0] flex-1"
          />

          <button
            onClick={handleSendTestEmail}
            disabled={testing || !testTargetEmail.trim()}
            className="h-10 px-5 bg-[#D94F2B] hover:bg-[#B83D20] disabled:opacity-50 text-white text-[13px] font-semibold rounded-[10px] transition-colors flex items-center justify-center gap-2 flex-shrink-0 shadow-sm"
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Kirim Test Email
          </button>
        </div>
      </div>
    </div>
  );
}
