// utils/scoringEngine.ts

import { TeamInfo } from "@/types";
import { ExtendedMatchPrediction } from "@/lib/predictions";

export interface ScoreResult {
    market: string;
    selection: string;
    score: number;          // 0-100
    confidence: 'alta' | 'media' | 'baja';
    reason: string;
    recommendation: {
        betOn: string;
        avoid: string;
    };
    warning?: string;
}

export function scorePicks(
    home: TeamInfo,
    away: TeamInfo,
    pred: ExtendedMatchPrediction,
    volatility?: number,
    excludedTeams: string[] = []
): ScoreResult[] {
    const homeM = home.metrics;
    const awayM = away.metrics;
    if (!homeM || !awayM) return [];

    const results: ScoreResult[] = [];

    // --- 1. Resultado: Local ---
    results.push(scoreResultado(home, away, pred, volatility, 'home'));

    // --- 2. Resultado: Empate ---
    results.push(scoreResultado(home, away, pred, volatility, 'draw'));

    // --- 3. Resultado: Visitante ---
    results.push(scoreResultado(home, away, pred, volatility, 'away'));

    // --- 4. Total de goles: Over 2.5 ---
    results.push(scoreOverUnder(home, away, pred, volatility, 'over'));

    // --- 5. Total de goles: Under 2.5 ---
    results.push(scoreOverUnder(home, away, pred, volatility, 'under'));

    // --- 6. BTTS: Sí ---
    results.push(scoreBTTS(home, away, pred, volatility, 'yes'));

    // --- 7. BTTS: No ---
    results.push(scoreBTTS(home, away, pred, volatility, 'no'));

    // --- 8. Corners (si hay datos) ---
    if (pred.corners?.lines?.length) {
        const cornerResult = scoreCorners(home, away, pred, volatility);
        if (cornerResult) results.push(cornerResult);
    }

    // Ordenar por puntuación descendente
    results.sort((a, b) => b.score - a.score);

    return results;
}

// ============================================================
// FUNCIONES DE PUNTUACIÓN POR MERCADO
// ============================================================

function scoreResultado(
    home: TeamInfo,
    away: TeamInfo,
    pred: ExtendedMatchPrediction,
    volatility: number | undefined,
    type: 'home' | 'away' | 'draw',
): ScoreResult {
    const homeM = home.metrics!;
    const awayM = away.metrics!;
    let score = 50; // base
    const reasons: string[] = [];

    // Factores ofensivos
    const homeOff = homeM.offensiveEfficiency;
    const awayOff = awayM.offensiveEfficiency;
    const homeXG = homeM.xG;
    const awayXG = awayM.xG;
    const homeShot = homeM.shotFactor;
    const awayShot = awayM.shotFactor;
    const homePrecDrop = homeM.precisionDrop;
    const awayPrecDrop = awayM.precisionDrop;
    const vol = volatility || 0;
    // Si el equipo está excluido, penaliza su victoria
    // const homeExcluded = excludedTeams.includes(home.teamName);
    // const awayExcluded = excludedTeams.includes(away.teamName);

    // 1. Eficiencia ofensiva (25%)
    if (type === 'home') {
        if (homeOff > 1.2) { score += 10; reasons.push(`Eficiencia ofensiva alta (${homeOff.toFixed(2)})`); }
        else if (homeOff < 0.8) { score -= 10; reasons.push(`Baja eficiencia ofensiva (${homeOff.toFixed(2)})`); }

        // if (homeExcluded) { score -= 15; reasons.push('Equipo en racha negativa'); }
        // if (awayExcluded && type === 'home') { score += 5; reasons.push('El rival está en racha negativa'); }
    }
    else if (type === 'away') {
        if (awayOff > 1.2) { score += 10; reasons.push(`Eficiencia ofensiva alta (${awayOff.toFixed(2)})`); }
        else if (awayOff < 0.8) { score -= 10; reasons.push(`Baja eficiencia ofensiva (${awayOff.toFixed(2)})`); }

        // if (awayExcluded) { score -= 15; reasons.push('Equipo en racha negativa'); }
        // if (homeExcluded && type === 'away') { score += 5; reasons.push('El rival está en racha negativa'); }
    }
    else { // draw
        // El empate es más probable cuando los equipos están equilibrados
        const diff = Math.abs(homeOff - awayOff);
        if (diff < 0.3) { score += 10; reasons.push('Equipos equilibrados'); }
        if (homeXG > 1.0 && awayXG > 1.0) { score += 5; reasons.push('Ambos generan peligro'); }
    }

    // 2. xG (20%)
    if (type === 'home' && homeXG > 1.2) { score += 8; reasons.push(`Buen xG (${homeXG.toFixed(2)})`); }
    else if (type === 'home' && homeXG < 0.8) { score -= 8; reasons.push(`Bajo xG (${homeXG.toFixed(2)})`); }

    if (type === 'away' && awayXG > 1.2) { score += 8; reasons.push(`Buen xG (${awayXG.toFixed(2)})`); }
    else if (type === 'away' && awayXG < 0.8) { score -= 8; reasons.push(`Bajo xG (${awayXG.toFixed(2)})`); }

    // 3. Precisión de tiro (15%)
    if (type === 'home' && homeShot > 0.35) { score += 6; reasons.push(`Buena puntería (${homeShot.toFixed(2)})`); }
    else if (type === 'home' && homeShot < 0.25) { score -= 6; reasons.push(`Mala puntería (${homeShot.toFixed(2)})`); }

    if (type === 'away' && awayShot > 0.35) { score += 6; reasons.push(`Buena puntería (${awayShot.toFixed(2)})`); }
    else if (type === 'away' && awayShot < 0.25) { score -= 6; reasons.push(`Mala puntería (${awayShot.toFixed(2)})`); }

    // 4. Caída de precisión (10%)
    if (type === 'home' && homePrecDrop < -0.05) { score -= 4; reasons.push('Caída de precisión'); }
    if (type === 'away' && awayPrecDrop < -0.05) { score -= 4; reasons.push('Caída de precisión'); }

    // 5. Volatilidad (15%)
    if (vol > 0.3) {
        score -= 6;
        reasons.push(`Alta volatilidad (${vol.toFixed(2)})`);
    }

    // 6. Probabilidad del modelo (10%)
    const { homeWin, draw, awayWin } = pred.moneyline;
    if (type === 'home' && homeWin.prob > 50) { score += 4; }
    else if (type === 'away' && awayWin.prob > 50) { score += 4; }
    else if (type === 'draw' && draw.prob > 30) { score += 4; }

    // Limitar puntuación
    score = Math.max(0, Math.min(100, score));

    // Determinar confianza
    let confidence: 'alta' | 'media' | 'baja' = 'media';
    if (score >= 70) confidence = 'alta';
    else if (score >= 45) confidence = 'media';
    else confidence = 'baja';

    // Generar recomendaciones
    const teamName = type === 'home' ? home.teamName : type === 'away' ? away.teamName : 'Empate';
    const betOn = type === 'home' ? `${home.teamName} (victoria)` :
        type === 'away' ? `${away.teamName} (victoria)` : 'Empate';
    const avoid = type === 'home' ? `Victoria de ${away.teamName}` :
        type === 'away' ? `Victoria de ${home.teamName}` : 'Victoria de alguno de los dos';

    return {
        market: 'Resultado',
        selection: teamName,
        score,
        confidence,
        reason: reasons.length > 0 ? reasons.join(' · ') : 'Sin señales destacadas',
        recommendation: {
            betOn,
            avoid,
        },
        warning: vol > 0.3 ? '📊 Partido impredecible' : undefined,
    };
}

// ============================================================
// FUNCIÓN DE PUNTUACIÓN PARA OVER/UNDER
// ============================================================

function scoreOverUnder(
    home: TeamInfo,
    away: TeamInfo,
    pred: ExtendedMatchPrediction,
    volatility: number | undefined,
    type: 'over' | 'under'
): ScoreResult {
    const homeM = home.metrics!;
    const awayM = away.metrics!;
    let score = 50;
    const reasons: string[] = [];

    const homeXG = homeM.xG;
    const awayXG = awayM.xG;
    const homeEff = homeM.offensiveEfficiency;
    const awayEff = awayM.offensiveEfficiency;
    const homeShot = homeM.shotFactor;
    const awayShot = awayM.shotFactor;
    const homePrecDrop = homeM.precisionDrop;
    const awayPrecDrop = awayM.precisionDrop;
    const vol = volatility || 0;
    const totalXG = homeXG + awayXG;

    // 1. xG total (20%)
    if (type === 'over' && totalXG > 2.2) { score += 8; reasons.push(`Alto xG total (${totalXG.toFixed(2)})`); }
    else if (type === 'under' && totalXG < 2.0) { score += 8; reasons.push(`Bajo xG total (${totalXG.toFixed(2)})`); }
    else if (type === 'over' && totalXG < 1.8) { score -= 8; reasons.push(`Bajo xG total (${totalXG.toFixed(2)})`); }
    else if (type === 'under' && totalXG > 2.5) { score -= 8; reasons.push(`Alto xG total (${totalXG.toFixed(2)})`); }

    // 2. Eficiencia ofensiva (15%)
    if (type === 'over') {
        if (homeEff > 1.2) { score += 6; reasons.push(`Sobrerendimiento local (${homeEff.toFixed(2)})`); }
        if (awayEff > 1.2) { score += 6; reasons.push(`Sobrerendimiento visitante (${awayEff.toFixed(2)})`); }
        if (homeEff < 0.8) { score -= 6; reasons.push(`Bajorendimiento local (${homeEff.toFixed(2)})`); }
        if (awayEff < 0.8) { score -= 6; reasons.push(`Bajorendimiento visitante (${awayEff.toFixed(2)})`); }
    } else { // under
        if (homeEff > 1.2) { score -= 6; reasons.push(`Sobrerendimiento local (${homeEff.toFixed(2)})`); }
        if (awayEff > 1.2) { score -= 6; reasons.push(`Sobrerendimiento visitante (${awayEff.toFixed(2)})`); }
        if (homeEff < 0.8) { score += 6; reasons.push(`Bajorendimiento local (${homeEff.toFixed(2)})`); }
        if (awayEff < 0.8) { score += 6; reasons.push(`Bajorendimiento visitante (${awayEff.toFixed(2)})`); }
    }

    // 3. Precisión de tiro (15%)
    const avgShot = (homeShot + awayShot) / 2;
    if (type === 'over' && avgShot > 0.35) { score += 6; reasons.push(`Buena puntería promedio (${avgShot.toFixed(2)})`); }
    else if (type === 'under' && avgShot < 0.30) { score += 6; reasons.push(`Mala puntería promedio (${avgShot.toFixed(2)})`); }

    // 4. Caída de precisión (10%)
    if (type === 'over') {
        if (homePrecDrop < -0.05) { score -= 4; reasons.push('Caída de precisión local'); }
        if (awayPrecDrop < -0.05) { score -= 4; reasons.push('Caída de precisión visitante'); }
    } else {
        if (homePrecDrop < -0.05) { score += 4; reasons.push('Caída de precisión local (menos goles)'); }
        if (awayPrecDrop < -0.05) { score += 4; reasons.push('Caída de precisión visitante (menos goles)'); }
    }

    // 5. Volatilidad (10%)
    if (vol > 0.3) {
        score -= 4;
        reasons.push(`Alta volatilidad (${vol.toFixed(2)})`);
    }

    // 6. Probabilidad del modelo (10%)
    const goalLine25 = pred.goalLines?.find(gl => gl.line === 2.5);
    if (goalLine25) {
        if (type === 'over' && goalLine25.overProb > 50) { score += 4; }
        else if (type === 'under' && goalLine25.underProb > 50) { score += 4; }
    }

    score = Math.max(0, Math.min(100, score));

    let confidence: 'alta' | 'media' | 'baja' = 'media';
    if (score >= 70) confidence = 'alta';
    else if (score >= 45) confidence = 'media';
    else confidence = 'baja';

    const selection = type === 'over' ? 'Over 2.5' : 'Under 2.5';
    const betOn = selection;
    const avoid = type === 'over' ? 'Under 2.5' : 'Over 2.5';

    return {
        market: 'Total de goles',
        selection,
        score,
        confidence,
        reason: reasons.length > 0 ? reasons.join(' · ') : 'Sin señales destacadas',
        recommendation: { betOn, avoid },
        warning: vol > 0.3 ? '📊 Partido impredecible' : undefined,
    };
}

// ============================================================
// FUNCIÓN DE PUNTUACIÓN PARA BTTS
// ============================================================

function scoreBTTS(
    home: TeamInfo,
    away: TeamInfo,
    pred: ExtendedMatchPrediction,
    volatility: number | undefined,
    type: 'yes' | 'no'
): ScoreResult {
    const homeM = home.metrics!;
    const awayM = away.metrics!;
    let score = 50;
    const reasons: string[] = [];

    const homeXG = homeM.xG;
    const awayXG = awayM.xG;
    const homeEff = homeM.offensiveEfficiency;
    const awayEff = awayM.offensiveEfficiency;
    const homeShot = homeM.shotFactor;
    const awayShot = awayM.shotFactor;
    const homePrecDrop = homeM.precisionDrop;
    const awayPrecDrop = awayM.precisionDrop;
    const vol = volatility || 0;

    // 1. xG (30%)
    if (type === 'yes') {
        if (homeXG > 1.0) { score += 10; reasons.push(`Buen xG local (${homeXG.toFixed(2)})`); }
        if (awayXG > 1.0) { score += 10; reasons.push(`Buen xG visitante (${awayXG.toFixed(2)})`); }
        if (homeXG < 0.7) { score -= 8; reasons.push(`Bajo xG local (${homeXG.toFixed(2)})`); }
        if (awayXG < 0.7) { score -= 8; reasons.push(`Bajo xG visitante (${awayXG.toFixed(2)})`); }
    } else {
        if (homeXG < 0.8) { score += 10; reasons.push(`Bajo xG local (${homeXG.toFixed(2)})`); }
        if (awayXG < 0.8) { score += 10; reasons.push(`Bajo xG visitante (${awayXG.toFixed(2)})`); }
        if (homeXG > 1.2) { score -= 8; reasons.push(`Alto xG local (${homeXG.toFixed(2)})`); }
        if (awayXG > 1.2) { score -= 8; reasons.push(`Alto xG visitante (${awayXG.toFixed(2)})`); }
    }

    // 2. Eficiencia (20%)
    if (type === 'yes') {
        if (homeEff > 1.0) { score += 5; reasons.push(`Buena eficiencia local (${homeEff.toFixed(2)})`); }
        if (awayEff > 1.0) { score += 5; reasons.push(`Buena eficiencia visitante (${awayEff.toFixed(2)})`); }
        if (homeEff < 0.8) { score -= 5; reasons.push(`Mala eficiencia local (${homeEff.toFixed(2)})`); }
        if (awayEff < 0.8) { score -= 5; reasons.push(`Mala eficiencia visitante (${awayEff.toFixed(2)})`); }
    } else {
        if (homeEff < 0.8) { score += 5; reasons.push(`Mala eficiencia local (${homeEff.toFixed(2)})`); }
        if (awayEff < 0.8) { score += 5; reasons.push(`Mala eficiencia visitante (${awayEff.toFixed(2)})`); }
        if (homeEff > 1.2) { score -= 5; reasons.push(`Alta eficiencia local (${homeEff.toFixed(2)})`); }
        if (awayEff > 1.2) { score -= 5; reasons.push(`Alta eficiencia visitante (${awayEff.toFixed(2)})`); }
    }

    // 3. Precisión (15%)
    if (type === 'yes') {
        if (homeShot > 0.35) { score += 5; reasons.push(`Buena puntería local (${homeShot.toFixed(2)})`); }
        if (awayShot > 0.35) { score += 5; reasons.push(`Buena puntería visitante (${awayShot.toFixed(2)})`); }
    } else {
        if (homeShot < 0.3) { score += 5; reasons.push(`Mala puntería local (${homeShot.toFixed(2)})`); }
        if (awayShot < 0.3) { score += 5; reasons.push(`Mala puntería visitante (${awayShot.toFixed(2)})`); }
    }

    // 4. Caída de precisión (10%)
    if (type === 'yes') {
        if (homePrecDrop < -0.05) { score -= 5; reasons.push('Caída de precisión local'); }
        if (awayPrecDrop < -0.05) { score -= 5; reasons.push('Caída de precisión visitante'); }
    } else {
        if (homePrecDrop < -0.05) { score += 5; reasons.push('Caída de precisión local (menos goles)'); }
        if (awayPrecDrop < -0.05) { score += 5; reasons.push('Caída de precisión visitante (menos goles)'); }
    }

    // 5. Volatilidad (10%)
    if (vol > 0.3) {
        score -= 5;
        reasons.push(`Alta volatilidad (${vol.toFixed(2)})`);
    }

    // 6. Probabilidad modelo (15%)
    if (pred.btts) {
        if (type === 'yes' && pred.btts.yes.prob > 50) { score += 5; }
        else if (type === 'no' && pred.btts.no.prob > 50) { score += 5; }
    }

    score = Math.max(0, Math.min(100, score));

    let confidence: 'alta' | 'media' | 'baja' = 'media';
    if (score >= 70) confidence = 'alta';
    else if (score >= 45) confidence = 'media';
    else confidence = 'baja';

    const selection = type === 'yes' ? 'Sí' : 'No';
    const betOn = type === 'yes' ? 'BTTS Sí' : 'BTTS No';
    const avoid = type === 'yes' ? 'BTTS No' : 'BTTS Sí';

    return {
        market: 'Ambos anotan',
        selection,
        score,
        confidence,
        reason: reasons.length > 0 ? reasons.join(' · ') : 'Sin señales destacadas',
        recommendation: { betOn, avoid },
        warning: vol > 0.3 ? '📊 Partido impredecible' : undefined,
    };
}

// ============================================================
// FUNCIÓN DE PUNTUACIÓN PARA CORNERS
// ============================================================

function scoreCorners(
    home: TeamInfo,
    away: TeamInfo,
    pred: ExtendedMatchPrediction,
    volatility: number | undefined
): ScoreResult | null {
    const homeM = home.metrics!;
    const awayM = away.metrics!;

    // Necesitamos el total esperado de corners
    const expectedCorners = pred.corners?.expectedTotal;
    if (!expectedCorners || !pred.corners?.lines?.length) return null;

    let score = 50;
    const reasons: string[] = [];

    const homeCorners = homeM.corners;
    const awayCorners = awayM.corners;
    const totalAvg = (homeCorners + awayCorners) / 2;

    // Buscar la línea más cercana al esperado
    let closestLine = pred.corners.lines[0];
    let minDiff = Math.abs(closestLine.line - expectedCorners);
    for (const cl of pred.corners.lines) {
        const diff = Math.abs(cl.line - expectedCorners);
        if (diff < minDiff) {
            minDiff = diff;
            closestLine = cl;
        }
    }

    const isOver = closestLine.overProb > closestLine.underProb;
    const line = closestLine.line;

    // Decidir si over o under basado en la probabilidad
    if (isOver) {
        score += 10;
        reasons.push(`Probabilidad > 50% de Over ${line}`);
    } else {
        score += 10;
        reasons.push(`Probabilidad > 50% de Under ${line}`);
    }

    // Ajustar por la diferencia entre esperado y línea
    const diff = expectedCorners - line;
    if (isOver && diff > 0.5) { score += 5; reasons.push('Línea por debajo del esperado'); }
    else if (!isOver && diff < -0.5) { score += 5; reasons.push('Línea por encima del esperado'); }

    // Volatilidad
    const vol = volatility || 0;
    if (vol > 0.3) { score -= 5; reasons.push(`Alta volatilidad (${vol.toFixed(2)})`); }

    score = Math.max(0, Math.min(100, score));

    let confidence: 'alta' | 'media' | 'baja' = 'media';
    if (score >= 70) confidence = 'alta';
    else if (score >= 45) confidence = 'media';
    else confidence = 'baja';

    const selection = isOver ? `Over ${line}` : `Under ${line}`;
    const betOn = selection;
    const avoid = isOver ? `Under ${line}` : `Over ${line}`;

    return {
        market: 'Córners',
        selection,
        score,
        confidence,
        reason: reasons.length > 0 ? reasons.join(' · ') : 'Sin señales destacadas',
        recommendation: { betOn, avoid },
        warning: vol > 0.3 ? '📊 Partido impredecible' : undefined,
    };
}