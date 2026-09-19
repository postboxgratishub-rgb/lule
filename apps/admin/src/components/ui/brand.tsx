import Image from "next/image";
import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/dashboard"
      className="inline-flex items-center rounded-xl text-ink-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600"
      aria-label="LULE admin home"
    >
      <Image
        src="/branding/lule-logo.png"
        alt=""
        width={1672}
        height={941}
        priority
        className={compact ? "h-10 w-auto object-contain" : "h-16 w-auto object-contain"}
        sizes={compact ? "72px" : "114px"}
      />
    </Link>
  );
}
