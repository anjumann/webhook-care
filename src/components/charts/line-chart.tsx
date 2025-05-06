import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface LineChartProps {
  data: any[];
  dataKey: string;
  valueFormatter?: (value: number) => string;
  showGridLines?: boolean;
  className?: string;
}

export function LineChart({
  data,
  dataKey,
  valueFormatter = (value: number) => `${value}`,
  showGridLines = true,
  className,
}: LineChartProps) {
  // Process data to group by date and calculate averages
  const processedData = data.reduce((acc: any[], item) => {
    const date = new Date(item.createdAt).toLocaleDateString();
    const existingDate = acc.find((d) => d.date === date);

    if (existingDate) {
      existingDate.values.push(item[dataKey]);
      existingDate.value = existingDate.values.reduce((a: number, b: number) => a + b, 0) / existingDate.values.length;
    } else {
      acc.push({
        date,
        value: item[dataKey],
        values: [item[dataKey]],
      });
    }

    return acc;
  }, []);

  // Sort by date
  processedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Only keep last 7 days
  const last7Days = processedData.slice(-7);

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={last7Days} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          {showGridLines && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis 
            dataKey="date" 
            fontSize={12}
            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          />
          <YAxis 
            fontSize={12}
            tickFormatter={valueFormatter}
          />
          <Tooltip
            formatter={valueFormatter}
            labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
} 