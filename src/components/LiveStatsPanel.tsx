import { LiveMatchStats } from "@/types/teamStats";

interface LiveStatsPanelProps {
    stats: LiveMatchStats;
    homeTeam: string;
    awayTeam: string;
}

const STAT_LABELS: Record<string, string> = {
    "Ball Possession": "Posesión",
    "Total Shots": "Tiros totales",
    "Shots on Goal": "Tiros al arco",
    "Corner Kicks": "Corners",
    "Yellow Cards": "Tarjetas amarillas",
    "Red Cards": "Tarjetas rojas",
    Fouls: "Faltas",
    Offsides: "Fuera de lugar",
};

export default function LiveStatsPanel({ stats, homeTeam, awayTeam }: LiveStatsPanelProps) {
    const keys = Object.keys(STAT_LABELS).filter(
        (k) => stats.home[k] !== undefined || stats.away[k] !== undefined
    );

    if (keys.length === 0) return null;

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
            <h2 className="text-lg font-bold mb-4">Estadísticas del partido en vivo</h2>
            <div className="space-y-3">
                {keys.map((key) => (
                    <div key={key} className="flex items-center justify-between text-sm">
                        <span className="w-1/3 text-center font-medium">
                            {stats.home[key] ?? "-"}
                        </span>
                        <span className="w-1/3 text-center text-neutral-500 text-xs">
                            {STAT_LABELS[key]}
                        </span>
                        <span className="w-1/3 text-center font-medium">
                            {stats.away[key] ?? "-"}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}