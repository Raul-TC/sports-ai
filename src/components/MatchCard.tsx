"use client";

import { getTopScoreProbabilities } from "@/utils/poisson";
import { TeamStatsBlock } from "./TeamStatsBlock";
import { StatBadge } from "./StatBadge";
import OddsPanel from "@/components/OddsPanel";
import {
    Clock,
    Goal,
    Circle,
    Info,
    AlertCircle,
    Sparkles,
    MapPin,
    Tv,
    UserRound,
    Calendar,
    Trophy,
    ChevronRight,
    History,
    HeartPulse,
    Square,
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
    isSelected: boolean;
    onToggle: (url: string) => void;
    activeTab: "today" | "future" | "past";
}

export function MatchCard({ prediction: r, isSelected, onToggle, activeTab }: MatchCardProps) {
    const homeLambda = r.prediction.homeExpectedGoals || 0;
    const awayLambda = r.prediction.awayExpectedGoals || 0;
    const topScoresTwo = getTopScoreProbabilities(homeLambda, awayLambda, 10, 16);
    const [showTooltip, setShowTooltip] = useState(false);


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

        // Calcular resumen
        let homeWins = 0, awayWins = 0, draws = 0;
        let totalGoals = 0;
        for (const h of r.h2h) {
            if (h.winner === 1) homeWins++;
            else if (h.winner === 2) awayWins++;
            else if (h.winner === -1) draws++;
            totalGoals += h.homeCompetitor.score + h.awayCompetitor.score;
        }

        return (
            <div className="my-3 pt-2 border-t border-gray-100 dark:border-neutral-800 px-4">
                <div className="flex items-center gap-2 mb-2">
                    <History className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Historial H2H
                    </span>
                    <span className="text-xs text-gray-400">
                        ({homeWins}V - {draws}E - {awayWins}D · {r.h2h.length} partidos)
                    </span>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                    {r.h2h.slice(0, 6).map((el) => (
                        <div
                            key={el.id}
                            className="flex items-center gap-1.5 text-xs bg-gray-50 dark:bg-neutral-800 px-2 py-1 rounded-lg border border-gray-200 dark:border-neutral-700"
                        >
                            {/* Escudo local */}
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
                    {r.h2h.length > 6 && (
                        <span className="text-xs text-gray-400">+{r.h2h.length - 6} más</span>
                    )}
                </div>
            </div>
        );
    };

    // ============================================================
    // RENDER DE ÚLTIMOS PARTIDOS
    // ============================================================
    // Renderizar con iconos y nombres

    const renderRecentGames = (games: any[], title: string) => {
        if (games.length === 0) return null;
        return (
            <div className="flex flex-col gap-1 mb-2 px-4">
                <span className="text-[10px] text-gray-400 font-medium">{title}</span>
                <div className="flex flex-wrap gap-1  mx-auto">
                    {games.map((el) => (
                        <div
                            key={el.id}
                            className="flex items-center gap-0.5 text-[10px] bg-gray-50 dark:bg-neutral-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-neutral-700"
                        >
                            <img
                                src={`https://imagecache.365scores.com/image/upload/f_png,w_20,h_20,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v5/Competitors/${el.homeCompetitor.id}`}
                                className="w-4 h-4 object-contain"
                                alt=""
                            />
                            <span className="text-gray-600 dark:text-gray-400">{el.homeCompetitor.score}</span>
                            <span className="text-gray-400">vs</span>
                            <span className="text-gray-600 dark:text-gray-400">{el.awayCompetitor.score}</span>
                            <img
                                src={`https://imagecache.365scores.com/image/upload/f_png,w_20,h_20,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v5/Competitors/${el.awayCompetitor.id}`}
                                className="w-4 h-4 object-contain"
                                alt=""
                            />
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // ============================================================
    // RENDER PRINCIPAL
    // ============================================================

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden transition-all duration-200 hover:shadow-md my-4">
            <div className="relative overflow-hidden rounded-2xl">
                <div className="absolute inset-0 bg-linear-to-r from-blue-600/20 via-transparent to-green-600/20" />

                <div className="relative p-6">

                    <div className="flex items-center justify-between">

                        <div className="flex flex-col items-center gap-2">
                            <img
                                src={`https://imagecache.365scores.com/image/upload/f_png,w_32,h_32,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v5/Competitors/${r.home.id}`}
                                className="w-16 h-16 object-contain"
                            />

                            <span className="font-bold text-lg">
                                {r.home.teamName}
                            </span>

                            <span className="text-green-400 font-semibold">
                                {r.prediction.moneyline.homeWin.prob}%
                            </span>
                        </div>

                        <div className="text-center">
                            <div className="text-sm text-zinc-400">
                                {formatTime(r.startTime)}
                            </div>

                            <div className="text-3xl font-bold">
                                VS
                            </div>

                            <div className="text-xs text-zinc-500">
                                {r.competitionName}
                                {r.estadio && (
                                    <>
                                        {/* <span className="hidden sm:inline">·</span> */}
                                        <span className="flex items-center justify-center gap-0.5">
                                            <MapPin className="w-3 h-3" /> {r.estadio.name}
                                        </span>
                                    </>
                                )}
                                {r.tv && r.tv.length > 0 && (
                                    <>
                                        {/* <span className="hidden sm:inline">·</span> */}
                                        <span className="flex items-center gap-0.5">
                                            <Tv className="w-3 h-3" /> {r.tv.map(tv => tv.name).join(', ')}
                                        </span>
                                    </>
                                )}
                                {r.arbitro && r.arbitro.length > 0 && (
                                    <>
                                        {/* <span className="hidden sm:inline">·</span> */}
                                        <span className="flex items-center gap-0.5 justify-center">
                                            <UserRound className="w-3 h-3" /> {r.arbitro.map(a => a.name).join(', ')}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-2">
                            <img
                                src={`https://imagecache.365scores.com/image/upload/f_png,w_32,h_32,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v5/Competitors/${r.away.id}`}
                                className="w-16 h-16 object-contain"
                            />

                            <span className="font-bold text-lg">
                                {r.away.teamName}
                            </span>

                            <span className="text-green-400 font-semibold">
                                {r.prediction.moneyline.awayWin.prob}%
                            </span>
                        </div>

                    </div>

                </div>
            </div>


            <div className="py-4 cursor-pointer" onClick={() => onToggle(r.matchUrl)}>
                {/* ============================================================ */}
                {/* CABECERA: Competición, hora, estadio, TV, árbitro */}
                {/* ============================================================ */}


                {/* ============================================================ */}
                {/* EQUIPOS Y FAVORITO */}
                {/* ============================================================ */}


                {/* Badges de favorito y trampa */}
                {/* <div className="flex flex-wrap items-center gap-1 mb-2"> */}
                {/* Favorito */}
                {/* <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                        <Trophy className="w-3 h-3" />
                        {(() => {
                            const { homeWin, draw, awayWin } = r.prediction.moneyline;
                            if (homeWin.prob > draw.prob && homeWin.prob > awayWin.prob) return r.home.teamName;
                            if (awayWin.prob > homeWin.prob && awayWin.prob > draw.prob) return r.away.teamName;
                            return "Empate";
                        })()}
                    </span> */}
                {/* {trap.isTrap && (
                        <span
                            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium border cursor-help ${trap.level === "high"
                                ? "text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20"
                                : trap.level === "medium"
                                    ? "text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20"
                                    : "text-yellow-600 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20"
                                }`}
                            title={`Nivel de riesgo: ${trap.level.toUpperCase()}\n${trap.details.map(d => `${d.team}: ${d.reason}`).join("\n")}`}
                        >
                            ⚠️ Trampa
                        </span>
                    )} */}
                {/* </div> */}
                {/* Lesiones y amonestados */}
                {/* // Obtén los jugadores ausentes (suponiendo que los tienes en r.injuries) */}


                {/* // Renderizar con iconos y nombres */}
                {(r.injuries?.home || r.injuries?.home) && (r.injuries.home.length > 0 || r.injuries?.away.length > 0) && <h3 className="mx-auto text-gray-500 dark:text-gray-400 w-full text-center my-2 font-bold">⚠️ Bajas del Partido ⚠️</h3>}
                <div className="flex items-center justify-center gap-4 px-4">

                    {(r.injuries?.home || r.injuries?.home) && (r.injuries.home.length > 0 || r.injuries?.away.length > 0) && (
                        <div className="mt-1 flex flex-wrap gap-1 self-start mx-auto w-1/2">
                            {r.injuries.home.map((p) => (
                                <div
                                    key={p.id}
                                    className="flex flex-col items-center gap-1 px-2 py-0.5 text-[10px]  mx-auto"
                                // title={`${p.reason === 'Tarjeta amarilla' ? 'Acumulacion de tarjetas' : p.reason}${p.expectedReturn ? ` · Regreso: ${p.expectedReturn}` : ''}`}
                                // onMouseEnter={() => setShowTooltip(true)}
                                // onMouseLeave={() => setShowTooltip(false)}
                                >
                                    {showTooltip && p.reason && (
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg z-10 whitespace-normal max-w-50 text-center pointer-events-none">
                                            {`${p.reason === 'Tarjeta amarilla' ? 'Acumulacion de tarjetas' : p.reason}${p.expectedReturn ? ` · Regreso: ${p.expectedReturn}` : ''}`}
                                        </div>
                                    )}
                                    {/* <span className="text-red-600 dark:text-red-400 font-medium">{p.name}</span> */}
                                    <img src={`https://imagecache.365scores.com/image/upload/f_png,w_62,h_62,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v21/Athletes/${p.athleteId}`} alt={p.name} className="w-8 md:w-12" />
                                    <div className="flex flex-col items-center">

                                        <span className=" font-medium">{p.name}</span>
                                        {p.expectedReturn && <span className=" font-medium">Regreso: {p.expectedReturn}</span>}
                                        <span className=" font-medium">{p.position}</span>
                                        <span className=" font-medium">{p.appearances}</span>
                                        <span className=" font-medium">{p.goals}</span>
                                        <span className=" font-medium">{p.assists}</span>
                                    </div>
                                    {p.status === 'suspension' && (
                                        <Square className="w-3 h-3 fill-red-500 text-red-500" />
                                    )}
                                    {p.status === 'injury' && (
                                        // <HeartPulse className="w-3 h-3 text-red-500" />
                                        '🩹'
                                    )}
                                    {p.status === 'doubtful' && (
                                        <AlertCircle className="w-3 h-3 text-yellow-500" />
                                    )}
                                    {showTooltip && (
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg z-10 whitespace-nowrap">
                                            {p.reason}{p.expectedReturn ? ` · Regreso: ${p.expectedReturn}` : ''}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    <hr className="h-full w-4" />
                    {(r.injuries?.home || r.injuries?.home) && (r.injuries.home.length > 0 || r.injuries?.away.length > 0) && (
                        <div className="mt-1 flex flex-wrap gap-1 w-1/2 self-start mx-auto">
                            {r.injuries.away.map((p) => (
                                <div
                                    key={p.id}
                                    className="flex flex-col items-center gap-1 px-2 py-0.5 text-[10px] mx-auto "
                                // title={`${p.reason === 'Tarjeta amarilla' ? 'Acumulacion de tarjetas' : p.reason}${p.expectedReturn ? ` · Regreso: ${p.expectedReturn}` : ''}`}
                                // onMouseEnter={() => setShowTooltip(true)}
                                // onMouseLeave={() => setShowTooltip(false)}
                                >
                                    {showTooltip && p.reason && (
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg z-10 whitespace-normal max-w-50 text-center pointer-events-none">
                                            {`${p.reason === 'Tarjeta amarilla' ? 'Acumulacion de tarjetas' : p.reason}${p.expectedReturn ? ` · Regreso: ${p.expectedReturn}` : ''}`}
                                        </div>
                                    )}
                                    <img src={`https://imagecache.365scores.com/image/upload/f_png,w_62,h_62,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v21/Athletes/${p.athleteId}`} alt={p.name} className="w-8 md:w-12" />
                                    <div className="flex flex-col items-center">

                                        <span className=" font-medium">{p.name}</span>
                                        {p.expectedReturn && <span className=" font-medium">Regreso: {p.expectedReturn}</span>}
                                        <span className=" font-medium">{p.appearances}</span>
                                        <span className=" font-medium">{p.position}</span>

                                        <span className=" font-medium">{p.goals}</span>
                                        <span className=" font-medium">{p.assists}</span>
                                    </div>
                                    {p.status === 'suspension' && (
                                        <Square className="w-3 h-3 fill-red-500 text-red-500" />
                                    )}
                                    {p.status === 'injury' && (
                                        // <HeartPulse className="w-3 h-3 text-red-500" />
                                        '🩹'
                                    )}
                                    {p.status === 'doubtful' && (
                                        <AlertCircle className="w-3 h-3 text-yellow-500" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {/* ============================================================ */}
                {/* H2H (HISTORIAL) */}
                {/* ============================================================ */}
                {renderH2H()}

                {/* ============================================================ */}
                {/* ÚLTIMOS PARTIDOS */}
                {/* ============================================================ */}
                <div className="mt-3 px-4 pt-2 border-t border-gray-100 dark:border-neutral-800">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            {renderRecentGames(homeGames, `Últimos ${homeGames.length} de ${r.home.teamName}`)}
                            {renderRecentGames(homeGamesLocal, `En casa`)}
                        </div>
                        <div className="space-y-1">
                            {renderRecentGames(awayGames, `Últimos ${awayGames.length} de ${r.away.teamName}`)}
                            {renderRecentGames(awayGamesAway, `Como visitante`)}
                        </div>
                    </div>
                </div>

                {/* ============================================================ */}
                {/* ESTADÍSTICAS */}
                {/* ============================================================ */}
                <div className="grid px-4 grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-neutral-800">
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

                {/* ============================================================ */}
                {/* MARCADORES EXACTOS */}
                {/* ============================================================ */}
                <div className="mt-3 pt-2 px-4 border-t border-gray-100 dark:border-neutral-800">
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
                        {topScoresTwo.map((score, idx) => (
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

                {/* ============================================================ */}
                {/* PICK RECOMENDADO */}
                {/* ============================================================ */}
                {recommendation && (
                    <div className="mt-3 pt-2 px-4 border-t border-gray-100 dark:border-neutral-800">
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
                                {(activeTab === 'past' && r.result) && (() => {
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
                    </div>
                )}

                {/* ============================================================ */}
                {/* RIESGO Y ADVERTENCIAS */}
                {/* ============================================================ */}
                <div className="mt-3 pt-2 px-4 border-t border-gray-100 dark:border-neutral-800">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        <div className="flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    Riesgo y Pick Recomendado
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

                {/* ============================================================ */}
                {/* JUGADAS (ratoneras, medias, altas) */}
                {/* ============================================================ */}
                <div className="mt-3 pt-2 px-4 border-t border-gray-100 dark:border-neutral-800 space-y-2">
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
            </div>

            {/* ============================================================ */}
            {/* PANEL DE ODDS EXPANDIBLE */}
            {/* ============================================================ */}
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isSelected ? "opacity-100" : "max-h-0 opacity-0"}`}
            >
                <div className="border-t border-gray-100 dark:border-neutral-800 p-4 bg-gray-50/50 dark:bg-neutral-800/50">
                    <OddsPanel
                        prediction={r.prediction}
                        homeTeam={r.home.teamName}
                        awayTeam={r.away.teamName}
                        results={r.result}
                    />
                </div>
            </div>
        </div >
    );
}