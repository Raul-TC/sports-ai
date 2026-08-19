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
    data?: Welcome[]
}

export function enrichPredictions(predictions: PredictionResult[], resultsData: any[]): EnrichedPrediction[] {
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

export interface Welcome {
    lastUpdateId: number;
    requestedUpdateId: number;
    ttl: number;
    paging: Paging;
    summary: Summary;
    competitionFilters: Competition[];
    sports: Sport[];
    countries: Country[];
    competitions: Competition[];
    competitors: Competitor[];
    games: Game[];
}

export interface Competition {
    id: number;
    countryId: number;
    sportId: number;
    name: string;
    hasBrackets: boolean;
    nameForURL: string;
    popularityRank: number;
    imageVersion: number;
    currentStageType: number;
    color?: string;
    competitorsType: number;
    currentPhaseNum: number;
    currentPhaseName?: string;
    currentSeasonNum: number;
    currentStageNum: number;
    hideOnCatalog: boolean;
    hideOnSearch: boolean;
    isInternational: boolean;
    hasStandings?: boolean;
    hasLiveStandings?: boolean;
    hasStandingsGroups?: boolean;
    totalGames?: number;
    liveGames?: number;
    hasActiveGames?: boolean;
}

export interface Competitor {
    id: number;
    countryId: number;
    sportId: number;
    name: string;
    symbolicName: string;
    nameForURL: string;
    type: number;
    popularityRank: number;
    imageVersion: number;
    color: string;
    awayColor?: string;
    mainCompetitionId: number;
    hasSquad: boolean;
    hasTransfers: boolean;
    competitorNum: number;
    hideOnSearch: boolean;
    hideOnCatalog: boolean;
    shortName?: string;
    longName?: string;
    score?: number;
    isQualified?: boolean;
    toQualify?: boolean;
    isWinner?: boolean;
    redCards?: number;
}

export interface Country {
    id: number;
    name: string;
    totalGames: number;
    liveGames: number;
    nameForURL: string;
    imageVersion: number;
    isInternational?: boolean;
}

export interface Game {
    id: number;
    sportId: number;
    competitionId: number;
    seasonNum?: number;
    stageNum?: number;
    groupNum?: number;
    roundNum?: number;
    roundName: RoundName;
    stageName?: string;
    competitionDisplayName: string;
    startTime: Date;
    statusGroup: number;
    statusText: StatusText;
    shortStatusText: ShortStatusText;
    gameTimeAndStatusDisplayType: number;
    justEnded: boolean;
    gameTime: number;
    gameTimeDisplay: string;
    hasLineups?: boolean;
    hasMissingPlayers?: boolean;
    hasFieldPositions?: boolean;
    lineupsStatus?: number;
    lineupsStatusText?: LineupsStatusText;
    hasTVNetworks: boolean;
    winDescription: string;
    homeCompetitor: Competitor;
    awayCompetitor: Competitor;
    isHomeAwayInverted: boolean;
    hasStats: boolean;
    hasStandings: boolean;
    standingsName?: StandingsName;
    hasBrackets: boolean;
    hasPreviousMeetings: boolean;
    hasRecentMatches: boolean;
    hasBets?: boolean;
    hasPlayerBets?: boolean;
    winner: number;
    homeAwayTeamOrder: number;
    hasNews?: boolean;
    hasPointByPoint: boolean;
    hasVideo: boolean;
}

export type LineupsStatusText = "Alineaciones";

export type RoundName = "Fecha";

export type ShortStatusText = "Final" | "En Tiempo Extra";

export type StandingsName = "Posiciones";

export type StatusText = "Finalizado" | "En Tiempo Extra" | "Por penaltis" | "En Juego" | "Programado" | "Suspendido" | "Cancelado";

export interface Paging {
    previousPage: string;
    nextPage: string;
}

export interface Sport {
    id: number;
    name: string;
    nameForURL: string;
    drawSupport: boolean;
    imageVersion: number;
}

export interface Summary {
}
