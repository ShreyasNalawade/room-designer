const STORAGE_KEY = 'roomcraft_design_v2';

// Memory fallback for tests / SSR
let memoryStore = {};

function getStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      return globalThis.localStorage;
    }
  } catch {
    // Ignore access error
  }
  return {
    getItem: (key) => memoryStore[key] || null,
    setItem: (key, val) => { memoryStore[key] = String(val); },
    removeItem: (key) => { delete memoryStore[key]; },
    clear: () => { memoryStore = {}; },
  };
}

/**
 * Save current room design and items to browser localStorage
 */
export function saveDesign(room, items, unit) {
  try {
    const storage = getStorage();
    const payload = {
      version: 2,
      savedAt: new Date().toISOString(),
      room,
      items: items || [],
      unit: unit || 'm',
    };
    storage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return { success: true, timestamp: payload.savedAt };
  } catch (err) {
    console.error('Failed to save design to localStorage:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Load saved room design and items from browser localStorage
 */
export function loadDesign() {
  try {
    const storage = getStorage();
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.room) {
      return {
        room: parsed.room,
        items: Array.isArray(parsed.items) ? parsed.items : [],
        unit: parsed.unit || 'm',
        savedAt: parsed.savedAt,
      };
    }
  } catch (err) {
    console.error('Failed to load design from localStorage:', err);
  }
  return null;
}

/**
 * Clear saved design from localStorage
 */
export function clearSavedDesign() {
  try {
    const storage = getStorage();
    storage.removeItem(STORAGE_KEY);
    return true;
  } catch (err) {
    console.error('Failed to clear localStorage:', err);
    return false;
  }
}
