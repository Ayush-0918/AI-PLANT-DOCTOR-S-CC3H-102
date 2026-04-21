export type SpeechRecognitionResultLike = {
  isFinal?: boolean;
  0: { transcript: string };
};

export type SpeechRecognitionEventLike = {
  resultIndex?: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

export type SpeechErrorEventLike = {
  error: string;
};

export type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechErrorEventLike) => void) | null;
  start: () => void;
  stop: () => void;
};

export type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechWindow = Window & {
  SpeechRecognition?: unknown;
  webkitSpeechRecognition?: unknown;
};

export function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const speechWindow = window as unknown as SpeechWindow;
  const ctor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
  return ctor ? (ctor as unknown as SpeechRecognitionConstructor) : null;
}
