// app/api/match-stats/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const gameId = searchParams.get("gameId");

    if (!gameId) {
        return NextResponse.json({ error: "gameId es requerido" }, { status: 400 });
    }

    const params = new URLSearchParams({
        appTypeId: "5",
        langId: "14",
        timezoneName: "America/Mexico_City",
        userCountryId: "31",
        games: gameId,
    });

    const url = `https://webws.365scores.com/web/game/stats/?${params.toString()}`;

    try {
        const response = await fetch(url, { next: { revalidate: 3600 } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        console.log({ data })
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Error fetching match stats:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}