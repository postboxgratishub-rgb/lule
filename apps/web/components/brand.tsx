import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/cn";

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-center rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500",
        inverse && "bg-white/95 px-3 py-2 shadow-lg shadow-black/10",
      )}
      aria-label="LULE learning home"
    >
      <Image
        src="/branding/lule-logo.png"
        alt=""
        width={1672}
        height={941}
        priority
        className="h-12 w-auto object-contain sm:h-14"
        sizes="(min-width: 640px) 100px, 86px"
      />
    </Link>
  );
}
