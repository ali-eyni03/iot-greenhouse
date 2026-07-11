import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { formatClockTime } from '../utils/plantStatus';
import { useTheme } from '../context/ThemeContext';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark
                    rounded-lg px-3 py-2 text-xs space-y-1 shadow-sm">
      <p className="text-ink-soft dark:text-ink-soft-dark">{formatClockTime(point.timestamp)}</p>
      <p className="text-amber dark:text-amber-dark font-mono">{point.air_temperature}° دما</p>
      <p className="text-ink dark:text-ink-dark font-mono">{point.air_humidity}٪ رطوبت هوا</p>
    </div>
  );
}

export function ClimateChart({ data }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const axisColor = isDark ? '#F0FAF4' : '#1F2937';
  const tempColor = isDark ? '#FBBF24' : '#F59E0B';
  const humidityColor = isDark ? '#9CA89F' : '#6B7280';

  if (!data || data.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-ink-soft dark:text-ink-soft-dark text-sm">
        هنوز داده‌ی کافی برای نمودار ثبت نشده است
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={224}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
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
          stroke={axisColor}
          strokeOpacity={0.15}
          tick={{ fill: axisColor, opacity: 0.5, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={32}
        />

        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12, opacity: 0.7, color: axisColor }}
          formatter={(value) => (value === 'air_temperature' ? 'دما' : 'رطوبت هوا')}
        />

        <Line
          type="monotone"
          dataKey="air_temperature"
          stroke={tempColor}
          strokeWidth={2}
          dot={false}
          isAnimationActive={true}
          animationDuration={400}
        />
        <Line
          type="monotone"
          dataKey="air_humidity"
          stroke={humidityColor}
          strokeWidth={2}
          dot={false}
          isAnimationActive={true}
          animationDuration={400}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
