import { useState } from "react";
import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";

interface StatBadgeProps {
    label: string;
    value: number | string;
    icon?: React.ElementType;
    trend?: "up" | "down" | "neutral";
    secondary?: boolean;
    description?: string;
    onClick?: (e: React.MouseEvent) => void;
    className?: string;
    isTrap?: boolean;
    indicator?: string;
    indicatorColor?: string;
}

export function StatBadge({
    label,
    value,
    icon: Icon,
    trend,
    secondary,
    description,
    onClick,
    className = "",
    isTrap = false,
    indicator,
    indicatorColor,
}: StatBadgeProps) {
    const [showTooltip, setShowTooltip] = useState(false);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onClick) onClick(e);
        if (description) setShowTooltip((prev) => !prev);
    };

    const trendIcon = {
        up: <TrendingUp className="w-3 h-3 text-green-500" />,
        down: <TrendingDown className="w-3 h-3 text-red-500" />,
        neutral: <Minus className="w-3 h-3 text-gray-400" />,
    }[trend || "neutral"];

    const baseClass = secondary
        ? "bg-gray-50/70 dark:bg-neutral-800/70 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-neutral-700"
        : isTrap
            ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
            : "bg-gray-50 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border-gray-100 dark:border-neutral-700";

    return (
        <span
            className={`relative inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${baseClass} whitespace-nowrap transition-colors cursor-pointer ${className}`}
            onClick={handleClick}
            title={description}
        >
            {Icon && <Icon className="w-3 h-3 text-gray-400" />}
            <span className="font-medium tabular-nums">{value}</span>
            <span className="text-[10px] opacity-75">{label}</span>
            {trend && trendIcon}
            {indicator && (
                <span className={`text-[10px] font-medium ${indicatorColor || "text-gray-500"}`}>
                    {indicator}
                </span>
            )}
            {description && <Info className="w-3 h-3 text-gray-400 opacity-50" />}

            {showTooltip && description && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg z-10 whitespace-normal max-w-[200px] text-center pointer-events-none">
                    {description}
                </div>
            )}
        </span>
    );
}