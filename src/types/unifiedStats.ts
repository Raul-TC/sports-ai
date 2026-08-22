import { PredictionOptions } from "@/lib/predictions";

export interface UnifiedTeamInfo {
    teamId: number;
    id: number;
    teamName: string;
    metrics: TeamMetrics;
    injuries?: {
        home: { id: number; name: string; position: string; reason: string; expectedReturn?: string; gamesPlayed?: number }[];
        away: { id: number; name: string; position: string; reason: string; expectedReturn?: string; gamesPlayed?: number }[];
    }[]
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
    estadio: { id: number; name: string; capacity: number };
    tvNetworks?: { id: number; name: string }[];
    recentMatches?: { home: any; away: any };
    h2hSummary?: { total: number; homeWins: number; awayWins: number; draws: number; avgGoals: number };
    arbitro: { id: number, name: string }
    h2h: any[],
    injuries: any[]
}

export interface TeamMetrics {
    golesPerPartido: number;
    golesRecibidos: number,
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