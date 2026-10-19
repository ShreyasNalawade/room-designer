import { useState, useCallback } from 'react';
import {
  createHistoryState,
  pushHistory,
  undoHistory,
  redoHistory,
  canUndo as checkCanUndo,
  canRedo as checkCanRedo,
} from './historyManager';

/**
 * Custom React hook for robust Undo/Redo design state management.
 * Tracks room configuration, furniture/wall/people items, and selection.
 */
export function useDesignHistory(initialState) {
  const [history, setHistory] = useState(() => createHistoryState(initialState));

  const items = history.present.items || [];
  const room = history.present.room;
  const selectedId = history.present.selectedId ?? null;

  const canUndo = checkCanUndo(history);
  const canRedo = checkCanRedo(history);

  // Set items array with history recording
  const updateItems = useCallback((newItemsOrFn, options = {}) => {
    setHistory((prev) => {
      const nextItems =
        typeof newItemsOrFn === 'function' ? newItemsOrFn(prev.present.items || []) : newItemsOrFn;
      return pushHistory(
        prev,
        {
          ...prev.present,
          items: nextItems,
        },
        options
      );
    });
  }, []);

  // Update a single item with history recording
  const updateSingleItem = useCallback((updatedItem, options = {}) => {
    setHistory((prev) => {
      const curItems = prev.present.items || [];
      const nextItems = curItems.map((it) => (it.id === updatedItem.id ? updatedItem : it));
      return pushHistory(
        prev,
        {
          ...prev.present,
          items: nextItems,
        },
        options
      );
    });
  }, []);

  // Update room with history recording
  const updateRoom = useCallback((newRoomOrFn, options = {}) => {
    setHistory((prev) => {
      const nextRoom =
        typeof newRoomOrFn === 'function' ? newRoomOrFn(prev.present.room) : newRoomOrFn;
      return pushHistory(
        prev,
        {
          ...prev.present,
          room: nextRoom,
        },
        options
      );
    });
  }, []);

  // Change selection without adding a history step
  const updateSelectedId = useCallback((idOrFn) => {
    setHistory((prev) => {
      const nextId =
        typeof idOrFn === 'function' ? idOrFn(prev.present.selectedId) : idOrFn;
      if (prev.present.selectedId === nextId) return prev;
      return {
        ...prev,
        present: {
          ...prev.present,
          selectedId: nextId,
        },
      };
    });
  }, []);

  // Reset history completely (for project load / project switch)
  const resetHistory = useCallback((newSnapshot) => {
    setHistory(createHistoryState(newSnapshot));
  }, []);

  // Atomic update of both room and items (e.g. for reset or preset migration)
  const setRoomAndItems = useCallback((newRoom, newItems, newSelectedId = null, options = {}) => {
    setHistory((prev) =>
      pushHistory(
        prev,
        {
          room: newRoom,
          items: newItems,
          selectedId: newSelectedId,
        },
        options
      )
    );
  }, []);

  // Undo step
  const undo = useCallback(() => {
    setHistory((prev) => undoHistory(prev));
  }, []);

  // Redo step
  const redo = useCallback(() => {
    setHistory((prev) => redoHistory(prev));
  }, []);

  return {
    items,
    room,
    selectedId,
    canUndo,
    canRedo,
    pastCount: history.past.length,
    futureCount: history.future.length,
    setItems: updateItems,
    setItem: updateSingleItem,
    setRoom: updateRoom,
    setRoomAndItems,
    setSelectedId: updateSelectedId,
    resetHistory,
    undo,
    redo,
  };
}
