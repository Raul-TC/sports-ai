"use client";

import { useMemo, useState, useEffect } from "react";
import { X, Trophy, TrendingUp, Filter } from "lucide-react";

interface TopPicksModalProps {
    predictions: any[];
    onClose: () => void;
    onSelectMatch?: (matchUrl: string) => void;
}

type MarketKey = "O1.5" | "AA" | "O2.5" | "ML";

interface MarketOption {
    key: MarketKey;
    label: string;
    emoji: string;
    description: string;
}

const MARKETS: MarketOption[] = [
    { key: "O1.5", label: "Over 1.5 Goles", emoji: "⬆️", description: "2 o más goles en el partido" },
    { key: "AA", label: "Ambos Anotan", emoji: "⚽", description: "Los dos equipos marcan al menos 1 gol" },
    { key: "O2.5", label: "Over 2.5 Goles", emoji: "🔥", description: "3 o más goles en el partido" },
    { key: "ML", label: "Ganador (ML)", emoji: "🏆", description: "Apuesta a que gana local, visita o empate" }
];

interface RankedPick {
    matchUrl: string;
    matchName: string;
    competitionName: string;
    startTime: string;
    homeTeam: string;
    awayTeam: string;
    homeId: number;
    awayId: number;
    market: MarketKey;
    selection?: "Home" | "Away" | "Draw";
    selectionLabel?: string;   // "América gana", "Empate", etc.
    confidence: string;
    confidenceLevel: number;
    probability: number;
    fairOdd: number;
    realOdd: number | null;
    edge: number | null;
    totalXG: number;
    shotsOTTotal: number;
    probBTTS: number;
    reasons: string[];
}

const CONFIDENCE_ORDER: Record<string, number> = {
    "Premium": 5,
    "Muy Bueno": 4,
    "Excelente": 4,
    "Bueno": 3,
    "Evitar": 1,
};

const CONFIDENCE_STYLES: Record<string, string> = {
    "Premium": "bg-purple-600 text-white",
    "Muy Bueno": "bg-emerald-600 text-white",
    "Excelente": "bg-emerald-600 text-white",
    "Bueno": "bg-emerald-500 text-white",
    "Evitar": "bg-red-500 text-white",
};

function evaluateMatchForMarket(p: any, market: MarketKey): RankedPick | null {
    if (!p.prediction || !p.home?.metrics || !p.away?.metrics) return null;

    const homeLambda = p.prediction.homeExpectedGoals ?? 0;
    const awayLambda = p.prediction.awayExpectedGoals ?? 0;
    const totalXG = homeLambda + awayLambda;
    const shotsOTTotal = (p.home.metrics.shotsOT ?? 0) + (p.away.metrics.shotsOT ?? 0);
    const homeXGA = p.home.metrics.xGA ?? 0;
    const awayXGA = p.away.metrics.xGA ?? 0;

    const probBTTS_raw = (1 - Math.exp(-homeLambda)) * (1 - Math.exp(-awayLambda));
    const probOver15_raw = 1 - Math.exp(-totalXG) * (1 + totalXG);
    const probOver25_raw = 1 - Math.exp(-totalXG) * (1 + totalXG + Math.pow(totalXG, 2) / 2);

    const probBTTS = probBTTS_raw * 100;
    const probOver15 = probOver15_raw * 100;
    const probOver25 = probOver25_raw * 100;

    const realOddBTTS = p.prediction.btts?.yes?.odd ?? null;
    const realOddOver15 = p.odds?.over15 ?? null;
    const realOddOver25 = p.odds?.over25 ?? null;

    // ---------- OVER 1.5 ----------
    if (market === "O1.5") {
        let confidence: string | null = null;
        const reasons: string[] = [];

        if (totalXG >= 3.0 && shotsOTTotal >= 9 && probBTTS >= 55) {
            confidence = "Premium";
            reasons.push(`xG total ${totalXG.toFixed(2)} ≥ 3.0`);
            reasons.push(`ShotsOT ${shotsOTTotal.toFixed(1)} ≥ 9`);
            reasons.push(`BTTS ${probBTTS.toFixed(0)}% ≥ 55%`);
        } else if (totalXG >= 2.5 && shotsOTTotal >= 8) {
            confidence = "Muy Bueno";
            reasons.push(`xG total ${totalXG.toFixed(2)} ≥ 2.5`);
            reasons.push(`ShotsOT ${shotsOTTotal.toFixed(1)} ≥ 8`);
        } else if (totalXG >= 2.2 && shotsOTTotal >= 7) {
            confidence = "Bueno";
            reasons.push(`xG total ${totalXG.toFixed(2)} ≥ 2.2`);
            reasons.push(`ShotsOT ${shotsOTTotal.toFixed(1)} ≥ 7`);
        }

        if (!confidence) return null;

        return {
            matchUrl: p.matchUrl,
            matchName: `${p.home.teamName} vs ${p.away.teamName}`,
            competitionName: p.competitionName ?? "—",
            startTime: p.startTime,
            homeTeam: p.home.teamName,
            awayTeam: p.away.teamName,
            homeId: p.home.id,
            awayId: p.away.id,
            market: "O1.5",
            confidence,
            confidenceLevel: CONFIDENCE_ORDER[confidence] ?? 0,
            probability: probOver15,
            fairOdd: 100 / probOver15,
            realOdd: realOddOver15,
            edge: realOddOver15 ? (probOver15 / 100) * realOddOver15 - 1 : null,
            totalXG,
            shotsOTTotal,
            probBTTS,
            reasons,
        };
    }

    // ---------- AMBOS ANOTAN ----------
    if (market === "AA") {
        let confidence: string | null = null;
        const reasons: string[] = [];

        if (probBTTS >= 67) {
            confidence = "Premium";
            reasons.push(`BTTS ${probBTTS.toFixed(0)}% ≥ 67%`);
        } else if (homeLambda >= 1.2 && awayLambda >= 1.1 && probBTTS >= 62 && homeXGA >= 1.1 && awayXGA >= 1.1) {
            confidence = "Muy Bueno";
            reasons.push(`xG local ${homeLambda.toFixed(2)} ≥ 1.2`);
            reasons.push(`xG visita ${awayLambda.toFixed(2)} ≥ 1.1`);
            reasons.push(`BTTS ${probBTTS.toFixed(0)}% ≥ 62%`);
        } else if (homeLambda >= 1.0 && awayLambda >= 0.9 && probBTTS >= 58 && homeXGA >= 1.1 && awayXGA >= 1.1) {
            confidence = "Bueno";
            reasons.push(`xG local ${homeLambda.toFixed(2)} ≥ 1.0`);
            reasons.push(`xG visita ${awayLambda.toFixed(2)} ≥ 0.9`);
            reasons.push(`BTTS ${probBTTS.toFixed(0)}% ≥ 58%`);
        }

        if (!confidence) return null;

        return {
            matchUrl: p.matchUrl,
            matchName: `${p.home.teamName} vs ${p.away.teamName}`,
            competitionName: p.competitionName ?? "—",
            startTime: p.startTime,
            homeTeam: p.home.teamName,
            awayTeam: p.away.teamName,
            homeId: p.home.id,
            awayId: p.away.id,
            market: "AA",
            confidence,
            confidenceLevel: CONFIDENCE_ORDER[confidence] ?? 0,
            probability: probBTTS,
            fairOdd: 100 / probBTTS,
            realOdd: realOddBTTS,
            edge: realOddBTTS ? (probBTTS / 100) * realOddBTTS - 1 : null,
            totalXG,
            shotsOTTotal,
            probBTTS,
            reasons,
        };
    }

    // ---------- OVER 2.5 ----------
    if (market === "O2.5") {
        if (totalXG < 2.4 || probBTTS < 50) return null;

        let confidence: string | null = null;
        const reasons: string[] = [];

        if (totalXG >= 3.2 && probBTTS >= 65 && shotsOTTotal >= 10) {
            confidence = "Premium";
            reasons.push(`xG total ${totalXG.toFixed(2)} ≥ 3.2`);
            reasons.push(`BTTS ${probBTTS.toFixed(0)}% ≥ 65%`);
            reasons.push(`ShotsOT ${shotsOTTotal.toFixed(1)} ≥ 10`);
        } else if (totalXG >= 3.0 && probBTTS >= 62 && shotsOTTotal >= 9) {
            confidence = "Excelente";
            reasons.push(`xG total ${totalXG.toFixed(2)} ≥ 3.0`);
            reasons.push(`BTTS ${probBTTS.toFixed(0)}% ≥ 62%`);
            reasons.push(`ShotsOT ${shotsOTTotal.toFixed(1)} ≥ 9`);
        } else if (totalXG >= 2.8 && probBTTS >= 58 && shotsOTTotal >= 8) {
            confidence = "Bueno";
            reasons.push(`xG total ${totalXG.toFixed(2)} ≥ 2.8`);
            reasons.push(`BTTS ${probBTTS.toFixed(0)}% ≥ 58%`);
            reasons.push(`ShotsOT ${shotsOTTotal.toFixed(1)} ≥ 8`);
        }

        if (!confidence) return null;

        return {
            matchUrl: p.matchUrl,
            matchName: `${p.home.teamName} vs ${p.away.teamName}`,
            competitionName: p.competitionName ?? "—",
            startTime: p.startTime,
            homeTeam: p.home.teamName,
            awayTeam: p.away.teamName,
            homeId: p.home.id,
            awayId: p.away.id,
            market: "O2.5",
            confidence,
            confidenceLevel: CONFIDENCE_ORDER[confidence] ?? 0,
            probability: probOver25,
            fairOdd: 100 / probOver25,
            realOdd: realOddOver25,
            edge: realOddOver25 ? (probOver25 / 100) * realOddOver25 - 1 : null,
            totalXG,
            shotsOTTotal,
            probBTTS,
            reasons,
        };
    }

    // ---------- MONEYLINE (GANADOR) ----------
    if (market === "ML") {
        const ml = p.prediction?.moneyline;
        if (!ml) return null;
        console.log("🔬 ML check:", {
            hasML: !!ml,
            homeWin: ml?.homeWin,
            draw: ml?.draw,
            awayWin: ml?.awayWin,
        });
        const homeProb = ml.homeWin?.prob ?? 0;
        const drawProb = ml.draw?.prob ?? 0;
        const awayProb = ml.awayWin?.prob ?? 0;

        const candidates = [
            { side: "Home" as const, label: `${p.home.teamName} gana`, prob: homeProb },
            { side: "Draw" as const, label: "Empate", prob: drawProb },
            { side: "Away" as const, label: `${p.away.teamName} gana`, prob: awayProb },
        ];
        const sorted = [...candidates].sort((a, b) => b.prob - a.prob);
        const best = sorted[0];
        const second = sorted[1];
        const gap = best.prob - second.prob;

        // Filtro mínimo: prob ≥ 42% y gap ≥ 8%
        if (best.prob < 42) return null;
        if (gap < 8) return null;

        // Reglas de confianza (SOLO probabilidad + gap)
        let confidence: string | null = null;
        const reasons: string[] = [];

        if (best.prob >= 60 && gap >= 25) {
            confidence = "Premium";
            reasons.push(`${best.prob.toFixed(0)}% de probabilidad`);
            reasons.push(`Gap de ${gap.toFixed(0)}% con el 2º`);
            reasons.push(`Favorito claro: ${best.label}`);
        } else if (best.prob >= 55 && gap >= 15) {
            confidence = "Muy Bueno";
            reasons.push(`${best.prob.toFixed(0)}% de probabilidad`);
            reasons.push(`Gap de ${gap.toFixed(0)}%`);
        } else if (best.prob >= 48 && gap >= 10) {
            confidence = "Bueno";
            reasons.push(`${best.prob.toFixed(0)}% de probabilidad`);
            reasons.push(`Gap de ${gap.toFixed(0)}%`);
        }

        if (!confidence) return null;

        return {
            matchUrl: p.matchUrl,
            matchName: `${p.home.teamName} vs ${p.away.teamName}`,
            competitionName: p.competitionName ?? "—",
            startTime: p.startTime,
            homeTeam: p.home.teamName,
            awayTeam: p.away.teamName,
            homeId: p.home.id,
            awayId: p.away.id,
            market: "ML",
            selection: best.side,
            selectionLabel: best.label,
            confidence,
            confidenceLevel: CONFIDENCE_ORDER[confidence] ?? 0,
            probability: best.prob,
            fairOdd: 100 / best.prob,   // ← cuota justa según el modelo
            realOdd: null,               // ← sin cuota real
            edge: null,                  // ← sin EV
            totalXG,
            shotsOTTotal,
            probBTTS,
            reasons,
        };
    }
    return null;
}

// ============================================================
// Sub-componente: fila de pick (fuera del componente principal)
// ============================================================
function PickRow({ pick, rank, onClick }: { pick: RankedPick; rank: number; onClick: () => void }) {
    const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;

    const formatTime = (iso: string) => {
        const date = new Date(iso);
        return date.toLocaleString("es-ES", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const confidenceStyle = CONFIDENCE_STYLES[pick.confidence] ?? "bg-gray-500 text-white";
    const hasValue = pick.edge !== null && pick.edge > 0;

    return (
        <button
            onClick={onClick}
            className="w-full text-left p-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-md transition-all group"
        >
            <div className="flex items-center gap-3">
                <div className="shrink-0 w-7 text-center">
                    {medal ? (
                        <span className="text-lg leading-none">{medal}</span>
                    ) : (
                        <span className="text-xs font-bold text-gray-400 dark:text-neutral-500 tabular-nums">
                            {rank}
                        </span>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-neutral-400 mb-1">
                        <span className="font-semibold text-gray-700 dark:text-neutral-300 truncate">
                            {pick.competitionName}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-neutral-600" />
                        <span className="shrink-0">{formatTime(pick.startTime)}</span>
                    </div>

                    <div className="flex items-center gap-2 mb-1.5">
                        <img
                            src={`https://imagecache.365scores.com/image/upload/f_png,w_20,h_20,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v5/Competitors/${pick.homeId}`}
                            className="w-4 h-4 object-contain shrink-0"
                            alt=""
                            onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                        <span className="text-xs font-semibold text-gray-800 dark:text-neutral-100 truncate">
                            {pick.homeTeam}
                        </span>
                        <span className="text-gray-400 text-[10px]">vs</span>
                        <span className="text-xs font-semibold text-gray-800 dark:text-neutral-100 truncate">
                            {pick.awayTeam}
                        </span>
                        <img
                            src={`https://imagecache.365scores.com/image/upload/f_png,w_20,h_20,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v5/Competitors/${pick.awayId}`}
                            className="w-4 h-4 object-contain shrink-0"
                            alt=""
                            onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                    </div>
                    {pick.market === "ML" && pick.selectionLabel && (
                        <div className="flex items-center gap-1.5 mb-1.5 text-[11px]">
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-bold">
                                🎯 {pick.selectionLabel}
                            </span>
                        </div>
                    )}
                    <div className="flex flex-wrap gap-1">
                        {pick.reasons.map((r, i) => (
                            <span
                                key={i}
                                className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400"
                            >
                                {r}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-1">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${confidenceStyle}`}>
                        {pick.confidence}
                    </span>

                    <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="text-gray-500 dark:text-neutral-400">Prob</span>
                        <span className="font-bold text-gray-800 dark:text-neutral-100 tabular-nums">
                            {pick.probability.toFixed(0)}%
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="text-gray-500 dark:text-neutral-400">Justa</span>
                        <span className="font-semibold text-gray-600 dark:text-neutral-300 tabular-nums">
                            {pick.fairOdd.toFixed(2)}
                        </span>
                    </div>

                    {/* {pick.realOdd && (
                        <div className={`flex items-center gap-1.5 text-[10px] ${hasValue ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                            }`}>
                            <span>Real</span>
                            <span className="font-bold tabular-nums">{pick.realOdd.toFixed(2)}</span>
                            {pick.edge !== null && (
                                <span className="text-[9px]">
                                    ({pick.edge > 0 ? "+" : ""}{(pick.edge * 100).toFixed(1)}%)
                                </span>
                            )}
                        </div>
                    )} */}

                    <TrendingUp className="w-3 h-3 text-gray-300 dark:text-neutral-600 group-hover:text-indigo-500 transition-colors" />
                </div>
            </div>
        </button>
    );
}

// ============================================================
// Componente principal
// ============================================================
export default function TopPicksModal({ predictions, onClose, onSelectMatch }: TopPicksModalProps) {
    const [activeMarket, setActiveMarket] = useState<MarketKey>("O1.5");
    const [minConfidence, setMinConfidence] = useState<"all" | "good" | "top">("all");
    const [onlyFuture, setOnlyFuture] = useState(true);

    useEffect(() => {
        document.body.style.overflow = "hidden";
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", onKey);
        };
    }, [onClose]);

    // Evaluación única por partido
    const allEvaluated = useMemo(() => {
        const map = new Map<string, Record<MarketKey, RankedPick | null>>();
        const now = Date.now();

        for (const p of predictions) {
            if (onlyFuture && new Date(p.startTime).getTime() < now) continue;

            map.set(p.matchUrl, {
                "O1.5": evaluateMatchForMarket(p, "O1.5"),
                "AA": evaluateMatchForMarket(p, "AA"),
                "O2.5": evaluateMatchForMarket(p, "O2.5"),
                ML: evaluateMatchForMarket(p, "ML"),
            });
        }

        return map;
    }, [predictions, onlyFuture]);

    // Picks del mercado activo
    const picks = useMemo<RankedPick[]>(() => {
        const results: RankedPick[] = [];
        for (const evaluated of allEvaluated.values()) {
            const pick = evaluated[activeMarket];
            if (pick) results.push(pick);
        }
        return results.sort((a, b) => {
            if (b.confidenceLevel !== a.confidenceLevel) {
                return b.confidenceLevel - a.confidenceLevel;
            }
            return b.probability - a.probability;
        });
    }, [allEvaluated, activeMarket]);

    // Filtro de confianza
    const filteredPicks = useMemo(() => {
        if (minConfidence === "top") return picks.filter((p) => p.confidenceLevel >= 4);
        if (minConfidence === "good") return picks.filter((p) => p.confidenceLevel >= 3);
        return picks;
    }, [picks, minConfidence]);

    const activeMarketInfo = MARKETS.find((m) => m.key === activeMarket)!;

    // Contadores por mercado
    const countsByMarket = useMemo(() => {
        const counts: Record<MarketKey, number> = { "O1.5": 0, AA: 0, "O2.5": 0, ML: 0 };
        for (const evaluated of allEvaluated.values()) {
            for (const m of MARKETS) {
                if (evaluated[m.key]) counts[m.key]++;
            }
        }
        return counts;
    }, [allEvaluated]);

    return (
        <div
            className="fixed inset-0 z-999 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-3xl max-h-[92vh] rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 overflow-scroll flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative px-5 py-4 border-b border-gray-100 dark:border-neutral-800 bg-linear-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/30">
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-white/70 dark:bg-neutral-800/70 hover:bg-white dark:hover:bg-neutral-700 transition"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-400/10">
                            <Trophy className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900 dark:text-white">
                                Mejores partidos por mercado
                            </h2>
                            <p className="text-[11px] text-gray-500 dark:text-neutral-400">
                                Filtrados por reglas de xG, BTTS y ShotsOT
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabs de mercado */}
                <div className="px-5 pt-3">
                    <div className="inline-flex w-full bg-gray-100 dark:bg-neutral-800/60 rounded-xl p-1 gap-1">
                        {MARKETS.map((m) => {
                            const isActive = activeMarket === m.key;
                            return (
                                <button
                                    key={m.key}
                                    onClick={() => setActiveMarket(m.key)}
                                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${isActive
                                        ? "bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-300 shadow-sm"
                                        : "text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200"
                                        }`}
                                >
                                    <span>{m.emoji}</span>
                                    <span>{m.label}</span>
                                    <span className="text-[10px] opacity-60 tabular-nums">
                                        {countsByMarket[m.key]}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Filtros */}
                <div className="px-5 pt-3 flex flex-wrap items-center gap-2 text-[10px]">
                    <Filter className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-500 dark:text-neutral-400 font-semibold">Confianza:</span>
                    {[
                        { key: "all", label: "Todas" },
                        { key: "good", label: "Bueno+" },
                        { key: "top", label: "Solo top" },
                    ].map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setMinConfidence(f.key as any)}
                            className={`px-2 py-0.5 rounded-full transition ${minConfidence === f.key
                                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 font-bold"
                                : "text-gray-500 hover:text-gray-700 dark:text-neutral-400"
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                    <span className="ml-auto flex items-center gap-1">
                        <input
                            type="checkbox"
                            id="onlyFuture"
                            checked={onlyFuture}
                            onChange={(e) => setOnlyFuture(e.target.checked)}
                            className="cursor-pointer"
                        />
                        <label htmlFor="onlyFuture" className="cursor-pointer text-gray-500 dark:text-neutral-400">
                            Solo próximos
                        </label>
                    </span>
                </div>

                {/* Lista */}
                <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
                    {filteredPicks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="text-4xl mb-2">🔍</div>
                            <div className="text-sm font-semibold text-gray-700 dark:text-neutral-300 mb-1">
                                No hay partidos que cumplan las reglas
                            </div>
                            <div className="text-[11px] text-gray-500 dark:text-neutral-400">
                                Prueba con menos filtros o cambia de mercado
                            </div>
                        </div>
                    ) : (
                        filteredPicks.map((pick, i) => (
                            <PickRow
                                key={`${pick.matchUrl}-${pick.market}-${i}`}
                                pick={pick}
                                rank={i + 1}
                                onClick={() => {
                                    onSelectMatch?.(pick.matchUrl);
                                    onClose();
                                }}
                            />
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-gray-100 dark:border-neutral-800 bg-gray-50/60 dark:bg-neutral-800/40 flex items-center justify-between text-[10px] text-gray-500 dark:text-neutral-400">
                    <span>
                        {filteredPicks.length} partido{filteredPicks.length !== 1 ? "s" : ""} ·
                        Mercado: <b className="text-gray-700 dark:text-neutral-200">{activeMarketInfo.label}</b>
                    </span>
                    <span className="italic">{activeMarketInfo.description}</span>
                </div>
            </div>
        </div>
    );
}