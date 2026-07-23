import { TeamInfo, TeamMetrics } from "@/types";
import { StatBadge } from "./StatBadge";
import { Goal, Target, Crosshair, CornerDownRight, Activity, Gauge, BarChart } from "lucide-react";

interface TeamStatsBlockProps {
    team: TeamInfo;
    title: string;
}

const getTrend = (value: number) => {
    if (value > 1.2) return "up";
    if (value < 0.8) return "down";
    return "neutral";
};

export function TeamStatsBlock({ team, title }: TeamStatsBlockProps) {
    const m = team.metrics;
    if (!m) return <div className="text-xs text-gray-400">Sin datos</div>;

    const effTrend = getTrend(m.offensiveEfficiency);

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
            label: "Gol Esp",
            value: m.xG.toFixed(2),
            icon: Goal,
            description: "Goles esperados según la calidad de las ocasiones generadas.",
        },
        {
            label: "Gol Esp Con",
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
    ];

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
                {primaryStats.map((stat, idx) => (
                    <StatBadge
                        key={idx}
                        label={stat.label}
                        value={stat.value}
                        icon={stat.icon}
                        trend={stat.trend as any}
                        description={stat.description}
                        indicator={stat.indicator}
                        indicatorColor={stat.indicatorColor}
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
                        indicator={stat.indicator}
                        indicatorColor={stat.indicatorColor}
                    />
                ))}
            </div>
        </div>
    );
}