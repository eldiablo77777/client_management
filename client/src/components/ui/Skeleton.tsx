export function SkeletonStatCard() {
  return (
    <div className="surface-card flex flex-col gap-4 p-5">
      <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
      <div className="space-y-2">
        <div className="h-6 w-16 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
        <div className="h-3 w-24 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
      </div>
    </div>
  );
}

export function SkeletonTableRows({
  rows = 5,
  columns = 6,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b border-slate-100 dark:border-slate-800">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className="px-3 py-4">
              <div className="h-3.5 w-full max-w-28 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function SkeletonCardList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="surface-card space-y-3 p-4">
          <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
        </div>
      ))}
    </div>
  );
}
