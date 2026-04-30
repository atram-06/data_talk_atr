export default function SkeletonLoader() {
  return (
    <div className="glass-card gradient-border p-6 animate-skeleton-pulse transition-colors duration-300">
      {/* Title skeleton */}
      <div className="h-5 w-48 rounded-md mb-6" style={{ background: 'var(--skeleton-bg)' }} />

      {/* Chart area skeleton */}
      <div className="h-52 rounded-lg mb-4 flex items-end justify-around px-6 pb-4 gap-3"
        style={{ background: 'var(--bg-card)' }}>
        {[40, 65, 50, 80, 55, 70, 45].map((h, i) => (
          <div
            key={i}
            className="w-8 rounded-t-md"
            style={{ height: `${h}%`, background: 'var(--skeleton-bg)' }}
          />
        ))}
      </div>

      {/* Insight skeleton */}
      <div className="space-y-2">
        <div className="h-3 w-full rounded" style={{ background: 'var(--skeleton-bg)' }} />
        <div className="h-3 w-3/4 rounded" style={{ background: 'var(--skeleton-bg)' }} />
      </div>
    </div>
  );
}
