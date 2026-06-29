// ── Audio unlock on first user interaction ────────────────────────────────────
// Browser autoplay policy blocks audio until user has interacted with the page.
// We pre-create and play a silent audio on first click/keypress to unlock future plays.

let audioUnlocked = false;

function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  // Play & immediately pause a silent audio to satisfy browser autoplay policy
  const silent = new Audio('/notification.mp3');
  silent.volume = 0;
  silent.play().then(() => {
    silent.pause();
    silent.currentTime = 0;
  }).catch(() => { /* silent */ });
}

// Register unlock listeners once
if (typeof window !== 'undefined') {
  ['click', 'touchstart', 'keydown'].forEach(evt => {
    window.addEventListener(evt, unlockAudio, { once: false, passive: true });
  });
}

export function playNotificationSound() {
  try {
    const audio = new Audio('/notification.mp3');
    audio.volume = 0.85;
    audio.play().catch(() => {
      // Autoplay still blocked — will work after next user interaction
    });
  } catch {
    // Silently ignore if Audio API not available
  }
}
