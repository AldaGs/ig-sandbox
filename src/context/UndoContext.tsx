import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

// Single-step undo. Each user action that has a sensible inverse pushes an
// entry here; pressing Ctrl/Cmd+Z (or tapping the toast) pops and invokes the
// most recent one. Older entries are dropped — this is "undo your last move",
// not full history.

interface UndoEntry {
  id: string;
  label: string;
  undo: () => void;
  pushedAt: number;
}

interface UndoContextValue {
  current: UndoEntry | null;
  push: (label: string, undo: () => void) => void;
  invoke: () => void;
  dismiss: () => void;
}

const UndoContext = createContext<UndoContextValue | undefined>(undefined);

// Auto-dismiss the toast after this long. The undo function is dropped at the
// same time, so a delayed Ctrl+Z past this window is a no-op.
const TOAST_LIFETIME_MS = 6000;

export function UndoProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<UndoEntry | null>(null);
  const timerRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const dismiss = useCallback(() => {
    clearTimer();
    setCurrent(null);
  }, []);

  const push = useCallback((label: string, undo: () => void) => {
    clearTimer();
    setCurrent({
      id: crypto.randomUUID(),
      label,
      undo,
      pushedAt: Date.now(),
    });
    timerRef.current = window.setTimeout(() => {
      setCurrent(null);
      timerRef.current = null;
    }, TOAST_LIFETIME_MS);
  }, []);

  const invoke = useCallback(() => {
    setCurrent((c) => {
      if (c) c.undo();
      return null;
    });
    clearTimer();
  }, []);

  // Global Ctrl/Cmd+Z. Skip when the user is editing text so the browser's
  // own undo still works inside inputs and textareas.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.key === 'z' || e.key === 'Z')) return;
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.shiftKey) return; // reserve redo for later
      const t = e.target as HTMLElement | null;
      if (t) {
        const tag = t.tagName;
        if (
          tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          t.isContentEditable
        ) {
          return;
        }
      }
      if (current) {
        e.preventDefault();
        invoke();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, invoke]);

  useEffect(() => () => clearTimer(), []);

  return (
    <UndoContext.Provider value={{ current, push, invoke, dismiss }}>
      {children}
    </UndoContext.Provider>
  );
}

export function useUndo() {
  const ctx = useContext(UndoContext);
  if (!ctx) throw new Error('useUndo must be used within UndoProvider');
  return ctx;
}
