/**
 * ShareDistribution Component
 * Visual chart for share distribution
 */

import React, { useMemo } from 'react';

export interface ShareItem {
  id: string;
  label: string;
  percentage: number;
  amount?: number;
  color?: string;
}

export interface ShareDistributionProps {
  shares: ShareItem[];
  totalAmount?: number;
  currency?: string;
  showLegend?: boolean;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const COLORS = [
  '#10B981', // emerald
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#F59E0B', // amber
  '#EF4444', // red
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#F97316', // orange
  '#6366F1', // indigo
];

export const ShareDistribution: React.FC<ShareDistributionProps> = ({
  shares,
  totalAmount,
  currency = 'ETH',
  showLegend = true,
  showLabels = true,
  size = 'md',
  className = '',
}) => {
  const sizeConfig = useMemo(() => {
    const configs = {
      sm: { chart: 120, stroke: 16 },
      md: { chart: 180, stroke: 24 },
      lg: { chart: 240, stroke: 32 },
    };
    return configs[size];
  }, [size]);

  const chartData = useMemo(() => {
    let currentAngle = -90; // Start from top
    return shares.map((share, index) => {
      const angle = (share.percentage / 100) * 360;
      const startAngle = currentAngle;
      currentAngle += angle;
      return {
        ...share,
        color: share.color || COLORS[index % COLORS.length],
        startAngle,
        endAngle: currentAngle,
        angle,
      };
    });
  }, [shares]);

  const createArcPath = (startAngle: number, endAngle: number, radius: number) => {
    const start = polarToCartesian(sizeConfig.chart / 2, sizeConfig.chart / 2, radius, endAngle);
    const end = polarToCartesian(sizeConfig.chart / 2, sizeConfig.chart / 2, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

    return [
      'M', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    ].join(' ');
  };

  const polarToCartesian = (cx: number, cy: number, radius: number, angle: number) => {
    const radians = (angle * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(radians),
      y: cy + radius * Math.sin(radians),
    };
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(amount);
  };

  return (
    <div className={`${className}`}>
      <div className="flex flex-col items-center">
        {/* Donut Chart */}
        <div className="relative" style={{ width: sizeConfig.chart, height: sizeConfig.chart }}>
          <svg viewBox={`0 0 ${sizeConfig.chart} ${sizeConfig.chart}`} className="transform -rotate-90">
            {chartData.map((item, index) => {
              if (item.percentage === 0) return null;
              const radius = (sizeConfig.chart - sizeConfig.stroke) / 2;
              
              if (item.percentage >= 100) {
                // Full circle
                return (
                  <circle
                    key={index}
                    cx={sizeConfig.chart / 2}
                    cy={sizeConfig.chart / 2}
                    r={radius}
                    fill="none"
                    stroke={item.color}
                    strokeWidth={sizeConfig.stroke}
                    className="transition-all duration-500"
                  />
                );
              }

              return (
                <path
                  key={index}
                  d={createArcPath(item.startAngle, item.endAngle, radius)}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={sizeConfig.stroke}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              );
            })}
          </svg>

          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {shares.length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Recipients
            </p>
          </div>
        </div>

        {/* Total Amount */}
        {totalAmount !== undefined && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {formatAmount(totalAmount)} {currency}
            </p>
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="mt-6 space-y-3">
          {chartData.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {item.label}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {item.percentage.toFixed(1)}%
                </p>
                {item.amount !== undefined && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatAmount(item.amount)} {currency}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bar Chart Alternative */}
      {showLabels && !showLegend && (
        <div className="mt-6 space-y-2">
          {chartData.map((item) => (
            <div key={item.id}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700 dark:text-gray-300 truncate">
                  {item.label}
                </span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(ShareDistribution);

