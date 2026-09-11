"use client";

import { useState } from "react";
import { Trophy, TrendingUp, TrendingDown } from "lucide-react";

export interface StandingRow {
    teamId: number;
    teamName: string;
    position: number;
    points: number;
    played: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDiff: number;
    pct: string;
    recentForm: number[];
    displayName: string;
    seasonNum: number;
    stageNum: number;
    isCurrentStage: boolean;
}

interface StandingDestination {
    num: number;
    name: string;
    guaranteedText?: string;
    color: string;
    type: number;
}

export interface StandingsBlock {
    displayName: string | null;
    rows: StandingRow[];
    destinations: StandingDestination[];
}

interface StandingsTableProps {
    title?: string;                              // "Liga MX - Apertura"
    standings: StandingRow[];                    // filas ordenadas por posición
    highlightTeamIds?: number[];                 // IDs a resaltar
    destinations?: Array<{ name: string; color: string }>;  // ej. "Cuartos de Final"
}

export default function StandingsTable({
    title,
    standings,
    highlightTeamIds = [],
    destinations = [],
}: StandingsTableProps) {
    const [expanded, setExpanded] = useState(false);
    const visible = expanded ? standings : standings.slice(0, 12);

    if (!standings || standings.length === 0) {
        return (
            <div className="rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 text-center">
                <div className="text-xs text-gray-400">Sin tabla de posiciones disponible.</div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-neutral-800">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-bold text-gray-800 dark:text-neutral-100">
                    {title ?? "Tabla de posiciones"}
                </span>
                <span className="ml-auto text-[10px] text-gray-400 dark:text-neutral-500">
                    {standings.length} equipos
                </span>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead className="bg-gray-50 dark:bg-neutral-800/60">
                        <tr className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-neutral-400">
                            <th className="text-center px-2 py-2 font-semibold w-8">#</th>
                            <th className="text-left px-3 py-2 font-semibold">Equipo</th>
                            <th className="text-center px-2 py-2 font-semibold">PJ</th>
                            <th className="text-center px-2 py-2 font-semibold">G</th>
                            <th className="text-center px-2 py-2 font-semibold">E</th>
                            <th className="text-center px-2 py-2 font-semibold">P</th>
                            <th className="text-center px-2 py-2 font-semibold">GF</th>
                            <th className="text-center px-2 py-2 font-semibold">GC</th>
                            <th className="text-center px-2 py-2 font-semibold">DG</th>
                            <th className="text-center px-3 py-2 font-semibold">PTS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visible.map((row) => {
                            const isHighlighted = highlightTeamIds.includes(row.teamId);
                            const gdColor =
                                row.goalDiff > 0
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : row.goalDiff < 0
                                        ? "text-rose-600 dark:text-rose-400"
                                        : "text-gray-500 dark:text-neutral-400";

                            return (
                                <tr
                                    key={row.teamId}
                                    className={`border-t border-gray-100 dark:border-neutral-800 transition-colors ${isHighlighted
                                        ? "bg-indigo-50/70 dark:bg-indigo-950/30"
                                        : "hover:bg-gray-50/60 dark:hover:bg-neutral-800/30"
                                        }`}
                                >
                                    <td className="px-2 py-2 text-center font-bold tabular-nums text-gray-700 dark:text-neutral-300">
                                        {row.position}
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="flex items-center gap-2">
                                            <img
                                                src={`https://imagecache.365scores.com/image/upload/f_png,w_20,h_20,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v5/Competitors/${row.teamId}`}
                                                className="w-5 h-5 object-contain shrink-0"
                                                alt=""
                                                onError={(e) => (e.currentTarget.style.display = "none")}
                                            />
                                            <span
                                                className={`font-semibold truncate ${isHighlighted
                                                    ? "text-indigo-700 dark:text-indigo-300"
                                                    : "text-gray-800 dark:text-neutral-100"
                                                    }`}
                                            >
                                                {row.teamName}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-2 py-2 text-center tabular-nums text-gray-600 dark:text-neutral-300">
                                        {row.played}
                                    </td>
                                    <td className="px-2 py-2 text-center tabular-nums text-emerald-600 dark:text-emerald-400">
                                        {row.wins}
                                    </td>
                                    <td className="px-2 py-2 text-center tabular-nums text-amber-600 dark:text-amber-400">
                                        {row.draws}
                                    </td>
                                    <td className="px-2 py-2 text-center tabular-nums text-rose-600 dark:text-rose-400">
                                        {row.losses}
                                    </td>
                                    <td className="px-2 py-2 text-center tabular-nums text-gray-600 dark:text-neutral-300">
                                        {row.goalsFor}
                                    </td>
                                    <td className="px-2 py-2 text-center tabular-nums text-gray-600 dark:text-neutral-300">
                                        {row.goalsAgainst}
                                    </td>
                                    <td className={`px-2 py-2 text-center tabular-nums font-semibold ${gdColor}`}>
                                        {row.goalDiff > 0 ? "+" : ""}{row.goalDiff}
                                    </td>
                                    <td className="px-3 py-2 text-center tabular-nums font-black text-gray-900 dark:text-white">
                                        {row.points}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Ver más */}
            {standings.length > 12 && (
                <button
                    onClick={() => setExpanded((v) => !v)}
                    className="w-full py-2 text-[11px] font-semibold text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30 transition border-t border-gray-100 dark:border-neutral-800"
                >
                    {expanded ? "Ver solo top 12" : `Ver todos (${standings.length})`}
                </button>
            )}

            {/* Leyenda de destinos */}
            {destinations.length > 0 && (
                <div className="px-4 py-2 border-t border-gray-100 dark:border-neutral-800 flex flex-wrap gap-2 text-[10px] text-gray-500 dark:text-neutral-400">
                    {destinations.map((d, i) => (
                        <span key={i} className="inline-flex items-center gap-1">
                            <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: d.color }}
                            />
                            {d.name}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}