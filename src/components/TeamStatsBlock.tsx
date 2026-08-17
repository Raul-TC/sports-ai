import { TeamInfo, TeamMetrics } from "@/types";
import { StatBadge } from "./StatBadge";
import { Goal, Target, Crosshair, CornerDownRight, Activity, Gauge, BarChart, Shield } from "lucide-react";
import { MatchResult } from "@/utils/extractMatchResult";

interface TeamStatsBlockProps {
    team: TeamInfo;
    results?: MatchResult
    opponent?: TeamInfo
    title: string;
    goalLines: {
        line: number
        overOdd: number
        overProb: number
        underOdd: number
        underProb: number
    }[]
}

const getTrend = (value: number) => {
    if (value > 1.2) return "up";
    if (value < 0.8) return "down";
    return "neutral";
};

// Reglas de comparación: qué significa "mejor" para cada métrica
const comparisonRule: Record<string, 'higher' | 'lower'> = {
    'Goles por Partido': 'higher',
    'Goles recibidos por Partido': 'lower',
    'Gol Esp': 'higher',
    'Gol Esp recibidos': 'lower',
    'Tiros': 'higher',
    'Tiro a Puerta': 'higher',
    'Córners': 'higher',
    'Eficiencia Of': 'higher',
    'Eficiencia Def': 'lower',
    'Goles Previstos': 'higher',
    'Puntería': 'higher',
    'Eficiencia Bruta': 'higher',
    'Caída Precisión': 'higher',
};


export function TeamStatsBlock({ team, title, opponent, goalLines, results }: TeamStatsBlockProps) {
    const m = team.metrics;
    if (!m) return <div className="text-xs text-gray-400">Sin datos</div>;

    const effTrend = getTrend(m.offensiveEfficiency);
    const opponentM = opponent?.metrics;

    // Función para obtener el valor del rival según el label
    const getOpponentValue = (label: string): number | null => {
        if (!opponentM) return null;
        switch (label) {
            case 'Goles por Partido': return opponentM.golesPerPartido;
            case 'Goles recibidos por Partido': return opponentM.golesRecibidos;
            case 'Gol Esp': return opponentM.xG;
            case 'Gol Esp recibidos': return opponentM.xGA;
            case 'Tiros': return opponentM.shots;
            case 'Tiro a Puerta': return opponentM.shotsOT;
            case 'Córners': return opponentM.corners;
            case 'Eficiencia Of': return opponentM.offensiveEfficiency;
            case 'Eficiencia Def': return opponentM.xGA > 0 ? opponentM.golesRecibidos / opponentM.xGA : 1;
            case 'Goles Previstos': return opponentM.expectedGoals;
            case 'Puntería': return opponentM.shotFactor;
            case 'Eficiencia Bruta': return opponentM.efficiency;
            case 'Caída Precisión': return opponentM.precisionDrop;
            default: return null;
        }
    };

    // Función para determinar si el valor actual es mejor que el del rival
    const isBetterThanOpponent = (label: string, currentValue: number): boolean => {
        const oppValue = getOpponentValue(label);
        if (oppValue === null) return false;
        const rule = comparisonRule[label];
        if (!rule) return false;
        return rule === 'higher' ? currentValue > oppValue : currentValue < oppValue;
    };
    let effIndicator = "";
    let effColor = "";
    if (m.offensiveEfficiency > 1.2) {
        effIndicator = "🔥 Sobre";
        effColor = "text-green-600";
    } else if (m.offensiveEfficiency < 0.8) {
        effIndicator = "❄️ Bajo";
        effColor = "text-red-500";
    } else {
        effIndicator = "⚖️ Esperado";
        effColor = "text-gray-500";
    }

    let shotIndicator = "";
    let shotColor = "";
    if (m.shotFactor > 0.4) {
        shotIndicator = "Alta";
        shotColor = "text-green-600";
    } else if (m.shotFactor > 0.3) {
        shotIndicator = "Media";
        shotColor = "text-amber-500";
    } else {
        shotIndicator = "Baja";
        shotColor = "text-red-500";
    }

    let dropIndicator = "";
    let dropColor = "";
    if (m.precisionDrop > 0.02) {
        dropIndicator = "📈 Mejora";
        dropColor = "text-green-600";
    } else if (m.precisionDrop < -0.02) {
        dropIndicator = "📉 Empeora";
        dropColor = "text-red-500";
    } else {
        dropIndicator = "➡️ Estable";
        dropColor = "text-gray-500";
    }

    let bruteIndicator = "";
    let bruteColor = "";
    if (m.efficiency > 0.15) {
        bruteIndicator = "Alta";
        bruteColor = "text-green-600";
    } else if (m.efficiency > 0.08) {
        bruteIndicator = "Media";
        bruteColor = "text-amber-500";
    } else {
        bruteIndicator = "Baja";
        bruteColor = "text-red-500";
    }

    const primaryStats = [
        {
            label: 'Goles por Partido'
            , value: m.golesPerPartido.toFixed(1)
            , description: 'Promedio de goles anotados por partido.'
        },
        {
            label: 'Goles recibidos por Partido'
            , value: m.golesRecibidos.toFixed(1)
            , description: 'Promedio de goles recibidos por partido.'
        },
        {
            label: "Gol Esp",
            value: m.xG.toFixed(2),
            icon: Goal,
            description: "Goles esperados según la calidad de las ocasiones generadas.",
        },
        {
            label: "Gol Esp recibidos",
            value: m.xGA.toFixed(2),
            icon: Target,
            description: "Goles esperados encajados según las ocasiones concedidas.",
        },
        {
            label: "Tiros",
            value: m.shots.toFixed(1),
            description: "Número total de disparos (incluyendo los que van fuera).",
        },
        {
            label: "Tiro a Puerta",
            value: m.shotsOT.toFixed(1),
            icon: Crosshair,
            description: "Disparos que van entre los tres palos.",
        },
        {
            label: "Córners",
            value: m.corners.toFixed(1),
            icon: CornerDownRight,
            description: "Saques de esquina a favor.",
        },
        {
            label: "Eficiencia Of",
            value: m.offensiveEfficiency.toFixed(2),
            icon: Activity,
            trend: effTrend,
            indicator: effIndicator,
            indicatorColor: effColor,
            description:
                m.offensiveEfficiency > 1.2
                    ? "El equipo marca más de lo esperado (probablemente está sobre-rendimiento)."
                    : m.offensiveEfficiency < 0.8
                        ? "El equipo marca menos de lo esperado (probablemente está bajo-rendimiento)."
                        : "El equipo marca lo esperado según sus ocasiones.",
        },
        {
            label: "Eficiencia Def",
            value: (m.golesRecibidos / (m.xGA || 0.1)).toFixed(2),
            icon: Shield,
            description:
                (m.golesRecibidos / (m.xGA || 0.1)) > 1.2
                    ? "Encaja más de lo esperado (defensa vulnerable)."
                    : (m.golesRecibidos / (m.xGA || 0.1)) < 0.8
                        ? "Encaja menos de lo esperado (defensa sólida)."
                        : "Encaja lo esperado.",
            trend: (m.golesRecibidos / (m.xGA || 0.1)) > 1.2 ? "down" : (m.golesRecibidos / (m.xGA || 0.1)) < 0.8 ? "up" : "neutral",
            indicator: (m.golesRecibidos / (m.xGA || 0.1)) > 1.2 ? "❌ Débil" : (m.golesRecibidos / (m.xGA || 0.1)) < 0.8 ? "✅ Sólida" : "⚖️ Esperada",
            indicatorColor: (m.golesRecibidos / (m.xGA || 0.1)) > 1.2 ? "text-red-500" : (m.golesRecibidos / (m.xGA || 0.1)) < 0.8 ? "text-green-600" : "text-gray-500",
        }
    ];
    // const baseClass = secondary
    //     ? "bg-gray-50/70 dark:bg-neutral-800/70 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-neutral-700"
    //     : isTrap
    //         ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
    //         : "bg-gray-50 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border-gray-100 dark:border-neutral-700";

    const secondaryStats = [
        {
            label: "Goles Previstos",
            value: m.expectedGoals.toFixed(2),
            icon: Goal,
            description: "Goles que predice el modelo de Poisson para este partido.",
        },
        {
            label: "Puntería",
            value: m.shotFactor.toFixed(2),
            icon: Gauge,
            indicator: shotIndicator,
            indicatorColor: shotColor,
            description: `Porcentaje de tiros que van a puerta. ${shotIndicator}.`,
        },
        {
            label: "Eficiencia Bruta",
            value: m.efficiency.toFixed(2),
            icon: BarChart,
            indicator: bruteIndicator,
            indicatorColor: bruteColor,
            description: `Goles por cada disparo. ${bruteIndicator}.`,
        },
        {
            label: "Caída Precisión",
            value: m.precisionDrop.toFixed(3),
            icon: Target,
            indicator: dropIndicator,
            indicatorColor: dropColor,
            description:
                m.precisionDrop > 0
                    ? "La puntería ha mejorado en los últimos partidos."
                    : m.precisionDrop < 0
                        ? "La puntería ha empeorado en los últimos partidos."
                        : "La puntería se mantiene estable.",
        },
    ];

    return (
        <div className="space-y-1.5">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {title}
            </div>
            <div className="flex flex-wrap gap-1">
                {primaryStats.map((stat, idx) => {
                    const isBetter = isBetterThanOpponent(stat.label, +stat.value);

                    return <StatBadge
                        key={idx}
                        label={stat.label}
                        value={stat.value}
                        icon={stat.icon}
                        trend={stat.trend as any}
                        description={stat.description}
                        indicator={stat.indicator}
                        indicatorColor={stat.indicatorColor}
                        isBetter={isBetter}
                        results={results}

                    />
                })}
            </div>
            <div className="flex flex-wrap gap-1">
                {secondaryStats.map((stat, idx) => {
                    const isBetter = isBetterThanOpponent(stat.label, +stat.value);

                    return <StatBadge
                        key={idx}
                        label={stat.label}
                        value={stat.value}
                        icon={stat.icon}
                        secondary
                        description={stat.description}
                        indicator={stat.indicator}
                        indicatorColor={stat.indicatorColor}
                        isBetter={isBetter}
                        results={results}
                    />
                })}
            </div>
            <div className="flex flex-wrap gap-1">
                <p className="w-full text-xs font-medium text-gray-500 dark:text-gray-400">Linea de goles</p>
                <p className="w-full text-xs font-medium text-gray-500 dark:text-gray-400">Over</p>

                {goalLines.map((stat, idx) => (
                    <span key={idx}
                        className={`relative inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border  whitespace-nowrap transition-colors cursor-pointer text-gray-400`}
                    // onClick={handleClick}
                    // title={description}
                    >
                        {/* {Icon && <Icon className="w-3 h-3 text-gray-400" />} */}
                        <Goal className="w-3 h-3 text-gray-400" />
                        <span className="font-medium tabular-nums">{stat.line}</span>
                        <span className="text-[10px] opacity-75">momio: {stat.overOdd}</span>
                        <span className="text-[10px] opacity-75">{stat.overProb}%</span>
                        {/* {trend && trendIcon} */}
                        {/* {indicator && (
                            <span className={`text-[10px] font-medium ${indicatorColor || "text-gray-500"}`}>
                                {indicator}
                            </span>
                        )} */}
                        {/* {description && <Info className="w-3 h-3 text-gray-400 opacity-50" />} */}

                        {/* {showTooltip && description && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg z-10 whitespace-normal max-w-[200px] text-center pointer-events-none">
                                {description}
                            </div>
                        )} */}
                    </span>
                ))}
                <p className="w-full text-xs font-medium text-gray-500 dark:text-gray-400">Under</p>
                {goalLines.map((stat, idx) => (
                    <span key={idx}
                        className={`relative inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border  whitespace-nowrap transition-colors cursor-pointer text-gray-400`}
                    // onClick={handleClick}
                    // title={description}
                    >
                        {<Goal className="w-3 h-3 text-gray-400" />}
                        <span className="font-medium tabular-nums">{stat.line}</span>
                        <span className="text-[10px] opacity-75">momio: {stat.underOdd}</span>
                        <span className="text-[10px] opacity-75">{stat.underProb}%</span>
                        {/* {trend && trendIcon} */}
                        {/* {indicator && (
                            <span className={`text-[10px] font-medium ${indicatorColor || "text-gray-500"}`}>
                                {indicator}
                            </span>
                        )} */}
                        {/* {description && <Info className="w-3 h-3 text-gray-400 opacity-50" />} */}

                        {/* {showTooltip && description && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg z-10 whitespace-normal max-w-[200px] text-center pointer-events-none">
                                {description}
                            </div>
                        )} */}
                    </span>
                ))}
            </div>
        </div>
    );
}