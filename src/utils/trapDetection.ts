import { PredictionResult, TrapResult, TrapDetail } from "@/types";

export function isMatchTrap(prediction: PredictionResult): TrapResult {
    const { home, away, prediction: pred, volatility } = prediction;
    const homeM = home.metrics;
    const awayM = away.metrics;

    if (!homeM || !awayM) {
        return { isTrap: false, level: "none", details: [] };
    }

    const details: TrapDetail[] = [];
    let trapScore = 0;

    const vol = volatility || 0;
    if (vol > 0.3) {
        trapScore += 1;
        details.push({
            team: "ambos",
            reason: `Alta volatilidad (${vol.toFixed(2)})`,
        });
    }

    if (homeM.offensiveEfficiency > 1.5 || homeM.offensiveEfficiency < 0.5) {
        trapScore += 1;
        details.push({
            team: home.teamName,
            reason: `Eficiencia ofensiva extrema (${homeM.offensiveEfficiency.toFixed(2)})`,
        });
    }
    if (awayM.offensiveEfficiency > 1.5 || awayM.offensiveEfficiency < 0.5) {
        trapScore += 1;
        details.push({
            team: away.teamName,
            reason: `Eficiencia ofensiva extrema (${awayM.offensiveEfficiency.toFixed(2)})`,
        });
    }

    if (homeM.precisionDrop < -0.05) {
        trapScore += 1;
        details.push({
            team: home.teamName,
            reason: `Caída de precisión (${homeM.precisionDrop.toFixed(3)})`,
        });
    }
    if (awayM.precisionDrop < -0.05) {
        trapScore += 1;
        details.push({
            team: away.teamName,
            reason: `Caída de precisión (${awayM.precisionDrop.toFixed(3)})`,
        });
    }

    const homeDiff = Math.abs(homeM.xG - homeM.expectedGoals);
    const awayDiff = Math.abs(awayM.xG - awayM.expectedGoals);
    if (homeDiff > 0.3) {
        trapScore += 1;
        details.push({
            team: home.teamName,
            reason: `Discrepancia xG vs esperado (${homeDiff.toFixed(2)})`,
        });
    }
    if (awayDiff > 0.3) {
        trapScore += 1;
        details.push({
            team: away.teamName,
            reason: `Discrepancia xG vs esperado (${awayDiff.toFixed(2)})`,
        });
    }

    let level: "low" | "medium" | "high" | "none" = "none";
    if (trapScore >= 4) level = "high";
    else if (trapScore >= 2) level = "medium";
    else if (trapScore >= 1) level = "low";

    return {
        isTrap: trapScore > 0,
        level,
        details,
    };
}