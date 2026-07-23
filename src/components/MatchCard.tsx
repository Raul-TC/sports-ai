import { useState } from "react";
import { PredictionResult, ExcludedTeam } from "@/types";
import { isMatchTrap } from "@/utils/trapDetection";
import { getWarningsAndExclusions, getBestPicks } from "@/utils/picks";
import { getTopScoreProbabilities } from "@/utils/poisson";
import { TeamStatsBlock } from "./TeamStatsBlock";
import { StatBadge } from "./StatBadge";
import OddsPanel from "@/components/OddsPanel";
import {
    ChevronDown,
    ChevronUp,
    Trophy,
    Clock,
    ShieldAlert,
    Goal,
    Circle,
    Info,
} from "lucide-react";
import { RiskSection } from "./RiskSelection";

interface MatchCardProps {
    prediction: PredictionResult;
    isSelected: boolean;
    onToggle: () => void;
    excludedTeams: ExcludedTeam[];
    onExcludeTeam: (teamName: string, scoredGoals: number, isWin: boolean) => void;
    onRemoveExcludedTeam: (teamName: string) => void;
}

const getFavorite = (pred: any) => {
    const { homeWin, draw, awayWin } = pred.moneyline;
    if (homeWin.prob > draw.prob && homeWin.prob > awayWin.prob) return "home";
    if (awayWin.prob > homeWin.prob && awayWin.prob > draw.prob) return "away";
    return "draw";
};
export function MatchCard({
    prediction: r,
    isSelected,
    onToggle,
    excludedTeams,
    onExcludeTeam,
    onRemoveExcludedTeam,
}: MatchCardProps) {
    const favorite = getFavorite(r.prediction);
    const favTeam =
        favorite === "home"
            ? r.home.teamName
            : favorite === "away"
                ? r.away.teamName
                : "Empate";

    const homeLambda = r.prediction.homeExpectedGoals || 0;
    const awayLambda = r.prediction.awayExpectedGoals || 0;
    const topScores = getTopScoreProbabilities(homeLambda, awayLambda, 10, 10);

    const trap = isMatchTrap(r);
    const { warnings, excludedMarkets } = getWarningsAndExclusions(
        trap,
        r.home.teamName,
        r.away.teamName
    );

    const { best: bestPick, plays, altas, ratoneras, medias } = getBestPicks(
        r.prediction,
        r.home.teamName,
        r.away.teamName,
        trap.level,
        excludedMarkets
    );

    const formatTime = (iso: string) => {
        const date = new Date(iso);
        return date.toLocaleString("es-ES", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    };


    return (
        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden transition-all duration-200 hover:shadow-md">
            {/* Tarjeta clickeable */}
            <div className="p-4 cursor-pointer" onClick={onToggle}>
                {/* Header */}
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{formatTime(r.startTime)}</span>
                        <span className="hidden md:inline">·</span>
                        <span className="truncate">{r.competitionName}</span>
                    </div>
                    <div>
                        {isSelected ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                </div>

                {/* Equipos excluidos */}
                {excludedTeams.some(t => t.name === r.home.teamName || t.name === r.away.teamName) && (
                    <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800/30">
                        <div className="text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
                            <span>⚠️</span> Alertas de equipos en racha negativa
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {excludedTeams
                                .filter(t => t.name === r.home.teamName || t.name === r.away.teamName)
                                .map((team) => (
                                    <div
                                        key={team.name}
                                        className="text-xs bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md px-2 py-1 flex items-center gap-1"
                                    >
                                        <span className="font-medium text-red-700 dark:text-red-300">{team.name}</span>
                                        <span className="text-red-500 dark:text-red-400">
                                            {team.losses > 0 ? `${team.losses} derrotas consecutivas` : 'Sin derrotas recientes'}
                                        </span>
                                        {team.goalsScored === 0 && (
                                            <span className="text-red-400 dark:text-red-500">(no ha anotado)</span>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRemoveExcludedTeam(team.name);
                                            }}
                                            className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300 ml-1"
                                            title="Eliminar de la lista negra"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* Equipos y favorito */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                    <div className="flex items-center gap-2 font-medium text-gray-800 dark:text-gray-100">
                        <span>{r.home.teamName}</span>
                        <span className="text-gray-400 text-sm">vs</span>
                        <span>{r.away.teamName}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 ml-auto">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                            <Trophy className="w-3 h-3" />
                            {favTeam}
                        </span>
                        {trap.isTrap && (
                            <span
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${trap.level === "high"
                                    ? "text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20"
                                    : trap.level === "medium"
                                        ? "text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20"
                                        : trap.level === "low"
                                            ? "text-yellow-600 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20"
                                            : "hidden"
                                    } cursor-help`}
                                title={`Nivel de riesgo: ${trap.level.toUpperCase()}\n${trap.details.map(d => `${d.team}: ${d.reason}`).join("\n")}`}
                            >
                                <ShieldAlert className="w-3 h-3" />
                                Trampa {trap.level}
                            </span>
                        )}
                    </div>
                    {/* Botones de exclusión */}
                    <div className="flex items-center gap-1 ml-2">
                        {(() => {
                            const homeExcluded = excludedTeams.find(t => t.name === r.home.teamName);
                            const awayExcluded = excludedTeams.find(t => t.name === r.away.teamName);
                            return (
                                <>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (homeExcluded) {
                                                onRemoveExcludedTeam(r.home.teamName);
                                            } else {
                                                onExcludeTeam(r.home.teamName, 0, false);
                                            }
                                        }}
                                        className={`text-xs px-1.5 py-0.5 rounded ${homeExcluded ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400'} hover:opacity-70 transition-opacity`}
                                        title={homeExcluded ? `Eliminar ${r.home.teamName} de la lista negra` : `Marcar ${r.home.teamName} como perdedor`}
                                    >
                                        {homeExcluded ? '❌' : '🚫'}
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (awayExcluded) {
                                                onRemoveExcludedTeam(r.away.teamName);
                                            } else {
                                                onExcludeTeam(r.away.teamName, 0, false);
                                            }
                                        }}
                                        className={`text-xs px-1.5 py-0.5 rounded ${awayExcluded ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400'} hover:opacity-70 transition-opacity`}
                                        title={awayExcluded ? `Eliminar ${r.away.teamName} de la lista negra` : `Marcar ${r.away.teamName} como perdedor`}
                                    >
                                        {awayExcluded ? '❌' : '🚫'}
                                    </button>
                                </>
                            );
                        })()}
                    </div>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-neutral-800">
                    <TeamStatsBlock team={r.home} title="Local" />
                    <TeamStatsBlock team={r.away} title="Visitante" />
                </div>

                {/* Marcadores exactos */}
                <div className="mt-3 pt-2 border-t border-gray-100 dark:border-neutral-800">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Circle className="w-3 h-3" />
                            Marcadores más probables
                            <span title="Probabilidad calculada con modelo de Poisson">
                                <Info className="w-3 h-3 text-gray-400 opacity-50 cursor-help" />
                            </span>
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {topScores.map((score, idx) => (
                            <StatBadge
                                key={idx}
                                label={`${(score.prob * 100).toFixed(1)}%`}
                                value={`${score.home}-${score.away}`}
                                icon={Goal}
                                secondary
                                description={`Probabilidad de que el marcador sea ${score.home}-${score.away}`}
                                className="bg-indigo-50/70 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800"
                            />
                        ))}
                        {topScores.length === 0 && (
                            <span className="text-xs text-gray-400">No hay datos suficientes</span>
                        )}
                    </div>
                </div>

                {/* Riesgo y picks */}
                <RiskSection
                    trap={trap}
                    warnings={{ warnings, excludedMarkets }}
                    bestPick={bestPick}
                    ratoneras={ratoneras}
                    medias={medias}
                    altas={altas}
                    plays={plays}
                />
            </div>

            {/* Odds expandible */}
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
}