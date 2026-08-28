import { ExtendedMatchPrediction } from "@/lib/predictions";
import { Welcome } from "@/utils/enrichPredictions";
import { TeamMetrics, UnifiedTeamInfo } from "./unifiedStats";

// export interface TeamMetrics {
//     golesPerPartido: number;
//     golesRecibidos: number,
//     xG: number;
//     xGA: number;
//     expectedGoals: number;
//     shotFactor: number;
//     offensiveEfficiency: number;
//     efficiency: number;
//     precisionDrop: number;
//     corners: number;
//     shots: number;
//     shotsOT: number;
// }

// export interface TeamInfo {
//     id: number;
//     teamId: number;
//     teamName: string;
//     metrics?: TeamMetrics;
// }

export interface PredictionResult {
    matchUrl: string;
    competitionName: string;
    startTime: string;
    home: UnifiedTeamInfo;
    away: UnifiedTeamInfo;
    prediction: ExtendedMatchPrediction;
    volatility?: number;
    data?: Welcome[],
    injuries?: {
        home: { id: number; name: string; position: string; reason: string; expectedReturn?: string; gamesPlayed?: number, status: string, appearances?: string, goals?: string, assists?: string, athleteId: string }[];
        away: { id: number; name: string; position: string; reason: string; expectedReturn?: string; gamesPlayed?: number, status: string, appearances?: string, goals?: string, assists?: string, athleteId: string }[];
    };
    estadio: { id: number; name: string; capacity: number };
    tv: { id: number; name: string; countryId: number }[];
    recentMatches: { home: any; away: any };
    h2h: any[]
    arbitro: { id: number, name: string }[]
}

export interface ExcludedTeam {
    name: string;
    losses: number;
    goalsScored: number;
    lastUpdate: string;
}

export interface TrapDetail {
    team: string;
    reason: string;
}

export interface TrapResult {
    isTrap: boolean;
    level: "low" | "medium" | "high" | "none";
    details: TrapDetail[];
}

export interface Pick {
    market: string;
    selection: string;
    odd: number;
    prob: number;
    ev: number;
    reason: string;
}

export interface BestPick {
    market: string;
    selection: string;
    odd: number;
    prob: number;
    ev: number;
    reason: string;
}

export interface WarningsAndExclusions {
    warnings: string[];
    excludedMarkets: string[];
}