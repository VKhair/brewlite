import React from 'react';

export default function SkeletonLoader() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="flex flex-col rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm animate-pulse dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="h-44 w-full rounded-xl bg-zinc-200 dark:bg-zinc-800 mb-4" />
          <div className="h-5 w-3/4 rounded-md bg-zinc-200 dark:bg-zinc-800 mb-2" />
          <div className="h-3 w-full rounded bg-zinc-100 dark:bg-zinc-800/60 mb-2" />
          <div className="h-3 w-2/3 rounded bg-zinc-100 dark:bg-zinc-800/60 mb-4" />
          <div className="mt-auto flex items-center justify-between pt-2">
            <div className="h-6 w-24 rounded-md bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-9 w-24 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </div>
      ))}
    </div>
  );
}
