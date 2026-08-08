// lib/engines/parlayEngine.ts
import { Parlay, ParlayPick, ParlayEngineResult, ScoreResult, ParlayCandidate } from '@/types/engineTypes';

export interface ParlayEngineConfig {
    minPickScore: number;       // score mínimo para considerar un pick (default: 70)
    minPickOdd: number;         // cuota mínima individual (default: 1.20)
    maxPickOdd: number;         // cuota máxima individual (default: 2.50)
    minTotalOdd: number;        // cuota total mínima (default: 2.00)
    maxTotalOdd: number;        // cuota total máxima (default: 4.00)
    maxPicksPerParlay: number;  // máximo de picks por parlay (default: 3)
    topParlays: number;         // cuántos parlays devolver (default: 10)
    excludeSameMatch: boolean;  // evitar combinaciones del mismo partido (default: false)
}

const DEFAULT_CONFIG: ParlayEngineConfig = {
    minPickScore: 60,
    minPickOdd: 1.20,
    maxPickOdd: 3.00,
    minTotalOdd: 2.00,
    maxTotalOdd: 4.00,
    maxPicksPerParlay: 3,
    topParlays: 10,
    excludeSameMatch: false,
};

/**
 * Genera combinaciones de picks (parlays) con cuota total entre 2.00 y 4.00
 * basadas en los picks con mayor score de cada partido.
 */
export function parlayEngine(
    candidates: ParlayCandidate[],
    config: Partial<ParlayEngineConfig> = {}
): ParlayEngineResult {
    const cfg = { ...DEFAULT_CONFIG, ...config };

    // console.log({ candidates, cfg });
    // ---- 1. Filtrar picks de alta confianza y cuota en rango ----
    const eligiblePicks: ParlayPick[] = candidates
        .filter(c => c.pick.score >= cfg.minPickScore)
        .filter(c => c.pick.odd >= cfg.minPickOdd && c.pick.odd <= cfg.maxPickOdd)
        .map(c => ({
            matchUrl: c.matchUrl,
            homeTeam: c.homeTeam,
            awayTeam: c.awayTeam,
            market: c.pick.market,
            selection: c.pick.selection,
            odd: c.pick.odd,
            probability: c.pick.score / 100,
            score: c.pick.score,
            confidence: c.pick.confidence,
            reason: c.pick.reason,
        }));


    // console.log({ eligiblePicks })
    // ---- 2. Agrupar por partido para evitar combinaciones incompatibles ----
    const picksByMatch: Record<string, ParlayPick[]> = {};
    for (const pick of eligiblePicks) {
        if (!picksByMatch[pick.matchUrl]) picksByMatch[pick.matchUrl] = [];
        picksByMatch[pick.matchUrl].push(pick);
    }

    // ---- 3. Función para verificar si dos picks son compatibles ----
    function arePicksCompatible(pickA: ParlayPick, pickB: ParlayPick): boolean {
        // Si son del mismo partido, verificar que no sean del mismo mercado excluyente
        if (pickA.matchUrl === pickB.matchUrl) {
            // Mismo mercado y selecciones opuestas (ej. Over 2.5 vs Under 2.5)
            if (pickA.market === pickB.market) {
                if (pickA.selection.includes('Over') && pickB.selection.includes('Under')) return false;
                if (pickA.selection.includes('Under') && pickB.selection.includes('Over')) return false;
                if (pickA.selection === 'Sí' && pickB.selection === 'No') return false;
                if (pickA.selection === 'No' && pickB.selection === 'Sí') return false;
                // Resultados opuestos (ej. Real Madrid vs Empate vs Barcelona)
                const teams = [pickA.homeTeam, pickA.awayTeam, 'Empate'];
                if (teams.includes(pickA.selection) && teams.includes(pickB.selection) && pickA.selection !== pickB.selection) {
                    return false;
                }
            }
            // Si son del mismo partido y cfg.excludeSameMatch es true, no se pueden combinar
            if (cfg.excludeSameMatch) return false;
        }
        return true;
    }

    // ---- 4. Generar combinaciones ----
    const parlays: Parlay[] = [];
    const allPicksArray = eligiblePicks;

    // Combinaciones de 2 picks
    for (let i = 0; i < allPicksArray.length; i++) {
        for (let j = i + 1; j < allPicksArray.length; j++) {
            const p1 = allPicksArray[i];
            const p2 = allPicksArray[j];
            if (!arePicksCompatible(p1, p2)) continue;
            const totalOdd = p1.odd * p2.odd;
            if (totalOdd >= cfg.minTotalOdd && totalOdd <= cfg.maxTotalOdd) {
                const totalEV = (p1.probability * p2.probability * totalOdd) - 1;
                const winRate = p1.probability * p2.probability;
                const score = (p1.score + p2.score) / 2 + (winRate * 20);
                parlays.push({
                    id: `parlay-${parlays.length + 1}`,
                    picks: [p1, p2],
                    totalOdd,
                    totalEV,
                    estimatedWinRate: winRate,
                    riskLevel: totalEV > 0.2 ? 'low' : totalEV > 0.05 ? 'medium' : 'high',
                    reasoning: generarRazonamiento([p1, p2]),
                    score: Math.min(100, score),
                });
            }
        }
    }

    // Combinaciones de 3 picks (si cfg.maxPicksPerParlay >= 3)
    if (cfg.maxPicksPerParlay >= 3) {
        for (let i = 0; i < allPicksArray.length; i++) {
            for (let j = i + 1; j < allPicksArray.length; j++) {
                for (let k = j + 1; k < allPicksArray.length; k++) {
                    const p1 = allPicksArray[i];
                    const p2 = allPicksArray[j];
                    const p3 = allPicksArray[k];
                    if (!arePicksCompatible(p1, p2) || !arePicksCompatible(p1, p3) || !arePicksCompatible(p2, p3)) continue;
                    const totalOdd = p1.odd * p2.odd * p3.odd;
                    if (totalOdd >= cfg.minTotalOdd && totalOdd <= cfg.maxTotalOdd) {
                        const totalEV = (p1.probability * p2.probability * p3.probability * totalOdd) - 1;
                        const winRate = p1.probability * p2.probability * p3.probability;
                        const score = (p1.score + p2.score + p3.score) / 3 + (winRate * 30);
                        parlays.push({
                            id: `parlay-${parlays.length + 1}`,
                            picks: [p1, p2, p3],
                            totalOdd,
                            totalEV,
                            estimatedWinRate: winRate,
                            riskLevel: totalEV > 0.2 ? 'low' : totalEV > 0.05 ? 'medium' : 'high',
                            reasoning: generarRazonamiento([p1, p2, p3]),
                            score: Math.min(100, score),
                        });
                    }
                }
            }
        }
    }

    // ---- 5. Ordenar y seleccionar los mejores ----
    parlays.sort((a, b) => {
        // Priorizar: 1) EV más alto, 2) Score más alto, 3) WinRate más alto
        if (b.totalEV !== a.totalEV) return b.totalEV - a.totalEV;
        if (b.score !== a.score) return b.score - a.score;
        return b.estimatedWinRate - a.estimatedWinRate;
    });

    const topParlays = parlays.slice(0, cfg.topParlays);

    return {
        parlays: topParlays,
        topParlay: topParlays.length > 0 ? topParlays[0] : null,
        totalCombinations: parlays.length,
    };
}

// ---- 6. Función auxiliar para generar razonamiento ----
function generarRazonamiento(picks: ParlayPick[]): string {
    const pickDescriptions = picks.map(p =>
        `${p.homeTeam} vs ${p.awayTeam}: ${p.market} → ${p.selection} (Cuota ${p.odd.toFixed(2)})`
    );
    const reasons = picks.map(p => p.reason).join('. ');
    const totalOdd = picks.reduce((acc, p) => acc * p.odd, 1);
    return `Combinación de ${picks.length} picks: ${pickDescriptions.join(' + ')}. ${reasons}. Cuota total: ${totalOdd.toFixed(2)}.`;
}