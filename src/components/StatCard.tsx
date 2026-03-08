import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  className?: string;
}

const StatCard = ({ title, value, icon, trend, className = "" }: StatCardProps) => (
  <div className={`rounded-xl border border-border bg-card p-5 shadow-card transition-all duration-300 hover:shadow-card-hover animate-count-up ${className}`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="mt-1 text-3xl font-bold text-foreground">{value}</p>
        {trend && <p className="mt-1 text-xs font-medium text-success">{trend}</p>}
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-secondary">
        {icon}
      </div>
    </div>
  </div>
);

export default StatCard;
