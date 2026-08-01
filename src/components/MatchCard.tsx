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
    ShieldAlert,
} from "lucide-react";

import { EnrichedPrediction } from "@/utils/enrichPredictions";
import Image from "next/image";
import { scoreEngine } from "@/utils/scoringEngine";
// import { isPickCorrect } from "@/utils/pickValidation";
import { gateEngine } from "@/utils/gateEngine";
import { trapEngine } from "@/utils/trapEngine";
import { recommendationEngine } from "@/utils/recomendationEngine";
import { useMemo } from "react";
import { getBestPicks } from "@/utils/picks";

interface MatchCardProps {
    prediction: EnrichedPrediction;
    isSelected: boolean;
    onToggle: (url: string) => void;
    activeTab: "today" | "future" | "past"
}

export function MatchCard({ prediction: r, isSelected, onToggle, activeTab }: MatchCardProps) {
    const homeLambda = r.prediction.homeExpectedGoals || 0;
    const awayLambda = r.prediction.awayExpectedGoals || 0;
    const topScoresTwo = getTopScoreProbabilities(homeLambda, awayLambda, 10, 10);

    // const trap = isMatchTrap(r);
    // const { warnings, excludedMarkets } = getWarningsAndExclusions(
    //     trap,
    //     r.home.teamName,
    //     r.away.teamName
    // );

    // const formatTime = (iso: string) => {
    //     const date = new Date(iso);
    //     return date.toLocaleString("es-ES", {
    //         day: "2-digit",
    //         month: "short",
    //         hour: "2-digit",
    //         minute: "2-digit",
    //     });
    // };

    // Dentro del map
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

    const topScores = useMemo(
        () =>
            getTopScoreProbabilities(
                r.prediction.homeExpectedGoals || 0,
                r.prediction.awayExpectedGoals || 0,
                10,
                10
            ),
        [r.prediction]
    );

    console.log({ recommendation })


    // ---- 6. Funciones auxiliares ----
    const formatTime = (iso: string) => {
        const date = new Date(iso);
        return date.toLocaleString("es-ES", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getFavorite = () => {
        const { homeWin, draw, awayWin } = r.prediction.moneyline;
        if (homeWin.prob > draw.prob && homeWin.prob > awayWin.prob) return "home";
        if (awayWin.prob > homeWin.prob && awayWin.prob > draw.prob) return "away";
        return "draw";
    };

    const favorite = getFavorite();
    const favTeam =
        favorite === "home"
            ? r.home.teamName
            : favorite === "away"
                ? r.away.teamName
                : "Empate";

    const trapLevelColor =
        trap.level === "high"
            ? "text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20"
            : trap.level === "medium"
                ? "text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20"
                : trap.level === "low"
                    ? "text-yellow-600 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20"
                    : "hidden";


    const { plays, altas, ratoneras, medias } = getBestPicks(r.prediction, r.home.teamName, r.away.teamName, trap.level);
    // const scoredPicks = scorePicks(r.home, r.away, r.prediction, r.volatility);
    // const bestPick = scoredPicks.length > 0 ? scoredPicks : null;

    const homeGames = r.data && r.data[0].games.filter(el => el.competitionDisplayName === r.competitionName && (el.homeCompetitor.id === r.home.id || el.awayCompetitor.id === r.home.id)).slice(0, 5).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    const awayGames = r.data && r.data[1].games.filter(el => el.competitionDisplayName === r.competitionName && (el.homeCompetitor.id === r.away.id || el.awayCompetitor.id === r.away.id)).slice(0, 5).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())

    return (

        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden transition-all duration-200 hover:shadow-md">
            <div
                className="p-4 cursor-pointer"
                onClick={() => onToggle(r.matchUrl)}
            >
                {/* Fila 1: Competición y hora */}
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{formatTime(r.startTime)}</span>
                        <span className="hidden md:inline">·</span>
                        <span className="truncate">{r.competitionName}</span>
                    </div>
                </div>

                {/* Fila 2: Equipos y favorito + badge de trampa */}
                <div className="flex flex-wrap md:flex-nowrap items-center  justify-center gap-2 mb-3 m-auto w-full">
                    <div className="flex items-center gap-2 font-medium text-gray-800 dark:text-gray-100 w-full flex-wrap md:flex-nowrap">
                        <div className={`flex flex-col items-center justify-center mx-auto md:m-0 md:w-1/2`}>

                            <div className="flex items-center justify-center gap-2 font-medium w-full text-gray-800 dark:text-gray-100 mx-auto">
                                <Image src={`https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v5/Competitors/${r.home.id}`} alt={r.home.teamName} width={64} height={64} />
                                <span>{r.home.teamName}</span>
                                {r.result &&
                                    <div className="flex flex-col w-full items-center">

                                        {r.result && (
                                            <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
                                                {r.result.homeScore}
                                            </span>
                                        )}
                                    </div>}
                            </div>
                            <p className="w-full text-sm text-gray-600 dark:text-gray-400">Ultimos juegos recientes</p>
                            <div className=" w-full h-auto my-2  flex flex-col items-center flex-wrap justify-center gap-4">
                                {homeGames ? homeGames.map(el => (
                                    <div key={el.id} className="text-white flex items-center gap-1 ">
                                        <span className="text-[12px] m-2 text-gray-600 dark:text-gray-400">
                                            {new Date(`${el.startTime}`).toLocaleDateString("es-MX")}
                                        </span>
                                        <Image src={`https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v5/Competitors/${el.homeCompetitor.id}`} alt={`${el.homeCompetitor.nameForURL} vs ${el.awayCompetitor.nameForURL}`} width={20} height={20} />
                                        <span className="text-gray-600 dark:text-gray-400">{el.homeCompetitor.score}</span>
                                        <span className="text-gray-600 dark:text-gray-400">vs</span>
                                        <span className="text-gray-600 dark:text-gray-400">{el.awayCompetitor.score}</span>

                                        <Image src={`https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v5/Competitors/${el.awayCompetitor.id}`} alt={`${el.homeCompetitor.nameForURL} vs ${el.awayCompetitor.nameForURL}`} width={20} height={20} />

                                    </div>
                                )) : <h2>Cargando Ultimos Partidos</h2>

                                }
                            </div>
                        </div>
                        <span className="text-gray-400 text-sm w-full md:w-auto text-center">vs</span>
                        <div className={`flex items-center justify-center flex-col mx-auto md:m-0 md:w-1/2`}>
                            <div className="flex items-center gap-2 justify-center font-medium text-gray-800 dark:text-gray-100 mx-auto w-full">
                                {r.result && <div className="flex flex-col items-center justify-center mx-auto">


                                    <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
                                        {r.result.awayScore}
                                    </span>

                                </div>}
                                <span>{r.away.teamName}</span>
                                <Image src={`https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v5/Competitors/${r.away.id}`} alt={r.away.teamName} width={64} height={64} />


                            </div>

                            <div className=" w-full h-auto my-2  flex flex-col items-center flex-wrap justify-center gap-4">

                                <p className="w-full text-sm text-end">Ultimos juegos recientes</p>
                                {awayGames ? awayGames.map(el => (
                                    <div key={el.id} className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                        <span className="text-[12px] m-2 text-gray-600 dark:text-gray-400">
                                            {new Date(`${el.startTime}`).toLocaleDateString("es-MX")}
                                        </span>
                                        <Image src={`https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v5/Competitors/${el.homeCompetitor.id}`} alt={`${el.homeCompetitor.nameForURL} vs ${el.awayCompetitor.nameForURL}`} width={20} height={20} className="max-h-[30px]" />
                                        <span className="text-gray-600 dark:text-gray-400">{el.homeCompetitor.score}</span>
                                        <span className="text-gray-600 dark:text-gray-400">vs</span>
                                        <span className="text-gray-600 dark:text-gray-400">{el.awayCompetitor.score}</span>

                                        <Image src={`https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v5/Competitors/${el.awayCompetitor.id}`} alt={`${el.homeCompetitor.nameForURL} vs ${el.awayCompetitor.nameForURL}`} width={20} height={20} className="max-h-[30px]" />
                                    </div>
                                )) : <h2>Cargando Ultimos Partidos</h2>

                                }
                            </div>
                            {/* {r.accuracy && (
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${r.accuracy.overallAccuracy > 70 ? 'bg-green-100 text-green-700' :
                                r.accuracy.overallAccuracy > 40 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                            }`}>
                                {r.accuracy.overallAccuracy.toFixed(0)}% acierto
                            </span>
                        )} */}
                        </div>
                    </div>
                </div>

                {/* Fila 3: Estadísticas completas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-neutral-800">
                    <TeamStatsBlock team={r.home} title="Local" />
                    <TeamStatsBlock team={r.away} title="Visitante" />
                </div>

                {/* Fila 4: Marcadores exactos */}
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
                        {topScoresTwo.map((score, idx) => (
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
                        {topScoresTwo.length === 0 && (
                            <span className="text-xs text-gray-400">No hay datos suficientes</span>
                        )}
                    </div>

                </div>
                {/* ---- RECOMENDACIÓN DEL MOTOR ---- */}
                {recommendation && (
                    <div className="mt-3 pt-2 border-t border-gray-100 dark:border-neutral-800">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                            <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                Pick recomendado
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs mt-1">
                                <span className="font-medium">{recommendation.pick.market}</span>
                                <span className="font-bold">{recommendation.pick.selection}</span>
                                <span className="bg-indigo-50 dark:bg-indigo-900/20">
                                    Confianza: {recommendation.pick.confidence}
                                </span>
                                <span className="bg-indigo-50 dark:bg-indigo-900/20 text-[10px]">
                                    Probabilidad: {Number(recommendation.pick.score).toFixed(0)}%
                                </span>
                                <span className="bg-indigo-50 dark:bg-indigo-900/20 text-[10px]">
                                    Momio: {recommendation.pick.odd}
                                </span>
                                {/* Badge de acierto/fallo si es partido pasado y tenemos resultado */}
                                {/* {activeTab === "past" && (r as any).result && (
                                    <span
                                        className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${isPickCorrect(recommendation.pick, (r as any).result)
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-700"
                                            }`}
                                    >
                                        {isPickCorrect(recommendation.pick, (r as any).result)
                                            ? "✅ Acertado"
                                            : "❌ Fallado"}
                                    </span>
                                )} */}
                            </div>
                            {/* <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {recommendation.reasoning}
                            </div> */}
                            {recommendation.alternatives.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                    <span className="text-[10px] text-gray-500">Alternativas:</span>
                                    {recommendation.alternatives.map((alt, i) => (
                                        <span
                                            key={i}
                                            className="text-[10px] bg-gray-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded-full"
                                        >
                                            {alt.market}: {alt.selection} (prob: {Number(alt.score).toFixed(0)}%) (momio: {alt.odd})
                                        </span>

                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {/* 
                {trap.isTrap && (
                    <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${trapLevelColor} cursor-help`}
                        title={`Nivel de riesgo: ${trap.level.toUpperCase()}\n\n${trap.details
                            .map((d) => `${d.team.toUpperCase()}: ${d.explanation || d.reason}`)
                            .join("\n\n")}`}
                    >
                        <ShieldAlert className="w-3 h-3" />
                        Trampa {trap.level}
                    </span>
                )} */}

                {/* NUEVA SECCIÓN: Riesgo y Pick Recomendado */}
                {/* NUEVA SECCIÓN: Riesgo y Pick Recomendado (siempre visible) */}
                {/* Riesgo y Pick Recomendado + Jugadas */}
                <div className="mt-3 pt-2 border-t border-gray-100 dark:border-neutral-800 space-y-2">
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
                            {/* {warnings.length > 0 && (
                                <div className="mt-1 space-y-0.5">
                                    {warnings.map((warning, idx) => (
                                        <div key={idx} className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1">
                                            <span>{warning}</span>
                                        </div>
                                    ))}
                                    {excludedMarkets.length > 0 && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            🚫 Mercados excluidos: {excludedMarkets.join(", ")}
                                        </div>
                                    )}
                                </div>
                            )} */}
                            {/* Pick recomendado (el de mayor EV) */}
                            {/* {bestPick && (
                                                bestPick.map((pick, idx) => (
                                                    <div key={idx} className="flex flex-wrap items-center gap-2 text-xs bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg px-3 py-1.5">
                                                        <Sparkles className="w-3 h-3 text-indigo-500" />
                                                        <span className="font-medium text-indigo-700 dark:text-indigo-300">{pick.market}</span>
                                                        <span className="font-bold text-gray-800 dark:text-gray-100">{pick.selection}</span>
                                                        <span className="text-gray-500 dark:text-gray-400">
                                                            {pick.confidence === 'alta' && '🔵 Alta confianza'}
                                                            {pick.confidence === 'media' && '🟡 Media confianza'}
                                                            {pick.confidence === 'baja' && '🔴 Baja confianza'}
                                                        </span>
                                                        <span className="text-gray-400 text-[10px]">{pick.reason}</span>

                                                        {pick.warning && (
                                                            <span className="text-[10px] bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-1.5 py-0.5 rounded">
                                                                {pick.warning}
                                                            </span>
                                                        )}
                                                    </div>))
                                            )} */}

                            {/* Cuotas ratoneras */}
                            {ratoneras.length > 0 && (
                                <div className="mt-1">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">🔹 Ratoneras (≤1.30)</span>
                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                        {ratoneras.map((pick, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-full px-2 py-0.5"
                                            >
                                                <span className="text-gray-600 dark:text-gray-300">{pick.market}</span>
                                                <span className="font-bold text-gray-800 dark:text-gray-100">{pick.selection}</span>
                                                <span className="text-gray-400">Cuota {pick.odd}</span>
                                                {/* <span className="text-green-600 font-medium">EV {(pick.ev * 100).toFixed(1)}%</span> */}
                                            </div>
                                        ))}
                                        {/* {ratoneras.length > 5 && (
                                                            <span className="text-xs text-gray-400">+{ratoneras.length - 5} más</span>
                                                        )} */}
                                    </div>
                                </div>
                            )}

                            {/* Cuotas medias */}
                            {medias.length > 0 && (
                                <div className="mt-1">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">🔸 Medias (1.30 - 1.8)</span>
                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                        {medias.map((pick, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-full px-2 py-0.5"
                                            >
                                                <span className="text-gray-600 dark:text-gray-300">{pick.market}</span>
                                                <span className="font-bold text-gray-800 dark:text-gray-100">{pick.selection}</span>
                                                <span className="text-gray-400">Cuota {pick.odd}</span>
                                                {/* <span className="text-green-600 font-medium">EV {(pick.ev * 100).toFixed(1)}%</span> */}
                                            </div>
                                        ))}
                                        {/* {medias.length > 5 && (
                                                            <span className="text-xs text-gray-400">+{medias.length - 5} más</span>
                                                        )} */}
                                    </div>
                                </div>
                            )}

                            {altas.length > 0 && (
                                <div className="mt-1">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">🔶 Altas (1.8 - 2.5)</span>
                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                        {altas.map((pick, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-full px-2 py-0.5"
                                            >
                                                <span className="text-gray-600 dark:text-gray-300">{pick.market}</span>
                                                <span className="font-bold text-gray-800 dark:text-gray-100">{pick.selection}</span>
                                                <span className="text-gray-400">Cuota {pick.odd}</span>
                                                {/* <span className="text-green-600 font-medium">EV {(pick.ev * 100).toFixed(1)}%</span> */}
                                            </div>
                                        ))}
                                        {/* {altas.length > 5 && (
                                                            <span className="text-xs text-gray-400">+{altas.length - 5} más</span>
                                                        )} */}
                                    </div>
                                </div>
                            )}

                            {/* Jugadas (si no hay ratoneras/medias y hay plays) */}
                            {ratoneras.length === 0 && medias.length === 0 && plays.length > 0 && altas.length === 0 && (
                                <div className="mt-1">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Jugadas alternativas</span>
                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                        {plays.map((play, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center gap-1 text-xs bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-full px-2 py-0.5"
                                            >
                                                <span className="text-gray-600 dark:text-gray-300">{play.market}</span>
                                                <span className="font-bold text-gray-800 dark:text-gray-100">{play.selection}</span>
                                                <span className="text-gray-400">Cuota {play.odd}</span>
                                                <span className="text-green-600 font-medium">EV {(play.ev * 100).toFixed(1)}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/*  {!bestPick && ratoneras.length === 0 && medias.length === 0 && plays.length === 0 && (
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    No hay picks con cuota razonable y valor positivo.
                                                </div>
                                            )}*/}
                        </div>
                    </div>
                </div>
            </div>

            {/* Panel de odds expandible */}
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isSelected ? "lg:max-h-200  opacity-100" : "max-h-0 opacity-0"
                    }`}
            >
                <div className="border-t border-gray-100 dark:border-neutral-800 p-4 bg-gray-50/50 dark:bg-neutral-800/50">
                    <OddsPanel
                        prediction={r.prediction}
                        homeTeam={r.home.teamName}
                        awayTeam={r.away.teamName}
                        results={r.result}
                    />
                    {/* Si el partido tiene resultado y precisión */}
                    {/* {r.result && r.accuracy && (
                                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-neutral-700">
                                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                                <span className="font-medium text-gray-600 dark:text-gray-400">Resultado real:</span>
                                                <span className="font-bold">
                                                    {r.result.homeScore} - {r.result.awayScore}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-white ${r.accuracy.overallAccuracy > 70 ? 'bg-green-500' :
                                                    r.accuracy.overallAccuracy > 40 ? 'bg-yellow-500' : 'bg-red-500'
                                                    }`}>
                                                    {r.accuracy.overallAccuracy.toFixed(0)}% acierto
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                                                <span>Ganador: {r.accuracy.winnerCorrect ? '✅' : '❌'}</span>
                                                <span>Over/Under: {r.accuracy.overUnderCorrect ? '✅' : '❌'}</span>
                                                <span>BTTS: {r.accuracy.bttsCorrect ? '✅' : '❌'}</span>
                                                <span>Error córners: ±{r.accuracy.cornersError.toFixed(1)}</span>
                                            </div>
                                        </div>
                                    )} */}
                </div>
            </div>
        </div >
    );
}