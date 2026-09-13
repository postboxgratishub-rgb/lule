export default function DashboardLoading() {
  return (
    <div className="animate-pulse" aria-label="Loading dashboard" aria-busy="true">
      <div className="h-3 w-28 rounded bg-slate-200" />
      <div className="mt-3 h-9 w-72 max-w-full rounded-lg bg-slate-200" />
      <div className="mt-3 h-4 w-[28rem] max-w-full rounded bg-slate-200" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="h-36 rounded-2xl bg-slate-200" />
        <div className="h-36 rounded-2xl bg-slate-200" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,.7fr)]">
        <div className="h-96 rounded-2xl bg-slate-200" />
        <div className="h-96 rounded-2xl bg-slate-200" />
      </div>
    </div>
  );
}
