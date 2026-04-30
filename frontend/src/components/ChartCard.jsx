import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';

const COLORS = ['#00d4ff', '#00ff88', '#ff6b6b', '#ffd93d', '#c084fc', '#fb923c', '#38bdf8'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--tooltip-bg)',
      border: '1px solid var(--tooltip-border)',
      borderRadius: '8px',
      padding: '8px 12px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
    }}>
      <p style={{ color: 'var(--accent-cyan)', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: 'var(--text-primary)', fontSize: 12 }}>
          <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: p.color }} />
          {p.name}: <span className="font-mono font-medium">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </p>
      ))}
    </div>
  );
};

function getThemeColors() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  return {
    axisTick: isLight ? '#7a8599' : '#5a6a85',
    axisLine: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)',
    grid: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.04)',
    tableBorder: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
    tableHeaderBg: isLight ? '#f0f3f8' : '#0a1020',
    pieStroke: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(7,11,20,0.8)',
    legendColor: isLight ? '#7a8599' : '#5a6a85',
  };
}

function renderChart(chartType, data, xKey, yKey) {
  const tc = getThemeColors();

  const commonAxisProps = {
    tick: { fill: tc.axisTick, fontSize: 11, fontFamily: 'IBM Plex Mono' },
    axisLine: { stroke: tc.axisLine },
    tickLine: false
  };

  const gridProps = {
    strokeDasharray: '3 3',
    stroke: tc.grid
  };

  switch (chartType) {
    case 'line':
      return (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey={xKey} {...commonAxisProps} />
            <YAxis {...commonAxisProps} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey={yKey} stroke="var(--accent-cyan)" strokeWidth={2.5}
              fill="url(#lineGrad)" dot={{ r: 3, fill: 'var(--accent-cyan)', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: 'var(--accent-cyan)', stroke: 'var(--bg-primary)', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      );

    case 'bar':
      return (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity={0.9} />
                <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey={xKey} {...commonAxisProps} />
            <YAxis {...commonAxisProps} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey={yKey} fill="url(#barGrad)" radius={[6, 6, 0, 0]} maxBarSize={50} />
          </BarChart>
        </ResponsiveContainer>
      );

    case 'pie': {
      const MAX_SLICES = 8;
      let pieData = data;
      if (data.length > MAX_SLICES) {
        const sorted = [...data].sort((a, b) => Math.abs(Number(b[yKey]) || 0) - Math.abs(Number(a[yKey]) || 0));
        const top = sorted.slice(0, MAX_SLICES - 1);
        const otherTotal = sorted.slice(MAX_SLICES - 1).reduce((sum, r) => sum + (Number(r[yKey]) || 0), 0);
        pieData = [...top, { [xKey]: 'Other', [yKey]: otherTotal }];
      }
      return (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={pieData} dataKey={yKey} nameKey={xKey} cx="50%" cy="45%"
              outerRadius={85} innerRadius={40}
              stroke={tc.pieStroke} strokeWidth={2}
              label={({ name, percent }) => percent > 0.04 ? `${name.length > 12 ? name.slice(0, 10) + '…' : name} ${(percent * 100).toFixed(0)}%` : ''}
              labelLine={{ stroke: tc.axisTick, strokeWidth: 1 }}
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'IBM Plex Mono', color: tc.legendColor }} />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    case 'scatter':
      return (
        <ResponsiveContainer width="100%" height={240}>
          <ScatterChart margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey={xKey} name={xKey} {...commonAxisProps} />
            <YAxis dataKey={yKey} name={yKey} {...commonAxisProps} />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: tc.axisLine }} />
            <Scatter data={data} fill="var(--accent-cyan)">
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      );

    case 'table':
      return (
        <div className="overflow-auto max-h-[260px]">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr style={{ borderBottom: `1px solid ${tc.tableBorder}` }}>
                {Object.keys(data[0] || {}).map(key => (
                  <th key={key} className="text-left py-2 px-3 text-dt-text-muted font-medium sticky top-0"
                    style={{ background: tc.tableHeaderBg }}>
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${tc.tableBorder}` }}
                  className="hover:bg-[var(--bg-card)] transition-colors">
                  {Object.values(row).map((val, j) => (
                    <td key={j} className="py-1.5 px-3 text-dt-text-primary/80">
                      {typeof val === 'number' ? val.toLocaleString() : val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    default:
      return <p className="text-dt-text-muted text-sm text-center py-8">Unknown chart type: {chartType}</p>;
  }
}

export default function ChartCard({ chart, index }) {
  const { chart_type, title, data, x_key, y_key, insight, sql_query } = chart;

  return (
    <div
      className="glass-card gradient-border p-5 animate-fade-in-up transition-colors duration-300"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Title */}
      <h3 className="text-sm font-sora font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        <span className={`w-2 h-2 rounded-full ${
          chart_type === 'line' ? 'bg-dt-accent-cyan' :
          chart_type === 'bar' ? 'bg-dt-accent-green' :
          chart_type === 'pie' ? 'bg-purple-400' :
          chart_type === 'scatter' ? 'bg-amber-400' :
          'bg-dt-text-muted'
        }`} />
        {title}
        <span className="ml-auto text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>{chart_type}</span>
      </h3>

      {/* Chart */}
      {renderChart(chart_type, data, x_key, y_key)}

      {/* Insight */}
      {insight && (
        <p className="text-xs mt-4 pt-3 leading-relaxed"
          style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
          💡 {insight}
        </p>
      )}
    </div>
  );
}
