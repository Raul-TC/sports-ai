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
    shots: number;
    shotsOnTarget: number;
    corners: number;
    // nuevos:
    foulsCommitted: number;
    foulsReceived: number;
    offsides: number;
    interceptions: number;
    clearances: number;
    saves: number;
    duelsWon: number;
    duelsAerialWon: number;
    duelsGroundWon: number;
    dribbles: number;
    tarjetasAmarillas: number,
}

export const DEFAULT_STAT_IDS: StatIdMap = {
    goalsFor: 153,
    goalsAgainst: 156,
    xGFor: 159,
    xGAgainst: 162,
    corners: 171,
    shots: 165,
    shotsOnTarget: 168,
    foulsCommitted: 12,
    foulsReceived: 37,
    offsides: 9,
    interceptions: 41,
    clearances: 40,
    saves: 23,
    duelsWon: 150,
    duelsAerialWon: 56,
    duelsGroundWon: 55,
    dribbles: 54,
    tarjetasAmarillas: 1
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
export type StatsFilterKey = "todos" | "ultimos5" | "ultimos5LocalVisita";


export interface RawMatchData {
    matchUrl: string;
    stats: Partial<Record<StatsFilterKey, RawStatsBlock>>;
    // ... campos existentes  
    informacionEquipos: {
        id: number,
        competitionDisplayName: string,
        home: {
            homeId: number,
            homeCompetitor: {
                // colors: {
                color: string,
                awayColor: string
                // },
            }
            teamName: string,
            nameForURL: string,
            alineaciones: any
        },
        away: {
            awayId: number,
            awayCompetitor: {
                // colors: {
                color: string,
                awayColor: string
                // },
            }
            teamName: string,
            nameForURL: string,
            alineaciones: any
        },
        estadio: {
            id: number,
            name: string,
            capacity: number,
        },
        arbitro: {
            id: number,
            name: string,
            nameForURL: string
        },
        tv: {
            id: number,
            name: string
        }[],
        playerStats: any[],
        members: []
    },
    h2h: {
        game: {
            competitionDisplayName: string,
            startTime: string,
            homeCompetitor: any[],
            awayCompetitor: any,
            h2hGames: any[]
        },

    },
    recentMatches: {
        home: {
            id: string,
            competitionId: string,
            competitionDisplayName: string,
            startTime: string,
            statusText: string,
            homeCompetitor: any[],
            awayCompetitor: any[],
        }
        away: {
            id: string,
            competitionId: string,
            competitionDisplayName: string,
            startTime: string,
            statusText: string,
            homeCompetitor: any[],
            awayCompetitor: any[],
        }
    }
}

export interface ParseOptions {
    filterKey?: StatsFilterKey;
    statisticGroup?: number | null;
    statIds?: StatIdMap;
}