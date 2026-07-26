import { ExtendedMatchPrediction } from "@/lib/predictions";
import { Pick, TeamInfo, TrapResult, WarningsAndExclusions } from "@/types";
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

// utils/picks.ts (o donde tengas las funciones de picks)

interface BestPickResult {
    market: string;        // "Resultado", "Total de goles", "Ambos anotan", "Córners"
    selection: string;     // "Real Madrid", "Over 2.5", etc.
    reason: string;        // Explicación del pick
    confidence: 'alta' | 'media' | 'baja';
    warning?: string;      // Leyenda de advertencia si aplica
}

export interface MarketScore {

    market: string;

    selection: string;

    score: number;

    confidence: number;

    reasons: string[];

}

// utils/picks.ts

interface BestPickResult {
    market: string;           // Mercado recomendado para apostar
    selection: string;        // Selección específica (ej. "Over 2.5")
    reason: string;           // Explicación detallada (el mensaje específico)
    confidence: 'alta' | 'media' | 'baja';
    recommendation: {         // 🔥 NUEVO
        betOn: string;          // Qué apostar (ej. "Under 2.5")
        avoid: string;          // Qué evitar (ej. "Victoria del local")
    };
    warning?: string;         // Advertencia adicional (opcional)
}

export function getBestPickFromData(
    home: TeamInfo,
    away: TeamInfo,
    pred: ExtendedMatchPrediction,
    volatility?: number
): BestPickResult | null {
    const homeM = home.metrics;
    const awayM = away.metrics;
    if (!homeM || !awayM) return null;

    const homeEff = homeM.offensiveEfficiency;
    const awayEff = awayM.offensiveEfficiency;
    const homeXG = homeM.xG;
    const awayXG = awayM.xG;
    const homeShot = homeM.shotFactor;
    const awayShot = awayM.shotFactor;
    const homePrecisionDrop = homeM.precisionDrop;
    const awayPrecisionDrop = awayM.precisionDrop;
    const vol = volatility || 0;

    // ---- 1. Sobrerendimiento local ----
    if (homeEff > 1.2 && homeXG > 1.2) {
        return {
            market: 'Total de goles',
            selection: 'Under 2.5',
            confidence: 'alta',
            reason: `${home.teamName} está marcando un ${((homeEff - 1) * 100).toFixed(0)}% más de goles de lo esperado según su xG (${homeXG.toFixed(2)}). Esto es insostenible: es probable que sus goles disminuyan (regresión a la media).`,
            recommendation: {
                betOn: 'Under 2.5 o Doble oportunidad (rival no pierde)',
                avoid: 'Victoria del local o Over 2.5',
            },
            warning: '📉 Regresión a la media esperada.',
        };
    }

    // ---- 2. Sobrerendimiento visitante ----
    if (awayEff > 1.2 && awayXG > 1.2) {
        return {
            market: 'Total de goles',
            selection: 'Under 2.5',
            confidence: 'alta',
            reason: `${away.teamName} está marcando un ${((awayEff - 1) * 100).toFixed(0)}% más de goles de lo esperado según su xG (${awayXG.toFixed(2)}). Es probable que su efectividad baje (regresión a la media).`,
            recommendation: {
                betOn: 'Under 2.5 o Doble oportunidad (local no pierde)',
                avoid: 'Victoria del visitante o Over 2.5',
            },
            warning: '📉 Regresión a la media esperada.',
        };
    }

    // ---- 3. Bajorendimiento local ----
    if (homeEff < 0.8 && homeXG < 0.8) {
        return {
            market: 'Total de goles',
            selection: 'Over 2.5',
            confidence: 'alta',
            reason: `${home.teamName} está marcando un ${((1 - homeEff) * 100).toFixed(0)}% menos de goles de lo esperado (xG ${homeXG.toFixed(2)}). Es probable que mejore su efectividad (regresión positiva).`,
            recommendation: {
                betOn: 'Over 2.5 o Victoria del local',
                avoid: 'Under 2.5 o que el local no marque',
            },
            warning: '📈 Probable mejora ofensiva.',
        };
    }

    // ---- 4. Bajorendimiento visitante ----
    if (awayEff < 0.8 && awayXG < 0.8) {
        return {
            market: 'Total de goles',
            selection: 'Over 2.5',
            confidence: 'alta',
            reason: `${away.teamName} está marcando un ${((1 - awayEff) * 100).toFixed(0)}% menos de goles de lo esperado (xG ${awayXG.toFixed(2)}). Probable mejora en su puntería.`,
            recommendation: {
                betOn: 'Over 2.5 o Victoria del visitante',
                avoid: 'Under 2.5 o que el visitante no marque',
            },
            warning: '📈 Probable mejora ofensiva.',
        };
    }

    // ---- 5. Ambos con buen xG y precisión -> Over 2.5 ----
    if (homeXG > 1.0 && awayXG > 1.0 && homeShot > 0.35 && awayShot > 0.35) {
        return {
            market: 'Total de goles',
            selection: 'Over 2.5',
            confidence: 'alta',
            reason: `Ambos equipos generan buen xG (${homeXG.toFixed(2)} vs ${awayXG.toFixed(2)}) y tienen buena precisión de tiro (${homeShot.toFixed(2)} / ${awayShot.toFixed(2)}). Se esperan goles.`,
            recommendation: {
                betOn: 'Over 2.5 y BTTS Sí',
                avoid: 'Under 2.5',
            },
        };
    }

    // ---- 6. Alta volatilidad ----
    if (vol > 0.3) {
        return {
            market: 'Resultado',
            selection: 'Evitar (partido impredecible)',
            confidence: 'baja',
            reason: `El partido tiene alta volatilidad (${vol.toFixed(2)}). Los equipos son muy irregulares, y los resultados son difíciles de predecir.`,
            recommendation: {
                betOn: 'Empate o victoria del underdog (cuota alta)',
                avoid: 'Favoritos claros o Over/Under con baja cuota',
            },
            warning: '📊 Partido impredecible. Reduce el tamaño de la apuesta.',
        };
    }

    // ---- 7. Caída de precisión ----
    if (homePrecisionDrop < -0.05) {
        return {
            market: 'Goles del local',
            selection: 'Under 0.5 goles del local',
            confidence: 'media',
            reason: `${home.teamName} ha perdido puntería en los últimos partidos (caída del ${Math.abs(homePrecisionDrop * 100).toFixed(0)}% en tiros a puerta).`,
            recommendation: {
                betOn: 'Under 0.5 goles del local',
                avoid: 'Over 0.5 goles del local o BTTS Sí',
            },
            warning: '🎯 Baja precisión reciente.',
        };
    }
    if (awayPrecisionDrop < -0.05) {
        return {
            market: 'Goles del visitante',
            selection: 'Under 0.5 goles del visitante',
            confidence: 'media',
            reason: `${away.teamName} ha perdido puntería en los últimos partidos (caída del ${Math.abs(awayPrecisionDrop * 100).toFixed(0)}% en tiros a puerta).`,
            recommendation: {
                betOn: 'Under 0.5 goles del visitante',
                avoid: 'Over 0.5 goles del visitante o BTTS Sí',
            },
            warning: '🎯 Baja precisión reciente.',
        };
    }

    // ---- 8. Caso por defecto: probabilidades del modelo ----
    const { homeWin, draw, awayWin } = pred.moneyline;
    if (homeWin.prob > draw.prob && homeWin.prob > awayWin.prob) {
        return {
            market: 'Resultado',
            selection: home.teamName,
            confidence: 'media',
            reason: `El modelo da ${homeWin.prob}% de probabilidad de que gane el local, pero no hay señales estadísticas extremas.`,
            recommendation: {
                betOn: `${home.teamName} (victoria)`,
                avoid: 'Empate o victoria visitante',
            },
        };
    } else if (awayWin.prob > homeWin.prob && awayWin.prob > draw.prob) {
        return {
            market: 'Resultado',
            selection: away.teamName,
            confidence: 'media',
            reason: `El modelo da ${awayWin.prob}% de probabilidad de que gane el visitante.`,
            recommendation: {
                betOn: `${away.teamName} (victoria)`,
                avoid: 'Empate o victoria local',
            },
        };
    } else {
        return {
            market: 'Resultado',
            selection: 'Empate',
            confidence: 'media',
            reason: `El modelo da ${draw.prob}% de probabilidad de empate. Partido equilibrado.`,
            recommendation: {
                betOn: 'Empate o Doble oportunidad (local o empate)',
                avoid: 'Victoria clara de alguno de los dos',
            },
        };
    }
}