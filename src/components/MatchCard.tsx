"use client";

import { getTopScoreProbabilities } from "@/utils/poisson";
import { TeamStatsBlock } from "./TeamStatsBlock";
import { StatBadge } from "./StatBadge";
import OddsPanel from "@/components/OddsPanel";
import {
    Clock,
    Goal,
    Circle,
    AlertCircle,
    Sparkles,
    MapPin,
    Tv,
    UserRound,
    History,
    Square,
    FileText,
    BarChart,
    Users,
    Zap,
    DollarSign,
} from "lucide-react";

import { EnrichedPrediction } from "@/utils/enrichPredictions";
import { scoreEngine } from "@/utils/scoringEngine";
import { isPickCorrect } from "@/utils/pickValidation";
import { gateEngine } from "@/utils/gateEngine";
import { trapEngine } from "@/utils/trapEngine";
import { recommendationEngine } from "@/utils/recomendationEngine";
import { getBestPicks } from "@/utils/picks";
import { useMemo, useState } from "react";

interface MatchCardProps {
    prediction: EnrichedPrediction;
    activeTab: "today" | "future" | "past";
}
/**
 * Renderiza las estadísticas de un equipo agrupadas por categoría
 */
const renderTeamStatistics = (teamId: number, statistics: any[]) => {
    // Filtrar estadísticas del equipo
    const teamStats = statistics.filter((s) => s.competitorId === teamId);

    // Agrupar por categoría (categoryName)
    const grouped: Record<string, any[]> = {};
    teamStats.forEach((stat) => {
        const cat = stat.categoryName || 'General';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(stat);
    });

    // Ordenar categorías por categoryOrder (si existe) para mantener consistencia
    const sortedCategories = Object.keys(grouped).sort((a, b) => {
        const orderA = grouped[a][0]?.categoryOrder || 99;
        const orderB = grouped[b][0]?.categoryOrder || 99;
        return orderA - orderB;
    });

    return sortedCategories.map((cat) => (
        <div key={cat} className="mb-2">
            <div className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 border-b border-gray-200 dark:border-neutral-700 pb-0.5 mb-1">
                {cat}
            </div>
            {grouped[cat].map((stat) => (
                <div key={stat.id} className="flex justify-between py-0.5 border-b border-gray-100 dark:border-neutral-700/50">
                    <span className="text-gray-500 dark:text-gray-400">{stat.name}</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                        {stat.value || '-'}
                        {stat.valuePercentage !== undefined && stat.valuePercentage !== null && (
                            <span className="text-[9px] text-gray-400 ml-1">
                                ({Math.round(stat.valuePercentage * 100)}%)
                            </span>
                        )}
                    </span>
                </div>
            ))}
        </div>
    ));
};
type TabKey = 'resumen' | 'estadisticas' | 'historial' | 'bajas' | 'picks' | 'odds';
export function MatchCard({ prediction: r, activeTab }: MatchCardProps) {
    const homeLambda = r.prediction.homeExpectedGoals || 0;
    const awayLambda = r.prediction.awayExpectedGoals || 0;
    const topScoresTwo = getTopScoreProbabilities(homeLambda, awayLambda, 10, 16);
    const [currentTab, setCurrentTab] = useState<TabKey>('resumen');
    const [h2hFilter, setH2hFilter] = useState<'all' | 'home' | 'away'>('all');
    /**
     * Renderiza las estadísticas de un equipo agrupadas por categoría
     */
    const StatRow = ({ label, value }: { label: string; value: string | number }) => (
        <div className="flex justify-between border-b border-gray-100 dark:border-neutral-700/50 py-0.5">
            <span className="text-gray-500 dark:text-gray-400">{label}</span>
            <span className="font-medium text-gray-700 dark:text-gray-300">{value}</span>
        </div>
    );
    // const handleClick = (e: React.MouseEvent) => {
    //     e.stopPropagation();
    //     if (onClick) onClick(e);
    //     if (description) setShowTooltip((prev) => !prev);
    // };
    const gate = useMemo(
        () => gateEngine(r.home, r.away, r.prediction),
        [r.home, r.away, r.prediction]
    );

    if (!gate.valid) {
        return (
            <div className="bg-gray-50 dark:bg-neutral-800 rounded-xl p-4 text-sm text-gray-500">
                ⚠️ Datos insuficientes: {gate.reason}
            </div>
        );
    }

    const trap = useMemo(
        () => trapEngine(r.home, r.away, r.prediction, r.volatility),
        [r.home, r.away, r.prediction, r.volatility]
    );

    const scoredPicks = useMemo(
        () =>
            scoreEngine({
                home: r.home,
                away: r.away,
                pred: r.prediction,
                volatility: r.volatility,
            }),
        [r.home, r.away, r.prediction, r.volatility]
    );

    const recommendation = useMemo(
        () => recommendationEngine(scoredPicks, trap, 5),
        [scoredPicks, trap]
    );
    //console.log({ recommendation, partido: r.home.teamName + " vs " + r.away.teamName })
    const { plays, altas, ratoneras, medias } = getBestPicks(r.prediction, r.home.teamName, r.away.teamName, trap.level);

    const formatTime = (iso: string) => {
        const date = new Date(iso);
        return date.toLocaleString("es-ES", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // ============================================================
    // FUNCIONES AUXILIARES PARA MOSTRAR DATOS
    // ============================================================

    // Filtrar últimos partidos
    const homeGames = r.recentMatches?.home
        ?.filter((el: { competitionDisplayName: string; statusText: string; homeCompetitor: { id: number; }; awayCompetitor: { id: number; }; }) => el.competitionDisplayName !== 'Partido Amistoso' &&
            (el.statusText === 'Finalizado' || el.statusText === 'Por penaltis') &&
            (el.homeCompetitor.id === r.home.id || el.awayCompetitor.id === r.home.id))
        .slice(0, 5)
        .sort((a: { startTime: string | number | Date; }, b: { startTime: string | number | Date; }) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()) || [];

    const homeGamesLocal = r.recentMatches?.home
        ?.filter((el: { competitionDisplayName: string; statusText: string; homeCompetitor: { id: number; }; }) => el.competitionDisplayName !== 'Partido Amistoso' &&
            (el.statusText === 'Finalizado' || el.statusText === 'Por penaltis') &&
            (el.homeCompetitor.id === r.home.id))
        .slice(0, 5)
        .sort((a: { startTime: string | number | Date; }, b: { startTime: string | number | Date; }) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()) || [];

    const awayGames = r.recentMatches?.away
        ?.filter((el: { competitionDisplayName: string; statusText: string; homeCompetitor: { id: number; }; awayCompetitor: { id: number; }; }) => el.competitionDisplayName !== 'Partido Amistoso' &&
            (el.statusText === 'Finalizado' || el.statusText === 'Por penaltis') &&
            (el.homeCompetitor.id === r.away.id || el.awayCompetitor.id === r.away.id))
        .slice(0, 5)
        .sort((a: { startTime: string | number | Date; }, b: { startTime: string | number | Date; }) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()) || [];

    const awayGamesAway = r.recentMatches?.away
        ?.filter((el: { competitionDisplayName: string; statusText: string; awayCompetitor: { id: number; }; }) => el.competitionDisplayName !== 'Partido Amistoso' &&
            (el.statusText === 'Finalizado' || el.statusText === 'Por penaltis') &&
            (el.awayCompetitor.id === r.away.id))
        .slice(0, 5)
        .sort((a: { startTime: string | number | Date; }, b: { startTime: string | number | Date; }) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()) || [];

    const results = r.result;

    // ============================================================
    // FUNCIÓN PARA EL PICK ACIERTO
    // ============================================================

    const getFinalPick = () => {
        const homeGoals = r.result?.homeScore ?? 0;
        const awayGoals = r.result?.awayScore ?? 0;
        const homeCorners = r.result?.homeCorners ?? 0;
        const awayCorners = r.result?.awayCorners ?? 0;
        const totalGoals = homeGoals + awayGoals;
        const totalCorners = homeCorners + awayCorners;

        const market = recommendation?.pick.market;

        let marketName = '';
        let realValue = 0;
        let unit = 'gol';

        if (market?.startsWith('Total de goles')) {
            marketName = 'totales';
            realValue = totalGoals;
        } else if (market?.startsWith('Goles del local')) {
            marketName = `de ${r.home.teamName}`;
            realValue = homeGoals;
        } else if (market?.startsWith('Goles del visitante')) {
            marketName = `de ${r.away.teamName}`;
            realValue = awayGoals;
        } else if (market === 'Córners') {
            realValue = totalCorners;
            unit = 'Córners';
        } else if (market === 'Doble oportunidad') {
            return `Resultado: ${homeGoals}-${awayGoals}`;
        }

        const plural = (realValue === 1 && unit === 'gol') ? '' : 'es';
        const valueText = unit === 'gol' ? `${realValue} ${unit}${plural}` : `${realValue} ${unit}`;
        return `${valueText} ${marketName}`;
    };

    // ============================================================
    // RENDER DEL H2H
    // ============================================================
    // console.log({ r })
    const renderH2H = () => {
        if (!r.h2h || r.h2h.length === 0) return null;

        // Filtrar partidos con scores válidos
        const validGames = r.h2h.filter(
            (h) =>
                h.homeCompetitor?.score != null &&
                h.awayCompetitor?.score != null &&
                h.homeCompetitor?.score !== undefined &&
                h.awayCompetitor?.score !== undefined
        );
        if (validGames.length === 0) return null;

        const currentHomeId = r.home.id;
        const currentAwayId = r.away.id;

        // Aplicar filtro
        const filteredGames = validGames.filter((h) => {
            if (h2hFilter === 'home') {
                return h.homeCompetitor.id === currentHomeId;
            }
            if (h2hFilter === 'away') {
                return h.awayCompetitor.id === currentHomeId;
            }
            return true; // 'all'
        });

        if (filteredGames.length === 0) {
            return (
                <div className="my-3 pt-2 border-t border-gray-100 dark:border-neutral-800 px-4">
                    <div className="flex items-center gap-2 mb-2">
                        <History className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            Historial H2H
                        </span>
                    </div>
                    <div className="text-xs text-gray-400">No hay partidos con este filtro.</div>
                </div>
            );
        }
        // console.log({ filteredGames })

        const totalGames = filteredGames.length;
        let totalGoals = 0;
        let bttsCount = 0;
        let over25Count = 0;
        let homeWins = 0, awayWins = 0, draws = 0;
        const scoreFreq: Record<string, number> = {};

        for (const h of filteredGames) {
            const homeScore = h.homeCompetitor.score;
            const awayScore = h.awayCompetitor.score;
            const total = homeScore + awayScore;

            totalGoals += total;
            if (homeScore > 0 && awayScore > 0) bttsCount++;
            if (total >= 2.5) over25Count++;

            const key = `${homeScore}-${awayScore}`;
            scoreFreq[key] = (scoreFreq[key] || 0) + 1;

            let winner = h.winner;
            if (!winner || winner === 0) {
                if (homeScore > awayScore) winner = 1;
                else if (homeScore < awayScore) winner = 2;
                else winner = -1;
            }

            if (winner === 1) {
                if (h.homeCompetitor.id === currentHomeId) homeWins++;
                else if (h.homeCompetitor.id === currentAwayId) awayWins++;
            } else if (winner === 2) {
                if (h.awayCompetitor.id === currentHomeId) homeWins++;
                else if (h.awayCompetitor.id === currentAwayId) awayWins++;
            } else {
                draws++;
            }
        }

        const avgGoals = totalGoals / totalGames;
        const bttsPercent = (bttsCount / totalGames) * 100;
        const over25Percent = (over25Count / totalGames) * 100;
        const mostFrequentScore = Object.entries(scoreFreq).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
        const homeWinPercent = (homeWins / totalGames) * 100;
        const awayWinPercent = (awayWins / totalGames) * 100;
        const drawPercent = (draws / totalGames) * 100;

        // Botones de filtro
        const filterOptions = [
            { key: 'home', label: 'Local' },
            { key: 'all', label: 'Todos' },
            { key: 'away', label: 'Visita' },
        ] as const;

        return (
            <div className=" dark:border-neutral-800 px-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <History className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            Historial H2H
                        </span>
                        <span className="text-xs text-gray-400">
                            ({homeWins}V - {draws}E - {awayWins}D · {totalGames} partidos)
                        </span>
                    </div>
                    {/* Botones de filtro */}
                    <div className="flex gap-1">
                        {filterOptions.map((opt) => (
                            <button
                                key={opt.key}
                                onClick={(e) => {
                                    e.stopPropagation(); // Evita que se expanda el panel de odds
                                    setH2hFilter(opt.key);
                                }}
                                className={`px-2 py-0.5 text-[10px] font-medium rounded-full border transition-colors ${h2hFilter === opt.key
                                    ? 'bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700'
                                    : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200 dark:bg-neutral-800 dark:text-gray-400 dark:border-neutral-700 dark:hover:bg-neutral-700'
                                    }`}
                            >
                                {opt.label} ({validGames.filter((h) => {
                                    if (opt.key === 'home') return h.homeCompetitor.id === currentHomeId;
                                    if (opt.key === 'away') return h.awayCompetitor.id === currentHomeId;
                                    return true;
                                }).length})
                            </button>
                        ))}
                    </div>
                </div>

                {/* Estadísticas resumen */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                    <StatBadge label="Prom. goles" value={avgGoals.toFixed(1)} secondary />
                    <StatBadge label="BTTS" value={`${bttsPercent.toFixed(0)}%`} secondary />
                    <StatBadge label="Over 2.5" value={`${over25Percent.toFixed(0)}%`} secondary />
                    <StatBadge label="Marcador común" value={mostFrequentScore} secondary />
                    <StatBadge label="Local" value={`${homeWinPercent.toFixed(0)}%`} secondary />
                    <StatBadge label="Empate" value={`${drawPercent.toFixed(0)}%`} secondary />
                    <StatBadge label="Visitante" value={`${awayWinPercent.toFixed(0)}%`} secondary />
                </div>

                {/* Lista de partidos */}
                <div className="flex flex-wrap gap-2 items-center">
                    {filteredGames.slice(0, 10).map((el) => (
                        <div
                            key={el.id}
                            className="flex items-center gap-1.5 text-xs bg-gray-50 dark:bg-neutral-800 px-2 py-1 rounded-lg border border-gray-200 dark:border-neutral-700"
                        >
                            <img
                                src={`https://imagecache.365scores.com/image/upload/f_png,w_20,h_20,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v5/Competitors/${el.homeCompetitor.id}`}
                                alt={el.homeCompetitor.name}
                                className="w-4 h-4 object-contain"
                            />
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                {el.homeCompetitor.score}
                            </span>
                            <span className="text-gray-400">vs</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                {el.awayCompetitor.score}
                            </span>
                            <img
                                src={`https://imagecache.365scores.com/image/upload/f_png,w_20,h_20,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v5/Competitors/${el.awayCompetitor.id}`}
                                alt={el.awayCompetitor.name}
                                className="w-4 h-4 object-contain"
                            />
                            <span className="text-gray-400 text-[9px] ml-0.5">
                                {new Date(el.startTime).toLocaleDateString("es-MX")}
                            </span>
                        </div>
                    ))}
                    {filteredGames.length > 10 && (
                        <span className="text-xs text-gray-400">+{filteredGames.length - 8} más</span>
                    )}
                </div>
            </div>
        );
    };

    // ============================================================
    // RENDER DE ÚLTIMOS PARTIDOS
    // ============================================================
    // Renderizar con iconos y nombres

    const renderRecentGames = (games: any[], title: string, teamId: number) => {
        if (games.length === 0) return null;
        return (
            <div className="flex flex-col gap-1 mb-2 px-4">
                <span className="text-[10px] text-gray-400 font-medium">{title}</span>
                <div className="flex flex-wrap gap-1 mx-auto">
                    {games.map((el) => {
                        // Determinar si el equipo es local o visitante en este partido
                        const isHome = el.homeCompetitor.id === teamId;
                        const isAway = el.awayCompetitor.id === teamId;
                        if (!isHome && !isAway) return null; // seguridad

                        const ourScore = isHome ? el.homeCompetitor.score : el.awayCompetitor.score;
                        const opponentScore = isHome ? el.awayCompetitor.score : el.homeCompetitor.score;

                        let resultClass = '';
                        if (ourScore > opponentScore) {
                            resultClass = 'border-green-500 bg-green-50 dark:bg-green-900/20';
                        } else if (ourScore < opponentScore) {
                            resultClass = 'border-red-500 bg-red-50 dark:bg-red-900/20';
                        } else {
                            resultClass = 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
                        }

                        return (
                            <div
                                key={el.id}
                                className={`flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded border ${resultClass}`}
                            >
                                <img
                                    src={`https://imagecache.365scores.com/image/upload/f_png,w_20,h_20,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v5/Competitors/${el.homeCompetitor.id}`}
                                    className="w-4 h-4 object-contain"
                                    alt=""
                                />
                                <span className="text-gray-600 dark:text-gray-300">{el.homeCompetitor.score}</span>
                                <span className="text-gray-400">vs</span>
                                <span className="text-gray-600 dark:text-gray-300">{el.awayCompetitor.score}</span>
                                <img
                                    src={`https://imagecache.365scores.com/image/upload/f_png,w_20,h_20,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v5/Competitors/${el.awayCompetitor.id}`}
                                    className="w-4 h-4 object-contain"
                                    alt=""
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // ============================================================
    // RENDER PRINCIPAL
    // ============================================================
    // console.log({ results: r.result })
    return (
        <div className="bg-white dark:bg-neutral-900  shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden transition-all duration-200 hover:shadow-md my-4">
            {/* Fondo decorativo con colores de los equipos */}

            <div className="relative overflow-hidden flex flex-col gap-2 ">
                <div className="absolute inset-0" style={{
                    background: `linear-gradient(
                        135deg,
                        ${r.home.colors.localColor}25 0%,
                        #0f172a 50%,
                        ${r.away.colors.localColor}25 100%
                    )`
                }} />

                {/* <div className="flex justify-between w-full px-4 py-2 backdrop-blur-sm">
                    <span className="text-sm dark:text-gray-50 font-medium text-white">
                        {r.competitionName}
                    </span>
                    <span className="text-sm dark:text-gray-50 font-medium text-white">
                        {formatTime(r.startTime)}
                    </span>
                    <span className="text-sm dark:text-gray-50 font-medium text-white">
                        {r.estadio && (
                            <span className="flex items-center justify-center gap-0.5">
                                <MapPin className="w-3 h-3" /> {r.estadio.name}
                            </span>
                        )}
                    </span>
                </div> */}
                <div className="px-3 py-2 border-b border-gray-100 dark:border-neutral-800 bg-gray-900/40">
                    <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400">
                        <span className="font-medium text-gray-700 dark:text-gray-300">{r.competitionName}</span>
                        <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                            <Clock className="w-3 h-3" />
                            {formatTime(r.startTime)}
                        </span>
                    </div>
                    {r.estadio && (
                        <div className="flex items-center gap-1 text-[9px] text-gray-400 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            <span>{r.estadio.name}</span>
                            {r.tv && r.tv.length > 0 && (
                                <>
                                    <span className="mx-1 text-gray-700 dark:text-gray-300">·</span>
                                    <Tv className="w-3 h-3" />
                                    <span>{r.tv.map(tv => tv.name).join(', ')}</span>
                                </>
                            )}
                            {r.arbitro && r.arbitro.length > 0 && (
                                <>
                                    <span className="mx-1 text-gray-700 dark:text-gray-300">·</span>
                                    <UserRound className="w-3 h-3" />
                                    <span>{r.arbitro.map(a => a.name).join(', ')}</span>
                                </>
                            )}
                        </div>
                    )}
                </div>
                <div className="relative p-6 w-full">
                    {/* Cabecera: equipos, hora, etc. */}

                    <div className="flex items-center justify-between w-full">
                        <div className="w-full flex items-center">
                            <div className="flex flex-col items-center gap-2 w-full">

                                <img
                                    src={`https://imagecache.365scores.com/image/upload/f_png,w_32,h_32,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v5/Competitors/${r.home.id}`}
                                    className="w-16 h-16 object-contain"
                                    alt={r.home.teamName}
                                />
                                <span className="font-bold text-xs md:text-lg">{r.home.teamName}</span>
                                <span className="text-green-400 font-semibold">
                                    {r.prediction.moneyline.homeWin.prob}%
                                </span>
                            </div>
                            <div>
                                {r.result && (
                                    <span className="font-bold md:text-4xl">
                                        {r.result.homeScore}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="text-center w-full flex flex-col items-center gap-1">
                            <div className="md:text-3xl font-bold">VS</div>
                        </div>

                        <div>
                            {r.result && (
                                <span className="font-bold md:text-4xl">
                                    {r.result.awayScore}
                                </span>
                            )}
                        </div>
                        <div className="w-full flex items-center">
                            <div className="flex flex-col items-center gap-2 w-full">
                                <img
                                    src={`https://imagecache.365scores.com/image/upload/f_png,w_32,h_32,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v5/Competitors/${r.away.id}`}
                                    className="w-16 h-16 object-contain"
                                    alt={r.away.teamName}
                                />
                                <span className="font-bold text-xs md:text-lg">{r.away.teamName}</span>
                                <span className="text-green-400 font-semibold">
                                    {r.prediction.moneyline.awayWin.prob}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ============================================================ */}
            {/* BARRA DE PESTAÑAS */}
            {/* ============================================================ */}
            <div className="px-4 pt-3 border-b border-gray-100 dark:border-neutral-800">
                <div className="flex gap-0.5 overflow-x-auto pb-1 scrollbar-hide">
                    {[
                        { key: 'resumen', label: 'Resumen', icon: FileText },
                        { key: 'estadisticas', label: 'Estadísticas', icon: BarChart },
                        { key: 'historial', label: 'Historial', icon: History },
                        { key: 'bajas', label: 'Bajas', icon: Users },
                        { key: 'picks', label: 'Picks', icon: Zap },
                        { key: 'odds', label: 'Odds', icon: DollarSign },
                    ].map((tab) => {
                        const isActive = currentTab === tab.key;
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setCurrentTab(tab.key as TabKey)}
                                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-all  cursor-pointer whitespace-nowrap ${isActive
                                    ? 'bg-white dark:bg-neutral-800 text-gray-900 dark:text-white shadow-sm border-b-2 border-indigo-500'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ============================================================ */}
            {/* CONTENIDO SEGÚN PESTAÑA */}
            {/* ============================================================ */}
            <div className="py-3">
                {/* PESTAÑA: RESUMEN */}

                {currentTab === 'resumen' && (
                    <div className="px-4 space-y-3r">
                        {/* Métricas clave */}
                        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-300">
                            <span className="flex items-center gap-1">
                                <span className="font-medium">BTTS</span>
                                <span className="font-bold text-gray-900 dark:text-white">
                                    {r.prediction.btts.yes.prob}%
                                </span>
                                <span className="text-[10px] text-gray-400">
                                    (cuota: {r.prediction.btts.yes.odd})
                                </span>
                            </span>
                            <span className="text-gray-300 dark:text-gray-600">|</span>
                            <span className="flex items-center gap-1">
                                <span className="font-medium">Goles Esperados</span>
                                <span className="font-bold text-gray-900 dark:text-white">
                                    {(r.prediction.awayExpectedGoals + r.prediction.homeExpectedGoals).toFixed(2)}
                                </span>
                            </span>
                            <span className="text-gray-300 dark:text-gray-600">|</span>
                            <span className="flex items-center gap-1">
                                <span className="font-medium">Córners</span>
                                <span className="font-bold text-gray-900 dark:text-white">
                                    {r.prediction.corners.expectedTotal}
                                </span>
                                <span className="text-[10px] text-gray-400">esperados</span>
                            </span>
                        </div>

                        {/* Indicador de ataque */}
                        <div className="flex justify-center text-xs my-2">
                            {homeLambda > 1.2 && awayLambda > 1.2 ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                                    ⚽ Ambos equipos generan buen ataque
                                </span>
                            ) : homeLambda > 1.2 ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                    🔵 {r.home.teamName} genera buen ataque
                                </span>
                            ) : awayLambda > 1.2 ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                                    🔴 {r.away.teamName} genera buen ataque
                                </span>
                            ) : (
                                <span className="text-gray-400">Partido con poco ataque esperado</span>
                            )}
                        </div>

                        {/* Marcadores más probables */}
                        <div className="flex flex-wrap items-center justify-center gap-1 my-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Marcadores:</span>
                            {topScoresTwo.slice(0, 10).map((score, idx) => (
                                <StatBadge
                                    key={idx}
                                    label={`${(score.prob * 100).toFixed(1)}%`}
                                    value={`${score.home}-${score.away}`}
                                    icon={Goal}
                                    secondary
                                    description={`Probabilidad de que el marcador sea ${score.home}-${score.away}`}
                                    scoreResult={results ? `${results.homeScore}-${results.awayScore}` : undefined}
                                />
                            ))}
                            {topScoresTwo.length === 0 && <span className="text-xs text-gray-400">Sin datos</span>}
                        </div>

                        {/* ============================================================ */}
                        {/* PICK RECOMENDADO CON REGLAS DE CONFIANZA */}
                        {/* ============================================================ */}
                        {(() => {
                            const totalLambda = homeLambda + awayLambda;
                            const probBTTS = (1 - Math.exp(-homeLambda)) * (1 - Math.exp(-awayLambda));
                            const probOver1_5 = 1 - (Math.exp(-totalLambda) * (1 + totalLambda));
                            const probOver2_5 = 1 - (Math.exp(-totalLambda) * (1 + totalLambda + Math.pow(totalLambda, 2) / 2));

                            const oddBTTS_est = 1 / probBTTS;
                            const oddOver1_5_est = 1 / probOver1_5;
                            const oddOver2_5_est = 1 / probOver2_5;

                            // Reglas para Over 2.5
                            let over25Confidence = '';
                            let over25Color = '';
                            if (totalLambda > 3.0) { over25Confidence = 'Excelente'; over25Color = 'bg-green-600 text-white'; }
                            else if (totalLambda >= 2.7) { over25Confidence = 'Dudoso'; over25Color = 'bg-yellow-500 text-white'; }
                            else if (totalLambda >= 2.3) { over25Confidence = 'Arriesgado'; over25Color = 'bg-red-500 text-white'; }
                            else { over25Confidence = 'Evitar'; over25Color = 'bg-red-500 text-white'; }

                            // Reglas para BTTS
                            let bttsConfidence = '';
                            let bttsColor = '';
                            const probBTTS_pct = probBTTS * 100;
                            if (probBTTS_pct > 67) { bttsConfidence = 'Excelente'; bttsColor = 'bg-green-600 text-white'; }
                            else if (probBTTS_pct >= 62) { bttsConfidence = 'Bueno'; bttsColor = 'bg-green-500 text-white'; }
                            else if (probBTTS_pct >= 58) { bttsConfidence = 'Arriesgado'; bttsColor = 'bg-yellow-500 text-white'; }
                            else { bttsConfidence = 'Evitar'; bttsColor = 'bg-red-500 text-white'; }

                            // Reglas para Over 1.5 (simple: si > 80% excelente, >70% bueno, >60% dudoso, sino evitar)
                            let over15Confidence = '';
                            let over15Color = '';
                            const probOver1_5_pct = probOver1_5 * 100;
                            if (probOver1_5_pct > 80) { over15Confidence = 'Excelente'; over15Color = 'bg-green-600 text-white'; }
                            else if (probOver1_5_pct >= 70) { over15Confidence = 'Bueno'; over15Color = 'bg-green-500 text-white'; }
                            else if (probOver1_5_pct >= 60) { over15Confidence = 'Dudoso'; over15Color = 'bg-yellow-500 text-white'; }
                            else { over15Confidence = 'Evitar'; over15Color = 'bg-red-500 text-white'; }

                            // Objeto con todos los mercados
                            const markets = [
                                {
                                    key: 'BTTS',
                                    label: 'Ambos Anotan',
                                    prob: probBTTS_pct,
                                    odd: oddBTTS_est,
                                    realOdd: r.prediction.btts.yes.odd,
                                    confidence: bttsConfidence,
                                    color: bttsColor,
                                    emoji: '⚽',
                                },
                                {
                                    key: 'Over1.5',
                                    label: 'Over 1.5',
                                    prob: probOver1_5_pct,
                                    odd: oddOver1_5_est,
                                    realOdd: null,
                                    confidence: over15Confidence,
                                    color: over15Color,
                                    emoji: '⬆️',
                                },
                                {
                                    key: 'Over2.5',
                                    label: 'Over 2.5',
                                    prob: probOver2_5 * 100,
                                    odd: oddOver2_5_est,
                                    realOdd: null,
                                    confidence: over25Confidence,
                                    color: over25Color,
                                    emoji: '⬆️⬆️',
                                },
                            ];

                            // Orden de prioridad para elegir el mejor: Excelente > Bueno > Dudoso > Evitar
                            const priority = { Excelente: 4, Bueno: 3, Dudoso: 2, Evitar: 1 };
                            const best = markets.reduce((best, current) => {
                                const bestScore = priority[best.confidence as keyof typeof priority] || 0;
                                const currentScore = priority[current.confidence as keyof typeof priority] || 0;
                                if (currentScore > bestScore) return current;
                                if (currentScore === bestScore && current.prob > best.prob) return current;
                                return best;
                            }, markets[0]);

                            return (
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-md border border-indigo-200 dark:border-indigo-800">
                                    <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1 mb-2">
                                        <Sparkles className="w-3 h-3" />
                                        Mejor opción según estadísticas
                                    </div>

                                    {/* Mejor pick destacado */}
                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                        <span className="font-medium">🎯 {best.emoji} {best.label}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${best.color}`}>
                                            {best.confidence}
                                        </span>
                                        <span className="bg-indigo-100 dark:bg-indigo-800/50 px-1.5 py-0.5 rounded-full">
                                            Prob: {best.prob.toFixed(1)}%
                                        </span>
                                        <span className="bg-indigo-100 dark:bg-indigo-800/50 px-1.5 py-0.5 rounded-full">
                                            Cuota estimada: {best.odd.toFixed(2)}
                                        </span>
                                        {best.realOdd && (
                                            <span className="bg-green-100 dark:bg-green-800/50 px-1.5 py-0.5 rounded-full text-green-700 dark:text-green-300">
                                                Cuota real: {best.realOdd.toFixed(2)}
                                            </span>
                                        )}
                                        <span className="text-gray-400 text-[10px]">
                                            {best.key === 'BTTS'
                                                ? `xG local ${homeLambda.toFixed(2)} · xG visitante ${awayLambda.toFixed(2)}`
                                                : `Goles esperados totales ${totalLambda.toFixed(2)}`}
                                        </span>
                                    </div>

                                    {/* Tabla comparativa de los tres mercados */}
                                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-1 text-[10px]">
                                        {markets.map((m) => (
                                            <div
                                                key={m.key}
                                                className={`flex flex-col items-center p-1.5 rounded border ${m.key === best.key
                                                    ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-100/50 dark:bg-indigo-800/30'
                                                    : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/30'
                                                    }`}
                                            >
                                                <span className="font-medium">{m.emoji} {m.label}</span>
                                                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${m.color}`}>
                                                    {m.confidence}
                                                </span>
                                                <span className="text-gray-600 dark:text-gray-300">
                                                    {m.prob.toFixed(0)}% · {m.odd.toFixed(2)}
                                                </span>
                                                {m.realOdd && (
                                                    <span className="text-green-600 dark:text-green-400 text-[9px]">
                                                        real {m.realOdd.toFixed(2)}
                                                    </span>
                                                )}
                                                {m.key === best.key && (
                                                    <span className="text-indigo-600 dark:text-indigo-300 text-[9px] font-bold">⭐ Recomendado</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Pick original del motor (opcional) */}
                                    {recommendation && (
                                        <div className="mt-2 pt-1 border-t border-indigo-200 dark:border-indigo-800">
                                            <div className="flex flex-wrap items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                                                <span>Pick original:</span>
                                                <span className="font-medium">{recommendation.pick.market}</span>
                                                <span className="font-bold">{recommendation.pick.selection}</span>
                                                <span className="bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded-full">
                                                    {recommendation.pick.confidence}
                                                </span>
                                                {activeTab === 'past' && r.result && (() => {
                                                    const resultText = getFinalPick();
                                                    const correct = isPickCorrect(recommendation.pick, r.result, r.home.teamName, r.away.teamName);
                                                    return (
                                                        <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                            {correct ? `✅ ${resultText}` : '❌ Fallado'}
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* PESTAÑA: ESTADÍSTICAS */}
                {currentTab === 'estadisticas' && (
                    <div className="space-y-4 px-4 pb-2">
                        {/* ============================================================ */}
                        {/* 1. PRE‑MATCH (siempre visible)                                */}
                        {/* ============================================================ */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] px-2 py-0.5 rounded-full font-medium">
                                    Predicción
                                </span>
                                Estadísticas pre‑match
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <TeamStatsBlock
                                    team={r.home}
                                    goalLines={r.prediction.teamGoals.home}
                                    title={r.home.teamName}
                                    opponent={r.away}
                                    results={r.result}
                                />
                                <TeamStatsBlock
                                    team={r.away}
                                    goalLines={r.prediction.teamGoals.away}
                                    title={r.away.teamName}
                                    opponent={r.home}
                                    results={r.result}
                                />
                            </div>

                            {/* Marcadores más probables */}
                            <div className="mt-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                        <Circle className="w-3 h-3" />
                                        Marcadores más probables
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {topScoresTwo.slice(0, 10).map((score, idx) => (
                                        <StatBadge
                                            key={idx}
                                            label={`${(score.prob * 100).toFixed(1)}%`}
                                            value={`${score.home}-${score.away}`}
                                            icon={Goal}
                                            secondary
                                            description={`Probabilidad de que el marcador sea ${score.home}-${score.away}`}
                                            scoreResult={results ? `${results.homeScore}-${results.awayScore}` : undefined}
                                        />
                                    ))}
                                    {topScoresTwo.length === 0 && (
                                        <span className="text-xs text-gray-400">No hay datos suficientes</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ============================================================ */}
                        {/* 2. POST‑MATCH (solo si r.result existe)                      */}
                        {/* ============================================================ */}
                        {r.result && (
                            <div className="border-t border-gray-200 dark:border-neutral-700 pt-3 mt-2">
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-[10px] px-2 py-0.5 rounded-full font-medium">
                                        Finalizado
                                    </span>
                                    Estadísticas del partido
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Local */}
                                    <div className="bg-white dark:bg-neutral-800/50 rounded-lg border border-gray-200 dark:border-neutral-700 p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <img
                                                src={`https://imagecache.365scores.com/image/upload/f_png,w_24,h_24,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v5/Competitors/${r.home.id}`}
                                                className="w-6 h-6 object-contain"
                                                alt=""
                                            />
                                            <span className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate">
                                                {r.home.teamName}
                                            </span>
                                            <span className="ml-auto text-lg font-bold text-gray-800 dark:text-gray-200">
                                                {r.result.homeScore}
                                            </span>
                                        </div>
                                        <div className="space-y-1.5 text-xs">
                                            <StatRow label="Goles esperados (xG)" value={r.result.homeXG.toFixed(2)} />
                                            <StatRow label="xG recibidos (xGA)" value={r.result.homeXGA.toFixed(2)} />
                                            <StatRow label="Tiros totales" value={r.result.homeShots} />
                                            <StatRow label="Tiros a puerta" value={r.result.homeShotsOnTarget} />
                                            <StatRow label="Córners" value={r.result.homeCorners} />
                                            <StatRow label="Faltas cometidas" value={r.result.homeFauls} />
                                            <StatRow label="Faltas recibidas" value={r.result.homeFaulsReceived} />
                                            <StatRow label="Tarjetas amarillas" value={r.result.homeYellowCards} />
                                            <StatRow label="Tarjetas rojas" value={r.result.homeRedCards} />
                                            <StatRow label="Fueras de juego" value={r.result.homeOffsides} />
                                            <StatRow label="Salvadas de portero" value={r.result.homeGoalkeeperSaves} />
                                        </div>
                                    </div>

                                    {/* Visitante */}
                                    <div className="bg-white dark:bg-neutral-800/50 rounded-lg border border-gray-200 dark:border-neutral-700 p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <img
                                                src={`https://imagecache.365scores.com/image/upload/f_png,w_24,h_24,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v5/Competitors/${r.away.id}`}
                                                className="w-6 h-6 object-contain"
                                                alt=""
                                            />
                                            <span className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate">
                                                {r.away.teamName}
                                            </span>
                                            <span className="ml-auto text-lg font-bold text-gray-800 dark:text-gray-200">
                                                {r.result.awayScore}
                                            </span>
                                        </div>
                                        <div className="space-y-1.5 text-xs">
                                            <StatRow label="Goles esperados (xG)" value={r.result.awayXG.toFixed(2)} />
                                            <StatRow label="xG recibidos (xGA)" value={r.result.awayXGA.toFixed(2)} />
                                            <StatRow label="Tiros totales" value={r.result.awayShots} />
                                            <StatRow label="Tiros a puerta" value={r.result.awayShotsOnTarget} />
                                            <StatRow label="Córners" value={r.result.awayCorners} />
                                            <StatRow label="Faltas cometidas" value={r.result.awayFauls} />
                                            <StatRow label="Faltas recibidas" value={r.result.awayFaulsReceived} />
                                            <StatRow label="Tarjetas amarillas" value={r.result.awayYellowCards} />
                                            <StatRow label="Tarjetas rojas" value={r.result.awayRedCards} />
                                            <StatRow label="Fueras de juego" value={r.result.awayOffsides} />
                                            <StatRow label="Salvadas de portero" value={r.result.awayGoalkeeperSaves} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* PESTAÑA: BAJAS */}
                {currentTab === 'bajas' && (
                    <div className="px-4">
                        {r.injuries && (r.injuries.home.length > 0 || r.injuries.away.length > 0) && (
                            <div>
                                <div className={`overflow-hidden transition-all duration-300 ease-in-out max-h-[2000px] opacity-100 mt-2`}>
                                    <div className="flex flex-col sm:flex-row items-start justify-center gap-4">
                                        {/* Lesiones del local */}
                                        {r.injuries.home.length > 0 && (
                                            <div className="flex-1">
                                                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                                    {r.home.teamName}
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {r.injuries.home.map((p) => (
                                                        <div
                                                            key={p.id}
                                                            className="relative flex flex-col items-center gap-1 px-2 py-1 text-[10px] bg-gray-50 dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 min-w-[60px]"
                                                        >
                                                            <img
                                                                src={`https://imagecache.365scores.com/image/upload/f_png,w_62,h_62,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v21/Athletes/${p.athleteId}`}
                                                                alt={p.name}
                                                                className="w-8 h-8 object-cover rounded-full"
                                                                onError={(e) => (e.currentTarget.src = '/placeholder-player.png')}
                                                            />
                                                            <span className="font-medium text-center">{p.name}</span>
                                                            <span className="text-[8px] text-gray-400">{p.position}</span>
                                                            {p.status === 'suspension' && (
                                                                <Square className="w-3 h-3 fill-red-500 text-red-500" />
                                                            )}
                                                            {p.status === 'injury' && <span>🩹</span>}
                                                            {p.status === 'doubtful' && (
                                                                <AlertCircle className="w-3 h-3 text-yellow-500" />
                                                            )}
                                                            {p.expectedReturn && (
                                                                <span className="text-[8px] text-gray-400">Regreso: {p.expectedReturn}</span>
                                                            )}
                                                            <span className="font-medium">{p.appearances === undefined ? 'No ha jugado esta temporada' : p.appearances}</span>
                                                            {p.goals && <span className="font-medium">{p.goals}</span>}
                                                            {p.assists && <span className="font-medium">{p.assists}</span>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Lesiones del visitante */}
                                        {r.injuries.away.length > 0 && (
                                            <div className="flex-1">
                                                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                                    {r.away.teamName}
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {r.injuries.away.map((p) => (
                                                        <div
                                                            key={p.id}
                                                            className="relative flex flex-col items-center gap-1 px-2 py-1 text-[10px] bg-gray-50 dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 min-w-[60px]"
                                                        >
                                                            <img
                                                                src={`https://imagecache.365scores.com/image/upload/f_png,w_62,h_62,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v21/Athletes/${p.athleteId}`}
                                                                alt={p.name}
                                                                className="w-8 h-8 object-cover rounded-full"
                                                                onError={(e) => (e.currentTarget.src = '/placeholder-player.png')}
                                                            />
                                                            <span className="font-medium text-center">{p.name}</span>
                                                            <span className="text-[8px] text-gray-400">{p.position}</span>
                                                            {p.status === 'suspension' && (
                                                                <Square className="w-3 h-3 fill-red-500 text-red-500" />
                                                            )}
                                                            {p.status === 'injury' && <span>🩹</span>}
                                                            {p.status === 'doubtful' && (
                                                                <AlertCircle className="w-3 h-3 text-yellow-500" />
                                                            )}
                                                            {p.expectedReturn && (
                                                                <span className="text-[8px] text-gray-400">Regreso: {p.expectedReturn}</span>
                                                            )}
                                                            <span className="font-medium">{p.appearances === undefined ? 'No ha jugado esta temporada' : p.appearances}</span>
                                                            {p.goals && <span className="font-medium">{p.goals}</span>}
                                                            {p.assists && <span className="font-medium">{p.assists}</span>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* PESTAÑA: PICKS */}
                {currentTab === 'picks' && (
                    <div className="space-y-3 px-4">
                        {/* Pick recomendado completo */}
                        {recommendation && (
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" />
                                    Pick recomendado
                                </div>
                                <div className="flex flex-wrap items-center gap-1 text-xs mt-1">
                                    <span className="font-medium">{recommendation.pick.market}</span>
                                    <span className="font-bold">{recommendation.pick.selection}</span>
                                    <span className="bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded-full">
                                        {recommendation.pick.confidence}
                                    </span>
                                    <span className="bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded-full text-[10px]">
                                        Prob: {((1 / recommendation.pick.odd) * 100).toFixed(1)}%
                                    </span>
                                    <span className="bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded-full text-[10px]">
                                        Momio: {recommendation.pick.odd}
                                    </span>
                                    <span className="text-gray-400 text-[10px]">{recommendation.pick.reason}</span>
                                    {activeTab === 'past' && r.result && (() => {
                                        const resultText = getFinalPick();
                                        const correct = isPickCorrect(recommendation.pick, r.result, r.home.teamName, r.away.teamName);
                                        return (
                                            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {correct ? `✅ Acertado: ${resultText}` : '❌ Fallado'}
                                            </span>
                                        );
                                    })()}
                                </div>

                                {/* Alternativas */}
                                {recommendation.alternatives.length > 0 && (
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        <span className="text-[10px] text-gray-500">Alternativas:</span>
                                        {recommendation.alternatives.map((alt, i) => {
                                            const altCorrect = r.result ? isPickCorrect(alt, r.result, r.home.teamName, r.away.teamName) : null;
                                            return (
                                                <span
                                                    key={i}
                                                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${altCorrect === null
                                                        ? 'bg-gray-100 dark:bg-neutral-800'
                                                        : altCorrect
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-red-100 text-red-700'
                                                        }`}
                                                >
                                                    {alt.market}: {alt.selection} (prob: {((1 / alt.odd) * 100).toFixed(1)}%) (momio: {alt.odd})
                                                    {r.result && (
                                                        <span className="ml-1">{altCorrect ? '✅' : '❌'}</span>
                                                    )}
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Jugadas (ratoneras, medias, altas) */}
                        <div className="space-y-2">
                            {ratoneras.length > 0 && (
                                <div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">🔹 Ratoneras (≤1.30)</span>
                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                        {ratoneras.slice(0, 5).map((pick, idx) => (
                                            <div key={idx} className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-full px-2 py-0.5">
                                                <span className="text-gray-600 dark:text-gray-300">{pick.market}</span>
                                                <span className="font-bold text-gray-800 dark:text-gray-100">{pick.selection}</span>
                                                <span className="text-gray-400">Cuota {pick.odd}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {medias.length > 0 && (
                                <div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">🔸 Medias (1.30 - 1.8)</span>
                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                        {medias.slice(0, 5).map((pick, idx) => (
                                            <div key={idx} className="flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-full px-2 py-0.5">
                                                <span className="text-gray-600 dark:text-gray-300">{pick.market}</span>
                                                <span className="font-bold text-gray-800 dark:text-gray-100">{pick.selection}</span>
                                                <span className="text-gray-400">Cuota {pick.odd}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {altas.length > 0 && (
                                <div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">🔶 Altas (1.8 - 2.5)</span>
                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                        {altas.slice(0, 5).map((pick, idx) => (
                                            <div key={idx} className="flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-full px-2 py-0.5">
                                                <span className="text-gray-600 dark:text-gray-300">{pick.market}</span>
                                                <span className="font-bold text-gray-800 dark:text-gray-100">{pick.selection}</span>
                                                <span className="text-gray-400">Cuota {pick.odd}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {ratoneras.length === 0 && medias.length === 0 && altas.length === 0 && plays.length > 0 && (
                                <div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Jugadas alternativas</span>
                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                        {plays.map((play, idx) => (
                                            <div key={idx} className="flex items-center gap-1 text-xs bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-full px-2 py-0.5">
                                                <span className="text-gray-600 dark:text-gray-300">{play.market}</span>
                                                <span className="font-bold text-gray-800 dark:text-gray-100">{play.selection}</span>
                                                <span className="text-gray-400">Cuota {play.odd}</span>
                                                <span className="text-green-600 font-medium">EV {(play.ev * 100).toFixed(1)}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Riesgo y advertencias */}
                        <div className="pt-2 border-t border-gray-100 dark:border-neutral-800">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                <div className="flex-1 space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                            Riesgo
                                        </span>
                                        {trap.level === "high" && (
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700">
                                                ALTO
                                            </span>
                                        )}
                                        {trap.level === "medium" && (
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-700">
                                                MEDIO
                                            </span>
                                        )}
                                        {trap.level === "low" && (
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-700">
                                                BAJO
                                            </span>
                                        )}
                                        {trap.level === "none" && (
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-300 dark:border-green-700">
                                                BAJO
                                            </span>
                                        )}
                                    </div>

                                    {trap.details.length > 0 && (
                                        <div className="mt-1 space-y-1 text-xs">
                                            <div className="font-medium text-amber-600 dark:text-amber-400">⚠️ Señales de alerta:</div>
                                            {trap.details.map((d, idx) => (
                                                <div key={idx} className="pl-2 border-l-2 border-amber-300 dark:border-amber-700 text-gray-600 dark:text-gray-400">
                                                    <span className="font-medium text-amber-600 dark:text-amber-400">
                                                        {d.team === 'ambos' ? '📊 General' : `🔴 ${d.team}:`}
                                                    </span>
                                                    <span> {d.explanation || d.reason}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* PESTAÑA: ODDS */}
                {currentTab === 'odds' && (
                    <div className="px-4">
                        <OddsPanel
                            prediction={r.prediction}
                            homeTeam={r.home.teamName}
                            awayTeam={r.away.teamName}
                            results={r.result}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}