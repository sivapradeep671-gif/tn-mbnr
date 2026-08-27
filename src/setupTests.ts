import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Reset jsdom state between tests
afterEach(() => {
  cleanup();
});

// Mock IndexedDB for test environment
if (typeof globalThis.indexedDB === 'undefined') {
  const mockStore = new Map();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).indexedDB = {
    open: vi.fn().mockImplementation(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const req: any = {
        result: {
          objectStoreNames: { contains: () => true, createObjectStore: () => ({ createIndex: () => {} }) },
          transaction: () => ({
            objectStore: () => ({
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              put: (item: any) => {
                if (item && item.id) mockStore.set(item.id, item);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const putReq: any = {};
                setTimeout(() => putReq.onsuccess && putReq.onsuccess({ target: putReq }), 0);
                return putReq;
              },
              get: (id: string) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const getReq: any = { result: mockStore.get(id) || null };
                setTimeout(() => getReq.onsuccess && getReq.onsuccess({ target: getReq }), 0);
                return getReq;
              },
              getAll: () => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const getAllReq: any = { result: Array.from(mockStore.values()) };
                setTimeout(() => getAllReq.onsuccess && getAllReq.onsuccess({ target: getAllReq }), 0);
                return getAllReq;
              },
              delete: (id: string) => {
                mockStore.delete(id);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const delReq: any = {};
                setTimeout(() => delReq.onsuccess && delReq.onsuccess({ target: delReq }), 0);
                return delReq;
              },
              clear: () => {
                mockStore.clear();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const clrReq: any = {};
                setTimeout(() => clrReq.onsuccess && clrReq.onsuccess({ target: clrReq }), 0);
                return clrReq;
              }
            })
          })
        }
      };
      setTimeout(() => {
        if (req.onupgradeneeded) req.onupgradeneeded({ target: req });
        if (req.onsuccess) req.onsuccess({ target: req });
      }, 0);
      return req;
    })
  };
}

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
