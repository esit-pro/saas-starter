'use client';

import * as React from 'react';
import * as RechartsPrimitive from 'recharts';
import {
  Bar,
  CartesianGrid,
  Label,
  BarChart as RechartsBarChart,
  Legend as RechartsLegend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { AxisDomain, AxisInterval } from "recharts/types/util/types"
import { ContentType, TooltipProps } from 'recharts/types/component/Tooltip';

import { cn } from '@/lib/utils';

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: '', dark: '.dark' } as const;

//#region Shape

function deepEqual<T>(obj1: T, obj2: T): boolean {
  if (obj1 === obj2) return true

  if (
    typeof obj1 !== "object" ||
    typeof obj2 !== "object" ||
    obj1 === null ||
    obj2 === null
  ) {
    return false
  }

  const keys1 = Object.keys(obj1) as Array<keyof T>
  const keys2 = Object.keys(obj2) as Array<keyof T>

  if (keys1.length !== keys2.length) return false

  for (const key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) return false
  }

  return true
}

interface ShapeProps {
  x: number
  y: number
  width: number
  height: number
  fillOpacity: number
  fill: string
  name: string
  value: number
  payload: any
}

const renderShape = (
  props: ShapeProps,
  activeBar: { dataKey: string; payload: any } | undefined,
  activeLegend: string | undefined,
  layout: string,
) => {
  const { fillOpacity, name, payload, value } = props
  let { x, width, y, height } = props

  if (layout === "horizontal" && height < 0) {
    y += height
    height = Math.abs(height) // height must be a positive number
  } else if (layout === "vertical" && width < 0) {
    x += width
    width = Math.abs(width) // width must be a positive number
  }

  const isActive =
    activeBar &&
    activeLegend &&
    activeBar.dataKey === name &&
    deepEqual(activeBar.payload, payload)

  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={props.fill}
      radius={4}
      className={cn(
        isActive ? "stroke-2 stroke-current" : "",
        activeLegend === name && !isActive ? "opacity-30" : "",
        activeLegend !== undefined && activeLegend !== name && !isActive
          ? "opacity-30"
          : ""
      )}
      fillOpacity={activeLegend === name || activeLegend === undefined ? 1 : fillOpacity}
    />
  )
}

//#endregion

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  );
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />');
  }

  return context;
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    config: ChartConfig;
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >['children'];
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line-line]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        {/* Debounce the chart to avoid laggy behavior on window resize */}
        <RechartsPrimitive.ResponsiveContainer debounce={2000}>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = 'Chart';

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([_, config]) => config.theme || config.color
  );

  if (!colorConfig.length) {
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES).map(
          ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color;
    return color ? `  --color-${key}: ${color};` : null;
  })
  .join('\n')}
}
`
        )
      }}
    />
  );
};

const ChartTooltip = RechartsPrimitive.Tooltip;

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentProps<'div'> & {
      hideLabel?: boolean;
      hideIndicator?: boolean;
      indicator?: 'line' | 'dot' | 'dashed';
      nameKey?: string;
      labelKey?: string;
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = 'dot',
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey
    },
    ref
  ) => {
    const { config } = useChart();

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null;
      }

      const [item] = payload;
      const key = `${labelKey || item.dataKey || item.name || 'value'}`;
      const itemConfig = getPayloadConfigFromPayload(config, item, key);
      const value =
        !labelKey && typeof label === 'string'
          ? config[label as keyof typeof config]?.label || label
          : itemConfig?.label;

      if (labelFormatter) {
        return (
          <div className={cn('font-medium', labelClassName)}>
            {labelFormatter(value, payload)}
          </div>
        );
      }

      if (!value) {
        return null;
      }

      return <div className={cn('font-medium', labelClassName)}>{value}</div>;
    }, [
      label,
      labelFormatter,
      payload,
      hideLabel,
      labelClassName,
      config,
      labelKey
    ]);

    if (!active || !payload?.length) {
      return null;
    }

    const nestLabel = payload.length === 1 && indicator !== 'dot';

    return (
      <div
        ref={ref}
        className={cn(
          'grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl',
          className
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className='grid gap-1.5'>
          {payload.map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || 'value'}`;
            const itemConfig = getPayloadConfigFromPayload(config, item, key);
            const indicatorColor = color || item.payload.fill || item.color;

            return (
              <div
                key={item.dataKey}
                className={cn(
                  'flex w-full items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground',
                  indicator === 'dot' && 'items-center'
                )}
              >
                {formatter && item.value && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            'shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]',
                            {
                              'h-2.5 w-2.5': indicator === 'dot',
                              'w-1': indicator === 'line',
                              'w-0 border-[1.5px] border-dashed bg-transparent':
                                indicator === 'dashed',
                              'my-0.5': nestLabel && indicator === 'dashed'
                            }
                          )}
                          style={
                            {
                              '--color-bg': indicatorColor,
                              '--color-border': indicatorColor
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        'flex flex-1 justify-between leading-none',
                        nestLabel ? 'items-end' : 'items-center'
                      )}
                    >
                      <div className='grid gap-1.5'>
                        {nestLabel ? tooltipLabel : null}
                        <span className='text-muted-foreground'>
                          {itemConfig?.label || item.name}
                        </span>
                      </div>
                      {item.value && (
                        <span className='font-mono font-medium tabular-nums text-foreground'>
                          {item.value.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);
ChartTooltipContent.displayName = 'ChartTooltip';

const ChartLegend = RechartsPrimitive.Legend;

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> &
    Pick<RechartsPrimitive.LegendProps, 'payload' | 'verticalAlign'> & {
      hideIcon?: boolean;
      nameKey?: string;
    }
>(
  (
    { className, hideIcon = false, payload, verticalAlign = 'bottom', nameKey },
    ref
  ) => {
    const { config } = useChart();

    if (!payload?.length) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-center gap-4',
          verticalAlign === 'top' ? 'pb-3' : 'pt-3',
          className
        )}
      >
        {payload.map((item) => {
          const key = `${nameKey || item.dataKey || 'value'}`;
          const itemConfig = getPayloadConfigFromPayload(config, item, key);

          return (
            <div
              key={item.value}
              className={cn(
                'flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground'
              )}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className='h-2 w-2 shrink-0 rounded-[2px]'
                  style={{
                    backgroundColor: item.color
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          );
        })}
      </div>
    );
  }
);
ChartLegendContent.displayName = 'ChartLegend';

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== 'object' || payload === null) {
    return undefined;
  }

  const payloadPayload =
    'payload' in payload &&
    typeof payload.payload === 'object' &&
    payload.payload !== null
      ? payload.payload
      : undefined;

  let configLabelKey: string = key;

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === 'string'
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string;
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === 'string'
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string;
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config];
}

// New BarChart component
export type BarChartProps = {
  data: Record<string, any>[]
  categories: string[]
  index: string
  colors?: string[]
  valueFormatter?: (value: number) => string
  startEndOnly?: boolean
  intervalType?: "equidistant" | "preserveStart" | "preserveEnd" | "preserveStartEnd"
  noDataText?: string
  showAnimation?: boolean
  animationDuration?: number
  showXAxis?: boolean
  showYAxis?: boolean
  yAxisWidth?: number
  showTooltip?: boolean
  showLegend?: boolean
  showGridLines?: boolean
  showGradient?: boolean
  autoMinValue?: boolean
  minValue?: number
  maxValue?: number
  stack?: boolean
  layout?: "horizontal" | "vertical"
  onValueChange?: (value: any) => void
  className?: string
  customTooltip?: ContentType<number, string>
}

export const BarChart = React.forwardRef<HTMLDivElement, BarChartProps>(
  (
    {
      data = [],
      categories,
      index,
      colors = ["blue", "purple", "indigo", "emerald", "rose", "gray"],
      valueFormatter,
      startEndOnly = false,
      intervalType = "equidistant",
      noDataText = "No data available",
      showAnimation = false,
      animationDuration = 900,
      showXAxis = true,
      showYAxis = true,
      yAxisWidth = 40,
      showTooltip = true,
      showLegend = true,
      showGridLines = true,
      showGradient = false,
      autoMinValue = false,
      minValue,
      maxValue,
      stack = false,
      layout = "vertical",
      onValueChange,
      className,
      customTooltip,
    },
    ref
  ) => {
    const [legendHeight, setLegendHeight] = React.useState(60)
    const [activeBar, setActiveBar] = React.useState<{ dataKey: string; payload: any } | undefined>(undefined)
    const [activeLegend, setActiveLegend] = React.useState<string | undefined>(undefined)
    
    const windowResizeHandler = React.useCallback(() => {
      const legendElement = document.getElementById("recharts-legend-wrapper")
      if (legendElement) {
        setLegendHeight(legendElement.getBoundingClientRect().height)
      }
    }, [])
    
    React.useEffect(() => {
      if (showLegend) {
        windowResizeHandler()
        window.addEventListener("resize", windowResizeHandler)
      }
      
      return () => {
        window.removeEventListener("resize", windowResizeHandler)
      }
    }, [showLegend, windowResizeHandler])

    const dataKeys = {
      xAxisKey: layout === "vertical" ? index : "value",
      yAxisKey: layout === "vertical" ? "value" : index,
    }

    const yAxisDomain = React.useMemo(() => {
      if (minValue !== undefined && maxValue !== undefined) {
        return [minValue, maxValue] as AxisDomain
      }
      if (minValue !== undefined) {
        return [minValue, "auto"] as AxisDomain
      }
      if (maxValue !== undefined) {
        return [0, maxValue] as AxisDomain
      }
      if (autoMinValue) {
        return ["auto", "auto"] as AxisDomain
      }
      
      return [0, "auto"] as AxisDomain
    }, [autoMinValue, minValue, maxValue])

    const colorMap: Record<string, string> = {
      blue: "#3b82f6",
      purple: "#a855f7",
      indigo: "#6366f1",
      emerald: "#10b981",
      rose: "#f43f5e",
      gray: "#6b7280",
    }

    const handleBarClick = (bar: any) => {
      if (onValueChange) {
        onValueChange({
          eventType: "barClick",
          categoryClicked: bar.dataKey,
          itemData: bar.payload,
        })
      }
    }

    const handleLegendClick = (dataKey: string) => {
      setActiveLegend(activeLegend === dataKey ? undefined : dataKey)
      
      if (onValueChange) {
        onValueChange({
          eventType: "legendClick",
          categoryClicked: dataKey,
        })
      }
    }

    const tooltipFormatter = (value: number, _: string, props: any) => {
      return [valueFormatter ? valueFormatter(value) : value, props.dataKey]
    }

    return (
      <div
        ref={ref}
        className={cn(
          "w-full h-80 flex flex-col",
          className
        )}
      >
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart
              data={data}
              layout={layout}
              barGap={2}
              barCategoryGap={8}
              onMouseMove={(e) => {
                if (e.activePayload) {
                  setActiveBar({
                    dataKey: e.activePayload[0].dataKey as string,
                    payload: e.activePayload[0].payload,
                  })
                }
              }}
              onMouseLeave={() => setActiveBar(undefined)}
              margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
            >
              {showGridLines ? (
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-slate-200 dark:stroke-slate-800"
                  horizontal={true}
                  vertical={false}
                />
              ) : null}
              
              {showXAxis ? (
                <XAxis
                  dataKey={index}
                  axisLine={false}
                  tick={{ transform: "translate(0, 6)" }}
                  ticks={
                    startEndOnly
                      ? [data[0][index], data[data.length - 1][index]]
                      : undefined
                  }
                  interval={intervalType === "equidistant" ? "preserveStartEnd" : 0}
                  minTickGap={5}
                  className="text-xs font-medium text-slate-500 dark:text-slate-400"
                  tickLine={false}
                  padding={{ left: 10, right: 10 }}
                  angle={0}
                  height={20}
                />
              ) : null}
              
              {showYAxis ? (
                <YAxis
                  dataKey="value"
                  axisLine={false}
                  tickLine={false}
                  className="text-xs font-medium text-slate-500 dark:text-slate-400"
                  tick={{ transform: "translate(-3, 0)" }}
                  width={yAxisWidth}
                  domain={yAxisDomain}
                  tickFormatter={valueFormatter}
                />
              ) : null}
              
              {showTooltip ? (
                <Tooltip
                  cursor={false}
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: "0.375rem",
                    boxShadow:
                      "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={tooltipFormatter}
                  wrapperClassName="!outline-none"
                  content={customTooltip}
                />
              ) : null}
              
              {showLegend ? (
                <RechartsLegend
                  verticalAlign="top"
                  align="center"
                  height={30}
                  className="text-sm mb-6"
                  onClick={(e) => {
                    if (e && e.dataKey) {
                      handleLegendClick(e.dataKey.toString())
                    }
                  }}
                  iconType="circle"
                  iconSize={10}
                  formatter={(value: string) => (
                    <span
                      className={cn(
                        "cursor-pointer",
                        activeLegend !== undefined && activeLegend !== value
                          ? "opacity-30"
                          : ""
                      )}
                    >
                      {value}
                    </span>
                  )}
                  wrapperStyle={{ paddingBottom: "1rem" }}
                />
              ) : null}
              
              {categories.map((category, idx) => (
                <Bar
                  key={category}
                  name={category}
                  dataKey={category}
                  fill={colorMap[colors[idx % colors.length]]}
                  radius={[4, 4, 0, 0]}
                  stackId={stack ? "a" : undefined}
                  onClick={(props) => handleBarClick(props)}
                  isAnimationActive={showAnimation}
                  animationDuration={animationDuration}
                  shape={(props: any) =>
                    renderShape(props as ShapeProps, activeBar, activeLegend, layout)
                  }
                />
              ))}
            </RechartsBarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              {noDataText}
            </p>
          </div>
        )}
      </div>
    )
  }
)

BarChart.displayName = "BarChart"

// Example data for demo purposes
const data = [
  {
    date: "Apr 23",
    "Active Hours": 234,
    Recovery: 93,
  },
  {
    date: "May 23",
    "Active Hours": 320,
    Recovery: 120,
  },
  {
    date: "Jun 23",
    "Active Hours": 295,
    Recovery: 118,
  },
  {
    date: "Jul 23",
    "Active Hours": 180,
    Recovery: 90,
  },
  {
    date: "Aug 23",
    "Active Hours": 175,
    Recovery: 93,
  },
  {
    date: "Sep 23",
    "Active Hours": 179,
    Recovery: 99,
  },
  {
    date: "Oct 23",
    "Active Hours": 143,
    Recovery: 101,
  },
  {
    date: "Nov 23",
    "Active Hours": 164,
    Recovery: 104,
  },
  {
    date: "Dec 23",
    "Active Hours": 201,
    Recovery: 86,
  },
  {
    date: "Jan 24",
    "Active Hours": 301,
    Recovery: 82,
  },
  {
    date: "Feb 24",
    "Active Hours": 235,
    Recovery: 72,
  },
  {
    date: "Mar 24",
    "Active Hours": 290,
    Recovery: 62,
  },
]

export const BarChartExample = () => {
  return (
    <BarChart
      className="h-64"
      data={data}
      index="date"
      categories={["Active Hours", "Recovery"]}
      yAxisWidth={60}
      maxValue={400}
      onValueChange={(v) => console.log(v)}
      valueFormatter={(number: number) =>
        `${Intl.NumberFormat("us").format(number).toString()}`
      }
    />
  )
}

export {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent
};