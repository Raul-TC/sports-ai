// --- Estadísticas de TEMPORADA del equipo (/teams/statistics) ---

export interface TeamStatisticsResponse {
    response: {
        team: { id: number; name: string; logo: string };
        league: { id: number; name: string; season: number };
        fixtures: {
            played: { total: number };
        };
        goals: {
            for: {
                average: { total: string; home: string; away: string };
            };
            against: {
                average: { total: string; home: string; away: string };
            };
        };
        form: string;
    };
}

export interface TeamStats {
    teamId: number;
    teamName: string;
    logo: string;
    played: number;
    goalsForAvg: number;
    goalsAgainstAvg: number;
    form: string;
}

// --- Estadísticas EN VIVO / post-partido (/fixtures/statistics) ---

export interface FixtureStatEntry {
    type: string;
    value: number | string | null;
}

export interface FixtureStatisticsTeam {
    team: { id: number; name: string; logo: string };
    statistics: FixtureStatEntry[];
}

export interface FixtureStatisticsResponse {
    response: FixtureStatisticsTeam[];
}

export interface LiveMatchStats {
    home: Record<string, number | string | null>;
    away: Record<string, number | string | null>;
}

// --- Head to Head (fallback cuando no hay stats de temporada) ---

export interface H2HFixture {
    fixture: { id: number; date: string };
    teams: {
        home: { id: number; name: string };
        away: { id: number; name: string };
    };
    goals: { home: number | null; away: number | null };
}

export interface H2HResponse {
    response: H2HFixture[];
}