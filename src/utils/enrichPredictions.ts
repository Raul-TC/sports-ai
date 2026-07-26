// utils/enrichPredictions.ts
import { PredictionResult } from "@/types";
import { extractMatchResult, MatchResult } from "./extractMatchResult";
import { ExtendedMatchPrediction } from "@/lib/predictions";

export interface EnrichedPrediction extends PredictionResult {
    result?: MatchResult;
    accuracy?: {
        winnerCorrect: boolean;
        overUnderCorrect: boolean;
        bttsCorrect: boolean;
        cornersError: number;
        homeXGError: number;
        awayXGError: number;
        overallAccuracy: number; // % de aciertos en mercados clave
    };
}

export function enrichPredictions(
    predictions: PredictionResult[],
    resultsData: any[] // array de objetos con matchUrl y stats
): EnrichedPrediction[] {
    // Crear un mapa de matchUrl -> MatchResult
    const resultsMap = new Map<string, MatchResult>();
    for (const item of resultsData) {
        const result = extractMatchResult(item.stats);
        if (result) {
            resultsMap.set(item.matchUrl, result);
        }
    }

    return predictions.map((pred) => {
        const result = resultsMap.get(pred.matchUrl);
        if (!result) {
            return { ...pred, result: undefined };
        }

        // Calcular precisión
        const predData = pred.prediction;

        // Ganador
        const predWinner = getPredictedWinner(predData);
        const winnerCorrect = predWinner === result.winner;

        // Over/Under 2.5
        const actualOver25 = result.homeScore + result.awayScore > 2.5;
        const predOver25 = predData.goalLines[1].overProb || false;
        const overUnderCorrect = predOver25 === actualOver25;

        // BTTS
        const actualBTTS = result.homeScore > 0 && result.awayScore > 0;
        const predBTTS = predData.btts.yes.prob > 0.5;
        const bttsCorrect = predBTTS === actualBTTS;

        // Errores
        const homeXGError = Math.abs((predData.homeExpectedGoals || 0) - result.homeXG);
        const awayXGError = Math.abs((predData.awayExpectedGoals || 0) - result.awayXG);
        const totalCorners = result.homeCorners + result.awayCorners;
        const predCorners = predData.corners?.expectedTotal || 0;
        const cornersError = Math.abs(totalCorners - predCorners);

        // Precisión general (promedio de 3 mercados)
        const correctMarkets = [winnerCorrect, overUnderCorrect, bttsCorrect].filter(Boolean).length;
        const overallAccuracy = (correctMarkets / 3) * 100;

        return {
            ...pred,
            result,
            accuracy: {
                winnerCorrect,
                overUnderCorrect,
                bttsCorrect,
                cornersError,
                homeXGError,
                awayXGError,
                overallAccuracy,
            },
        };
    });
}

function getPredictedWinner(pred: ExtendedMatchPrediction): 'home' | 'away' | 'draw' {
    const { homeWin, draw, awayWin } = pred.moneyline;
    if (homeWin.prob > draw.prob && homeWin.prob > awayWin.prob) return 'home';
    if (awayWin.prob > homeWin.prob && awayWin.prob > draw.prob) return 'away';
    return 'draw';
}