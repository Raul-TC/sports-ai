"use client";

import { useState } from "react";
import { ExtendedMatchPrediction } from "@/lib/predictions";
import OddsPanel from "@/components/OddsPanel";
import {
    ChevronDown,
    ChevronUp,
    Trophy,
    Clock,
    TrendingUp,
    TrendingDown,
    Minus,
    Goal,
    Target,
    CornerDownRight,
    Activity,
    Crosshair,
    Gauge,
    BarChart,
    Info,
} from "lucide-react";

// Interfaz para las métricas de un equipo
interface TeamMetrics {
    xG: number;
    xGA: number;
    expectedGoals: number;
    shotFactor: number;
    offensiveEfficiency: number;
    efficiency: number;
    precisionDrop: number;
    corners: number;
    shots: number;
    shotsOT: number;
}

interface TeamInfo {
    teamId: number;
    teamName: string;
    metrics?: TeamMetrics;
}

interface PredictionResult {
    matchUrl: string;
    competitionName: string;
    startTime: string;
    home: TeamInfo;
    away: TeamInfo;
    prediction: ExtendedMatchPrediction;
}

interface MatchesExplorerProps {
    predictions: PredictionResult[];
}

export default function MatchesExplorer({ predictions }: MatchesExplorerProps) {
    const [selectedMatchUrl, setSelectedMatchUrl] = useState<string | null>(null);

    const toggleMatch = (url: string) => {
        setSelectedMatchUrl(selectedMatchUrl === url ? null : url);
    };

    const formatTime = (iso: string) => {
        const date = new Date(iso);
        return date.toLocaleString("es-ES", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getFavorite = (pred: ExtendedMatchPrediction) => {
        const { homeWin, draw, awayWin } = pred.moneyline;
        if (homeWin.prob > draw.prob && homeWin.prob > awayWin.prob) return "home";
        if (awayWin.prob > homeWin.prob && awayWin.prob > draw.prob) return "away";
        return "draw";
    };

    const getTrend = (value: number) => {
        if (value > 1.2) return "up";
        if (value < 0.8) return "down";
        return "neutral";
    };

    // Componente de badge con tooltip en click (para móvil) y hover (para desktop)
    const StatBadge = ({
        label,
        value,
        icon: Icon,
        trend,
        secondary,
        description,
    }: {
        label: string;
        value: number | string;
        icon?: React.ElementType;
        trend?: "up" | "down" | "neutral";
        secondary?: boolean;
        description?: string;
    }) => {
        const [showTooltip, setShowTooltip] = useState(false);

        const toggleTooltip = (e: React.MouseEvent) => {
            e.stopPropagation(); // Evita que el clic llegue al padre
            setShowTooltip((prev) => !prev);
        };

        const trendIcon = {
            up: <TrendingUp className="w-3 h-3 text-green-500" />,
            down: <TrendingDown className="w-3 h-3 text-red-500" />,
            neutral: <Minus className="w-3 h-3 text-gray-400" />,
        }[trend || "neutral"];

        const baseClass = secondary
            ? "bg-gray-50/70 dark:bg-neutral-800/70 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-neutral-700"
            : "bg-gray-50 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border-gray-100 dark:border-neutral-700";

        return (
            <span
                className={`relative inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${baseClass} whitespace-nowrap transition-colors cursor-pointer`}
                onClick={toggleTooltip}
                title={description} // Tooltip nativo para desktop (hover)
            >
                {Icon && <Icon className="w-3 h-3 text-gray-400" />}
                <span className="font-medium tabular-nums">{value}</span>
                <span className="text-[10px] opacity-75">{label}</span>
                {trend && trendIcon}
                {description && <Info className="w-3 h-3 text-gray-400 opacity-50" />}

                {/* Tooltip personalizado (se muestra al hacer clic) */}
                {showTooltip && description && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg z-10 whitespace-normal max-w-[200px] text-center pointer-events-none">
                        {description}
                    </div>
                )}
            </span>
        );
    };

    const TeamStatsBlock = ({
        team,
        title,
    }: {
        team: TeamInfo;
        title: string;
    }) => {
        const m = team.metrics;
        if (!m) return <div className="text-xs text-gray-400">Sin datos</div>;

        const effTrend = getTrend(m.offensiveEfficiency);

        const primaryStats = [
            {
                label: "Gol Esp",
                value: m.xG.toFixed(2),
                icon: Goal,
                description: "Goles esperados según el modelo",
            },
            {
                label: "Gol Esp Con",
                value: m.xGA.toFixed(2),
                icon: Target,
                description: "Goles esperados encajados",
            },
            {
                label: "Tiros",
                value: m.shots.toFixed(1),
                description: "Número de tiros totales",
            },
            {
                label: "Tiro a Puerta",
                value: m.shotsOT.toFixed(1),
                icon: Crosshair,
                description: "Tiros que van entre los tres palos",
            },
            {
                label: "Córners",
                value: m.corners.toFixed(1),
                icon: CornerDownRight,
                description: "Córners a favor",
            },
            {
                label: "Eficiencia Of",
                value: m.offensiveEfficiency.toFixed(2),
                icon: Activity,
                trend: effTrend,
                description:
                    m.offensiveEfficiency > 1
                        ? "Rendimiento superior al esperado (goles > xG)"
                        : m.offensiveEfficiency < 1
                            ? "Rendimiento inferior al esperado (goles < xG)"
                            : "Rendimiento en línea con lo esperado",
            },
        ];

        const secondaryStats = [
            {
                label: "Goles Previstos",
                value: m.expectedGoals.toFixed(2),
                icon: Goal,
                description: "Goles que se esperan en este partido (Poisson)",
            },
            {
                label: "Precisión Tiro",
                value: m.shotFactor.toFixed(2),
                icon: Gauge,
                description: "Tiros a puerta / tiros totales",
            },
            {
                label: "Eficiencia Bruta",
                value: m.efficiency.toFixed(2),
                icon: BarChart,
                description: "Goles / tiros totales",
            },
            {
                label: "Caída Precisión",
                value: m.precisionDrop.toFixed(3),
                icon: Target,
                description:
                    m.precisionDrop > 0
                        ? "La precisión ha mejorado recientemente"
                        : m.precisionDrop < 0
                            ? "La precisión ha empeorado recientemente"
                            : "Sin cambios en la precisión",
            },
        ];

        return (
            <div className="space-y-1.5">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {title}
                </div>
                <div className="flex flex-wrap gap-1">
                    {primaryStats.map((stat, idx) => (
                        <StatBadge
                            key={idx}
                            label={stat.label}
                            value={stat.value}
                            icon={stat.icon}
                            trend={stat.trend as any}
                            description={stat.description}
                        />
                    ))}
                </div>
                <div className="flex flex-wrap gap-1">
                    {secondaryStats.map((stat, idx) => (
                        <StatBadge
                            key={idx}
                            label={stat.label}
                            value={stat.value}
                            icon={stat.icon}
                            secondary
                            description={stat.description}
                        />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 tracking-tight flex items-center gap-2">
                <Trophy className="w-6 h-6 text-indigo-500" />
                Pronósticos de Partidos
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2 mb-4">
                {predictions.length} partidos disponibles · Haz clic en una tarjeta para ver las odds completas
            </p>

            {predictions.length === 0 ? (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                    No hay predicciones disponibles en este momento.
                </div>
            ) : (
                predictions.map((r) => {
                    const isSelected = selectedMatchUrl === r.matchUrl;
                    const favorite = getFavorite(r.prediction);
                    const favTeam =
                        favorite === "home"
                            ? r.home.teamName
                            : favorite === "away"
                                ? r.away.teamName
                                : "Empate";

                    return (
                        <div
                            key={r.matchUrl}
                            className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden transition-all duration-200 hover:shadow-md"
                        >
                            <div
                                className="p-4 cursor-pointer"
                                onClick={() => toggleMatch(r.matchUrl)}
                            >
                                {/* Fila 1: Competición y hora */}
                                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        <span>{formatTime(r.startTime)}</span>
                                        <span className="hidden md:inline">·</span>
                                        <span className="truncate">{r.competitionName}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {isSelected ? (
                                            <ChevronUp className="w-5 h-5" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5" />
                                        )}
                                    </div>
                                </div>

                                {/* Fila 2: Equipos y favorito */}
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                    <div className="flex items-center gap-2 font-medium text-gray-800 dark:text-gray-100">
                                        <span>{r.home.teamName}</span>
                                        <span className="text-gray-400 text-sm">vs</span>
                                        <span>{r.away.teamName}</span>
                                    </div>
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 ml-auto">
                                        <Trophy className="w-3 h-3" />
                                        {favTeam}
                                    </span>
                                </div>

                                {/* Fila 3: Estadísticas completas de ambos equipos */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-neutral-800">
                                    <TeamStatsBlock team={r.home} title="Local" />
                                    <TeamStatsBlock team={r.away} title="Visitante" />
                                </div>

                                {/* Fila 4: Badges rápidos de Over/Under y BTTS */}
                                <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-gray-100 dark:border-neutral-800">
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-50 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-neutral-700">
                                        {r.prediction.goalLines[1]?.overProb > 70 ? "Over 2.5" : "Under 2.5"}
                                    </span>
                                    {r.prediction.btts.yes.prob !== undefined && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-50 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-neutral-700">
                                            {r.prediction.btts.yes.prob > 0.5 ? "BTTS Sí" : "BTTS No"}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Panel de odds expandible */}
                            <div
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${isSelected ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
                                    }`}
                            >
                                <div className="border-t border-gray-100 dark:border-neutral-800 p-4 bg-gray-50/50 dark:bg-neutral-800/50">
                                    <OddsPanel
                                        prediction={r.prediction}
                                        homeTeam={r.home.teamName}
                                        awayTeam={r.away.teamName}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}