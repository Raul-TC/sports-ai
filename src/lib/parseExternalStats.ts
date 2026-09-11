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

export type StatsFilterKey = "todos" | "ultimos5" | "ultimos5LocalVisita";

export interface RawStatEntry {
    id: number;
    competitorId: number;
    value: string;
    statisticGroup?: number;
}

export interface RawGame {
    competitionDisplayName: string;
    startTime: string;
    homeCompetitor: { id: number; name: string };
    awayCompetitor: { id: number; name: string };
}

export interface RawStatsBlock {
    statistics: RawStatEntry[];
    games: RawGame[];
}

export interface RawMatchData {
    matchUrl: string;
    stats: Partial<Record<StatsFilterKey, RawStatsBlock>>;
}

export interface ParseOptions {
    filterKey?: StatsFilterKey;
    statisticGroup?: number | null;
    statIds?: StatIdMap;
}

export function extractStatValue(
    statistics: RawStatEntry[],
    statId: number,
    competitorId: number,
    statisticGroup: number | null
): number {
    const entry = statistics.find(
        (s) =>
            s.id === statId &&
            s.competitorId === competitorId &&
            (statisticGroup === null || s.statisticGroup === statisticGroup)
    );
    return entry ? parseFloat(entry.value) || 0 : 0;
}
