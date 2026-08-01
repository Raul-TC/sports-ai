// lib/engines/trapEngine.ts
import { TrapResult, TrapDetail } from '@/types/engineTypes';
import { TeamInfo } from '@/types';
import { ExtendedMatchPrediction } from '@/lib/predictions';
// Diccionario de explicaciones según el tipo de señal
const EXPLANATIONS: Record<string, (value: string, team?: string) => string> = {
    'Sobrerendimiento ofensivo': (value, team) => {
        const percentage = ((parseFloat(value) - 1) * 100).toFixed(0);
        return `${team || 'El equipo'} está marcando un ${percentage}% más de goles de lo esperado según las ocasiones que genera. Esto es insostenible: es probable que su efectividad baje y marque menos goles en los próximos partidos. Si quieres apostar, considera Under en goles del equipo o en contra de su victoria.`;
    },
    'Bajorendimiento ofensivo': (value, team) => {
        const percentage = ((1 - parseFloat(value)) * 100).toFixed(0);
        return `${team || 'El equipo'} está marcando un ${percentage}% menos de goles de lo esperado. Es probable que mejore su puntería y comience a marcar más. Esta puede ser una buena oportunidad para apostar a su favor o a Over en goles del equipo.`;
    },
    'Caída de precisión': (value, team) => {
        const drop = (parseFloat(value) * 100).toFixed(1);
        return `${team || 'El equipo'} ha perdido ${drop}% de precisión en sus tiros en los últimos partidos. Esto indica que están disparando peor; es probable que marquen menos goles. Considera apostar a que no marquen o a Under en goles del equipo.`;
    },
    'Alta volatilidad': (value, team) => {
        return `El partido tiene una volatilidad de ${value}, lo que significa que ambos equipos son muy irregulares. Los resultados son impredecibles, las cuotas pueden no reflejar el riesgo real. Mejor reducir el tamaño de la apuesta o buscar mercados alternativos como el empate o el Under.`;
    },
    'Discrepancia xG': (value, team) => {
        const diff = parseFloat(value);
        return `${team || 'El equipo'} tiene una diferencia de ${diff.toFixed(2)} goles entre su xG real y el esperado. Esto indica incertidumbre en el modelo: el rendimiento real no coincide con lo esperado. Mejor evitar apostar fuerte en este equipo.`;
    },
    'Marcador exacto muy repartido': () => {
        return 'Las probabilidades de los marcadores exactos están muy distribuidas, ningún resultado destaca claramente. Esto hace que el partido sea impredecible. Evita apostar a correct score o a favoritos muy claros.';
    },
    'No existe marcador dominante': () => {
        return 'Los dos marcadores más probables tienen una probabilidad muy similar. No hay un resultado claro, lo que aumenta la incertidumbre. Considera apostar a doble oportunidad o al empate.';
    },
    'Favorito vulnerable al empate': () => {
        return 'El equipo favorito tiene una probabilidad alta de ganar, pero el empate también es significativo. El favorito podría no ganar; apostar a su victoria es arriesgado. Mejor apostar a doble oportunidad (local o empate) o a que el underdog no pierde.';
    },
    'Partido con pocos goles esperados': () => {
        return 'La suma de goles esperados (xG) es baja, inferior a 2.0. Se espera un partido con pocos goles. Apostar a Under 2.5 tiene valor, y también puede ser buena opción apostar a que no marquen ambos equipos (BTTS No).';
    },
    'Favorito pero ambos pueden marcar': () => {
        return 'El favorito tiene alta probabilidad de ganar, pero también hay alta probabilidad de que ambos equipos marquen. Esto sugiere que el partido puede ser más abierto de lo esperado. Considera apostar a BTTS Sí o a Over 2.5.';
    },
    'Dominio estadístico no reflejado': (value, team) => {
        const diff = parseFloat(value);
        return `El equipo ${team || 'favorito'} tiene una clara ventaja estadística (${diff.toFixed(2)} goles esperados de diferencia), pero la probabilidad de victoria no es tan alta. Esto puede deberse a factores no capturados, como lesiones o motivación. Podría haber valor en apostar a su victoria si la cuota es alta.`;
    },
};

// Función para generar la explicación a partir del detalle
function getExplanation(detail: { team: string; reason: string; value?: string }): string {
    const key = Object.keys(EXPLANATIONS).find(k => detail.reason.includes(k));
    if (key) {
        const value = detail.reason.match(/\d+\.\d+/)?.[0] || '';
        return EXPLANATIONS[key](value, detail.team);
    }
    // Si no hay explicación específica, devolver la razón tal cual
    return detail.reason;
}

export function trapEngine(home: TeamInfo, away: TeamInfo, pred: ExtendedMatchPrediction, volatility?: number): TrapResult {
    const homeM = home.metrics;
    const awayM = away.metrics;
    if (!homeM || !awayM) {
        return { isTrap: false, level: 'none', details: [] };
    }

    const details: TrapDetail[] = [];
    let trapScore = 0;
    const vol = volatility || 0;

    // ---- 1. Usar tu trapAnalysis ----
    if (pred.trapAnalysis) {
        const ta = pred.trapAnalysis;
        for (const reason of ta.reasons) {
            const detail: TrapDetail = {
                team: 'ambos',
                reason,
                explanation: getExplanation({ team: 'ambos', reason }),
                severity: ta.level === 'DANGER' ? 'high' : ta.level === 'CAUTION' ? 'medium' : 'low',
            };
            details.push(detail);
            if (ta.level === 'DANGER') trapScore += 2;
            else if (ta.level === 'CAUTION') trapScore += 1;
        }
    }

    // ---- 2. Métricas de equipos ----
    // Alta volatilidad
    if (vol > 0.3) {
        const reason = `Alta volatilidad (${vol.toFixed(2)})`;
        details.push({
            team: 'ambos',
            reason,
            explanation: EXPLANATIONS['Alta volatilidad'](vol.toFixed(2), ''),
            severity: vol > 0.5 ? 'high' : 'medium',
        });
        trapScore += 1;
    }

    // Sobrerendimiento ofensivo
    if (homeM.offensiveEfficiency > 1.5) {
        const reason = `Sobrerendimiento ofensivo (${homeM.offensiveEfficiency.toFixed(2)})`;
        details.push({
            team: home.teamName,
            reason,
            explanation: EXPLANATIONS['Sobrerendimiento ofensivo'](homeM.offensiveEfficiency.toFixed(2), home.teamName),
            severity: homeM.offensiveEfficiency > 1.8 ? 'high' : 'medium',
        });
        trapScore += 1;
    }
    if (awayM.offensiveEfficiency > 1.5) {
        const reason = `Sobrerendimiento ofensivo (${awayM.offensiveEfficiency.toFixed(2)})`;
        details.push({
            team: away.teamName,
            reason,
            explanation: EXPLANATIONS['Sobrerendimiento ofensivo'](awayM.offensiveEfficiency.toFixed(2), away.teamName),
            severity: awayM.offensiveEfficiency > 1.8 ? 'high' : 'medium',
        });
        trapScore += 1;
    }

    // Bajorendimiento ofensivo
    if (homeM.offensiveEfficiency < 0.65) {
        const reason = `Bajorendimiento ofensivo (${homeM.offensiveEfficiency.toFixed(2)})`;
        details.push({
            team: home.teamName,
            reason,
            explanation: EXPLANATIONS['Bajorendimiento ofensivo'](homeM.offensiveEfficiency.toFixed(2), home.teamName),
            severity: homeM.offensiveEfficiency < 0.3 ? 'high' : 'medium',
        });
        trapScore += 1;
    }
    if (awayM.offensiveEfficiency < 0.65) {
        const reason = `Bajorendimiento ofensivo (${awayM.offensiveEfficiency.toFixed(2)})`;
        details.push({
            team: away.teamName,
            reason,
            explanation: EXPLANATIONS['Bajorendimiento ofensivo'](awayM.offensiveEfficiency.toFixed(2), away.teamName),
            severity: awayM.offensiveEfficiency < 0.3 ? 'high' : 'medium',
        });
        trapScore += 1;
    }

    // Caída de precisión
    if (homeM.precisionDrop < -0.05) {
        const reason = `Caída de precisión (${homeM.precisionDrop.toFixed(3)})`;
        details.push({
            team: home.teamName,
            reason,
            explanation: EXPLANATIONS['Caída de precisión'](homeM.precisionDrop.toFixed(3), home.teamName),
            severity: homeM.precisionDrop < -0.1 ? 'high' : 'low',
        });
        trapScore += 1;
    }
    if (awayM.precisionDrop < -0.05) {
        const reason = `Caída de precisión (${awayM.precisionDrop.toFixed(3)})`;
        details.push({
            team: away.teamName,
            reason,
            explanation: EXPLANATIONS['Caída de precisión'](awayM.precisionDrop.toFixed(3), away.teamName),
            severity: awayM.precisionDrop < -0.1 ? 'high' : 'low',
        });
        trapScore += 1;
    }

    // Discrepancia xG
    const homeDiff = Math.abs(homeM.xG - homeM.expectedGoals);
    const awayDiff = Math.abs(awayM.xG - awayM.expectedGoals);
    if (homeDiff > 0.3) {
        const reason = `Discrepancia xG (${homeDiff.toFixed(2)})`;
        details.push({
            team: home.teamName,
            reason,
            explanation: EXPLANATIONS['Discrepancia xG'](homeDiff.toFixed(2), home.teamName),
            severity: homeDiff > 0.6 ? 'high' : 'low',
        });
        trapScore += 1;
    }
    if (awayDiff > 0.3) {
        const reason = `Discrepancia xG (${awayDiff.toFixed(2)})`;
        details.push({
            team: away.teamName,
            reason,
            explanation: EXPLANATIONS['Discrepancia xG'](awayDiff.toFixed(2), away.teamName),
            severity: awayDiff > 0.6 ? 'high' : 'low',
        });
        trapScore += 1;
    }

    let level: 'low' | 'medium' | 'high' | 'none' = 'none';
    if (trapScore >= 4) level = 'high';
    else if (trapScore >= 2) level = 'medium';
    else if (trapScore >= 1) level = 'low';

    return {
        isTrap: trapScore > 0,
        level,
        details,
    };
}