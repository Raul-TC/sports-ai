"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { ExtendedMatchPrediction } from "@/lib/predictions";
import OddsPanel from "@/components/OddsPanel";
import {
    Trophy,
    Clock,
    TrendingUp,
    TrendingDown,
    Minus,
    Goal,
    Target,
    CornerDownRight,
    Activity,
    Crosshair,
    Gauge,
    BarChart,
    Info,
    Circle,
    Calendar,
    CalendarClock,
    HelpCircle,
    Sparkles,
    AlertCircle,
    Loader2,
} from "lucide-react";
import Image from "next/image";
// import { getBestPickFromData } from "@/utils/picks";
import { scorePicks } from "@/utils/scoringEngine";
import { enrichPredictions } from "@/utils/enrichPredictions";
import { isPickCorrect } from "@/utils/pickValidation";
import { MatchCard } from "./MatchCard";
import { useMatchFilters } from "@/hooks/useMatchFilters";
import { TabNavigation } from "./TabNavigation";
import { StatBadge } from "./StatBadge";
// import { useMatchFilters } from "@/hooks/useMatchFilters";

// ============================================================
// INTERFACES (igual que antes)
// ============================================================

interface TeamMetrics {
    xG: number;
    xGA: number;
    expectedGoals: number;
    shotFactor: number;
    offensiveEfficiency: number;
    efficiency: number;
    precisionDrop: number;
    corners: number;
    shots: number;
    shotsOT: number;
}

interface TeamInfo {
    teamId: number;
    id: number;
    teamName: string;
    metrics?: TeamMetrics;
}

interface PredictionResult {
    matchUrl: string;
    competitionName: string;
    startTime: string;
    home: TeamInfo;
    away: TeamInfo;
    prediction: ExtendedMatchPrediction;
    volatility?: number;
}

interface MatchesExplorerProps {
    predictions: PredictionResult[];
    results: any[]; // array de objetos con matchUrl y stats
}
// ============================================================
// DETECCIÓN DE TRAMPAS (mejorada)
// ============================================================


// ============================================================
// FUNCIÓN PARA EL MEJOR PICK (basado en EV)
// ============================================================

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
const INITIAL_VISIBLE = 10;
const LOAD_MORE = 10;

export default function MatchesExplorer({ predictions, results }: MatchesExplorerProps) {
    const [showHelp, setShowHelp] = useState(false);    //         const existing = prev.find(t => t.name === teamName);
    //         if (existing) {
    //             // Si ya existe, actualizamos sus estadísticas
    //             const updated = prev.map(t => {
    //                 if (t.name === teamName) {
    //                     return {
    //                         ...t,
    //                         losses: isWin ? 0 : t.losses + 1, // si gana, reseteamos las derrotas
    //                         goalsScored: t.goalsScored + scoredGoals,
    //                         lastUpdate: new Date().toISOString(),
    //                     };
    //                 }
    //                 return t;
    //             });
    //             return updated;
    //         } else {
    //             // Si no existe, lo añadimos
    //             return [
    //                 ...prev,
    //                 {
    //                     name: teamName,
    //                     losses: isWin ? 0 : 1,
    //                     goalsScored: scoredGoals,
    //                     lastUpdate: new Date().toISOString(),
    //                 },
    //             ];
    //         }
    //     });
    // };
    const [selectedMatchUrl, setSelectedMatchUrl] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
    const { activeTab, setActiveTab, filteredPredictions, todayCount, futureCount, pastCount } = useMatchFilters(predictions, results);
    const [matchesWithData, setMatchesWithData] = useState([]);

    const toggleMatch = (url: string) => {
        setSelectedMatchUrl(selectedMatchUrl === url ? null : url);
    };

    async function fetchMatchData(id: number) {
        const res = await fetch(`https://webws.365scores.com/web/games/results/?appTypeId=5&langId=14&timezoneName=America%2FMexico_City&competitors=${id}&showOdds=true&includeTopBettingOpportunity=1&topBookmaker=4`);
        return res.json();
    }
    useEffect(() => {
        if (activeTab !== "today") return;
        const loadData = async () => {
            const data = await Promise.all(
                visiblePredictions.map(async (match) => {
                    const result = await fetchMatchData(match.home.teamId);
                    const result2 = await fetchMatchData(match.away.teamId);

                    return {
                        ...match,
                        data: [result, result2],
                    };
                })
            );

            setMatchesWithData(data);
        };

        loadData();

    }, [activeTab]);


    const visiblePredictions = useMemo(() => {
        return filteredPredictions.slice(0, visibleCount);
    }, [filteredPredictions, visibleCount]);

    const hasMore = visibleCount < filteredPredictions.length;

    // Referencia al centinela (último elemento de la lista)
    const loaderRef = useRef<HTMLDivElement>(null);

    // Callback para cargar más partidos
    const loadMore = useCallback(() => {
        if (hasMore) {
            setVisibleCount(prev => Math.min(prev + LOAD_MORE, filteredPredictions.length));
        }
    }, [hasMore, filteredPredictions.length]);


    // Intersection Observer para detectar cuando el centinela es visible
    useEffect(() => {
        if (!loaderRef.current || !hasMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMore();
                }
            },
            { root: null, rootMargin: "200px", threshold: 0.1 }
        );

        observer.observe(loaderRef.current);

        return () => {
            observer.disconnect();
        };
    }, [loaderRef.current, hasMore, loadMore]);

    // Resetear el contador cuando cambia la pestaña o los filtros
    useEffect(() => {
        setVisibleCount(INITIAL_VISIBLE);
    }, [activeTab, predictions])

    // ============================================================
    // RENDER PRINCIPAL
    // ============================================================
    const matches = activeTab === 'today' && matchesWithData.length > 0 ? matchesWithData : visiblePredictions
    return (
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 tracking-tight flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-indigo-500" />
                    Pronósticos de Partidos
                </h2>
                <button
                    onClick={() => setShowHelp(!showHelp)}
                    className="inline-flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline ml-auto"
                >
                    <HelpCircle className="w-4 h-4" />
                    ¿Qué significan estas estadísticas?
                </button>
            </div>
            {showHelp && (
                <div className="bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl p-4 my-2 text-sm space-y-2">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300">Glosario de métricas</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div><strong>Gol Esp (xG):</strong> Goles esperados según ocasiones.</div>
                        <div><strong>Gol Esp Con (xGA):</strong> Goles esperados encajados.</div>
                        <div><strong>Tiros:</strong> Disparos totales.</div>
                        <div><strong>Tiro a Puerta:</strong> Disparos entre palos.</div>
                        <div><strong>Córners:</strong> Saques de esquina a favor.</div>
                        <div><strong>Eficiencia Of:</strong> Indica si el equipo rinde más o menos de lo esperado.</div>
                        <div><strong>Goles Previstos:</strong> Predicción de goles (Poisson) para este partido.</div>
                        <div><strong>Puntería:</strong> Alta = eficacia en el disparo.</div>
                        <div><strong>Eficiencia Bruta:</strong> Mide la conversión.</div>
                        <div><strong>Caída Precisión:</strong> Cambio en la puntería (histórico vs últimos 5 partidos).</div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Pasa el ratón o haz clic en cualquier badge para más detalles.</p>
                </div>
            )}

            {/* Pestañas */}
            <TabNavigation
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                todayCount={todayCount}
                futureCount={futureCount}
                pastCount={pastCount}
            />

            {/* Lista de partidos */}
            {filteredPredictions.length === 0 ? (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                    {activeTab === "today"
                        ? "No hay partidos programados para hoy."
                        : activeTab === "future"
                            ? "No hay partidos futuros."
                            : "No hay partidos pasados."}
                </div>
            ) : (
                <>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                        Mostrando {visiblePredictions.length} de {filteredPredictions.length} partidos
                    </p>

                    {matches.map(r => (
                        <MatchCard key={r.matchUrl} prediction={r} onToggle={toggleMatch} isSelected={selectedMatchUrl === r.matchUrl} activeTab={activeTab} />
                    ))

                    }
                    <div ref={loaderRef} className="py-4 flex justify-center items-center">
                        {hasMore ? (
                            <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Cargando más partidos...
                            </div>
                        ) : (
                            <span className="text-sm text-gray-400 dark:text-gray-500">
                                ✅ Todos los partidos cargados
                            </span>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}