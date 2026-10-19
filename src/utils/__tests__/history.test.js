import { describe, it, expect } from 'vitest';
import {
  createHistoryState,
  pushHistory,
  undoHistory,
  redoHistory,
  canUndo,
  canRedo,
  areSnapshotsEqual,
} from '../historyManager';

describe('historyManager - Undo / Redo Architecture', () => {
  const initialRoom = {
    id: 'room-1',
    name: 'Master Suite',
    shape: 'rectangle',
    widthMm: 5000,
    lengthMm: 4000,
    rotation: 0,
  };

  const initialItems = [
    {
      id: 'bed-1',
      name: 'King Bed',
      x: 1000,
      y: 1200,
      widthMm: 1800,
      depthMm: 2000,
      rotation: 0,
      locked: false,
    },
  ];

  it('initializes history with empty past and future', () => {
    const history = createHistoryState({
      room: initialRoom,
      items: initialItems,
      selectedId: 'bed-1',
    });

    expect(canUndo(history)).toBe(false);
    expect(canRedo(history)).toBe(false);
    expect(history.past).toHaveLength(0);
    expect(history.future).toHaveLength(0);
    expect(history.present.items[0].name).toBe('King Bed');
  });

  it('records a moved item position and allows undoing back to origin', () => {
    let history = createHistoryState({
      room: initialRoom,
      items: initialItems,
      selectedId: 'bed-1',
    });

    // Move bed from (1000, 1200) to (2500, 1800)
    const movedItems = [
      {
        ...initialItems[0],
        x: 2500,
        y: 1800,
      },
    ];

    history = pushHistory(history, {
      room: initialRoom,
      items: movedItems,
      selectedId: 'bed-1',
    });

    expect(canUndo(history)).toBe(true);
    expect(canRedo(history)).toBe(false);
    expect(history.present.items[0].x).toBe(2500);
    expect(history.present.items[0].y).toBe(1800);

    // Perform Undo
    history = undoHistory(history);

    expect(canUndo(history)).toBe(false);
    expect(canRedo(history)).toBe(true);
    expect(history.present.items[0].x).toBe(1000);
    expect(history.present.items[0].y).toBe(1200);

    // Perform Redo
    history = redoHistory(history);

    expect(canUndo(history)).toBe(true);
    expect(canRedo(history)).toBe(false);
    expect(history.present.items[0].x).toBe(2500);
    expect(history.present.items[0].y).toBe(1800);
  });

  it('records item resizing and rotation and properly undoes them', () => {
    let history = createHistoryState({
      room: initialRoom,
      items: initialItems,
      selectedId: 'bed-1',
    });

    // Resize bed width and rotate by 90
    const resizedItems = [
      {
        ...initialItems[0],
        widthMm: 2000,
        depthMm: 2200,
        rotation: 90,
      },
    ];

    history = pushHistory(history, {
      room: initialRoom,
      items: resizedItems,
      selectedId: 'bed-1',
    });

    expect(history.present.items[0].widthMm).toBe(2000);
    expect(history.present.items[0].rotation).toBe(90);

    history = undoHistory(history);
    expect(history.present.items[0].widthMm).toBe(1800);
    expect(history.present.items[0].rotation).toBe(0);
  });

  it('records component deletion and addition', () => {
    let history = createHistoryState({
      room: initialRoom,
      items: initialItems,
      selectedId: 'bed-1',
    });

    // Delete bed
    history = pushHistory(history, {
      room: initialRoom,
      items: [],
      selectedId: null,
    });

    expect(history.present.items).toHaveLength(0);
    expect(canUndo(history)).toBe(true);

    // Undo delete restores the bed
    history = undoHistory(history);
    expect(history.present.items).toHaveLength(1);
    expect(history.present.items[0].id).toBe('bed-1');
  });

  it('does not push duplicate snapshots when nothing changes', () => {
    const history = createHistoryState({
      room: initialRoom,
      items: initialItems,
      selectedId: 'bed-1',
    });

    const nextHistory = pushHistory(history, {
      room: initialRoom,
      items: initialItems,
      selectedId: 'bed-1',
    });

    expect(nextHistory.past).toHaveLength(0);
    expect(canUndo(nextHistory)).toBe(false);
  });

  it('clears future redo history when a new action occurs in an undone state (branching)', () => {
    let history = createHistoryState({
      room: initialRoom,
      items: initialItems,
      selectedId: 'bed-1',
    });

    // Step 1: Move item
    history = pushHistory(history, {
      room: initialRoom,
      items: [{ ...initialItems[0], x: 2000 }],
      selectedId: 'bed-1',
    });

    // Step 2: Undo to initial
    history = undoHistory(history);
    expect(canRedo(history)).toBe(true);

    // Step 3: Branch by adding a partition wall
    const wallItem = {
      id: 'wall-1',
      name: 'Partition Wall',
      x: 500,
      y: 500,
      widthMm: 2000,
      depthMm: 150,
      rotation: 0,
    };

    history = pushHistory(history, {
      room: initialRoom,
      items: [...initialItems, wallItem],
      selectedId: 'wall-1',
    });

    // Future must be cleared!
    expect(canRedo(history)).toBe(false);
    expect(history.present.items).toHaveLength(2);
  });

  it('caps history stack to maxDepth to prevent unbounded memory usage', () => {
    let history = createHistoryState({
      room: initialRoom,
      items: initialItems,
      selectedId: 'bed-1',
    });

    // Push 15 updates with maxDepth of 5
    for (let i = 1; i <= 15; i++) {
      history = pushHistory(
        history,
        {
          room: initialRoom,
          items: [{ ...initialItems[0], x: i * 100 }],
          selectedId: 'bed-1',
        },
        { maxDepth: 5 }
      );
    }

    expect(history.past.length).toBe(5);
    expect(history.present.items[0].x).toBe(1500);
  });

  it('coalesces rapid consecutive typing/sliding when coalesce is true', () => {
    let history = createHistoryState({
      room: initialRoom,
      items: initialItems,
      selectedId: 'bed-1',
    });

    // First edit at t = 1000
    history = pushHistory(
      history,
      {
        room: initialRoom,
        items: [{ ...initialItems[0], x: 1100 }],
        selectedId: 'bed-1',
      },
      { coalesce: true, timestamp: 1000 }
    );
    expect(history.past).toHaveLength(1);

    // Consecutive rapid edit at t = 1100 (< 600ms)
    history = pushHistory(
      history,
      {
        room: initialRoom,
        items: [{ ...initialItems[0], x: 1200 }],
        selectedId: 'bed-1',
      },
      { coalesce: true, timestamp: 1100 }
    );
    // Should still have past length 1 because it coalesced into present!
    expect(history.past).toHaveLength(1);
    expect(history.present.items[0].x).toBe(1200);

    // Later edit at t = 2000 (> 600ms)
    history = pushHistory(
      history,
      {
        room: initialRoom,
        items: [{ ...initialItems[0], x: 1300 }],
        selectedId: 'bed-1',
      },
      { coalesce: true, timestamp: 2000 }
    );
    expect(history.past).toHaveLength(2);
    expect(history.present.items[0].x).toBe(1300);
  });

  it('correctly compares snapshots with areSnapshotsEqual', () => {
    const snap1 = { room: initialRoom, items: initialItems };
    const snap2 = { room: { ...initialRoom }, items: [{ ...initialItems[0] }] };
    expect(areSnapshotsEqual(snap1, snap2)).toBe(true);

    const snapDiffRoom = { room: { ...initialRoom, widthMm: 7000 }, items: initialItems };
    expect(areSnapshotsEqual(snap1, snapDiffRoom)).toBe(false);

    const snapDiffItem = { room: initialRoom, items: [{ ...initialItems[0], x: 9999 }] };
    expect(areSnapshotsEqual(snap1, snapDiffItem)).toBe(false);
  });
});
