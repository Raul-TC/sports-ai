export interface ExternalTeamStat {
    teamId: number;
    teamName: string;
    goalsFor: number;
    goalsAgainst: number;
    xG: number;
    xGA: number;
    corners: number;
    metrics: TeamMetrics
}

export interface ExternalMatchStats {
    matchUrl: string;
    competitionName: string;
    startTime: string;
    home: ExternalTeamStat;
    away: ExternalTeamStat;
    prediction: ExternalMatchStats[]

}

export interface TeamMetrics {
    corners: number;
    efficiency: number;
    expectedGoals: number;
    offensiveEfficiency: number;
    precisionDrop: number;
    shotFactor: number;
    shots: number;
    shotsOT: number;
    xG: number;
    xGA: number;
}