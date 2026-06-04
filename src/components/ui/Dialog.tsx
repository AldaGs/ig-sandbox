import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

type DialogKind = 'alert' | 'confirm' | 'prompt';

interface DialogOptions {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  // prompt only
  placeholder?: string;
  defaultValue?: string;
  maxLength?: number;
}

interface DialogState extends DialogOptions {
  kind: DialogKind;
}

interface DialogContextValue {
  alert: (opts: DialogOptions) => Promise<void>;
  confirm: (opts: DialogOptions) => Promise<boolean>;
  prompt: (opts: DialogOptions) => Promise<string | null>;
}

const DialogContext = createContext<DialogContextValue | undefined>(undefined);

const ANIM_MS = 180;

export function DialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState | null>(null);
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState('');
  const resolver = useRef<((result: unknown) => void) | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  const open = useCallback((next: DialogState) => {
    return new Promise<unknown>((resolve) => {
      resolver.current = resolve;
      setValue(next.defaultValue ?? '');
      setState(next);
      requestAnimationFrame(() => setVisible(true));
    });
  }, []);

  const close = useCallback((result: unknown) => {
    setVisible(false);
    window.setTimeout(() => {
      setState(null);
      const resolve = resolver.current;
      resolver.current = null;
      resolve?.(result);
    }, ANIM_MS);
  }, []);

  const api = useMemo<DialogContextValue>(
    () => ({
      alert: (opts) => open({ ...opts, kind: 'alert' }) as Promise<void>,
      confirm: (opts) => open({ ...opts, kind: 'confirm' }) as Promise<boolean>,
      prompt: (opts) =>
        open({ ...opts, kind: 'prompt' }) as Promise<string | null>,
    }),
    [open],
  );

  // Once shown, focus the prompt input (or the confirm button otherwise) so
  // keyboard users land inside the dialog and Enter/Escape work.
  useEffect(() => {
    if (!visible || !state) return;
    const t = window.setTimeout(() => {
      if (state.kind === 'prompt') inputRef.current?.focus();
      else confirmRef.current?.focus();
    }, 20);
    return () => window.clearTimeout(t);
  }, [visible, state]);

  const onConfirm = () => {
    if (!state) return;
    if (state.kind === 'confirm') close(true);
    else if (state.kind === 'prompt') close(value);
    else close(undefined);
  };

  const onCancel = () => {
    if (!state) return;
    if (state.kind === 'confirm') close(false);
    else if (state.kind === 'prompt') close(null);
    else close(undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onConfirm();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <DialogContext.Provider value={api}>
      {children}
      {state && (
        <div
          className={`fixed inset-0 z-[60] flex items-center justify-center p-6 transition-opacity duration-150 ${
            visible ? 'bg-black/60 opacity-100' : 'bg-black/0 opacity-0'
          }`}
          onClick={onCancel}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
            className={`w-full max-w-xs rounded-2xl bg-neutral-900 p-5 text-white shadow-2xl ring-1 ring-white/10 transition-all duration-150 ${
              visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
          >
            {state.title && (
              <h2 className="text-base font-semibold">{state.title}</h2>
            )}
            {state.message && (
              <p className="mt-1 text-sm text-neutral-400">{state.message}</p>
            )}

            {state.kind === 'prompt' && (
              <input
                ref={inputRef}
                value={value}
                maxLength={state.maxLength}
                placeholder={state.placeholder}
                onChange={(e) => setValue(e.target.value)}
                className="mt-3 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-blue-500 focus:outline-none"
              />
            )}

            <div className="mt-5 flex justify-end gap-2">
              {state.kind !== 'alert' && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-800"
                >
                  {state.cancelLabel ?? 'Cancel'}
                </button>
              )}
              <button
                ref={confirmRef}
                type="button"
                onClick={onConfirm}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                  state.danger
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {state.confirmLabel ?? 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used within DialogProvider');
  return ctx;
}
