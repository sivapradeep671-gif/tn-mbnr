import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Reset jsdom state between tests
afterEach(() => {
  cleanup();
});

// Mock Web Speech API (Speech Synthesis)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'speechSynthesis', {
    value: {
      speak: vi.fn(),
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      getVoices: vi.fn().mockReturnValue([]),
      onvoiceschanged: null,
    },
    writable: true,
  });

  // Mock Speech Recognition
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).webkitSpeechRecognition = vi.fn().mockImplementation(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    onresult: null,
    onerror: null,
    onend: null,
  }));
}

// Mock Geolocation API
if (typeof navigator !== 'undefined') {
  Object.defineProperty(navigator, 'geolocation', {
    value: {
      getCurrentPosition: vi.fn().mockImplementation((success) => 
        success({
          coords: {
            latitude: 13.0827,
            longitude: 80.2707,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        })
      ),
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    },
    writable: true,
  });
}

// Mock ScrollTo
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  window.scrollTo = vi.fn() as any;
}
