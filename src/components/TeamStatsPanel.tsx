import Image from "next/image";
import { TeamStats } from "@/types/teamStats";

interface TeamStatsPanelProps {
    home: TeamStats;
    away: TeamStats;
}

export default function TeamStatsPanel({ home, away }: TeamStatsPanelProps) {
    const rows = [
        { label: "Partidos jugados", home: home.played, away: away.played },
        { label: "Goles a favor (prom.)", home: home.goalsForAvg, away: away.goalsForAvg },
        { label: "Goles en contra (prom.)", home: home.goalsAgainstAvg, away: away.goalsAgainstAvg },
        { label: "Forma reciente", home: home.form, away: away.form },
    ];

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col items-center gap-1 flex-1">
                    <Image src={home.logo} alt={home.teamName} width={44} height={44} />
                    <span className="text-sm font-semibold text-center">{home.teamName}</span>
                </div>
                <span className="text-xs text-neutral-400 font-medium">VS</span>
                <div className="flex flex-col items-center gap-1 flex-1">
                    <Image src={away.logo} alt={away.teamName} width={44} height={44} />
                    <span className="text-sm font-semibold text-center">{away.teamName}</span>
                </div>
            </div>

            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {rows.map((row) => (
                    <div key={row.label} className="flex items-center justify-between py-2 text-sm">
                        <span className="w-1/3 text-center font-medium">{row.home}</span>
                        <span className="w-1/3 text-center text-neutral-500 text-xs">{row.label}</span>
                        <span className="w-1/3 text-center font-medium">{row.away}</span>
                    </div>
                ))}
            </div>

        </div>
    );
}