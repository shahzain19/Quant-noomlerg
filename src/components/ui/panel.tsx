import { cn, formatTimestamp } from "@/lib/utils";

export function DataTimestamp({ timestamp }: { timestamp: string | null }) {
  return (
    <span className="text-[11px] text-zinc-500">
      Data timestamp: {timestamp ? formatTimestamp(timestamp) : "No data available"}
    </span>
  );
}

export function NoData({ message = "No data available" }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-8 text-zinc-500 text-sm">{message}</div>
  );
}

export function Panel({
  title,
  children,
  className,
  action,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={cn("border border-zinc-800 bg-zinc-950/50", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
          {title && (
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              {title}
            </h3>
          )}
          {action}
        </div>
      )}
      <div className="p-3">{children}</div>
    </div>
  );
}

export function ChangeValue({
  value,
  className,
}: {
  value: number | null;
  className?: string;
}) {
  if (value == null) return <span className="text-zinc-500">—</span>;
  const positive = value >= 0;
  return (
    <span className={cn(positive ? "text-green-500" : "text-red-500", className)}>
      {positive ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
}

export function MetricRow({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex justify-between items-baseline py-1", className)}>
      <span className="text-zinc-500">{label}</span>
      <span className="font-mono text-zinc-200">{value}</span>
    </div>
  );
}
