import { ExternalMatchStats, ExternalTeamStat } from "@/types/externalStats";

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

/**
 * Separa el JSON crudo (arreglo de N partidos) en un arreglo de
 * ExternalMatchStats — un objeto independiente por partido, cada uno
 * con las stats de su propio local y visitante ya extraídas.
 */
export function parseExternalStats(raw: RawMatchData[], options: ParseOptions = {}): ExternalMatchStats[] {
    const filterKey = options.filterKey ?? "ultimos5";
    const statisticGroup = options.statisticGroup === undefined ? 2 : options.statisticGroup;
    const statIds = options.statIds ?? DEFAULT_STAT_IDS;

    return raw
        .map((match): ExternalMatchStats | null => {
            const block = match.stats[filterKey];
            console.log({ block, filterKey })
            if (!block || !block.games?.length) {
                console.warn(`⚠️ Sin bloque "${filterKey}" para ${match.matchUrl} — se omite.`);
                return null;
            }

            const { statistics, games } = block;
            const game = games[0];
            const homeId = game.homeCompetitor.id;
            const awayId = game.awayCompetitor.id;

            const buildTeamStat = (teamId: number, teamName: string): ExternalTeamStat => ({
                teamId,
                teamName,
                goalsFor: extractStatValue(statistics, statIds.goalsFor, teamId, statisticGroup),
                goalsAgainst: extractStatValue(statistics, statIds.goalsAgainst, teamId, statisticGroup),
                xGFor: extractStatValue(statistics, statIds.xGFor, teamId, statisticGroup),
                xGAgainst: extractStatValue(statistics, statIds.xGAgainst, teamId, statisticGroup),
                cornersAvg: extractStatValue(statistics, statIds.corners, teamId, statisticGroup),
            });

            return {
                matchUrl: match.matchUrl,
                competitionName: game.competitionDisplayName,
                startTime: game.startTime,
                home: buildTeamStat(homeId, game.homeCompetitor.name),
                away: buildTeamStat(awayId, game.awayCompetitor.name),
            };
        })
        .filter((m): m is ExternalMatchStats => m !== null);
}