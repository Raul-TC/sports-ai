// // utils/scoringEngine.ts

// import { TeamInfo } from "@/types";
// import { ExtendedMatchPrediction } from "@/lib/predictions";

// export interface ScoreResult {
//     market: string;
//     selection: string;
//     score: number;          // 0-100
//     confidence: 'alta' | 'media' | 'baja';
//     reason: string;
//     recommendation: {
//         betOn: string;
//         avoid: string;
//     };
//     warning?: string;
// }

// export function scorePicks(home: TeamInfo, away: TeamInfo, pred: ExtendedMatchPrediction, volatility?: number, excludedTeams: string[] = []): ScoreResult[] {
//     const homeM = home.metrics;
//     const awayM = away.metrics;
//     if (!homeM || !awayM) return [];

//     const results: ScoreResult[] = [];

//     // --- 1. Resultado: Local ---
//     results.push(scoreResultado(home, away, pred, volatility, 'home'));

//     // --- 2. Resultado: Empate ---
//     results.push(scoreResultado(home, away, pred, volatility, 'draw'));

//     // --- 3. Resultado: Visitante ---
//     results.push(scoreResultado(home, away, pred, volatility, 'away'));

//     // --- 4. Total de goles: Over 2.5 ---
//     results.push(scoreOverUnder(home, away, pred, volatility, 'over'));

//     // --- 5. Total de goles: Under 2.5 ---
//     results.push(scoreOverUnder(home, away, pred, volatility, 'under'));

//     // --- 6. BTTS: Sí ---
//     results.push(scoreBTTS(home, away, pred, volatility, 'yes'));

//     // --- 7. BTTS: No ---
//     results.push(scoreBTTS(home, away, pred, volatility, 'no'));

//     // --- 8. Corners (si hay datos) ---
//     if (pred.corners?.lines?.length) {
//         const cornerResult = scoreCorners(home, away, pred, volatility);
//         if (cornerResult) results.push(cornerResult);
//     }

//     // Ordenar por puntuación descendente
//     results.sort((a, b) => b.score - a.score);

//     return results;
// }

// // ============================================================
// // FUNCIONES DE PUNTUACIÓN POR MERCADO
// // ============================================================

// function scoreResultado(home: TeamInfo, away: TeamInfo, pred: ExtendedMatchPrediction, volatility: number | undefined, type: 'home' | 'away' | 'draw'): ScoreResult {
//     const homeM = home.metrics!;
//     const awayM = away.metrics!;
//     let score = 50; // base
//     const reasons: string[] = [];

//     // Factores ofensivos
//     const homeOff = homeM.offensiveEfficiency;
//     const awayOff = awayM.offensiveEfficiency;
//     const homeXG = homeM.xG;
//     const awayXG = awayM.xG;
//     const homeShot = homeM.shotFactor;
//     const awayShot = awayM.shotFactor;
//     const homePrecDrop = homeM.precisionDrop;
//     const awayPrecDrop = awayM.precisionDrop;
//     const vol = volatility || 0;
//     // Si el equipo está excluido, penaliza su victoria
//     // const homeExcluded = excludedTeams.includes(home.teamName);
//     // const awayExcluded = excludedTeams.includes(away.teamName);

//     // 1. Eficiencia ofensiva (25%)
//     if (type === 'home') {
//         if (homeOff > 1.2) { score += 10; reasons.push(`Eficiencia ofensiva alta (${homeOff.toFixed(2)})`); }
//         else if (homeOff < 0.8) { score -= 10; reasons.push(`Baja eficiencia ofensiva (${homeOff.toFixed(2)})`); }

//         // if (homeExcluded) { score -= 15; reasons.push('Equipo en racha negativa'); }
//         // if (awayExcluded && type === 'home') { score += 5; reasons.push('El rival está en racha negativa'); }
//     }
//     else if (type === 'away') {
//         if (awayOff > 1.2) { score += 10; reasons.push(`Eficiencia ofensiva alta (${awayOff.toFixed(2)})`); }
//         else if (awayOff < 0.8) { score -= 10; reasons.push(`Baja eficiencia ofensiva (${awayOff.toFixed(2)})`); }

//         // if (awayExcluded) { score -= 15; reasons.push('Equipo en racha negativa'); }
//         // if (homeExcluded && type === 'away') { score += 5; reasons.push('El rival está en racha negativa'); }
//     }
//     else { // draw
//         // El empate es más probable cuando los equipos están equilibrados
//         const diff = Math.abs(homeOff - awayOff);
//         if (diff < 0.3) { score += 10; reasons.push('Equipos equilibrados'); }
//         if (homeXG > 1.0 && awayXG > 1.0) { score += 5; reasons.push('Ambos generan peligro'); }
//     }

//     // 2. xG (20%)
//     if (type === 'home' && homeXG > 1.2) { score += 8; reasons.push(`Buen xG (${homeXG.toFixed(2)})`); }
//     else if (type === 'home' && homeXG < 0.8) { score -= 8; reasons.push(`Bajo xG (${homeXG.toFixed(2)})`); }

//     if (type === 'away' && awayXG > 1.2) { score += 8; reasons.push(`Buen xG (${awayXG.toFixed(2)})`); }
//     else if (type === 'away' && awayXG < 0.8) { score -= 8; reasons.push(`Bajo xG (${awayXG.toFixed(2)})`); }

//     // 3. Precisión de tiro (15%)
//     if (type === 'home' && homeShot > 0.35) { score += 6; reasons.push(`Buena puntería (${homeShot.toFixed(2)})`); }
//     else if (type === 'home' && homeShot < 0.25) { score -= 6; reasons.push(`Mala puntería (${homeShot.toFixed(2)})`); }

//     if (type === 'away' && awayShot > 0.35) { score += 6; reasons.push(`Buena puntería (${awayShot.toFixed(2)})`); }
//     else if (type === 'away' && awayShot < 0.25) { score -= 6; reasons.push(`Mala puntería (${awayShot.toFixed(2)})`); }

//     // 4. Caída de precisión (10%)
//     if (type === 'home' && homePrecDrop < -0.05) { score -= 4; reasons.push('Caída de precisión'); }
//     if (type === 'away' && awayPrecDrop < -0.05) { score -= 4; reasons.push('Caída de precisión'); }

//     // 5. Volatilidad (15%)
//     if (vol > 0.3) {
//         score -= 6;
//         reasons.push(`Alta volatilidad (${vol.toFixed(2)})`);
//     }

//     // 6. Probabilidad del modelo (10%)
//     const { homeWin, draw, awayWin } = pred.moneyline;
//     if (type === 'home' && homeWin.prob > 50) { score += 4; }
//     else if (type === 'away' && awayWin.prob > 50) { score += 4; }
//     else if (type === 'draw' && draw.prob > 30) { score += 4; }

//     // Limitar puntuación
//     score = Math.max(0, Math.min(100, score));

//     // Determinar confianza
//     let confidence: 'alta' | 'media' | 'baja' = 'media';
//     if (score >= 70) confidence = 'alta';
//     else if (score >= 45) confidence = 'media';
//     else confidence = 'baja';

//     // Generar recomendaciones
//     const teamName = type === 'home' ? home.teamName : type === 'away' ? away.teamName : 'Empate';
//     const betOn = type === 'home' ? `${home.teamName} (victoria)` :
//         type === 'away' ? `${away.teamName} (victoria)` : 'Empate';
//     const avoid = type === 'home' ? `Victoria de ${away.teamName}` :
//         type === 'away' ? `Victoria de ${home.teamName}` : 'Victoria de alguno de los dos';

//     return {
//         market: 'Resultado',
//         selection: teamName,
//         score,
//         confidence,
//         reason: reasons.length > 0 ? reasons.join(' · ') : 'Sin señales destacadas',
//         recommendation: {
//             betOn,
//             avoid,
//         },
//         warning: vol > 0.3 ? '📊 Partido impredecible' : undefined,
//     };
// }

// // ============================================================
// // FUNCIÓN DE PUNTUACIÓN PARA OVER/UNDER
// // ============================================================

// function scoreOverUnder(
//     home: TeamInfo,
//     away: TeamInfo,
//     pred: ExtendedMatchPrediction,
//     volatility: number | undefined,
//     type: 'over' | 'under'
// ): ScoreResult {
//     const homeM = home.metrics!;
//     const awayM = away.metrics!;
//     let score = 50;
//     const reasons: string[] = [];

//     const homeXG = homeM.xG;
//     const awayXG = awayM.xG;
//     const homeEff = homeM.offensiveEfficiency;
//     const awayEff = awayM.offensiveEfficiency;
//     const homeShot = homeM.shotFactor;
//     const awayShot = awayM.shotFactor;
//     const homePrecDrop = homeM.precisionDrop;
//     const awayPrecDrop = awayM.precisionDrop;
//     const vol = volatility || 0;
//     const totalXG = homeXG + awayXG;

//     // 1. xG total (20%)
//     if (type === 'over' && totalXG >= 2.5) { score += 8; reasons.push(`Alto xG total (${totalXG.toFixed(2)})`); }
//     else if (type === 'under' && totalXG < 2.0) { score += 8; reasons.push(`Bajo xG total (${totalXG.toFixed(2)})`); }
//     else if (type === 'over' && totalXG < 1.8) { score -= 8; reasons.push(`Bajo xG total (${totalXG.toFixed(2)})`); }
//     else if (type === 'under' && totalXG > 2.5) { score -= 8; reasons.push(`Alto xG total (${totalXG.toFixed(2)})`); }

//     // 2. Eficiencia ofensiva (15%)
//     if (type === 'over') {
//         if (homeEff > 1.2) { score += 6; reasons.push(`Sobrerendimiento local (${homeEff.toFixed(2)})`); }
//         if (awayEff > 1.2) { score += 6; reasons.push(`Sobrerendimiento visitante (${awayEff.toFixed(2)})`); }
//         if (homeEff < 0.8) { score -= 6; reasons.push(`Bajorendimiento local (${homeEff.toFixed(2)})`); }
//         if (awayEff < 0.8) { score -= 6; reasons.push(`Bajorendimiento visitante (${awayEff.toFixed(2)})`); }
//     } else { // under
//         if (homeEff > 1.2) { score -= 6; reasons.push(`Sobrerendimiento local (${homeEff.toFixed(2)})`); }
//         if (awayEff > 1.2) { score -= 6; reasons.push(`Sobrerendimiento visitante (${awayEff.toFixed(2)})`); }
//         if (homeEff < 0.8) { score += 6; reasons.push(`Bajorendimiento local (${homeEff.toFixed(2)})`); }
//         if (awayEff < 0.8) { score += 6; reasons.push(`Bajorendimiento visitante (${awayEff.toFixed(2)})`); }
//     }

//     // 3. Precisión de tiro (15%)
//     const avgShot = (homeShot + awayShot) / 2;
//     if (type === 'over' && avgShot > 0.35) { score += 6; reasons.push(`Buena puntería promedio (${avgShot.toFixed(2)})`); }
//     else if (type === 'under' && avgShot < 0.30) { score += 6; reasons.push(`Mala puntería promedio (${avgShot.toFixed(2)})`); }

//     // 4. Caída de precisión (10%)
//     if (type === 'over') {
//         if (homePrecDrop < -0.05) { score -= 4; reasons.push('Caída de precisión local'); }
//         if (awayPrecDrop < -0.05) { score -= 4; reasons.push('Caída de precisión visitante'); }
//     } else {
//         if (homePrecDrop < -0.05) { score += 4; reasons.push('Caída de precisión local (menos goles)'); }
//         if (awayPrecDrop < -0.05) { score += 4; reasons.push('Caída de precisión visitante (menos goles)'); }
//     }

//     // 5. Volatilidad (10%)
//     if (vol > 0.3) {
//         score -= 4;
//         reasons.push(`Alta volatilidad (${vol.toFixed(2)})`);
//     }

//     // 6. Probabilidad del modelo (10%)
//     const goalLine25 = pred.goalLines?.find(gl => gl.line === 2.5);
//     if (goalLine25) {
//         if (type === 'over' && goalLine25.overProb > 50) { score += 4; }
//         else if (type === 'under' && goalLine25.underProb > 50) { score += 4; }
//     }

//     score = Math.max(0, Math.min(100, score));

//     let confidence: 'alta' | 'media' | 'baja' = 'media';
//     if (score >= 70) confidence = 'alta';
//     else if (score >= 45) confidence = 'media';
//     else confidence = 'baja';

//     const selection = type === 'over' ? 'Over 2.5' : 'Under 2.5';
//     const betOn = selection;
//     const avoid = type === 'over' ? 'Under 2.5' : 'Over 2.5';

//     return {
//         market: 'Total de goles',
//         selection,
//         score,
//         confidence,
//         reason: reasons.length > 0 ? reasons.join(' · ') : 'Sin señales destacadas',
//         recommendation: { betOn, avoid },
//         warning: vol > 0.3 ? '📊 Partido impredecible' : undefined,
//     };
// }

// // ============================================================
// // FUNCIÓN DE PUNTUACIÓN PARA BTTS
// // ============================================================

// function scoreBTTS(home: TeamInfo, away: TeamInfo, pred: ExtendedMatchPrediction, volatility: number | undefined, type: 'yes' | 'no'): ScoreResult {
//     const homeM = home.metrics!;
//     const awayM = away.metrics!;
//     let score = 50;
//     const reasons: string[] = [];

//     const homeXG = homeM.xG;
//     const awayXG = awayM.xG;
//     const homeEff = homeM.offensiveEfficiency;
//     const awayEff = awayM.offensiveEfficiency;
//     const homeShot = homeM.shotFactor;
//     const awayShot = awayM.shotFactor;
//     const homePrecDrop = homeM.precisionDrop;
//     const awayPrecDrop = awayM.precisionDrop;
//     const vol = volatility || 0;

//     // console.log({ homeXG, awayXG })
//     // 1. xG (30%)
//     if (type === 'yes') {
//         if (homeXG >= 1.3 && away.metrics?.xGA > 1.2) { score += 10; reasons.push(`Buen xG local (${homeXG.toFixed(2)})`); }
//         if (awayXG >= 1.3 && home.metrics?.xGA > 1.2) { score += 10; reasons.push(`Buen xG visitante (${awayXG.toFixed(2)})`); }
//         if (homeXG < 1 && away.metrics?.xGA < 1) { score -= 8; reasons.push(`Bajo xG local (${homeXG.toFixed(2)})`); }
//         if (awayXG < 1 && home.metrics?.xGA < 1) { score -= 8; reasons.push(`Bajo xG visitante (${awayXG.toFixed(2)})`); }
//     } else {
//         if (homeXG < 1) { score += 10; reasons.push(`Bajo xG local (${homeXG.toFixed(2)})`); }
//         if (awayXG < 1) { score += 10; reasons.push(`Bajo xG visitante (${awayXG.toFixed(2)})`); }
//         if (homeXG >= 1.5) { score -= 8; reasons.push(`Alto xG local (${homeXG.toFixed(2)})`); }
//         if (awayXG >= 1.5) { score -= 8; reasons.push(`Alto xG visitante (${awayXG.toFixed(2)})`); }
//     }

//     // 2. Eficiencia (20%)
//     if (type === 'yes') {
//         if (homeEff >= 1.3) { score += 5; reasons.push(`Buena eficiencia local (${homeEff.toFixed(2)})`); }
//         if (awayEff >= 1.3) { score += 5; reasons.push(`Buena eficiencia visitante (${awayEff.toFixed(2)})`); }
//         if (homeEff < 0.8) { score -= 5; reasons.push(`Mala eficiencia local (${homeEff.toFixed(2)})`); }
//         if (awayEff < 0.8) { score -= 5; reasons.push(`Mala eficiencia visitante (${awayEff.toFixed(2)})`); }
//     } else {
//         if (homeEff < 0.8) { score += 5; reasons.push(`Mala eficiencia local (${homeEff.toFixed(2)})`); }
//         if (awayEff < 0.8) { score += 5; reasons.push(`Mala eficiencia visitante (${awayEff.toFixed(2)})`); }
//         if (homeEff > 1.4) { score -= 5; reasons.push(`Alta eficiencia local (${homeEff.toFixed(2)})`); }
//         if (awayEff > 1.4) { score -= 5; reasons.push(`Alta eficiencia visitante (${awayEff.toFixed(2)})`); }
//     }

//     // 3. Precisión (15%)
//     if (type === 'yes') {
//         if (homeShot > 0.35) { score += 5; reasons.push(`Buena puntería local (${homeShot.toFixed(2)})`); }
//         if (awayShot > 0.35) { score += 5; reasons.push(`Buena puntería visitante (${awayShot.toFixed(2)})`); }
//     } else {
//         if (homeShot < 0.35) { score += 5; reasons.push(`Mala puntería local (${homeShot.toFixed(2)})`); }
//         if (awayShot < 0.35) { score += 5; reasons.push(`Mala puntería visitante (${awayShot.toFixed(2)})`); }
//     }

//     // 4. Caída de precisión (10%)
//     if (type === 'yes') {
//         if (homePrecDrop < -0.05) { score -= 5; reasons.push('Caída de precisión local'); }
//         if (awayPrecDrop < -0.05) { score -= 5; reasons.push('Caída de precisión visitante'); }
//     } else {
//         if (homePrecDrop < -0.05) { score += 5; reasons.push('Caída de precisión local (menos goles)'); }
//         if (awayPrecDrop < -0.05) { score += 5; reasons.push('Caída de precisión visitante (menos goles)'); }
//     }

//     // 5. Volatilidad (10%)
//     if (vol > 0.3) {
//         score -= 5;
//         reasons.push(`Alta volatilidad (${vol.toFixed(2)})`);
//     }

//     // 6. Probabilidad modelo (15%)
//     if (pred.btts) {
//         if (type === 'yes' && pred.btts.yes.prob > 65) { score += 5; }
//         else if (type === 'no' && pred.btts.no.prob > 65) { score += 5; }
//     }

//     score = Math.max(0, Math.min(100, score));

//     let confidence: 'alta' | 'media' | 'baja' = 'media';
//     if (score >= 75) confidence = 'alta';
//     else if (score >= 60) confidence = 'media';
//     else confidence = 'baja';

//     const selection = type === 'yes' ? 'Sí' : 'No';
//     const betOn = type === 'yes' ? 'BTTS Sí' : 'BTTS No';
//     const avoid = type === 'yes' ? 'BTTS No' : 'BTTS Sí';

//     return {
//         market: 'Ambos anotan',
//         selection,
//         score,
//         confidence,
//         reason: reasons.length > 0 ? reasons.join(' · ') : 'Sin señales destacadas',
//         recommendation: { betOn, avoid },
//         warning: vol > 0.3 ? '📊 Partido impredecible' : undefined,
//     };
// }

// // ============================================================
// // FUNCIÓN DE PUNTUACIÓN PARA CORNERS
// // ============================================================

// function scoreCorners(home: TeamInfo, away: TeamInfo, pred: ExtendedMatchPrediction, volatility: number | undefined): ScoreResult | null {
//     const homeM = home.metrics!;
//     const awayM = away.metrics!;

//     // Necesitamos el total esperado de corners
//     const expectedCorners = pred.corners?.expectedTotal;
//     if (!expectedCorners || !pred.corners?.lines?.length) return null;

//     let score = 50;
//     const reasons: string[] = [];

//     const homeCorners = homeM.corners;
//     const awayCorners = awayM.corners;
//     const totalAvg = (homeCorners + awayCorners) / 2;

//     // Buscar la línea más cercana al esperado
//     let closestLine = pred.corners.lines[0];
//     let minDiff = Math.abs(closestLine.line - expectedCorners);
//     for (const cl of pred.corners.lines) {
//         const diff = Math.abs(cl.line - expectedCorners);
//         if (diff < minDiff) {
//             minDiff = diff;
//             closestLine = cl;
//         }
//     }

//     const isOver = closestLine.overProb > closestLine.underProb;
//     const line = closestLine.line;

//     // Decidir si over o under basado en la probabilidad
//     if (isOver) {
//         score += 10;
//         reasons.push(`Probabilidad > 50% de Over ${line}`);
//     } else {
//         score += 10;
//         reasons.push(`Probabilidad > 50% de Under ${line}`);
//     }

//     // Ajustar por la diferencia entre esperado y línea
//     const diff = expectedCorners - line;
//     if (isOver && diff > 0.5) { score += 5; reasons.push('Línea por debajo del esperado'); }
//     else if (!isOver && diff < -0.5) { score += 5; reasons.push('Línea por encima del esperado'); }

//     // Volatilidad
//     const vol = volatility || 0;
//     if (vol > 0.3) { score -= 5; reasons.push(`Alta volatilidad (${vol.toFixed(2)})`); }

//     score = Math.max(0, Math.min(100, score));

//     let confidence: 'alta' | 'media' | 'baja' = 'media';
//     if (score >= 70) confidence = 'alta';
//     else if (score >= 45) confidence = 'media';
//     else confidence = 'baja';

//     const selection = isOver ? `Over ${line}` : `Under ${line}`;
//     const betOn = selection;
//     const avoid = isOver ? `Under ${line}` : `Over ${line}`;

//     return {
//         market: 'Córners',
//         selection,
//         score,
//         confidence,
//         reason: reasons.length > 0 ? reasons.join(' · ') : 'Sin señales destacadas',
//         recommendation: { betOn, avoid },
//         warning: vol > 0.3 ? '📊 Partido impredecible' : undefined,
//     };
// }

// utils/scoringEngine.ts
import { ScoreResult } from '@/types/engineTypes';
import { TeamInfo } from '@/types';
import { ExtendedMatchPrediction } from '@/lib/predictions';
import { calculateDefensiveEfficiency, getConfidenceLevel, normalize } from './engines';
export interface ScoreEngineContext {
    home: TeamInfo;
    away: TeamInfo;
    pred: ExtendedMatchPrediction;
    volatility?: number;
}

export function scoreEngine(context: ScoreEngineContext): ScoreResult[] {
    const { home, away, pred, volatility } = context;
    const homeM = home.metrics!;
    const awayM = away.metrics!;
    const vol = volatility || 0;
    const results: ScoreResult[] = [];

    // ---- 1. Resultado (Moneyline) ----
    results.push(buildScoreResult(
        'Resultado',
        home.teamName,
        pred.moneyline.homeWin.prob / 100,
        homeM, awayM, vol, 'home',
        `${home.teamName} (victoria)`,
        `Victoria de ${away.teamName}`
    ));
    results.push(buildScoreResult(
        'Resultado',
        'Empate',
        pred.moneyline.draw.prob / 100,
        homeM, awayM, vol, 'draw',
        'Empate',
        'Victoria de alguno de los dos'
    ));
    results.push(buildScoreResult(
        'Resultado',
        away.teamName,
        pred.moneyline.awayWin.prob / 100,
        homeM, awayM, vol, 'away',
        `${away.teamName} (victoria)`,
        `Victoria de ${home.teamName}`
    ));

    // ---- 2. BTTS ----
    results.push(buildScoreResult(
        'BTTS',
        'Sí',
        pred.btts.yes.prob / 100,
        homeM, awayM, vol, 'btts_yes',
        'BTTS Sí',
        'BTTS No'
    ));
    results.push(buildScoreResult(
        'BTTS',
        'No',
        pred.btts.no.prob / 100,
        homeM, awayM, vol, 'btts_no',
        'BTTS No',
        'BTTS Sí'
    ));

    // ---- 3. Total de goles (todas las líneas) ----
    for (const gl of pred.goalLines) {
        const overScore = buildScoreResult(
            `Total de goles (${gl.line})`,
            `Over ${gl.line}`,
            gl.overProb / 100,
            homeM, awayM, vol, 'over',
            `Over ${gl.line}`,
            `Under ${gl.line}`
        );
        results.push(overScore);
        const underScore = buildScoreResult(
            `Total de goles (${gl.line})`,
            `Under ${gl.line}`,
            gl.underProb / 100,
            homeM, awayM, vol, 'under',
            `Under ${gl.line}`,
            `Over ${gl.line}`
        );
        results.push(underScore);
    }

    // ---- 4. Corners (solo la línea más cercana) ----
    if (pred.corners?.lines?.length) {
        const cl = pred.corners.lines[0]; // ya viene ordenado por cercanía
        const overScore = buildScoreResult(
            'Córners',
            `Over ${cl.line}`,
            cl.overProb / 100,
            homeM, awayM, vol, 'corners',
            `Over ${cl.line}`,
            `Under ${cl.line}`
        );
        results.push(overScore);
        const underScore = buildScoreResult(
            'Córners',
            `Under ${cl.line}`,
            cl.underProb / 100,
            homeM, awayM, vol, 'corners',
            `Under ${cl.line}`,
            `Over ${cl.line}`
        );
        results.push(underScore);
    }

    // ---- 5. Doble oportunidad ----
    results.push(buildScoreResult(
        'Doble oportunidad',
        'Local o Empate (1X)',
        pred.doubleChance.homeOrDraw.prob / 100,
        homeM, awayM, vol, '1X',
        'Local o Empate',
        'Victoria visitante'
    ));
    results.push(buildScoreResult(
        'Doble oportunidad',
        'Empate o Visitante (X2)',
        pred.doubleChance.drawOrAway.prob / 100,
        homeM, awayM, vol, 'X2',
        'Empate o Visitante',
        'Victoria local'
    ));
    results.push(buildScoreResult(
        'Doble oportunidad',
        'Local o Visitante (12)',
        pred.doubleChance.noDraw.prob / 100,
        homeM, awayM, vol, '12',
        'Local o Visitante',
        'Empate'
    ));

    // ---- 6. Draw No Bet ----
    results.push(buildScoreResult(
        'Draw No Bet',
        home.teamName,
        pred.drawNoBet.home.prob / 100,
        homeM, awayM, vol, 'dnb_home',
        `${home.teamName} (DNB)`,
        `${away.teamName} (DNB)`
    ));
    results.push(buildScoreResult(
        'Draw No Bet',
        away.teamName,
        pred.drawNoBet.away.prob / 100,
        homeM, awayM, vol, 'dnb_away',
        `${away.teamName} (DNB)`,
        `${home.teamName} (DNB)`
    ));

    // ---- 7. Team Goals ----
    for (const tg of pred.teamGoals.home) {
        results.push(buildScoreResult(
            `Goles del local (${tg.line})`,
            `Over ${tg.line}`,
            tg.overProb / 100,
            homeM, awayM, vol, 'team_goals_home',
            `Over ${tg.line} goles local`,
            `Under ${tg.line} goles local`
        ));
    }
    for (const tg of pred.teamGoals.away) {
        results.push(buildScoreResult(
            `Goles del visitante (${tg.line})`,
            `Over ${tg.line}`,
            tg.overProb / 100,
            homeM, awayM, vol, 'team_goals_away',
            `Over ${tg.line} goles visitante`,
            `Under ${tg.line} goles visitante`
        ));
    }

    // ---- 8. Win to Nil ----
    results.push(buildScoreResult(
        'Win to Nil',
        home.teamName,
        pred.winToNil.home.prob / 100,
        homeM, awayM, vol, 'win_to_nil_home',
        `${home.teamName} gana sin encajar`,
        `Cualquier otro resultado`
    ));
    results.push(buildScoreResult(
        'Win to Nil',
        away.teamName,
        pred.winToNil.away.prob / 100,
        homeM, awayM, vol, 'win_to_nil_away',
        `${away.teamName} gana sin encajar`,
        `Cualquier otro resultado`
    ));

    // ---- 9. Clean Sheet ----
    results.push(buildScoreResult(
        'Clean Sheet',
        home.teamName,
        pred.cleanSheet.home.prob / 100,
        homeM, awayM, vol, 'clean_sheet_home',
        `${home.teamName} no encaja`,
        `${home.teamName} encaja`
    ));
    results.push(buildScoreResult(
        'Clean Sheet',
        away.teamName,
        pred.cleanSheet.away.prob / 100,
        homeM, awayM, vol, 'clean_sheet_away',
        `${away.teamName} no encaja`,
        `${away.teamName} encaja`
    ));

    // ---- 10. Resultado + BTTS (opcional, para más profundidad) ----
    // Puedes añadir aquí picks de resultBTTS si lo deseas, pero ya tienes suficientes.

    // Ordenar por puntuación descendente
    results.sort((a, b) => b.score - a.score);
    return results;
}

// -------- Función auxiliar para construir un ScoreResult --------
// engines/scoreEngine.ts

function buildScoreResult(
    market: string,
    selection: string,
    baseProb: number,        // entre 0 y 1
    homeM: any,
    awayM: any,
    vol: number,
    type: string,
    betOn: string,
    avoid: string,
    pred?: ExtendedMatchPrediction // opcional, para acceder a más datos
): ScoreResult {
    let score = 50 + (baseProb - 0.5) * 50;
    const reasons: string[] = [];

    // ---- 1. Contexto general del partido ----
    const totalXG = homeM.xG + awayM.xG;
    const avgShot = (homeM.shotFactor + awayM.shotFactor) / 2;
    const homeEff = homeM.offensiveEfficiency;
    const awayEff = awayM.offensiveEfficiency;

    // ---- 2. Razones específicas por tipo de mercado ----
    switch (type) {
        case 'home':
        case 'away':
        case 'draw': {
            const team = type === 'home' ? homeM : type === 'away' ? awayM : null;
            const rival = type === 'home' ? awayM : type === 'away' ? homeM : null;
            if (team) {
                if (team.xG > 1.2) reasons.push(`Genera mucho peligro (${team.xG.toFixed(2)} xG)`);
                else if (team.xG < 0.8) reasons.push(`Genera poco peligro (${team.xG.toFixed(2)} xG)`);
                if (team.offensiveEfficiency > 1.2) reasons.push(`Aprovecha bien sus ocasiones (${team.offensiveEfficiency.toFixed(2)})`);
                else if (team.offensiveEfficiency < 0.8) reasons.push(`Desaprovecha sus ocasiones (${team.offensiveEfficiency.toFixed(2)})`);
            }
            if (rival) {
                if (rival.xGA > 1.2) reasons.push(`Rival concede muchas ocasiones (${rival.xGA.toFixed(2)} xGA)`);
                else if (rival.xGA < 0.8) reasons.push(`Rival defiende bien (${rival.xGA.toFixed(2)} xGA)`);
            }
            if (type === 'draw') {
                const diff = Math.abs(homeEff - awayEff);
                if (diff < 0.2) reasons.push('Equipos muy equilibrados');
                if (homeM.xG > 1.0 && awayM.xG > 1.0) reasons.push('Ambos pueden marcar, partido abierto');
            }
            break;
        }

        case 'over':
        case 'under': {
            const line = parseFloat(market.match(/\((\d+\.?\d*)\)/)?.[1] || '2.5');
            if (totalXG > line + 0.5) reasons.push(`Mucho potencial ofensivo (${totalXG.toFixed(2)} xG total)`);
            else if (totalXG < line - 0.5) reasons.push(`Poco potencial ofensivo (${totalXG.toFixed(2)} xG total)`);
            if (homeEff > 1.2 && awayEff > 1.2) reasons.push('Ambos equipos muy efectivos');
            else if (homeEff < 0.8 && awayEff < 0.8) reasons.push('Ambos equipos poco efectivos');
            if (avgShot > 0.35) reasons.push(`Buena puntería combinada (${avgShot.toFixed(2)})`);
            else if (avgShot < 0.25) reasons.push(`Mala puntería combinada (${avgShot.toFixed(2)})`);
            break;
        }

        case 'btts_yes':
        case 'btts_no': {
            if (homeM.xG > 1.0 && awayM.xG > 1.0) reasons.push('Ambos equipos generan peligro');
            else if (homeM.xG < 0.8 && awayM.xG < 0.8) reasons.push('Ambos equipos generan poco peligro');
            if (homeM.offensiveEfficiency > 1.2 || awayM.offensiveEfficiency > 1.2) reasons.push('Algún equipo está muy efectivo');
            break;
        }

        case 'corners': {
            const expectedCorners = pred?.corners?.expectedTotal || (homeM.corners + awayM.corners) / 2;
            const line = parseFloat(selection.match(/Over (\d+\.?\d*)/)?.[1] || '9.5');
            if (expectedCorners > line + 0.5) reasons.push(`Se esperan muchos corners (${expectedCorners.toFixed(2)})`);
            else if (expectedCorners < line - 0.5) reasons.push(`Se esperan pocos corners (${expectedCorners.toFixed(2)})`);
            break;
        }

        case '1X':
        case 'X2':
        case '12': {
            const homeProb = pred?.moneyline?.homeWin?.prob || 0;
            const drawProb = pred?.moneyline?.draw?.prob || 0;
            const awayProb = pred?.moneyline?.awayWin?.prob || 0;
            if (type === '1X' && homeProb > 40 && drawProb > 20) reasons.push('Local o empate muy probable');
            if (type === 'X2' && awayProb > 40 && drawProb > 20) reasons.push('Visitante o empate muy probable');
            if (type === '12' && homeProb > 40 && awayProb > 20) reasons.push('Partido con pocos empates en el historial');
            break;
        }

        case 'dnb_home':
        case 'dnb_away': {
            const team = type === 'dnb_home' ? homeM : awayM;
            const rival = type === 'dnb_home' ? awayM : homeM;
            if (team.xG > rival.xGA + 0.3) reasons.push(`Ventaja ofensiva clara (${team.xG.toFixed(2)} vs ${rival.xGA.toFixed(2)})`);
            else if (team.xG < rival.xGA - 0.3) reasons.push(`Desventaja ofensiva (${team.xG.toFixed(2)} vs ${rival.xGA.toFixed(2)})`);
            break;
        }

        case 'team_goals_home':
        case 'team_goals_away': {
            const team = type === 'team_goals_home' ? homeM : awayM;
            const line = parseFloat(selection.match(/Over (\d+\.?\d*)/)?.[1] || '0.5');
            if (team.xG > line + 0.5) reasons.push(`El equipo tiene buen xG (${team.xG.toFixed(2)}) para marcar ${line} goles`);
            else if (team.xG < line - 0.3) reasons.push(`El equipo tiene bajo xG (${team.xG.toFixed(2)}) para marcar ${line} goles`);
            break;
        }

        case 'win_to_nil_home':
        case 'win_to_nil_away': {
            const team = type === 'win_to_nil_home' ? homeM : awayM;
            const rival = type === 'win_to_nil_home' ? awayM : homeM;
            if (team.xG > 1.2 && rival.xGA < 0.8) reasons.push(`El equipo es ofensivo y el rival concede poco, pero puede ganar sin encajar`);
            break;
        }

        case 'clean_sheet_home':
        case 'clean_sheet_away': {
            const rival = type === 'clean_sheet_home' ? awayM : homeM;
            if (rival.xG < 0.8) reasons.push(`El rival genera muy poco peligro (${rival.xG.toFixed(2)} xG)`);
            else if (rival.xG > 1.2) reasons.push(`El rival genera mucho peligro (${rival.xG.toFixed(2)} xG)`);
            break;
        }

        default:
            break;
    }

    // ---- 3. Ajustes comunes ----
    if (vol > 0.3) {
        score -= 6;
        reasons.push('Alta volatilidad (partido impredecible)');
    }

    // ---- 4. Construir el string final ----
    const reasonText = reasons.length > 0
        ? reasons.join(' · ')
        : `Probabilidad base: ${(baseProb * 100).toFixed(1)}%`;

    // ---- 5. Score final ----
    score = Math.max(0, Math.min(100, score));
    const odd = baseProb > 0 ? +(1 / baseProb).toFixed(2) : 0;

    return {
        market,
        selection,
        score,
        confidence: getConfidenceLevel(score),
        reason: reasonText,
        recommendation: { betOn, avoid },
        warning: vol > 0.3 ? '📊 Partido impredecible' : undefined,
        odd,
    };
}