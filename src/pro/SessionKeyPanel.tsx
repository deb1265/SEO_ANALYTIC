import { useEffect, useId, useState, useSyncExternalStore } from "react";
import { KeyRound, Check, Trash2 } from "lucide-react";
import {
  clearSessionKey,
  hasSessionKey,
  setSessionKey,
  subscribeSessionKey,
} from "./session-key";

export default function SessionKeyPanel() {
  const connected = useSyncExternalStore(
    subscribeSessionKey,
    hasSessionKey,
    () => false,
  );
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const id = useId();
  useEffect(() => {
    const clearDraft = () => {
      setDraft("");
      setError("");
    };
    window.addEventListener("pagehide", clearDraft);
    return () => window.removeEventListener("pagehide", clearDraft);
  }, []);
  function connect() {
    try {
      setSessionKey(draft);
      setDraft("");
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <section className="s-session-key" aria-label="OpenRouter session settings">
      <div className="s-session-description">
        <KeyRound size={20} />
        <div>
          <strong>OpenRouter · Muse Spark 1.3</strong>
          <p>
            {connected
              ? "Key active for this tab. "
              : "Add your key to enable AI research. "}
            Refreshing or closing this tab clears it.
          </p>
        </div>
      </div>
      {connected ? (
        <div className="s-session-controls">
          <span className="s-tag teal" role="status">
            <Check size={13} /> Session key active
          </span>
          <button type="button" className="s-btn" onClick={clearSessionKey}>
            <Trash2 size={14} /> Clear key
          </button>
        </div>
      ) : (
        <div className="s-session-controls">
          <label className="s-sr-only" htmlFor={id}>
            OpenRouter API key
          </label>
          <input
            id={id}
            type="password"
            autoComplete="off"
            spellCheck={false}
            autoCapitalize="none"
            placeholder="sk-or-v1-…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                connect();
              }
            }}
          />
          <button
            type="button"
            className="s-btn primary"
            onClick={connect}
            disabled={!draft.trim()}
          >
            Use key for this tab
          </button>
        </div>
      )}
      {error && (
        <p className="s-input-error" role="alert">
          {error}
        </p>
      )}
      <small className="s-session-footnote">
        Kept in memory and sent directly to OpenRouter. Never saved with reports
        or on Vercel. Provider charges apply.
      </small>
    </section>
  );
}
