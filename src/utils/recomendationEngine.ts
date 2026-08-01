// lib/engines/recommendationEngine.ts
import { Recommendation, ScoreResult, TrapResult } from '@/types/engineTypes';

export function recommendationEngine(
    scoredPicks: ScoreResult[],
    trap: TrapResult,
    topN: number = 5,
    minOdd: number = 1.25,
    maxOdd: number = 5.0
): Recommendation | null {
    if (scoredPicks.length === 0) return null;

    // Filtrar por cuota
    const viablePicks = scoredPicks.filter(
        (p) => p.odd >= minOdd && p.odd <= maxOdd
    );

    let bestPick: ScoreResult | null = null;

    if (viablePicks.length === 0) {
        const fallback = scoredPicks.filter((p) => p.odd >= minOdd);
        if (fallback.length > 0) {
            bestPick = fallback.reduce((a, b) => (a.score > b.score ? a : b));
        } else {
            bestPick = scoredPicks[0];
        }
    } else {
        bestPick = viablePicks.reduce((a, b) => (a.score > b.score ? a : b));
    }

    if (!bestPick) return null;

    // Alternativas
    const alternatives = viablePicks
        .filter((p) => p !== bestPick)
        .slice(0, topN);

    // ---- Construir razonamiento con explicaciones de trampa ----
    let reasoning = `${bestPick.market}: ${bestPick.selection}. `;
    reasoning += bestPick.reason;
    reasoning += ` Cuota: ${bestPick.odd.toFixed(2)}.`;

    if (trap.isTrap && trap.details.length > 0) {
        reasoning += ` ⚠️ Atención: `;
        // Usamos las explicaciones completas en lugar de solo las razones
        const explanations = trap.details.map(d => d.explanation || d.reason);
        reasoning += explanations.join(' ');
    }

    reasoning += ` ✅ Apostar: ${bestPick.recommendation.betOn}. ❌ Evitar: ${bestPick.recommendation.avoid}.`;

    const confidence = {
        level: bestPick.confidence,
        score: bestPick.score,
    };

    return {
        pick: bestPick,
        trap,
        confidence,
        reasoning,
        alternatives,
    };
}