export default function DataPreview({ schema, uploadResult }) {
  const data = uploadResult || schema;
  if (!data) return null;

  return (
    <div className="glass-card p-4 mx-4 mb-3 transition-colors duration-300">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4 text-dt-accent-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M3 5V19A9 3 0 0 0 21 19V5" />
          <path d="M3 12A9 3 0 0 0 21 12" />
        </svg>
        <span className="text-sm font-medium text-dt-text-primary font-mono">
          {data.table_name}
        </span>
        <span className="text-xs text-dt-text-muted ml-auto">
          {data.row_count?.toLocaleString()} rows
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <th className="text-left py-1.5 px-2 text-dt-text-muted font-medium">Column</th>
              <th className="text-left py-1.5 px-2 text-dt-text-muted font-medium">Type</th>
              <th className="text-left py-1.5 px-2 text-dt-text-muted font-medium">Sample Values</th>
            </tr>
          </thead>
          <tbody>
            {(data.columns || []).map((col, i) => (
              <tr key={i} className="hover:bg-[var(--bg-card)] transition-colors"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td className="py-1.5 px-2 text-dt-accent-cyan">{col.name}</td>
                <td className="py-1.5 px-2 text-dt-text-muted">{col.type}</td>
                <td className="py-1.5 px-2 text-dt-text-primary/70 truncate max-w-[200px]">
                  {(col.sample_values || []).join(', ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
