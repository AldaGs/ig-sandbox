export default function VerifiedBadge({ size = 14 }: { size?: number }) {
  // IG's verified check: scalloped blue badge with a white tick.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-label="Verified"
      role="img"
    >
      <path
        fill="#3b82f6"
        d="M12 .5l2.6 2.1 3.3-.4 1.5 3 3 1.5-.4 3.3L24 12l-2 2.6.4 3.3-3 1.5-1.5 3-3.3-.4L12 23.5l-2.6-2.1-3.3.4-1.5-3-3-1.5.4-3.3L0 12l2-2.6L1.6 6.1l3-1.5 1.5-3 3.3.4L12 .5z"
      />
      <path
        fill="#fff"
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 12.3l3 3 6-6.5"
      />
    </svg>
  );
}
