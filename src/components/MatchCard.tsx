import Image from "next/image";
import Link from "next/link";
import { Fixture } from "@/types/fixture";

interface MatchCardProps {
    fixture: Fixture;
}

export default function MatchCard({ fixture }: MatchCardProps) {
    const { teams, league, fixture: fixtureInfo, goals } = fixture;

    const matchTime = new Date(fixtureInfo.date).toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
    });

    const isLive = ["1H", "2H", "HT", "LIVE"].includes(fixtureInfo.status.short);
    const isFinished = fixtureInfo.status.short === "FT";

    return (
        <Link
            href={`/partido/${fixtureInfo.id}`}
            className="block bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
        >
            <div className="flex items-center gap-2 mb-3">
                <Image src={league.logo} alt={league.name} width={18} height={18} className="object-contain" />
                <span className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                    {league.country} · {league.name}
                </span>
            </div>

            <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col items-center gap-1 flex-1">
                    <Image src={teams.home.logo} alt={teams.home.name} width={40} height={40} className="object-contain" />
                    <span className="text-sm font-medium text-center line-clamp-1">{teams.home.name}</span>
                </div>

                <div className="flex flex-col items-center gap-1 min-w-[70px]">
                    {isFinished || isLive ? (
                        <span className="text-lg font-bold">{goals.home ?? 0} - {goals.away ?? 0}</span>
                    ) : (
                        <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{matchTime}</span>
                    )}
                    <span
                        className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${isLive ? "bg-red-100 text-red-600" : isFinished ? "bg-neutral-100 text-neutral-500" : "bg-blue-100 text-blue-600"
                            }`}
                    >
                        {fixtureInfo.status.short}
                    </span>
                </div>

                <div className="flex flex-col items-center gap-1 flex-1">
                    <Image src={teams.away.logo} alt={teams.away.name} width={40} height={40} className="object-contain" />
                    <span className="text-sm font-medium text-center line-clamp-1">{teams.away.name}</span>
                </div>
            </div>

            <p className="text-center text-[11px] text-blue-500 mt-3">Ver estadísticas y cuotas →</p>
        </Link>
    );
}