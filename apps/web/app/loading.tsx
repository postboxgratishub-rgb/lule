import { Brand } from "@/components/brand";
import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-4">
      <div className="flex flex-col items-center gap-6 text-slate-500">
        <Brand />
        <Spinner label="Preparing your learning space…" />
      </div>
    </main>
  );
}
