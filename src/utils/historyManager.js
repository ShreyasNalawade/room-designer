/**
 * Core Architecture & Logic for Undo / Redo History Management.
 * Supports deep state snapshotting, branching history truncation,
 * capped memory depth, and action coalescing.
 */

export const MAX_HISTORY_SNAPSHOTS = 50;

/**
 * Deep clone state snapshot to ensure absolute immutability.
 */
export function cloneSnapshot(snapshot) {
  if (!snapshot) return snapshot;
  return JSON.parse(JSON.stringify(snapshot));
}

/**
 * Compare two snapshots to detect meaningful differences in room or items.
 * Ignores trivial selection differences so selection clicks do not pollute history.
 */
export function areSnapshotsEqual(snapA, snapB) {
  if (snapA === snapB) return true;
  if (!snapA || !snapB) return false;

  // 1. Compare Room Geometry
  const rA = snapA.room;
  const rB = snapB.room;
  if (rA !== rB) {
    if (!rA || !rB) return false;
    if (
      rA.id !== rB.id ||
      rA.widthMm !== rB.widthMm ||
      rA.lengthMm !== rB.lengthMm ||
      rA.shape !== rB.shape ||
      (rA.rotation || 0) !== (rB.rotation || 0) ||
      (rA.topWidthMm || 0) !== (rB.topWidthMm || 0) ||
      (rA.bottomWidthMm || 0) !== (rB.bottomWidthMm || 0) ||
      rA.presetId !== rB.presetId
    ) {
      return false;
    }
  }

  // 2. Compare Items Array
  const iA = snapA.items || [];
  const iB = snapB.items || [];
  if (iA === iB) return true;
  if (iA.length !== iB.length) return false;

  for (let idx = 0; idx < iA.length; idx++) {
    const a = iA[idx];
    const b = iB[idx];
    if (a.id !== b.id) return false;
    if (a.x !== b.x || a.y !== b.y) return false;
    if (a.widthMm !== b.widthMm || a.depthMm !== b.depthMm || a.heightMm !== b.heightMm) return false;
    if ((a.rotation || 0) !== (b.rotation || 0)) return false;
    if (!!a.locked !== !!b.locked) return false;
    if (a.symbol !== b.symbol || a.color !== b.color || a.name !== b.name) return false;
  }

  return true;
}

/**
 * Initialize a new history state container.
 */
export function createHistoryState(initialSnapshot) {
  return {
    past: [],
    present: cloneSnapshot(initialSnapshot),
    future: [],
    lastPushedAt: 0,
  };
}

/**
 * Push a new snapshot onto history.
 * If coalesce is true and performed within coalesceWindowMs, replaces present rather than appending.
 */
export function pushHistory(
  history,
  newSnapshot,
  {
    maxDepth = MAX_HISTORY_SNAPSHOTS,
    coalesce = false,
    coalesceWindowMs = 600,
    timestamp = Date.now(),
  } = {}
) {
  if (!history || !newSnapshot) return history;

  // Don't push identical states
  if (areSnapshotsEqual(history.present, newSnapshot)) {
    return {
      ...history,
      present: {
        ...history.present,
        selectedId: newSnapshot.selectedId, // Keep updated selection
      },
    };
  }

  const isCoalescable =
    coalesce &&
    history.past.length > 0 &&
    timestamp - history.lastPushedAt < coalesceWindowMs;

  if (isCoalescable) {
    return {
      ...history,
      present: cloneSnapshot(newSnapshot),
      lastPushedAt: timestamp,
    };
  }

  const newPast = [...history.past, cloneSnapshot(history.present)];
  if (newPast.length > maxDepth) {
    newPast.shift(); // Evict oldest
  }

  return {
    past: newPast,
    present: cloneSnapshot(newSnapshot),
    future: [], // New action truncates future
    lastPushedAt: timestamp,
  };
}

/**
 * Undo to the preceding state in past stack.
 */
export function undoHistory(history) {
  if (!history || history.past.length === 0) return history;

  const previous = history.past[history.past.length - 1];
  const newPast = history.past.slice(0, history.past.length - 1);

  // Validate that selectedId in previous state still corresponds to an existing item
  const validSelectedId =
    previous.selectedId && (previous.items || []).some((it) => it.id === previous.selectedId)
      ? previous.selectedId
      : null;

  return {
    past: newPast,
    present: {
      ...previous,
      selectedId: validSelectedId,
    },
    future: [cloneSnapshot(history.present), ...history.future],
    lastPushedAt: Date.now(),
  };
}

/**
 * Redo to the next state in future stack.
 */
export function redoHistory(history) {
  if (!history || history.future.length === 0) return history;

  const next = history.future[0];
  const newFuture = history.future.slice(1);

  const validSelectedId =
    next.selectedId && (next.items || []).some((it) => it.id === next.selectedId)
      ? next.selectedId
      : null;

  return {
    past: [...history.past, cloneSnapshot(history.present)],
    present: {
      ...next,
      selectedId: validSelectedId,
    },
    future: newFuture,
    lastPushedAt: Date.now(),
  };
}

export function canUndo(history) {
  return !!history && history.past.length > 0;
}

export function canRedo(history) {
  return !!history && history.future.length > 0;
}
