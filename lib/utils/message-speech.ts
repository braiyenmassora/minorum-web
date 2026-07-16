import { loadConfig } from "@/lib/services/config-storage-service";

type SpeechListener = (activeMessageId: string | null) => void;

/** 9Router edge-tts Indonesian voice (noAuth). Upgrade path: picker from /v1/models/tts. */
const DEFAULT_TTS_MODEL = "edge-tts/vi-VN-HoaiMyNeural";

const listeners = new Set<SpeechListener>();
let activeMessageId: string | null = null;
let activeAudio: HTMLAudioElement | null = null;
let activeObjectUrl: string | null = null;
let fetchAbort: AbortController | null = null;

function notify(): void {
  for (const listener of listeners) {
    listener(activeMessageId);
  }
}

function setActive(messageId: string | null): void {
  activeMessageId = messageId;
  notify();
}

function releaseAudio(): void {
  if (activeAudio) {
    activeAudio.onended = null;
    activeAudio.onerror = null;
    activeAudio.pause();
    activeAudio.src = "";
    activeAudio = null;
  }
  if (activeObjectUrl) {
    URL.revokeObjectURL(activeObjectUrl);
    activeObjectUrl = null;
  }
}

function stopSpeech(): void {
  fetchAbort?.abort();
  fetchAbort = null;
  releaseAudio();
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  setActive(null);
}

export function subscribeMessageSpeech(listener: SpeechListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getActiveMessageSpeechId(): string | null {
  return activeMessageId;
}

/** Strip markdown noise so TTS doesn't read backticks/links aloud. */
export function plainTextForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_~>|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function playViaBrowser(messageId: string, text: string): void {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    setActive(null);
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "id-ID";
  utterance.onend = () => {
    if (activeMessageId === messageId) {
      setActive(null);
    }
  };
  utterance.onerror = () => {
    if (activeMessageId === messageId) {
      setActive(null);
    }
  };

  setActive(messageId);
  window.speechSynthesis.speak(utterance);
}

async function playViaRouter(
  messageId: string,
  text: string,
  apiBaseUrl: string,
  apiKey: string,
): Promise<void> {
  const controller = new AbortController();
  fetchAbort = controller;

  const response = await fetch("/api/proxy/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Minorum-Api-Base": apiBaseUrl,
    },
    body: JSON.stringify({ model: DEFAULT_TTS_MODEL, input: text }),
    signal: controller.signal,
  });

  if (!response.ok) {
    throw new Error(`TTS HTTP ${response.status}`);
  }

  const blob = await response.blob();
  if (controller.signal.aborted || activeMessageId !== messageId) {
    return;
  }

  const objectUrl = URL.createObjectURL(blob);
  const audio = new Audio(objectUrl);
  activeObjectUrl = objectUrl;
  activeAudio = audio;

  audio.onended = () => {
    if (activeMessageId === messageId) {
      releaseAudio();
      setActive(null);
    }
  };
  audio.onerror = () => {
    if (activeMessageId === messageId) {
      releaseAudio();
      setActive(null);
    }
  };

  await audio.play();
}

export async function toggleMessageSpeech(
  messageId: string,
  text: string,
): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  if (activeMessageId === messageId) {
    stopSpeech();
    return;
  }

  stopSpeech();

  const spoken = plainTextForSpeech(text);
  if (!spoken) {
    return;
  }

  setActive(messageId);

  const config = loadConfig();
  if (!config) {
    playViaBrowser(messageId, spoken);
    return;
  }

  try {
    await playViaRouter(messageId, spoken, config.apiBaseUrl, config.apiKey);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return;
    }
    // ponytail: router down → browser voices (ceiling: quality drop)
    if (activeMessageId === messageId) {
      playViaBrowser(messageId, spoken);
    }
  }
}
