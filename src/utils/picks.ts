import { ExtendedMatchPrediction } from "@/lib/predictions";
import { Pick, TrapResult, WarningsAndExclusions } from "@/types";
import { getOddsCategory } from "./odds";

export function getBestPicks(
    pred: ExtendedMatchPrediction,
    homeTeam: string,
    awayTeam: string,
    riskLevel: "low" | "medium" | "high" | "none",
    excludedMarkets: string[] = []
): { best: Pick | null; plays: Pick[]; allPicks: Pick[]; ratoneras: Pick[]; medias: Pick[]; altas: Pick[] } {
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

    // 2. BTTS
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

    // 3. Over/Under (todas las líneas de goles)
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

    // 4. Corners
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

    // Filtrar por mercados excluidos
    const availablePicks = allPicks.filter(p => !excludedMarkets.includes(p.market));
    const picksToUse = availablePicks.length > 0 ? availablePicks : allPicks;

    // Ordenar por probabilidad
    picksToUse.sort((a, b) => b.prob - a.prob);

    // Aplicar filtros de riesgo (según nivel)
    let filteredPicks: Pick[] = [];
    if (riskLevel === "high") {
        filteredPicks = picksToUse.filter(p => p.prob > 45);
    } else if (riskLevel === "medium") {
        filteredPicks = picksToUse.filter(p => p.prob > 55);
    } else {
        filteredPicks = picksToUse;
    }
    if (filteredPicks.length === 0) {
        filteredPicks = picksToUse.length > 0 ? [picksToUse[0]] : [];
    }

    // Clasificar por cuota
    const positiveEV = allPicks.filter(p => p.ev > 0.05);
    const ratoneras = allPicks.filter(p => p.odd >= 1.15 && p.odd <= 1.30);
    const medias = allPicks.filter(p => p.odd > 1.30 && p.odd <= 1.80);
    const altas = allPicks.filter(p => {
        const isML = p.market === "Resultado";
        const limit = isML ? 2.5 : 2.0;
        return p.odd > 1.80 && p.odd <= limit;
    });

    const best = positiveEV.length > 0 ? positiveEV[0] : null;
    const plays = allPicks
        .filter(p => p.odd < 2.0 && p !== best)
        .slice(0, 3);

    return { best, plays, allPicks: positiveEV, ratoneras, medias, altas };
}

export function getWarningsAndExclusions(
    trap: TrapResult,
    homeTeam: string,
    awayTeam: string
): WarningsAndExclusions {
    const warnings: string[] = [];
    const excludedMarkets: string[] = [];

    if (trap.level === "low" || trap.level === "none") {
        return { warnings: [], excludedMarkets: [] };
    }

    for (const detail of trap.details) {
        const teamName = detail.team === "ambos" ? "ambos equipos" : detail.team;

        if (detail.reason.includes("Alta volatilidad")) {
            warnings.push(`📊 Alta volatilidad en ${teamName}.`);
            if (trap.level === "high") {
                excludedMarkets.push("Resultado", "Total de goles");
            } else {
                warnings.push(`⚠️ Ten precaución con Resultado y Total de goles en ${teamName}.`);
            }
        }

        if (detail.reason.includes("Eficiencia ofensiva extrema")) {
            warnings.push(`⚡ Eficiencia ofensiva extrema en ${teamName}.`);
            if (trap.level === "high") {
                excludedMarkets.push("Resultado", "Ambos anotan");
            } else {
                warnings.push(`⚠️ Ten precaución con Resultado y BTTS en ${teamName}.`);
            }
        }

        if (detail.reason.includes("Caída de precisión")) {
            warnings.push(`🎯 Caída de precisión en ${teamName}.`);
            if (trap.level === "high") {
                excludedMarkets.push("Total de goles");
            } else {
                warnings.push(`⚠️ Ten precaución con Total de goles en ${teamName}.`);
            }
        }

        if (detail.reason.includes("Discrepancia xG")) {
            warnings.push(`❓ Discrepancia entre xG y goles esperados en ${teamName}.`);
            if (trap.level === "high") {
                excludedMarkets.push("Resultado", "Total de goles", "Ambos anotan");
            } else {
                warnings.push(`⚠️ Ten precaución con todos los mercados en ${teamName}.`);
            }
        }
    }

    if (trap.level === "high" && excludedMarkets.length === 0) {
        excludedMarkets.push("Resultado");
        warnings.push("🔴 Riesgo alto: evita apostar al Resultado.");
    }

    const uniqueExcluded = [...new Set(excludedMarkets)];
    return { warnings, excludedMarkets: uniqueExcluded };
}