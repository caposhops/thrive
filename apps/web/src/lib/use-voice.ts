"use client";

/**
 * Two lightweight hooks around the browser voice APIs.
 *
 * - useSpeechRecognition — mic input via SpeechRecognition. Chrome/Edge/
 *   Safari 14.1+/Android Chrome; Firefox falls back to `supported: false`.
 * - useSpeechSynthesis   — TTS output via window.speechSynthesis. Broad
 *   support across every current browser.
 *
 * Both fire only from user gestures (mic button click, TTS toggle click)
 * so iOS Safari's activation requirement is met naturally.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// The DOM types don't ship SpeechRecognition on window; define the minimum
// shape we call. Kept structural (not a namespace type) so we can cast.
type MinimalRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((ev: unknown) => void) | null;
  onerror: ((ev: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type RecognitionCtor = new () => MinimalRecognition;

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// ─────────────────────────────────────────────────────────────
// Speech Recognition (mic → text)
// ─────────────────────────────────────────────────────────────

export type UseSpeechRecognitionOptions = {
  /**
   * Called once per finalized utterance (user stops speaking).
   * Also called with `isFinal: false` for interim transcripts so the UI
   * can show text live as the user talks.
   */
  onTranscript?: (text: string, isFinal: boolean) => void;
};

export function useSpeechRecognition({
  onTranscript,
}: UseSpeechRecognitionOptions = {}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<MinimalRecognition | null>(null);
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    const Ctor = getRecognitionCtor();
    setSupported(!!Ctor);
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    // Fresh instance each time — Chrome sometimes wedges if reused after error
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = false; // auto-ends on natural pause
    rec.onresult = (ev: unknown) => {
      const evt = ev as {
        results: ArrayLike<{
          0: { transcript: string };
          isFinal: boolean;
        }>;
      };
      let interim = "";
      let final = "";
      for (let i = 0; i < evt.results.length; i++) {
        const r = evt.results[i];
        const chunk = r[0]?.transcript ?? "";
        if (r.isFinal) final += chunk;
        else interim += chunk;
      }
      if (final) onTranscriptRef.current?.(final.trim(), true);
      else if (interim) onTranscriptRef.current?.(interim.trim(), false);
    };
    rec.onerror = () => {
      setListening(false);
    };
    rec.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };
    recognitionRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      // Chrome throws if start() is called while a previous session is closing
      setListening(false);
    }
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const cancel = useCallback(() => {
    recognitionRef.current?.abort();
    setListening(false);
  }, []);

  return { supported, listening, start, stop, cancel };
}

// ─────────────────────────────────────────────────────────────
// Speech Synthesis (text → voice)
// ─────────────────────────────────────────────────────────────

const TTS_ENABLED_KEY = "thrive:coach:tts";

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;
  const englishVoices = voices.filter((v) => v.lang.startsWith("en"));
  const pool = englishVoices.length > 0 ? englishVoices : voices;
  // Prefer local (higher quality on Mac/iOS); prefer "premium/enhanced" names
  const scored = pool
    .map((v) => {
      let score = 0;
      if (v.localService) score += 2;
      const n = v.name.toLowerCase();
      if (/(premium|enhanced|neural|natural|siri|samantha|serena|ava|karen)/.test(n))
        score += 3;
      if (/(male|david|alex|daniel)/.test(n)) score -= 1; // small nudge toward warmer feminine defaults; user can override later
      return { v, score };
    })
    .sort((a, b) => b.score - a.score);
  return scored[0]?.v ?? pool[0];
}

export function useSpeechSynthesis() {
  const [supported, setSupported] = useState(false);
  const [muted, setMutedState] = useState<boolean>(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ok = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
    setSupported(ok);
    if (!ok) return;

    // Load saved preference
    try {
      const raw = window.localStorage.getItem(TTS_ENABLED_KEY);
      if (raw === "true") setMutedState(false);
    } catch {
      /* ignore */
    }

    // Voices load async in some browsers
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const setMuted = useCallback((next: boolean) => {
    setMutedState(next);
    try {
      window.localStorage.setItem(TTS_ENABLED_KEY, next ? "false" : "true");
    } catch {
      /* ignore */
    }
    if (next && typeof window !== "undefined") {
      window.speechSynthesis?.cancel();
    }
  }, []);

  const voice = useMemo(() => pickVoice(voices), [voices]);

  const speak = useCallback(
    (text: string, opts?: { force?: boolean }) => {
      // `force: true` speaks even when muted — used by conversation mode
      // where TTS is intrinsic to the loop, not a separate opt-in.
      if (!supported || (!opts?.force && muted) || !text.trim()) return;
      // Interrupt anything queued so the newest message wins
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (voice) u.voice = voice;
      u.rate = 1.0;
      u.pitch = 1.0;
      u.volume = 1.0;
      u.onstart = () => setSpeaking(true);
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(u);
    },
    [supported, muted, voice],
  );

  const cancel = useCallback(() => {
    if (supported) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, [supported]);

  return { supported, muted, setMuted, speaking, speak, cancel, voice };
}
