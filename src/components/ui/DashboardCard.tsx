import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: "blue" | "green" | "purple" | "amber" | "red" | "teal";
  className?: string;
}

const colors = {
  blue: {
    bg: "bg-blue-50",
    icon: "bg-[#1e3a5f] text-white",
    value: "text-[#1e3a5f]",
  },
  green: {
    bg: "bg-green-50",
    icon: "bg-green-600 text-white",
    value: "text-green-700",
  },
  purple: {
    bg: "bg-purple-50",
    icon: "bg-purple-600 text-white",
    value: "text-purple-700",
  },
  amber: {
    bg: "bg-amber-50",
    icon: "bg-amber-500 text-white",
    value: "text-amber-700",
  },
  red: {
    bg: "bg-red-50",
    icon: "bg-red-600 text-white",
    value: "text-red-700",
  },
  teal: {
    bg: "bg-teal-50",
    icon: "bg-teal-600 text-white",
    value: "text-teal-700",
  },
};

export default function DashboardCard({
  title,
  value,
  subtitle,
  icon,
  color = "blue",
  className,
}: DashboardCardProps) {
  const c = colors[color];
  return (
    <div
      className={cn(
        "bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            {title}
          </p>
          <p className={cn("text-3xl font-bold mt-1", c.value)}>{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", c.icon)}>
          {icon}
        </div>
      </div>
    </div>
  );
}
