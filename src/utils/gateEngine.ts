import { ExtendedMatchPrediction } from '@/lib/predictions';
import { UnifiedTeamInfo } from '@/types/unifiedStats';
export interface GateResult {
    valid: boolean;
    reason?: string;
}

export function gateEngine(
    home: UnifiedTeamInfo,
    away: UnifiedTeamInfo,
    pred: ExtendedMatchPrediction
): GateResult {
    if (!home.metrics || !away.metrics) {
        return { valid: false, reason: 'Faltan métricas de uno de los equipos' };
    }
    if (!pred.moneyline || !pred.goalLines?.length) {
        return { valid: false, reason: 'Faltan datos de predicción básicos' };
    }
    // Validación rápida de valores
    const h = home.metrics;
    const a = away.metrics;
    if (h.xG < 0 || a.xG < 0 || h.xGA < 0 || a.xGA < 0) {
        return { valid: false, reason: 'xG o xGA negativos o inválidos' };
    }
    return { valid: true };
}