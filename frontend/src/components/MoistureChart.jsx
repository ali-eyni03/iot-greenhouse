import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { formatClockTime } from '../utils/plantStatus';
import { useTheme } from '../context/ThemeContext';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark
                    rounded-lg px-3 py-2 text-xs shadow-sm">
      <p className="text-ink-soft dark:text-ink-soft-dark mb-1">{formatClockTime(point.timestamp)}</p>
      <p className="text-leaf dark:text-leaf-dark font-mono">{point.soil_moisture_percent}٪ رطوبت</p>
    </div>
  );
}

export function MoistureChart({ data }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const lineColor = isDark ? '#4ADE80' : '#16A34A';
  const axisColor = isDark ? '#F0FAF4' : '#1F2937';

  if (!data || data.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-ink-soft dark:text-ink-soft-dark text-sm">
        هنوز داده‌ی کافی برای نمودار ثبت نشده است
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={224}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="moistureFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity={0.35} />
            <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke={axisColor} strokeOpacity={0.08} vertical={false} />

        <XAxis
          dataKey="timestamp"
          tickFormatter={formatClockTime}
          stroke={axisColor}
          strokeOpacity={0.15}
          tick={{ fill: axisColor, opacity: 0.5, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          minTickGap={40}
        />
        <YAxis
          domain={[0, 100]}
          stroke={axisColor}
          strokeOpacity={0.15}
          tick={{ fill: axisColor, opacity: 0.5, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={32}
        />

        <Tooltip content={<CustomTooltip />} />

        <Area
          type="monotone"
          dataKey="soil_moisture_percent"
          stroke={lineColor}
          strokeWidth={2}
          fill="url(#moistureFill)"
          isAnimationActive={true}
          animationDuration={400}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
