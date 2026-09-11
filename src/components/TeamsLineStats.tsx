"use client";

import { useMemo, useState } from "react";
import { TrendingUp, Filter } from "lucide-react";

interface Props {
    predictions: any[];
    minMatches?: number;
}

type CategoryKey = "goles" | "corners" | "tarjetas" | "tiros" | "faltas";

interface LineOption {
    key: string;
    label: string;
    emoji: string;
    category: CategoryKey;
    description: string;
    check: (r: any) => boolean;
}

const CATEGORY_LABELS: Record<CategoryKey, { label: string; emoji: string }> = {
    goles: { label: "Goles", emoji: "⚽" },
    corners: { label: "Córners", emoji: "🚩" },
    tarjetas: { label: "Tarjetas", emoji: "🟨" },
    tiros: { label: "Tiros", emoji: "🎯" },
    faltas: { label: "Faltas", emoji: "🦵" },
};

const LINE_OPTIONS: LineOption[] = [
    // ============ GOLES ============
    {
        key: "btts", label: "Ambos Anotan", emoji: "⚽", category: "goles",
        description: "Ambos equipos marcan al menos 1 gol",
        check: (r) => r.homeScore > 0 && r.awayScore > 0
    },
    {
        key: "over15", label: "Over 1.5 goles", emoji: "⬆️", category: "goles",
        description: "2 o más goles en el partido",
        check: (r) => r.homeScore + r.awayScore >= 2
    },
    {
        key: "over25", label: "Over 2.5 goles", emoji: "🔥", category: "goles",
        description: "3 o más goles en el partido",
        check: (r) => r.homeScore + r.awayScore >= 3
    },
    {
        key: "over35", label: "Over 3.5 goles", emoji: "🚀", category: "goles",
        description: "4 o más goles en el partido",
        check: (r) => r.homeScore + r.awayScore >= 4
    },
    {
        key: "under25", label: "Under 2.5 goles", emoji: "🛡️", category: "goles",
        description: "2 o menos goles en el partido",
        check: (r) => r.homeScore + r.awayScore <= 2
    },
    {
        key: "homeScores", label: "Local anota", emoji: "🏠", category: "goles",
        description: "El equipo local marca al menos 1 gol",
        check: (r) => r.homeScore > 0
    },
    {
        key: "awayScores", label: "Visitante anota", emoji: "✈️", category: "goles",
        description: "El equipo visitante marca al menos 1 gol",
        check: (r) => r.awayScore > 0
    },

    // ============ CÓRNERS ============
    {
        key: "cornersOver75", label: "Over 7.5 córners", emoji: "🚩", category: "corners",
        description: "8 o más córners en el partido",
        check: (r) => ((r.homeCorners ?? 0) + (r.awayCorners ?? 0)) >= 8
    },
    {
        key: "cornersOver85", label: "Over 8.5 córners", emoji: "🚩", category: "corners",
        description: "9 o más córners en el partido",
        check: (r) => ((r.homeCorners ?? 0) + (r.awayCorners ?? 0)) >= 9
    },
    {
        key: "cornersOver95", label: "Over 9.5 córners", emoji: "🚩", category: "corners",
        description: "10 o más córners en el partido",
        check: (r) => ((r.homeCorners ?? 0) + (r.awayCorners ?? 0)) >= 10
    },
    {
        key: "cornersOver105", label: "Over 10.5 córners", emoji: "🚩", category: "corners",
        description: "11 o más córners en el partido",
        check: (r) => ((r.homeCorners ?? 0) + (r.awayCorners ?? 0)) >= 11
    },
    {
        key: "cornersOver115", label: "Over 11.5 córners", emoji: "🚩", category: "corners",
        description: "12 o más córners en el partido",
        check: (r) => ((r.homeCorners ?? 0) + (r.awayCorners ?? 0)) >= 12
    },
    {
        key: "cornersUnder95", label: "Under 9.5 córners", emoji: "🚩", category: "corners",
        description: "9 o menos córners en el partido",
        check: (r) => ((r.homeCorners ?? 0) + (r.awayCorners ?? 0)) <= 9
    },

    // ============ TARJETAS ============
    {
        key: "yellowOver25", label: "Over 2.5 amarillas", emoji: "🟨", category: "tarjetas",
        description: "3 o más amarillas en el partido",
        check: (r) => ((r.homeYellowCards ?? 0) + (r.awayYellowCards ?? 0)) >= 3
    },
    {
        key: "yellowOver35", label: "Over 3.5 amarillas", emoji: "🟨", category: "tarjetas",
        description: "4 o más amarillas en el partido",
        check: (r) => ((r.homeYellowCards ?? 0) + (r.awayYellowCards ?? 0)) >= 4
    },
    {
        key: "yellowOver45", label: "Over 4.5 amarillas", emoji: "🟨", category: "tarjetas",
        description: "5 o más amarillas en el partido",
        check: (r) => ((r.homeYellowCards ?? 0) + (r.awayYellowCards ?? 0)) >= 5
    },
    {
        key: "yellowOver55", label: "Over 5.5 amarillas", emoji: "🟨", category: "tarjetas",
        description: "6 o más amarillas en el partido",
        check: (r) => ((r.homeYellowCards ?? 0) + (r.awayYellowCards ?? 0)) >= 6
    },
    {
        key: "cardsOver35", label: "Over 3.5 tarjetas", emoji: "🟨🟥", category: "tarjetas",
        description: "4 o más tarjetas totales",
        check: (r) => (
            (r.homeYellowCards ?? 0) + (r.awayYellowCards ?? 0) +
            (r.homeRedCards ?? 0) + (r.awayRedCards ?? 0)
        ) >= 4
    },
    {
        key: "cardsOver45", label: "Over 4.5 tarjetas", emoji: "🟨🟥", category: "tarjetas",
        description: "5 o más tarjetas totales",
        check: (r) => (
            (r.homeYellowCards ?? 0) + (r.awayYellowCards ?? 0) +
            (r.homeRedCards ?? 0) + (r.awayRedCards ?? 0)
        ) >= 5
    },
    {
        key: "redsAny", label: "Alguna roja", emoji: "🟥", category: "tarjetas",
        description: "Al menos 1 tarjeta roja",
        check: (r) => ((r.homeRedCards ?? 0) + (r.awayRedCards ?? 0)) >= 1
    },

    // ============ TIROS ============
    {
        key: "shotsOver15", label: "Over 15 tiros", emoji: "🎯", category: "tiros",
        description: "16 o más tiros totales",
        check: (r) => ((r.homeShots ?? 0) + (r.awayShots ?? 0)) >= 16
    },
    {
        key: "shotsOver20", label: "Over 20 tiros", emoji: "🎯", category: "tiros",
        description: "21 o más tiros totales",
        check: (r) => ((r.homeShots ?? 0) + (r.awayShots ?? 0)) >= 21
    },
    {
        key: "shotsOver25", label: "Over 25 tiros", emoji: "🎯", category: "tiros",
        description: "26 o más tiros totales",
        check: (r) => ((r.homeShots ?? 0) + (r.awayShots ?? 0)) >= 26
    },
    {
        key: "shotsOTOver7", label: "Over 7 tiros a puerta", emoji: "🎯", category: "tiros",
        description: "8 o más tiros a puerta totales",
        check: (r) => ((r.homeShotsOnTarget ?? 0) + (r.awayShotsOnTarget ?? 0)) >= 8
    },
    {
        key: "shotsOTOver9", label: "Over 9 tiros a puerta", emoji: "🎯", category: "tiros",
        description: "10 o más tiros a puerta totales",
        check: (r) => ((r.homeShotsOnTarget ?? 0) + (r.awayShotsOnTarget ?? 0)) >= 10
    },

    // ============ FALTAS ============
    {
        key: "foulsOver20", label: "Over 20 faltas", emoji: "🦵", category: "faltas",
        description: "21 o más faltas en el partido",
        check: (r) => ((r.homeFauls ?? 0) + (r.awayFauls ?? 0)) >= 21
    },
    {
        key: "foulsOver25", label: "Over 25 faltas", emoji: "🦵", category: "faltas",
        description: "26 o más faltas en el partido",
        check: (r) => ((r.homeFauls ?? 0) + (r.awayFauls ?? 0)) >= 26
    },
    {
        key: "foulsOver30", label: "Over 30 faltas", emoji: "🦵", category: "faltas",
        description: "31 o más faltas en el partido",
        check: (r) => ((r.homeFauls ?? 0) + (r.awayFauls ?? 0)) >= 31
    },
];

interface TeamAgg {
    teamName: string;
    teamId: number;
    matches: number;
    hits: number;
    pct: number;
    avgGoalsFor: number;
    avgGoalsAgainst: number;
    bttsCount: number;
    over25Count: number;
    cleanSheets: number;

    // acumuladores (solo lo que hizo el equipo)
    totalCorners: number;
    totalYellow: number;
    totalShots: number;
    totalFouls: number;

    // promedios
    avgCorners: number;
    avgYellow: number;
    avgShots: number;
    avgFouls: number;
}

export default function TeamsLineStats({ predictions, minMatches = 3 }: Props) {
    const [selectedLine, setSelectedLine] = useState<string>("btts");
    const [sortBy, setSortBy] = useState<"pct" | "hits">("pct");
    const [expanded, setExpanded] = useState(false);

    const line = LINE_OPTIONS.find((l) => l.key === selectedLine) ?? LINE_OPTIONS[0];

    const linesByCategory = useMemo(() => {
        const grouped: Record<CategoryKey, LineOption[]> = {
            goles: [], corners: [], tarjetas: [], tiros: [], faltas: [],
        };
        for (const l of LINE_OPTIONS) grouped[l.category].push(l);
        return grouped;
    }, []);

    const teams = useMemo<TeamAgg[]>(() => {
        const map = new Map<number, TeamAgg>();

        for (const p of predictions) {
            if (!p.result || p.result.homeScore == null || p.result.awayScore == null) continue;

            const r = p.result;
            const hs = Number(r.homeScore);
            const as_ = Number(r.awayScore);
            if (isNaN(hs) || isNaN(as_)) continue;

            const hit = line.check(r);

            for (const team of [
                { id: p.home.teamId, name: p.home.teamName, isHome: true, goalsFor: hs, goalsAgainst: as_ },
                { id: p.away.teamId, name: p.away.teamName, isHome: false, goalsFor: as_, goalsAgainst: hs },
            ]) {
                if (!map.has(team.id)) {
                    map.set(team.id, {
                        teamName: team.name,
                        teamId: team.id,
                        matches: 0,
                        hits: 0,
                        pct: 0,
                        avgGoalsFor: 0,
                        avgGoalsAgainst: 0,
                        bttsCount: 0,
                        over25Count: 0,
                        cleanSheets: 0,
                        totalCorners: 0,
                        totalYellow: 0,
                        totalShots: 0,
                        totalFouls: 0,
                        avgCorners: 0,
                        avgYellow: 0,
                        avgShots: 0,
                        avgFouls: 0,
                    });
                }
                const agg = map.get(team.id)!;
                agg.matches += 1;
                if (hit) agg.hits += 1;

                agg.avgGoalsFor += team.goalsFor;
                agg.avgGoalsAgainst += team.goalsAgainst;

                // ✅ Stats propias del equipo (solo lo que hizo él)
                const ownCorners = team.isHome ? (r.homeCorners ?? 0) : (r.awayCorners ?? 0);
                const ownYellow = team.isHome ? (r.homeYellowCards ?? 0) : (r.awayYellowCards ?? 0);
                const ownShots = team.isHome ? (r.homeShots ?? 0) : (r.awayShots ?? 0);
                const ownFouls = team.isHome ? (r.homeFauls ?? 0) : (r.awayFauls ?? 0);

                agg.totalCorners += ownCorners;
                agg.totalYellow += ownYellow;
                agg.totalShots += ownShots;
                agg.totalFouls += ownFouls;

                if (hs > 0 && as_ > 0) agg.bttsCount += 1;
                if (hs + as_ >= 3) agg.over25Count += 1;
                if (team.goalsAgainst === 0) agg.cleanSheets += 1;
            }
        }

        const arr = Array.from(map.values()).map((t) => ({
            ...t,
            pct: t.matches > 0 ? (t.hits / t.matches) * 100 : 0,
            avgGoalsFor: t.matches > 0 ? t.avgGoalsFor / t.matches : 0,
            avgGoalsAgainst: t.matches > 0 ? t.avgGoalsAgainst / t.matches : 0,
            avgCorners: t.matches > 0 ? t.totalCorners / t.matches : 0,
            avgYellow: t.matches > 0 ? t.totalYellow / t.matches : 0,
            avgShots: t.matches > 0 ? t.totalShots / t.matches : 0,
            avgFouls: t.matches > 0 ? t.totalFouls / t.matches : 0,
        }));

        return arr
            // .filter((t) => t.matches >= minMatches)
            .sort((a, b) =>
                sortBy === "pct"
                    ? b.pct - a.pct || b.hits - a.hits
                    : b.hits - a.hits || b.pct - a.pct
            );
    }, [predictions, line, minMatches, sortBy]);

    if (teams.length === 0) {
        return (
            <div className="mt-6 rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 text-center">
                <div className="text-xs text-gray-400">
                    Sin datos suficientes para el ranking (mínimo {minMatches} partidos por equipo).
                </div>
            </div>
        );
    }

    const displayed = expanded ? teams : teams.slice(0, 10);

    return (
        <div className="mt-6 rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-neutral-800 flex-wrap">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-bold text-gray-800 dark:text-neutral-100">
                        Ranking por línea
                    </span>
                    <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                        {teams.length} equipos · ≥{minMatches} partidos
                    </span>
                </div>

                <div className="ml-auto flex items-center gap-2 flex-wrap">
                    <select
                        value={selectedLine}
                        onChange={(e) => setSelectedLine(e.target.value)}
                        className="text-[11px] bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg px-2 py-1 cursor-pointer font-medium max-w-[230px]"
                    >
                        {(Object.keys(linesByCategory) as CategoryKey[]).map((cat) => (
                            <optgroup
                                key={cat}
                                label={`${CATEGORY_LABELS[cat].emoji} ${CATEGORY_LABELS[cat].label}`}
                            >
                                {linesByCategory[cat].map((opt) => (
                                    <option key={opt.key} value={opt.key}>
                                        {opt.emoji} {opt.label}
                                    </option>
                                ))}
                            </optgroup>
                        ))}
                    </select>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as "pct" | "hits")}
                        className="text-[11px] bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg px-2 py-1 cursor-pointer font-medium"
                    >
                        <option value="pct">% de cumplimiento</option>
                        <option value="hits">Total de aciertos</option>
                    </select>
                </div>
            </div>

            {/* Descripción de la línea */}
            <div className="px-4 py-2 bg-gray-50/60 dark:bg-neutral-800/40 text-[10px] text-gray-500 dark:text-neutral-400 flex items-center gap-1.5 border-b border-gray-100 dark:border-neutral-800">
                <Filter className="w-3 h-3" />
                <span className="font-semibold">{line.emoji} {line.label}:</span>
                <span>{line.description}</span>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead className="bg-gray-50 dark:bg-neutral-800/60">
                        <tr className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-neutral-400">
                            <th className="text-left px-3 py-2 font-semibold w-8">#</th>
                            <th className="text-left px-3 py-2 font-semibold">Equipo</th>
                            <th className="text-center px-3 py-2 font-semibold">PJ</th>
                            <th className="text-center px-3 py-2 font-semibold">{line.emoji} Hits</th>
                            <th className="text-center px-3 py-2 font-semibold">%</th>
                            <th className="text-center px-3 py-2 font-semibold hidden sm:table-cell">GF prom</th>
                            <th className="text-center px-3 py-2 font-semibold hidden sm:table-cell">GC prom</th>
                            <th className="text-center px-3 py-2 font-semibold hidden md:table-cell">🚩 prom</th>
                            <th className="text-center px-3 py-2 font-semibold hidden md:table-cell">🟨 prom</th>
                            <th className="text-center px-3 py-2 font-semibold hidden lg:table-cell">🎯 prom</th>
                            <th className="text-center px-3 py-2 font-semibold hidden lg:table-cell">🦵 prom</th>
                            <th className="text-center px-3 py-2 font-semibold hidden xl:table-cell">AA</th>
                            <th className="text-center px-3 py-2 font-semibold hidden xl:table-cell">O2.5</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayed.map((t, i) => {
                            const position = i + 1;
                            const medal =
                                position === 1 ? "🥇"
                                    : position === 2 ? "🥈"
                                        : position === 3 ? "🥉"
                                            : null;
                            const pctColor =
                                t.pct >= 70 ? "text-emerald-600 dark:text-emerald-400"
                                    : t.pct >= 50 ? "text-amber-600 dark:text-amber-400"
                                        : "text-rose-600 dark:text-rose-400";
                            const barColor =
                                t.pct >= 70 ? "bg-emerald-500"
                                    : t.pct >= 50 ? "bg-amber-500"
                                        : "bg-rose-500";

                            return (
                                <tr
                                    key={t.teamId}
                                    className="border-t border-gray-100 dark:border-neutral-800 hover:bg-gray-50/60 dark:hover:bg-neutral-800/30"
                                >
                                    <td className="px-3 py-2 text-center text-gray-400 dark:text-neutral-500 tabular-nums font-semibold">
                                        {medal ?? position}
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="flex items-center gap-2">
                                            <img
                                                src={`https://imagecache.365scores.com/image/upload/f_png,w_20,h_20,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v5/Competitors/${t.teamId}`}
                                                className="w-5 h-5 object-contain shrink-0"
                                                alt=""
                                                onError={(e) => (e.currentTarget.style.display = "none")}
                                            />
                                            <span className="font-semibold text-gray-800 dark:text-neutral-100 truncate">
                                                {t.teamName}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 text-center tabular-nums text-gray-500 dark:text-neutral-400">
                                        {t.matches}
                                    </td>
                                    <td className="px-3 py-2 text-center tabular-nums font-bold text-gray-800 dark:text-neutral-100">
                                        {t.hits}
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className={`text-xs font-bold tabular-nums ${pctColor}`}>
                                                {t.pct.toFixed(0)}%
                                            </span>
                                            <div className="w-16 h-1 rounded-full bg-gray-200 dark:bg-neutral-800 overflow-hidden">
                                                <div
                                                    className={`h-full ${barColor} rounded-full transition-all duration-500`}
                                                    style={{ width: `${Math.min(t.pct, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 text-center tabular-nums text-gray-600 dark:text-neutral-300 hidden sm:table-cell">
                                        {t.avgGoalsFor.toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2 text-center tabular-nums text-gray-600 dark:text-neutral-300 hidden sm:table-cell">
                                        {t.avgGoalsAgainst.toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2 text-center tabular-nums text-gray-600 dark:text-neutral-300 hidden md:table-cell">
                                        {t.avgCorners.toFixed(1)}
                                    </td>
                                    <td className="px-3 py-2 text-center tabular-nums text-gray-600 dark:text-neutral-300 hidden md:table-cell">
                                        {t.avgYellow.toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2 text-center tabular-nums text-gray-600 dark:text-neutral-300 hidden lg:table-cell">
                                        {t.avgShots.toFixed(1)}
                                    </td>
                                    <td className="px-3 py-2 text-center tabular-nums text-gray-600 dark:text-neutral-300 hidden lg:table-cell">
                                        {t.avgFouls.toFixed(1)}
                                    </td>
                                    <td className="px-3 py-2 text-center tabular-nums hidden xl:table-cell">
                                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
                                            {t.bttsCount}/{t.matches}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 text-center tabular-nums hidden xl:table-cell">
                                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300">
                                            {t.over25Count}/{t.matches}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Ver más */}
            {teams.length > 10 && (
                <button
                    onClick={() => setExpanded((v) => !v)}
                    className="w-full py-2 text-[11px] font-semibold text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30 transition border-t border-gray-100 dark:border-neutral-800"
                >
                    {expanded ? "Ver solo top 10" : `Ver todos (${teams.length})`}
                </button>
            )}
        </div>
    );
}