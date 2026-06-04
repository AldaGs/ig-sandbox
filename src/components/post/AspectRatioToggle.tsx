import type { PostAspect } from '../../context/ProfileContext';

const ratios: { value: PostAspect; label: string; aspect: number }[] = [
  { value: '4:5', label: '4:5', aspect: 4 / 5 },
  { value: '1:1', label: '1:1', aspect: 1 },
  { value: '1.91:1', label: '1.91', aspect: 1.91 },
];

export function aspectToNumber(a: PostAspect): number {
  return ratios.find((r) => r.value === a)?.aspect ?? 1;
}

export default function AspectRatioToggle({
  value,
  onChange,
}: {
  value: PostAspect;
  onChange: (v: PostAspect) => void;
}) {
  return (
    <div className="inline-flex rounded-lg bg-neutral-900 p-0.5 text-xs">
      {ratios.map((r) => (
        <button
          key={r.value}
          type="button"
          onClick={() => onChange(r.value)}
          className={`rounded-md px-2.5 py-1 transition-colors ${
            value === r.value
              ? 'bg-neutral-700 text-white'
              : 'text-neutral-400'
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
