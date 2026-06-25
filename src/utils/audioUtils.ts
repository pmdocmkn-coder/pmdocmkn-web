export function playNotificationSound() {
  try {
    // Memutar file audio dari folder public
    const audio = new Audio('/notification.mp3');
    
    // Opsional: Atur volume (0.0 - 1.0)
    audio.volume = 1.0; 
    
    audio.play().catch(error => {
      // Biasanya browser memblokir autoplay jika user belum pernah interaksi (klik) di halaman
      console.warn("Autoplay dicegah oleh browser, butuh interaksi user terlebih dahulu:", error);
    });
  } catch (e) {
    console.error("Gagal memutar suara notifikasi", e);
  }
}
