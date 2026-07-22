"use client";

import { useState, useMemo } from "react";
import { ExtendedMatchPrediction } from "@/lib/predictions";
import OddsPanel from "@/components/OddsPanel";
import {
    ChevronDown,
    ChevronUp,
    Trophy,
    Clock,
    TrendingUp,
    TrendingDown,
    Minus,
    Goal,
    Target,
    CornerDownRight,
    Activity,
    Crosshair,
    Gauge,
    BarChart,
    Info,
    Circle,
    Calendar,
    CalendarClock,
    AlertTriangle,
    ShieldAlert,
    HelpCircle,
    Sparkles,
    AlertCircle,
} from "lucide-react";

// ============================================================
// INTERFACES (igual que antes)
// ============================================================

interface TeamMetrics {
    xG: number;
    xGA: number;
    expectedGoals: number;
    shotFactor: number;
    offensiveEfficiency: number;
    efficiency: number;
    precisionDrop: number;
    corners: number;
    shots: number;
    shotsOT: number;
}

interface TeamInfo {
    teamId: number;
    teamName: string;
    metrics?: TeamMetrics;
}

interface PredictionResult {
    matchUrl: string;
    competitionName: string;
    startTime: string;
    home: TeamInfo;
    away: TeamInfo;
    prediction: ExtendedMatchPrediction;
    volatility?: number;
}

interface MatchesExplorerProps {
    predictions: PredictionResult[];
}

// ============================================================
// FUNCIONES AUXILIARES (Poisson y trampa)
// ============================================================

function poisson(k: number, lambda: number): number {
    if (lambda === 0) return k === 0 ? 1 : 0;
    return (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial(k);
}

function factorial(n: number): number {
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

function getTopScoreProbabilities(
    homeLambda: number,
    awayLambda: number,
    maxGoals: number = 10,
    topN: number = 10
): { home: number; away: number; prob: number }[] {
    const scores: { home: number; away: number; prob: number }[] = [];
    for (let h = 0; h <= maxGoals; h++) {
        for (let a = 0; a <= maxGoals; a++) {
            const prob = poisson(h, homeLambda) * poisson(a, awayLambda);
            scores.push({ home: h, away: a, prob });
        }
    }
    scores.sort((a, b) => b.prob - a.prob);
    return scores.slice(0, topN);
}

// ============================================================
// DETECCIÓN DE TRAMPAS (mejorada)
// ============================================================

interface TrapResult {
    isTrap: boolean;
    level: "low" | "medium" | "high" | "none";
    reasons: string[];
}

function isMatchTrap(prediction: PredictionResult): TrapResult {
    const { home, away, prediction: pred, volatility } = prediction;
    const homeM = home.metrics;
    const awayM = away.metrics;
    console.log({ pred });
    if (!homeM || !awayM) {
        return { isTrap: false, level: "none", reasons: [] };
    }

    const reasons: string[] = [];
    let trapScore = 0;

    const vol = volatility || 0;
    if (vol > 0.3) {
        trapScore += 1;
        reasons.push(`Alta volatilidad (${vol.toFixed(2)})`);
    }

    if (homeM.offensiveEfficiency > 1.5 || homeM.offensiveEfficiency < 0.5) {
        trapScore += 1;
        reasons.push(`Eficiencia ofensiva local extrema (${homeM.offensiveEfficiency.toFixed(2)})`);
    }
    if (awayM.offensiveEfficiency > 1.5 || awayM.offensiveEfficiency < 0.5) {
        trapScore += 1;
        reasons.push(`Eficiencia ofensiva visitante extrema (${awayM.offensiveEfficiency.toFixed(2)})`);
    }

    if (homeM.precisionDrop < -0.05) {
        trapScore += 1;
        reasons.push(`Caída de precisión local (${homeM.precisionDrop.toFixed(3)})`);
    }
    if (awayM.precisionDrop < -0.05) {
        trapScore += 1;
        reasons.push(`Caída de precisión visitante (${awayM.precisionDrop.toFixed(3)})`);
    }

    const homeDiff = Math.abs(homeM.xG - homeM.expectedGoals);
    const awayDiff = Math.abs(awayM.xG - awayM.expectedGoals);
    if (homeDiff > 0.3) {
        trapScore += 1;
        reasons.push(`Discrepancia xG local vs esperado (${homeDiff.toFixed(2)})`);
    }
    if (awayDiff > 0.3) {
        trapScore += 1;
        reasons.push(`Discrepancia xG visitante vs esperado (${awayDiff.toFixed(2)})`);
    }

    let level: "low" | "medium" | "high" | "none" = "none";
    if (trapScore >= 4) level = "high";
    else if (trapScore >= 2) level = "medium";
    else if (trapScore >= 1) level = "low";

    return {
        isTrap: trapScore > 0,
        level,
        reasons: reasons.length > 0 ? reasons : ["Sin señales claras"],
    };
}

// ============================================================
// FUNCIÓN PARA EL MEJOR PICK (basado en EV)
// ============================================================

interface BestPick {
    market: string;
    selection: string;
    odd: number;
    prob: number;
    ev: number;
    reason: string;
}

function getBestPick(pred: ExtendedMatchPrediction, homeTeam: string, awayTeam: string): BestPick | null {
    let bestEV = -Infinity;
    let best: BestPick | null = null;

    // 1. Moneyline
    const mlMarkets = [
        { label: `${homeTeam}`, prob: pred.moneyline.homeWin.prob, odd: pred.moneyline.homeWin.odd, key: "home" },
        { label: "Empate", prob: pred.moneyline.draw.prob, odd: pred.moneyline.draw.odd, key: "draw" },
        { label: `${awayTeam}`, prob: pred.moneyline.awayWin.prob, odd: pred.moneyline.awayWin.odd, key: "away" },
    ];
    for (const m of mlMarkets) {
        if (m.odd > 0 && m.prob > 0) {
            const ev = (m.prob / 100) * m.odd - 1;
            if (ev > bestEV) {
                bestEV = ev;
                best = {
                    market: "Resultado",
                    selection: m.label,
                    odd: m.odd,
                    prob: m.prob,
                    ev: ev,
                    reason: `Probabilidad ${m.prob}% · Cuota ${m.odd}`,
                };
            }
        }
    }

    // 2. BTTS
    if (pred.btts) {
        const bttsMarkets = [
            { label: "Sí", prob: pred.btts.yes.prob, odd: pred.btts.yes.odd },
            { label: "No", prob: pred.btts.no.prob, odd: pred.btts.no.odd },
        ];
        for (const m of bttsMarkets) {
            if (m.odd > 0 && m.prob > 0) {
                const ev = (m.prob / 100) * m.odd - 1;
                if (ev > bestEV) {
                    bestEV = ev;
                    best = {
                        market: "Ambos anotan",
                        selection: m.label,
                        odd: m.odd,
                        prob: m.prob,
                        ev: ev,
                        reason: `Probabilidad ${m.prob}% · Cuota ${m.odd}`,
                    };
                }
            }
        }
    }

    // 3. Over/Under 2.5 (usamos la línea 2.5, que suele ser la más común)
    const goalLine25 = pred.goalLines?.find((gl) => gl.line === 2.5);
    if (goalLine25) {
        const ouMarkets = [
            { label: "Over 2.5", prob: goalLine25.overProb, odd: goalLine25.overOdd },
            { label: "Under 2.5", prob: goalLine25.underProb, odd: goalLine25.underOdd },
        ];
        for (const m of ouMarkets) {
            if (m.odd > 0 && m.prob > 0) {
                const ev = (m.prob / 100) * m.odd - 1;
                if (ev > bestEV) {
                    bestEV = ev;
                    best = {
                        market: "Total de goles",
                        selection: m.label,
                        odd: m.odd,
                        prob: m.prob,
                        ev: ev,
                        reason: `Probabilidad ${m.prob}% · Cuota ${m.odd}`,
                    };
                }
            }
        }
    }

    // 4. Corners (opcional, solo si hay líneas)
    if (pred.corners?.lines?.length) {
        // Tomamos la línea más cercana a la esperada (por simplificar, la primera)
        const cornerLine = pred.corners.lines[0];
        if (cornerLine) {
            const cMarkets = [
                { label: `Over ${cornerLine.line}`, prob: cornerLine.overProb, odd: cornerLine.overOdd },
                { label: `Under ${cornerLine.line}`, prob: cornerLine.underProb, odd: cornerLine.underOdd },
            ];
            for (const m of cMarkets) {
                if (m.odd > 0 && m.prob > 0) {
                    const ev = (m.prob / 100) * m.odd - 1;
                    if (ev > bestEV) {
                        bestEV = ev;
                        best = {
                            market: "Córners",
                            selection: m.label,
                            odd: m.odd,
                            prob: m.prob,
                            ev: ev,
                            reason: `Probabilidad ${m.prob}% · Cuota ${m.odd}`,
                        };
                    }
                }
            }
        }
    }

    return best;
}

function getOddsCategory(pick: Pick): "ratonera" | "media" | "alta" {
    const isML = pick.market === "Resultado";
    const limitMedia = isML ? 2.5 : 2.0;
    if (pick.odd <= 1.30) return "ratonera";
    if (pick.odd <= limitMedia) return "media";
    return "alta";
}

interface Pick {
    market: string;
    selection: string;
    odd: number;
    prob: number;
    ev: number;
    reason: string;
}

function getBestPicks(
    pred: ExtendedMatchPrediction,
    homeTeam: string,
    awayTeam: string
): { best: Pick | null; plays: Pick[]; allPicks: Pick[]; ratoneras: Pick[]; medias: Pick[] } {
    const allPicks: Pick[] = [];

    // 1. Moneyline (Resultado)
    const mlMarkets = [
        { label: `${homeTeam}`, prob: pred.moneyline.homeWin.prob, odd: pred.moneyline.homeWin.odd },
        { label: "Empate", prob: pred.moneyline.draw.prob, odd: pred.moneyline.draw.odd },
        { label: `${awayTeam}`, prob: pred.moneyline.awayWin.prob, odd: pred.moneyline.awayWin.odd },
    ];
    for (const m of mlMarkets) {
        if (m.odd > 0 && m.prob > 0) {
            const ev = (m.prob / 100) * m.odd - 1;
            allPicks.push({
                market: "Resultado",
                selection: m.label,
                odd: m.odd,
                prob: m.prob,
                ev: ev,
                reason: `Prob ${m.prob}% · Cuota ${m.odd}`,
            });
        }
    }

    // 2. BTTS (no tiene filtro especial, pero se incluye)
    if (pred.btts) {
        const bttsMarkets = [
            { label: "Sí", prob: pred.btts.yes.prob, odd: pred.btts.yes.odd },
            { label: "No", prob: pred.btts.no.prob, odd: pred.btts.no.odd },
        ];
        for (const m of bttsMarkets) {
            if (m.odd > 0 && m.prob > 0) {
                const ev = (m.prob / 100) * m.odd - 1;
                allPicks.push({
                    market: "Ambos anotan",
                    selection: m.label,
                    odd: m.odd,
                    prob: m.prob,
                    ev: ev,
                    reason: `Prob ${m.prob}% · Cuota ${m.odd}`,
                });
            }
        }
    }

    // 3. Over/Under 2.5 (Goles)
    if (pred.goalLines && pred.goalLines.length > 0) {
        for (const gl of pred.goalLines) {
            if (gl.overProb > 0 && gl.overOdd > 0) {
                const evOver = (gl.overProb / 100) * gl.overOdd - 1;
                allPicks.push({
                    market: "Total de goles",
                    selection: `Over ${gl.line}`,
                    odd: gl.overOdd,
                    prob: gl.overProb,
                    ev: evOver,
                    reason: `Prob ${gl.overProb}% · Cuota ${gl.overOdd}`,
                });
            }
            if (gl.underProb > 0 && gl.underOdd > 0) {
                const evUnder = (gl.underProb / 100) * gl.underOdd - 1;
                allPicks.push({
                    market: "Total de goles",
                    selection: `Under ${gl.line}`,
                    odd: gl.underOdd,
                    prob: gl.underProb,
                    ev: evUnder,
                    reason: `Prob ${gl.underProb}% · Cuota ${gl.underOdd}`,
                });
            }
        }
    }

    // 4. Corners (opcional, no tiene filtro especial, pero se incluye)
    if (pred.corners?.lines?.length) {
        for (const cornerLine of pred.corners.lines) {
            if (cornerLine && cornerLine.overProb !== undefined && cornerLine.overOdd !== undefined) {
                const cMarkets = [
                    { label: `Over ${cornerLine.line}`, prob: cornerLine.overProb, odd: cornerLine.overOdd },
                    { label: `Under ${cornerLine.line}`, prob: cornerLine.underProb, odd: cornerLine.underOdd },
                ];
                for (const m of cMarkets) {
                    if (m.odd > 0 && m.prob > 0 && !isNaN(m.prob) && !isNaN(m.odd)) {
                        const ev = (m.prob / 100) * m.odd - 1;
                        allPicks.push({
                            market: "Córners",
                            selection: m.label,
                            odd: m.odd,
                            prob: m.prob,
                            ev: ev,
                            reason: `Prob ${m.prob.toFixed(1)}% · Cuota ${m.odd.toFixed(2)}`,
                        });
                    }
                }
            }
        }
    }

    // Ordenar por EV descendente
    allPicks.sort((a, b) => b.ev - a.ev);

    // --- FILTROS PARA EL PICK RECOMENDADO ---
    // - Goles: odd < 2.00
    // - Resultado (ML): odd < 2.50
    // - Probabilidad mínima: >5% (para evitar cuotas muy altas o muy bajas)
    const bestCandidates = allPicks.filter((p) => {
        if (p.market === "Total de goles") {
            return p.odd < 2.0 && p.prob > 60;
        }
        if (p.market === "Resultado") {
            return p.odd < 2.5 && p.prob > 60;
        }
        // Para otros mercados (BTTS, Córners), permitimos odd < 2.5 y prob > 5
        return p.odd < 2.5 && p.prob > 60;
    });

    const positiveEV = allPicks.filter(p => p.ev > 0.05);
    const ratoneras = allPicks.filter(p => p.odd >= 1.18 && p.odd <= 1.30);
    console.log({ ratoneras })
    const medias = allPicks.filter(p => {
        const isML = p.market === "Resultado";
        const limit = isML ? 2.5 : 2.0;
        return p.odd > 1.30 && p.odd <= limit;
    });

    // El mejor pick será el de mayor EV entre los candidatos (si hay)
    const best = positiveEV.length > 0 ? positiveEV[0] : null;

    // --- JUGADAS (plays) ---
    // Picks con cuota < 2.00 y EV > 0.05 (independientemente del mercado)
    const plays = allPicks
        .filter(p => p.odd < 2.0 && p !== best)
        .slice(0, 3);

    // --- ALTO RIESGO (opcional) ---
    // Picks con cuota > 5.0 y EV > 0.05 (pueden ser interesantes pero no recomendados)
    // const highRisk = allPicks
    //     .filter((p) => p.odd > 5.0 && p.ev > 0.05)
    //     .slice(0, 2);

    return { best, plays, allPicks: positiveEV, ratoneras, medias };
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function MatchesExplorer({ predictions }: MatchesExplorerProps) {
    const [selectedMatchUrl, setSelectedMatchUrl] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"today" | "future" | "past">("today");
    const [showHelp, setShowHelp] = useState(false);

    // console.log({ DATA: predictions })
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isSameDay = (date1: Date, date2: Date) => {
        return (
            date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate()
        );
    };

    const getDateWithoutTime = (iso: string) => {
        const d = new Date(iso);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    const filteredPredictions = useMemo(() => {
        return predictions.filter((p) => {
            const matchDate = getDateWithoutTime(p.startTime);
            if (activeTab === "today") return isSameDay(matchDate, today);
            if (activeTab === "future") return matchDate > today;
            return matchDate < today;
        });
    }, [predictions, activeTab, today]);

    const todayCount = predictions.filter((p) => isSameDay(getDateWithoutTime(p.startTime), today)).length;
    const futureCount = predictions.filter((p) => getDateWithoutTime(p.startTime) > today).length;
    const pastCount = predictions.filter((p) => getDateWithoutTime(p.startTime) < today).length;

    const toggleMatch = (url: string) => {
        setSelectedMatchUrl(selectedMatchUrl === url ? null : url);
    };

    const formatTime = (iso: string) => {
        const date = new Date(iso);
        return date.toLocaleString("es-ES", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getFavorite = (pred: ExtendedMatchPrediction) => {
        const { homeWin, draw, awayWin } = pred.moneyline;
        if (homeWin.prob > draw.prob && homeWin.prob > awayWin.prob) return "home";
        if (awayWin.prob > homeWin.prob && awayWin.prob > draw.prob) return "away";
        return "draw";
    };

    const getTrend = (value: number) => {
        if (value > 1.2) return "up";
        if (value < 0.8) return "down";
        return "neutral";
    };

    // ============================================================
    // STAT BADGE (sin cambios)
    // ============================================================

    const StatBadge = ({
        label,
        value,
        icon: Icon,
        trend,
        secondary,
        description,
        onClick,
        className = "",
        isTrap = false,
        indicator,
        indicatorColor,
    }: {
        label: string;
        value: number | string;
        icon?: React.ElementType;
        trend?: "up" | "down" | "neutral";
        secondary?: boolean;
        description?: string;
        onClick?: (e: React.MouseEvent) => void;
        className?: string;
        isTrap?: boolean;
        indicator?: string;
        indicatorColor?: string;
    }) => {
        const [showTooltip, setShowTooltip] = useState(false);

        const handleClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (onClick) onClick(e);
            if (description) setShowTooltip((prev) => !prev);
        };

        const trendIcon = {
            up: <TrendingUp className="w-3 h-3 text-green-500" />,
            down: <TrendingDown className="w-3 h-3 text-red-500" />,
            neutral: <Minus className="w-3 h-3 text-gray-400" />,
        }[trend || "neutral"];

        const baseClass = secondary
            ? "bg-gray-50/70 dark:bg-neutral-800/70 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-neutral-700"
            : isTrap
                ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                : "bg-gray-50 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border-gray-100 dark:border-neutral-700";

        return (
            <span
                className={`relative inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${baseClass} whitespace-nowrap transition-colors cursor-pointer ${className}`}
                onClick={handleClick}
                title={description}
            >
                {Icon && <Icon className="w-3 h-3 text-gray-400" />}
                <span className="font-medium tabular-nums">{value}</span>
                <span className="text-[10px] opacity-75">{label}</span>
                {trend && trendIcon}
                {indicator && (
                    <span className={`text-[10px] font-medium ${indicatorColor || "text-gray-500"}`}>
                        {indicator}
                    </span>
                )}
                {description && <Info className="w-3 h-3 text-gray-400 opacity-50" />}

                {showTooltip && description && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg z-10 whitespace-normal max-w-[200px] text-center pointer-events-none">
                        {description}
                    </div>
                )}
            </span>
        );
    };

    // ============================================================
    // BLOQUE DE ESTADÍSTICAS (sin cambios)
    // ============================================================

    const TeamStatsBlock = ({
        team,
        title,
    }: {
        team: TeamInfo;
        title: string;
    }) => {
        const m = team.metrics;
        if (!m) return <div className="text-xs text-gray-400">Sin datos</div>;

        const effTrend = getTrend(m.offensiveEfficiency);

        let effIndicator = "";
        let effColor = "";
        if (m.offensiveEfficiency > 1.2) {
            effIndicator = "🔥 Sobre";
            effColor = "text-green-600";
        } else if (m.offensiveEfficiency < 0.8) {
            effIndicator = "❄️ Bajo";
            effColor = "text-red-500";
        } else {
            effIndicator = "⚖️ Esperado";
            effColor = "text-gray-500";
        }

        let shotIndicator = "";
        let shotColor = "";
        if (m.shotFactor > 0.4) {
            shotIndicator = "Alta";
            shotColor = "text-green-600";
        } else if (m.shotFactor > 0.3) {
            shotIndicator = "Media";
            shotColor = "text-amber-500";
        } else {
            shotIndicator = "Baja";
            shotColor = "text-red-500";
        }

        let dropIndicator = "";
        let dropColor = "";
        if (m.precisionDrop > 0.02) {
            dropIndicator = "📈 Mejora";
            dropColor = "text-green-600";
        } else if (m.precisionDrop < -0.02) {
            dropIndicator = "📉 Empeora";
            dropColor = "text-red-500";
        } else {
            dropIndicator = "➡️ Estable";
            dropColor = "text-gray-500";
        }

        let bruteIndicator = "";
        let bruteColor = "";
        if (m.efficiency > 0.15) {
            bruteIndicator = "Alta";
            bruteColor = "text-green-600";
        } else if (m.efficiency > 0.08) {
            bruteIndicator = "Media";
            bruteColor = "text-amber-500";
        } else {
            bruteIndicator = "Baja";
            bruteColor = "text-red-500";
        }

        const primaryStats = [
            {
                label: "Gol Esp",
                value: m.xG.toFixed(2),
                icon: Goal,
                description: "Goles esperados según la calidad de las ocasiones generadas.",
            },
            {
                label: "Gol Esp Con",
                value: m.xGA.toFixed(2),
                icon: Target,
                description: "Goles esperados encajados según las ocasiones concedidas.",
            },
            {
                label: "Tiros",
                value: m.shots.toFixed(1),
                description: "Número total de disparos (incluyendo los que van fuera).",
            },
            {
                label: "Tiro a Puerta",
                value: m.shotsOT.toFixed(1),
                icon: Crosshair,
                description: "Disparos que van entre los tres palos.",
            },
            {
                label: "Córners",
                value: m.corners.toFixed(1),
                icon: CornerDownRight,
                description: "Saques de esquina a favor.",
            },
            {
                label: "Eficiencia Of",
                value: m.offensiveEfficiency.toFixed(2),
                icon: Activity,
                trend: effTrend,
                indicator: effIndicator,
                indicatorColor: effColor,
                description:
                    m.offensiveEfficiency > 1.2
                        ? "El equipo marca más de lo esperado (probablemente está sobre-rendimiento)."
                        : m.offensiveEfficiency < 0.8
                            ? "El equipo marca menos de lo esperado (probablemente está bajo-rendimiento)."
                            : "El equipo marca lo esperado según sus ocasiones.",
            },
        ];

        const secondaryStats = [
            {
                label: "Goles Previstos",
                value: m.expectedGoals.toFixed(2),
                icon: Goal,
                description: "Goles que predice el modelo de Poisson para este partido.",
            },
            {
                label: "Puntería",
                value: m.shotFactor.toFixed(2),
                icon: Gauge,
                indicator: shotIndicator,
                indicatorColor: shotColor,
                description: `Porcentaje de tiros que van a puerta. ${shotIndicator}.`,
            },
            {
                label: "Eficiencia Bruta",
                value: m.efficiency.toFixed(2),
                icon: BarChart,
                indicator: bruteIndicator,
                indicatorColor: bruteColor,
                description: `Goles por cada disparo. ${bruteIndicator}.`,
            },
            {
                label: "Caída Precisión",
                value: m.precisionDrop.toFixed(3),
                icon: Target,
                indicator: dropIndicator,
                indicatorColor: dropColor,
                description:
                    m.precisionDrop > 0
                        ? "La puntería ha mejorado en los últimos partidos."
                        : m.precisionDrop < 0
                            ? "La puntería ha empeorado en los últimos partidos."
                            : "La puntería se mantiene estable.",
            },
        ];

        return (
            <div className="space-y-1.5">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {title}
                </div>
                <div className="flex flex-wrap gap-1">
                    {primaryStats.map((stat, idx) => (
                        <StatBadge
                            key={idx}
                            label={stat.label}
                            value={stat.value}
                            icon={stat.icon}
                            trend={stat.trend as any}
                            description={stat.description}
                            indicator={stat.indicator}
                            indicatorColor={stat.indicatorColor}
                        />
                    ))}
                </div>
                <div className="flex flex-wrap gap-1">
                    {secondaryStats.map((stat, idx) => (
                        <StatBadge
                            key={idx}
                            label={stat.label}
                            value={stat.value}
                            icon={stat.icon}
                            secondary
                            description={stat.description}
                            indicator={stat.indicator}
                            indicatorColor={stat.indicatorColor}
                        />
                    ))}
                </div>
            </div>
        );
    };

    // ============================================================
    // RENDER PRINCIPAL
    // ============================================================

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 tracking-tight flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-indigo-500" />
                    Pronósticos de Partidos
                </h2>
                <button
                    onClick={() => setShowHelp(!showHelp)}
                    className="inline-flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline ml-auto"
                >
                    <HelpCircle className="w-4 h-4" />
                    ¿Qué significan estas estadísticas?
                </button>
            </div>

            {showHelp && (
                <div className="bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl p-4 my-2 text-sm space-y-2">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300">Glosario de métricas</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div><strong>Gol Esp (xG):</strong> Goles esperados según ocasiones.</div>
                        <div><strong>Gol Esp Con (xGA):</strong> Goles esperados encajados.</div>
                        <div><strong>Tiros:</strong> Disparos totales.</div>
                        <div><strong>Tiro a Puerta:</strong> Disparos entre palos.</div>
                        <div><strong>Córners:</strong> Saques de esquina a favor.</div>
                        <div><strong>Eficiencia Of:</strong> Goles reales / xG. Indica si el equipo rinde más o menos de lo esperado.</div>
                        <div><strong>Goles Previstos:</strong> Predicción de goles (Poisson) para este partido.</div>
                        <div><strong>Puntería:</strong> Tiros a puerta / tiros totales. Alta = eficacia en el disparo.</div>
                        <div><strong>Eficiencia Bruta:</strong> Goles / tiros totales. Mide la conversión.</div>
                        <div><strong>Caída Precisión:</strong> Cambio en la puntería (histórico vs últimos 5 partidos).</div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Pasa el ratón o haz clic en cualquier badge para más detalles.</p>
                </div>
            )}

            {/* Pestañas */}
            <div className="flex border-b border-gray-200 dark:border-neutral-700 overflow-x-auto">
                <button
                    onClick={() => setActiveTab("today")}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === "today"
                        ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        }`}
                >
                    <Calendar className="w-4 h-4" />
                    Hoy
                    <span className="ml-1 rounded-full bg-gray-100 dark:bg-neutral-800 px-2 py-0.5 text-xs">
                        {todayCount}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab("future")}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === "future"
                        ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        }`}
                >
                    <CalendarClock className="w-4 h-4" />
                    Futuros
                    <span className="ml-1 rounded-full bg-gray-100 dark:bg-neutral-800 px-2 py-0.5 text-xs">
                        {futureCount}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab("past")}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === "past"
                        ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        }`}
                >
                    <CalendarClock className="w-4 h-4" />
                    Pasados
                    <span className="ml-1 rounded-full bg-gray-100 dark:bg-neutral-800 px-2 py-0.5 text-xs">
                        {pastCount}
                    </span>
                </button>
            </div>

            {/* Lista de partidos */}
            {filteredPredictions.length === 0 ? (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                    {activeTab === "today"
                        ? "No hay partidos programados para hoy."
                        : activeTab === "future"
                            ? "No hay partidos futuros."
                            : "No hay partidos pasados."}
                </div>
            ) : (
                filteredPredictions.map((r) => {
                    const isSelected = selectedMatchUrl === r.matchUrl;
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
                    const trapLevelColor =
                        trap.level === "high"
                            ? "text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20"
                            : trap.level === "medium"
                                ? "text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20"
                                : trap.level === "low"
                                    ? "text-yellow-600 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20"
                                    : "hidden";

                    // Calcular el mejor pick
                    const { best: bestPick, plays, allPicks, ratoneras, medias } = getBestPicks(r.prediction, r.home.teamName, r.away.teamName);
                    return (
                        <div
                            key={r.matchUrl}
                            className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden transition-all duration-200 hover:shadow-md"
                        >
                            <div
                                className="p-4 cursor-pointer"
                                onClick={() => toggleMatch(r.matchUrl)}
                            >
                                {/* Fila 1: Competición y hora */}
                                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        <span>{formatTime(r.startTime)}</span>
                                        <span className="hidden md:inline">·</span>
                                        <span className="truncate">{r.competitionName}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {isSelected ? (
                                            <ChevronUp className="w-5 h-5" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5" />
                                        )}
                                    </div>
                                </div>

                                {/* Fila 2: Equipos y favorito + badge de trampa */}
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
                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${trapLevelColor} cursor-help`}
                                                title={`Nivel de riesgo: ${trap.level.toUpperCase()}\n${trap.reasons.join("\n")}`}
                                            >
                                                <ShieldAlert className="w-3 h-3" />
                                                Trampa {trap.level}
                                            </span>
                                        )}
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

                                {/* Fila 5: Over/Under y BTTS */}
                                <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-gray-100 dark:border-neutral-800">
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-50 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-neutral-700">
                                        {r.prediction.goalLines[1].overProb > 60 ? "Over 2.5" : "Under 2.5"}
                                    </span>
                                    {r.prediction.btts.yes !== undefined && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-50 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-neutral-700">
                                            {r.prediction.btts.yes.prob > 60 ? "BTTS Sí" : "BTTS No"}
                                        </span>
                                    )}
                                </div>

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

                                            {/* Razones solo si hay trampa */}
                                            {trap.isTrap && trap.reasons.length > 0 && (
                                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                                    <span className="font-medium">⚠️ </span>
                                                    {trap.reasons.join(" · ")}
                                                </div>
                                            )}


                                            {/* Pick recomendado (el de mayor EV) */}
                                            {bestPick && (
                                                <div className="flex flex-wrap items-center gap-2 text-xs bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg px-3 py-1.5">
                                                    <Sparkles className="w-3 h-3 text-indigo-500" />
                                                    <span className="font-medium text-indigo-700 dark:text-indigo-300">{bestPick.market}</span>
                                                    <span className="font-bold text-gray-800 dark:text-gray-100">{bestPick.selection}</span>
                                                    <span className="text-gray-500 dark:text-gray-400">Cuota {bestPick.odd} · EV {(bestPick.ev * 100).toFixed(1)}%</span>
                                                    <span className="text-gray-400 text-[10px]">{bestPick.reason}</span>
                                                    {getOddsCategory(bestPick) === "ratonera" && (
                                                        <span className="text-[10px] bg-gray-200 dark:bg-neutral-700 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded">Ratonera</span>
                                                    )}
                                                    {getOddsCategory(bestPick) === "media" && (
                                                        <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">Media</span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Cuotas ratoneras */}
                                            {ratoneras.length > 0 && (
                                                <div className="mt-1">
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">🔹 Ratoneras (≤1.30)</span>
                                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                                        {ratoneras.slice(0, 5).map((pick, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-full px-2 py-0.5"
                                                            >
                                                                <span className="text-gray-600 dark:text-gray-300">{pick.market}</span>
                                                                <span className="font-bold text-gray-800 dark:text-gray-100">{pick.selection}</span>
                                                                <span className="text-gray-400">Cuota {pick.odd}</span>
                                                                <span className="text-green-600 font-medium">EV {(pick.ev * 100).toFixed(1)}%</span>
                                                            </div>
                                                        ))}
                                                        {ratoneras.length > 5 && (
                                                            <span className="text-xs text-gray-400">+{ratoneras.length - 5} más</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Cuotas medias */}
                                            {medias.length > 0 && (
                                                <div className="mt-1">
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">🔸 Medias (1.30 - 2.0/2.5)</span>
                                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                                        {medias.slice(0, 5).map((pick, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-full px-2 py-0.5"
                                                            >
                                                                <span className="text-gray-600 dark:text-gray-300">{pick.market}</span>
                                                                <span className="font-bold text-gray-800 dark:text-gray-100">{pick.selection}</span>
                                                                <span className="text-gray-400">Cuota {pick.odd}</span>
                                                                <span className="text-green-600 font-medium">EV {(pick.ev * 100).toFixed(1)}%</span>
                                                            </div>
                                                        ))}
                                                        {medias.length > 5 && (
                                                            <span className="text-xs text-gray-400">+{medias.length - 5} más</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Jugadas (si no hay ratoneras/medias y hay plays) */}
                                            {ratoneras.length === 0 && medias.length === 0 && plays.length > 0 && (
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

                                            {!bestPick && ratoneras.length === 0 && medias.length === 0 && plays.length === 0 && (
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    No hay picks con cuota razonable y valor positivo.
                                                </div>
                                            )}
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
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}