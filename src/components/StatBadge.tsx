import { useState } from "react";
import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { MatchResult } from "@/utils/extractMatchResult";

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
    scoreResult?: string | undefined;
    isBetter?: boolean;
    results?: MatchResult
}

export function StatBadge({
    scoreResult,
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
    isBetter = false,
    results = undefined,
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

    // 🔥 Lógica de colores (prioridad de arriba a abajo)
    let baseClass = "";

    // 1. ¿Es marcador exacto y coincide?
    const isScoreMatch = (() => {
        if (!scoreResult || scoreResult === "undefined-undefined" || scoreResult === "-") return false;
        const normalizedReal = String(scoreResult).replace(/\s/g, "");
        const normalizedPredicted = String(value).replace(/\s/g, "");
        return normalizedReal === normalizedPredicted;
    })();

    if (isScoreMatch) {
        baseClass = "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700";
    }
    // 2. ¿Es mejor que el rival en esta métrica?
    else if (isBetter) {
        baseClass = "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700";
    }
    // 3. ¿Es trampa?
    else if (isTrap) {
        baseClass = "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800";
    }
    // 4. ¿Es secundario?
    else if (secondary) {
        baseClass = "bg-gray-50/70 dark:bg-neutral-800/70 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-neutral-700";
    }
    // 5. Por defecto
    else {
        baseClass = "bg-gray-50 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border-gray-100 dark:border-neutral-700";
    }
    return (
        <span
            className={`relative inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border  ${baseClass} whitespace-nowrap transition-colors cursor-pointer ${className}`}
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
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg z-10 whitespace-normal max-w-50 text-center pointer-events-none">
                    {description}
                </div>
            )}
        </span>
    );
}