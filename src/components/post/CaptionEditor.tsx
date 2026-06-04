import { useState } from 'react';

const TOKEN_RE = /(#[\w._]+|@[\w._]+|https?:\/\/\S+)/g;

export function HighlightedCaption({ text }: { text: string }) {
  if (!text) return null;
  const parts = text.split(TOKEN_RE);
  return (
    <span>
      {parts.map((part, i) => {
        if (!part) return null;
        if (part.startsWith('#') || part.startsWith('@')) {
          return (
            <span key={i} className="text-blue-400">
              {part}
            </span>
          );
        }
        if (/^https?:\/\//.test(part)) {
          return (
            <span key={i} className="text-blue-400 underline">
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

export default function CaptionEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="space-y-1">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 2200))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Write a caption…  #hashtags @mentions supported"
        rows={3}
        className="block w-full resize-y rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-neutral-600"
      />
      <div className="flex justify-between text-[11px] text-neutral-500">
        <span>{value.length} / 2,200</span>
        <span>{focused ? 'Tap outside to preview formatting' : ''}</span>
      </div>
    </div>
  );
}
