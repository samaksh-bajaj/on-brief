import Link from "next/link";

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-sm text-lg font-bold tracking-tight outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <svg
        viewBox="0 0 20 20"
        aria-hidden="true"
        className="size-5 text-primary"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3.5 11.5 8 16 16.5 4.5" />
      </svg>
      OnBrief
    </Link>
  );
}
