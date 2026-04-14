export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="space-y-8">
        <div className="space-y-4 rounded-xl border border-border p-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 animate-pulse rounded-full bg-muted" />
            <div className="space-y-3">
              <div className="h-8 w-64 animate-pulse rounded bg-muted" />
              <div className="h-4 w-40 animate-pulse rounded bg-muted" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-11/12 animate-pulse rounded bg-muted" />
            <div className="h-4 w-10/12 animate-pulse rounded bg-muted" />
            <div className="h-4 w-8/12 animate-pulse rounded bg-muted" />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
            <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
            <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
            <div className="h-6 w-28 animate-pulse rounded-full bg-muted" />
          </div>
        </div>
      </div>
    </div>
  )
}
