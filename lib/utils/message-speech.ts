type SpeechListener = (activeMessageId: string | null) => void;

let activeMessageId: string | null = null;
const listeners = new Set<SpeechListener>();

function notify(): void {
  for (const listener of listeners) {
    listener(activeMessageId);
  }
}

export function subscribeMessageSpeech(listener: SpeechListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getActiveMessageSpeechId(): string | null {
  return activeMessageId;
}

export function toggleMessageSpeech(messageId: string, text: string): void {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return;
  }

  const synthesis = window.speechSynthesis;

  if (
    activeMessageId === messageId &&
    (synthesis.speaking || synthesis.pending)
  ) {
    synthesis.cancel();
    activeMessageId = null;
    notify();
    return;
  }

  synthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "id-ID";

  utterance.onend = () => {
    if (activeMessageId === messageId) {
      activeMessageId = null;
      notify();
    }
  };

  utterance.onerror = () => {
    if (activeMessageId === messageId) {
      activeMessageId = null;
      notify();
    }
  };

  activeMessageId = messageId;
  notify();
  synthesis.speak(utterance);
}
