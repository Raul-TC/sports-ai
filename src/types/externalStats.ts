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

export interface StatIdMap {
    goalsFor: number;
    goalsAgainst: number;
    xGFor: number;
    xGAgainst: number;
    corners: number;
    shots: number;
    shotsOnTarget: number;
}

export const DEFAULT_STAT_IDS: StatIdMap = {
    goalsFor: 153,
    goalsAgainst: 156,
    xGFor: 159,
    xGAgainst: 162,
    corners: 171,
    shots: 165,
    shotsOnTarget: 168,
};

export interface RawGame {
    competitionDisplayName: string;
    startTime: string;
    homeCompetitor: { id: number; name: string };
    awayCompetitor: { id: number; name: string };
}

export interface RawStatEntry {
    id: number;
    competitorId: number;
    value: string;
    statisticGroup?: number;
}

export interface RawStatsBlock {
    statistics: RawStatEntry[];
    games: RawGame[];
}
export type StatsFilterKey = "todos" | "ultimos5" | "ultimos5LocalVisita"; export interface RawMatchData {
    matchUrl: string;
    stats: Partial<Record<StatsFilterKey, RawStatsBlock>>;
}

export interface ParseOptions {
    filterKey?: StatsFilterKey;
    statisticGroup?: number | null;
    statIds?: StatIdMap;
}