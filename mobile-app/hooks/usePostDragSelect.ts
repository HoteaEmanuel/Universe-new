import { useMemo, useRef, useState } from "react";
import type { LayoutChangeEvent, NativeSyntheticEvent, NativeScrollEvent, ScrollView } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import type { Post } from "@universe/shared";

// Mirrors the grid's own layout: ProfilePostGrid.tsx renders two columns
// inside a `flex-row gap-3 px-4` container (px-4 = 16, gap-3 = 12 on
// Tailwind's default 4px scale) - keep these in sync with that className if
// it ever changes, there's no way to read Tailwind spacing back out at
// runtime.
const GRID_GAP = 12;
const GRID_PADDING_X = 16;
const AUTO_SCROLL_EDGE = 60;
const AUTO_SCROLL_STEP = 12;
const AUTO_SCROLL_INTERVAL_MS = 16;

type DragMode = "select" | "deselect";

type DragState = {
  anchorIndex: number;
  mode: DragMode;
  snapshot: Set<string>;
  lastIndex: number;
};

// Drives the Profile screen's "long-press a post, then slide to select more"
// interaction. One Gesture.Pan lives on the whole scrollable area (not one
// per tile) and works out which tile is under the finger by arithmetic,
// rather than each tile trying to detect touches sliding over its
// neighbours - a touch that starts on one tile never reaches another view.
//
// The Pan uses manual activation: it silently tracks every touch from
// touch-down, but only calls stateManager.activate() once selection mode is
// already on (or just turned on mid-touch by a tile's own onLongPress) -
// otherwise it fails and lets the ScrollView handle the touch as a normal
// scroll. This is what lets a finger already down when long-press fires
// keep going straight into a drag, and what keeps plain scrolling unbroken
// the rest of the time.
export const usePostDragSelect = (posts: Post[]) => {
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const postsRef = useRef(posts);
  postsRef.current = posts;
  const selectModeRef = useRef(false);
  const selectedIdsRef = useRef<Set<string>>(new Set());
  const scrollEnabledRef = useRef(true);
  const dragStateRef = useRef<DragState | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const scrollOffsetRef = useRef(0);
  const scrollViewHeightRef = useRef(0);
  const gridTopRef = useRef(0);
  const gridWidthRef = useRef(0);
  const lastFingerRef = useRef({ x: 0, y: 0 });
  const autoScrollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoScrollStepRef = useRef(0);

  const applySelection = (next: Set<string>) => {
    selectedIdsRef.current = next;
    setSelectedIds(next);
  };

  const setScroll = (enabled: boolean) => {
    if (scrollEnabledRef.current === enabled) return;
    scrollEnabledRef.current = enabled;
    setScrollEnabled(enabled);
  };

  const stopAutoScroll = () => {
    if (autoScrollTimerRef.current) {
      clearInterval(autoScrollTimerRef.current);
      autoScrollTimerRef.current = null;
    }
  };

  const computeIndexAt = (fingerX: number, fingerY: number): number | null => {
    const currentPosts = postsRef.current;
    if (currentPosts.length === 0) return null;
    const gridWidth = gridWidthRef.current;
    if (gridWidth <= 0) return null;
    const localY = fingerY + scrollOffsetRef.current - gridTopRef.current;
    if (localY < 0) return null;
    const cellWidth = (gridWidth - GRID_PADDING_X * 2 - GRID_GAP) / 2;
    const rowPitch = cellWidth + GRID_GAP;
    if (rowPitch <= 0) return null;
    const col = fingerX < gridWidth / 2 ? 0 : 1;
    const maxRow = Math.ceil(currentPosts.length / 2) - 1;
    const row = Math.min(Math.max(Math.floor(localY / rowPitch), 0), Math.max(maxRow, 0));
    return Math.min(row * 2 + col, currentPosts.length - 1);
  };

  const applyDragRange = (drag: DragState, currentIndex: number) => {
    const currentPosts = postsRef.current;
    const lo = Math.min(drag.anchorIndex, currentIndex);
    const hi = Math.max(drag.anchorIndex, currentIndex);
    const next = new Set(drag.snapshot);
    for (let i = lo; i <= hi; i++) {
      const id = currentPosts[i]?.id;
      if (!id) continue;
      if (drag.mode === "select") next.add(id);
      else next.delete(id);
    }
    drag.lastIndex = currentIndex;
    applySelection(next);
  };

  const startAutoScroll = (step: number) => {
    autoScrollStepRef.current = step;
    if (autoScrollTimerRef.current) return;
    autoScrollTimerRef.current = setInterval(() => {
      const maxOffset = Number.MAX_SAFE_INTEGER; // ScrollView clamps overscroll itself
      scrollOffsetRef.current = Math.max(0, Math.min(scrollOffsetRef.current + autoScrollStepRef.current, maxOffset));
      scrollViewRef.current?.scrollTo({ y: scrollOffsetRef.current, animated: false });
      const drag = dragStateRef.current;
      if (!drag) return;
      const index = computeIndexAt(lastFingerRef.current.x, lastFingerRef.current.y);
      if (index !== null && index !== drag.lastIndex) applyDragRange(drag, index);
    }, AUTO_SCROLL_INTERVAL_MS);
  };

  const maybeAutoScroll = (fingerY: number) => {
    const viewportHeight = scrollViewHeightRef.current;
    if (viewportHeight <= 0) {
      stopAutoScroll();
      return;
    }
    if (fingerY < AUTO_SCROLL_EDGE) startAutoScroll(-AUTO_SCROLL_STEP);
    else if (fingerY > viewportHeight - AUTO_SCROLL_EDGE) startAutoScroll(AUTO_SCROLL_STEP);
    else stopAutoScroll();
  };

  const endDrag = () => {
    dragStateRef.current = null;
    stopAutoScroll();
    setScroll(true);
  };

  // Called by a tile's onLongPress - the anchor tile is already known (it's
  // whichever tile the long-press fired on), so this doesn't need to
  // recompute a position from coordinates the way a fresh mid-select-mode
  // drag does below.
  const enterSelectMode = (postId: string) => {
    selectModeRef.current = true;
    setSelectMode(true);
    const snapshot = new Set(selectedIdsRef.current);
    const next = new Set(snapshot);
    next.add(postId);
    applySelection(next);
    const anchorIndex = postsRef.current.findIndex((post) => post.id === postId);
    dragStateRef.current = { anchorIndex, mode: "select", snapshot, lastIndex: anchorIndex };
  };

  // Tap-to-toggle fallback for select mode - the primary way a plain tap
  // (no drag) flips one tile, independent of the Pan gesture below (which
  // only ever acts once the touch has moved to a different tile than where
  // it started, so it never double-applies against this).
  const toggleSelect = (postId: string) => {
    const next = new Set(selectedIdsRef.current);
    if (next.has(postId)) next.delete(postId);
    else next.add(postId);
    applySelection(next);
  };

  const selectAll = () => {
    applySelection(new Set(postsRef.current.map((post) => post.id)));
  };

  const exitSelectMode = () => {
    selectModeRef.current = false;
    setSelectMode(false);
    applySelection(new Set());
    dragStateRef.current = null;
    stopAutoScroll();
  };

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .manualActivation(true)
        .runOnJS(true)
        .onTouchesMove((event, stateManager) => {
          const touch = event.allTouches[0];
          if (!touch) return;
          lastFingerRef.current = { x: touch.x, y: touch.y };
          if (!selectModeRef.current) {
            stateManager.fail();
            return;
          }
          const index = computeIndexAt(touch.x, touch.y);
          if (index === null) return;

          if (!dragStateRef.current) {
            // First move seen while already in select mode (no long-press
            // this time) - anchor the drag wherever the finger currently
            // is, toggling relative to that tile's current state.
            const anchorId = postsRef.current[index]?.id;
            dragStateRef.current = {
              anchorIndex: index,
              mode: anchorId && selectedIdsRef.current.has(anchorId) ? "deselect" : "select",
              snapshot: new Set(selectedIdsRef.current),
              lastIndex: index,
            };
          }

          stateManager.activate();
          setScroll(false);
          const drag = dragStateRef.current;
          if (index !== drag.lastIndex) applyDragRange(drag, index);
          maybeAutoScroll(touch.y);
        })
        .onTouchesUp(() => endDrag())
        .onTouchesCancelled(() => endDrag())
        .onEnd(() => endDrag()),
    [],
  );

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
  };

  const handleScrollViewLayout = (event: LayoutChangeEvent) => {
    scrollViewHeightRef.current = event.nativeEvent.layout.height;
  };

  const handleGridLayout = (event: LayoutChangeEvent) => {
    gridTopRef.current = event.nativeEvent.layout.y;
    gridWidthRef.current = event.nativeEvent.layout.width;
  };

  return {
    selectMode,
    selectedIds,
    scrollEnabled,
    gesture,
    scrollViewRef,
    handleScroll,
    handleScrollViewLayout,
    handleGridLayout,
    enterSelectMode,
    toggleSelect,
    selectAll,
    exitSelectMode,
  };
};
