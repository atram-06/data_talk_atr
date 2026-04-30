import ChartCard from './ChartCard';
import SkeletonLoader from './SkeletonLoader';

export default function DashboardCanvas({ charts, isLoading }) {
  const isEmpty = charts.length === 0 && !isLoading;

  return (
    <div className="h-full overflow-y-auto p-6 transition-colors duration-300">
      {isEmpty ? (
        <div className="h-full flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 mb-6 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <svg className="w-10 h-10" style={{ color: 'var(--text-muted)', opacity: 0.4 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
            </svg>
          </div>
          <h3 className="text-lg font-sora font-semibold mb-2" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
            Your dashboard awaits
          </h3>
          <p className="text-sm max-w-xs" style={{ color: 'var(--text-muted)', opacity: 0.4 }}>
            Ask a question to generate your first chart. Try one of the suggested queries in the chat.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 max-w-3xl mx-auto">
          {isLoading && <SkeletonLoader />}
          {charts.map((chart, i) => (
            <ChartCard key={chart.id} chart={chart} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
