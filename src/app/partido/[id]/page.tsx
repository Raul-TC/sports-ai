// import { notFound } from "next/navigation";
// import {
//     getFixtureById,
//     getTeamStatistics,
//     getFixtureStatistics,
//     getHeadToHeadAverages,
//     getRecentFormStats,
// } from "@/lib/api-football";
// import { getSeasonForFixture } from "@/lib/season";
// import { isInternationalTeamCompetition } from "@/lib/leagues";
// import { calculatePrediction } from "@/lib/predictions";
// import { TeamStats } from "@/types/teamStats";
// import TeamStatsPanel from "@/components/TeamStatsPanel";
// import OddsPanel from "@/components/OddsPanel";
// import LiveStatsPanel from "@/components/LiveStatsPanel";
// import Link from "next/link";
// import ExternalPredictionsPage from "@/components/preddict";

// interface PageProps {
//     params: Promise<{ id: string }>;
// }

// const NOT_STARTED = ["NS", "TBD"];
// const LIVE = ["1H", "2H", "HT", "ET", "P", "LIVE"];
// const FINISHED = ["FT", "AET", "PEN"];

// export default async function MatchDetailPage({ params }: PageProps) {
//     const { id } = await params;
//     const fixture = await getFixtureById(id);

//     if (!fixture) notFound();

//     const status = fixture.fixture.status.short;
//     const isPrematch = NOT_STARTED.includes(status);
//     const isLive = LIVE.includes(status);
//     const isFinished = FINISHED.includes(status);

//     const isInternational = isInternationalTeamCompetition(
//         fixture.league.id,
//         fixture.league.name,
//         fixture.league.country
//     );

//     // --- Datos de PREMATCH: stats de los equipos + predicción ---
//     let homeStats: TeamStats | null = null;
//     let awayStats: TeamStats | null = null;
//     let usedFallbackForm = false;
//     let h2hFallback = null;

//     if (isPrematch || isFinished) {
//         // Traemos stats de equipo también para partidos finalizados, como
//         // contexto de referencia (no solo mientras está sin empezar).
//         if (isInternational) {
//             [homeStats, awayStats] = await Promise.all([
//                 getRecentFormStats(fixture.teams.home.id, fixture.teams.home.name, fixture.teams.home.logo),
//                 getRecentFormStats(fixture.teams.away.id, fixture.teams.away.name, fixture.teams.away.logo),
//             ]);
//             usedFallbackForm = true;
//         } else {
//             const season = getSeasonForFixture(fixture.league.id, fixture.fixture.date);
//             [homeStats, awayStats] = await Promise.all([
//                 getTeamStatistics(fixture.teams.home.id, fixture.league.id, season),
//                 getTeamStatistics(fixture.teams.away.id, fixture.league.id, season),
//             ]);
//         }

//         if (!homeStats || !awayStats) {
//             h2hFallback = await getHeadToHeadAverages(fixture.teams.home.id, fixture.teams.away.id);
//         }
//     }

//     // --- Datos EN VIVO: estadísticas reales del partido en curso ---
//     const liveStats = isLive || isFinished
//         ? await getFixtureStatistics(fixture.fixture.id)
//         : null;

//     // 🔧 DEBUG TEMPORAL — quitar cuando confirmemos la causa
//     const debugInfo = {
//         leagueId: fixture.league.id,
//         leagueName: fixture.league.name,
//         leagueCountry: fixture.league.country,
//         isInternational,
//         status,
//         isPrematch,
//         homeTeamId: fixture.teams.home.id,
//         awayTeamId: fixture.teams.away.id,
//         homeStats,
//         awayStats,
//         h2hFallback,
//     };
//     return (
//         <main className="max-w-3xl mx-auto px-4 py-8">
//             <Link href="/" className="text-sm text-blue-500 mb-4 inline-block">
//                 ← Volver a partidos del día
//             </Link>

//             <header className="mb-6 text-center">
//                 <p className="text-xs text-neutral-500">{fixture.league.name} · {fixture.league.round}</p>
//                 <h1 className="text-xl font-bold mt-1">
//                     {fixture.teams.home.name} vs {fixture.teams.away.name}
//                 </h1>
//                 <span
//                     className={`inline-block mt-2 text-[11px] uppercase tracking-wide px-2 py-0.5 rounded-full ${isLive
//                         ? "bg-red-100 text-red-600"
//                         : isFinished
//                             ? "bg-neutral-100 text-neutral-500"
//                             : "bg-blue-100 text-blue-600"
//                         }`}
//                 >
//                     {isPrematch ? "Aún no empieza" : isLive ? "En vivo" : "Finalizado"}
//                 </span>
//             </header>

//             <div className="space-y-6">
//                 {/* CASO 1: Partido en vivo → mostrar estadísticas del partido en curso */}
//                 {isLive && (
//                     <>
//                         {liveStats ? (
//                             <LiveStatsPanel
//                                 stats={liveStats}
//                                 homeTeam={fixture.teams.home.name}
//                                 awayTeam={fixture.teams.away.name}
//                             />
//                         ) : (
//                             <p className="text-center text-sm text-neutral-500 py-6">
//                                 El partido está en curso pero la API todavía no reporta estadísticas de eventos.
//                                 Suele tardar unos minutos en aparecer tras el pitido inicial.
//                             </p>
//                         )}
//                     </>
//                 )}

//                 {/* CASO 2: Partido finalizado → estadísticas finales del partido + contexto previo */}
//                 {isFinished && liveStats && (
//                     <LiveStatsPanel
//                         stats={liveStats}
//                         homeTeam={fixture.teams.home.name}
//                         awayTeam={fixture.teams.away.name}
//                     />
//                 )}

//                 {/* CASO 3: Prematch (o contexto adicional post-partido) → stats de cada equipo */}
//                 {(isPrematch || isFinished) && (
//                     <>
//                         {homeStats && awayStats ? (
//                             <>
//                                 <TeamStatsPanel home={homeStats} away={awayStats} />
//                                 {isPrematch && (
//                                     <OddsPanel
//                                         prediction={calculatePrediction(homeStats, awayStats)}
//                                         homeTeam={fixture.teams.home.name}
//                                         awayTeam={fixture.teams.away.name}
//                                     />
//                                 )}
//                                 {usedFallbackForm && (
//                                     <p className="text-center text-[11px] text-neutral-400">
//                                         Estadísticas basadas en los últimos partidos (Mundial/amistosos/eliminatorias)
//                                     </p>
//                                 )}
//                             </>
//                         ) : h2hFallback ? (
//                             <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl p-4 text-sm">
//                                 <p className="font-medium mb-1">
//                                     ⚠️ Sin suficiente historial reciente para este equipo.
//                                 </p>
//                                 <p className="text-neutral-600 dark:text-neutral-400">
//                                     Usando promedio de goles de los últimos {h2hFallback.matchesFound} enfrentamientos
//                                     directos: {fixture.teams.home.name} {h2hFallback.homeAvgGoals} —{" "}
//                                     {h2hFallback.awayAvgGoals} {fixture.teams.away.name}.
//                                 </p>
//                             </div>
//                         ) : (
//                             isPrematch && (
//                                 <div className="text-center text-neutral-500 py-10 text-sm">
//                                     No hay suficientes datos para generar estadísticas o predicciones de este partido.
//                                 </div>
//                             )
//                         )}
//                     </>
//                 )}
//             </div>
//             {process.env.NODE_ENV === "development" && (
//                 <details className="mt-8 text-xs bg-neutral-100 dark:bg-neutral-900 rounded-lg p-4">
//                     <summary className="cursor-pointer font-medium">🔧 Debug info</summary>
//                     <pre className="overflow-auto mt-2 whitespace-pre-wrap">
//                         {JSON.stringify(debugInfo, null, 2)}
//                     </pre>
//                 </details>
//             )}

//             <ExternalPredictionsPage />
//         </main>
//     );
// }