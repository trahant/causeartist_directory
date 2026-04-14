export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className="space-y-3 rounded-xl border border-border p-4">
            <div className="h-4 w-48 animate-pulse rounded bg-muted" />
            <div className="space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
              <div className="h-3 w-11/12 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
