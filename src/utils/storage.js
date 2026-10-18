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
    setItem: (key, val) => {
      memoryStore[key] = String(val);
    },
    removeItem: (key) => {
      delete memoryStore[key];
    },
    clear: () => {
      memoryStore = {};
    },
  };
}

/**
 * Save current room design and items to browser localStorage
 */
export function saveDesign(room, items, unit) {
  try {
    const storage = getStorage();
    const payload = {
      app: 'RoomCraft',
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

/**
 * Validates and normalizes raw JSON data for imported room designs
 */
export function parseAndValidateDesignJSON(rawString) {
  try {
    const data = typeof rawString === 'string' ? JSON.parse(rawString) : rawString;
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Invalid file format. Expected a JSON object.' };
    }

    if (!data.room || typeof data.room !== 'object') {
      return { valid: false, error: 'Invalid room design file: missing room geometry specification.' };
    }

    const shape = data.room.shape || 'rectangle';
    const room = {
      id: data.room.id || `room-${Date.now()}`,
      presetId: data.room.presetId || null,
      name: data.room.name || 'Imported Room',
      shape,
      widthMm: Number(data.room.widthMm) || 6000,
      lengthMm: Number(data.room.lengthMm) || 4500,
      topWidthMm: Number(data.room.topWidthMm) || (shape === 'trapezoid' ? 4000 : undefined),
      bottomWidthMm: Number(data.room.bottomWidthMm) || (shape === 'trapezoid' ? 6000 : undefined),
    };

    const items = Array.isArray(data.items)
      ? data.items.map((item, idx) => ({
          id: item.id || `inst_${Date.now()}_${idx}`,
          catalogId: item.catalogId || 'custom-item',
          name: item.name || 'Component',
          category: item.category || 'misc',
          symbol: item.symbol || 'generic',
          color: item.color || '#06b6d4',
          x: typeof item.x === 'number' ? item.x : 0,
          y: typeof item.y === 'number' ? item.y : 0,
          widthMm: Number(item.widthMm) || 800,
          depthMm: Number(item.depthMm || item.heightMm) || 600,
          rotation: Number(item.rotation) || 0,
          locked: !!item.locked,
        }))
      : [];

    const unit = ['m', 'cm', 'ft', 'in'].includes(data.unit) ? data.unit : 'm';

    return {
      valid: true,
      data: {
        room,
        items,
        unit,
        savedAt: data.savedAt || new Date().toISOString(),
      },
    };
  } catch (err) {
    return { valid: false, error: `JSON Parse error: ${err.message}` };
  }
}

/**
 * Triggers a browser download of the current design as a JSON file
 */
export function exportDesignFile(room, items, unit, customFilename) {
  try {
    const payload = {
      app: 'RoomCraft',
      schemaVersion: 2,
      exportedAt: new Date().toISOString(),
      room,
      items: items || [],
      unit: unit || 'm',
    };

    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const safeName = (customFilename || room.name || 'roomcraft-design')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `${safeName}-${dateStr}.json`;

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, fileName };
  } catch (err) {
    console.error('Failed to export design file:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Read and import a design from an uploaded File object
 */
export async function importDesignFromFile(file) {
  try {
    const text = await file.text();
    const result = parseAndValidateDesignJSON(text);
    if (!result.valid) {
      return { success: false, error: result.error };
    }

    // Persist immediately to localStorage so it stays active
    saveDesign(result.data.room, result.data.items, result.data.unit);

    return {
      success: true,
      data: result.data,
    };
  } catch (err) {
    return { success: false, error: `Failed to read file: ${err.message}` };
  }
}
