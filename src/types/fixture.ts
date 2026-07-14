export interface Fixture {
    fixture: {
        id: number;
        date: string;
        timestamp: number;
        status: {
            long: string;
            short: string;
        };
    };
    league: {
        id: number;
        name: string;
        country: string;
        logo: string;
        round: string;
    };
    teams: {
        home: {
            id: number;
            name: string;
            logo: string;
        };
        away: {
            id: number;
            name: string;
            logo: string;
        };
    };
    goals: {
        home: number | null;
        away: number | null;
    };
}

export interface ApiFootballResponse {
    get: string;
    parameters: Record<string, string>;
    errors: unknown[];
    results: number;
    response: Fixture[];
}