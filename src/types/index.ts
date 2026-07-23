import { ExtendedMatchPrediction } from "@/lib/predictions";

export interface TeamMetrics {
    xG: number;
    xGA: number;
    expectedGoals: number;
    shotFactor: number;
    offensiveEfficiency: number;
    efficiency: number;
    precisionDrop: number;
    corners: number;
    shots: number;
    shotsOT: number;
}

export interface TeamInfo {
    teamId: number;
    teamName: string;
    metrics?: TeamMetrics;
}

export interface PredictionResult {
    matchUrl: string;
    competitionName: string;
    startTime: string;
    home: TeamInfo;
    away: TeamInfo;
    prediction: ExtendedMatchPrediction;
    volatility?: number;
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