import { PredictionOptions } from "@/lib/predictions";

export interface UnifiedTeamInfo {
    teamId: number;
    teamName: string;
    metrics: TeamMetrics;
}

export interface MatchMetrics {
    home: TeamMetrics;
    away: TeamMetrics;

    match: {
        xG: number;
        expectedGoals: number;
        volatility: number;
        corners: number
    };
}
export interface MatchSummaryMetrics {
    xG: number;
    expectedGoals: number;
    volatility: number;
}


export interface UnifiedMatch {
    matchUrl: string;
    competitionName: string;
    startTime: string;

    home: UnifiedTeamInfo;
    away: UnifiedTeamInfo;

    matchMetrics: MatchSummaryMetrics;
    // prediction: PredictionOptions
}

export interface TeamMetrics {
    xG: number;
    xGA: number;
    expectedGoals: number;
    shotFactor: number;
    offensiveEfficiency: number;
    efficiency: number;
    precisionDrop: number;
    corners: number
    shots: number,
    shotsOT: number
}