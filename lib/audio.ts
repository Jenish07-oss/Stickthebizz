// Web Audio API synthesizer for zero-dependency, ultra-responsive sound effects
// Tuned for gentle, pleasant, low-volume cashier and customer feedback

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Scan Trigger: Gentle, warm blip (low-volume 0.05, pure sine)
 */
export function playScanChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    const now = ctx.currentTime;

    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.05, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  } catch {
    // Ignore audio errors on unsupported environments
  }
}

/**
 * Merchant Approval: Soft, warm, low-volume acoustic chime (pure sine at 0.06 volume)
 */
export function playApprovalBell() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Gentle dual-sine chord (C5 + G5: warm and pleasant, zero harshness)
    const notes = [523.25, 783.99];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.03);

      gain.gain.setValueAtTime(0.001, now + i * 0.03);
      gain.gain.linearRampToValueAtTime(0.04, now + i * 0.03 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.03);
      osc.stop(now + 0.35);
    });
  } catch {
    // Ignore
  }
}

/**
 * Milestone Fanfare: Celebratory ascending warm tones at low volume (0.05)
 */
export function playMilestoneFanfare() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const startTime = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const noteTime = startTime + idx * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.05, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.25);
    });
  } catch {
    // Ignore
  }
}

/**
 * Scan Rejection: Gentle low double-thud (low-volume 0.04, non-grating)
 */
export function playRejectBuzz() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    const now = ctx.currentTime;

    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.04, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  } catch {
    // Ignore
  }
}
