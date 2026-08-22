// app/MatchesExplorer.tsx (o donde tengas el componente)
"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Trophy, HelpCircle, Loader2, Filter } from "lucide-react";
import { MatchCard } from "@/components/MatchCard";
import { useMatchFilters } from "@/hooks/useMatchFilters";
import { TabNavigation } from "@/components/TabNavigation";
import { FilterModal, FilterOptions } from "@/components/FilterModal";
import { scoreEngine } from "@/utils/scoringEngine";
import { trapEngine } from "@/utils/trapEngine";
import type { PredictionResult as SharedPredictionResult } from "@/types/index";

// ============================================================
// INTERFACES
// ============================================================

interface TeamMetrics {
    golesPerPartido: number;
    golesRecibidos: number,
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

interface MatchesExplorerProps {
    predictions: SharedPredictionResult[];
    results: any[];
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
const INITIAL_VISIBLE = 10;
const LOAD_MORE = 10;

const defaultFilters: FilterOptions = {
    btts: "all",
    overUnder: { line: null, type: null },
    corners: { line: null, type: null },
    result: "all",
    confidence: "all",
    risk: "all",
    minOdd: 1.0,
    maxOdd: 10.0,
};
const LEAGUES = {
    "LigaMX": { id: 141, name: "Liga MX", flag: "🇲🇽" },
    "Brasileirão": { id: 113, name: "Brasileirão", flag: "🇧🇷" },
    "MLS": { id: 104, name: "MLS", flag: "🇺🇸" },
    "Argentina": { id: 72, name: "Liga Profesional", flag: "🇦🇷" },
    "LaLiga": { id: 11, name: "LaLiga", flag: "🇪🇸" },
    "Premier League": { id: 168, name: "Premier League", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    "UEFA Champions League": { id: 332, name: "UEFA Champions League", flag: "🏆" },
    "Conmebol Libertadores": { id: 102, name: "Conmebol Libertadores", flag: "🏆" },
    "Conmebol Sudamericana": { id: 389, name: "Conmebol Sudamericana", flag: "🏆" },
};

export default function MatchesExplorer({ predictions, results }: MatchesExplorerProps) {
    const [showHelp, setShowHelp] = useState(false);
    const [selectedMatchUrl, setSelectedMatchUrl] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
    const { activeTab, setActiveTab, filteredPredictions, todayCount, futureCount, pastCount } = useMatchFilters(predictions, results);
    const [matchesWithData, setMatchesWithData] = useState<any[]>([]);
    const [filterModalOpen, setFilterModalOpen] = useState(false);
    const [filters, setFilters] = useState<FilterOptions>(defaultFilters);
    console.log({ results })
    const toggleMatch = (url: string) => {
        setSelectedMatchUrl(selectedMatchUrl === url ? null : url);
    };
    // ============================================================
    // FETCH DE DATOS DE 365SCORES
    // ============================================================
    // async function fetchMatchData(id: number) {
    //     const res = await fetch(`https://webws.365scores.com/web/games/results/?appTypeId=5&langId=14&timezoneName=America%2FMexico_City&competitors=${id}`);
    //     return res.json();
    // }

    // ============================================================
    // VISIBLES
    // ============================================================
    const visiblePredictions = useMemo(() => {
        return filteredPredictions.slice(0, visibleCount);
    }, [filteredPredictions, visibleCount]);

    // ============================================================
    // FUNCIÓN DE FILTRADO CENTRALIZADA
    // ============================================================
    const applyFilters = useCallback((matchesList: any[]) => {
        return matchesList.filter((match) => {
            const picks = scoreEngine({
                home: match.home,
                away: match.away,
                pred: match.prediction,
                volatility: match.volatility,
            });
            let targetPick = picks[0]; // por defecto el mejor pick

            // 1. BTTS
            if (filters.btts !== "all") {
                const bttsPick = picks.find((p) => p.market === "BTTS");
                if (!bttsPick) return false;
                const bttsYes = bttsPick.selection === "Sí";
                if (filters.btts === "yes" && !bttsYes) return false;
                if (filters.btts === "no" && bttsYes) return false;
                targetPick = bttsPick; // Para el filtro de cuota, usamos el pick de BTTS
            }

            // 2. Over/Under
            if (filters.overUnder.line !== null && filters.overUnder.type !== null) {
                const line = filters.overUnder.line;
                const type = filters.overUnder.type;
                const ouPick = picks.find((p) => p.market === `Total de goles (${line})`);
                if (!ouPick) return false;
                const isOver = ouPick.selection.includes("Over");
                if (type === "over" && !isOver) return false;
                if (type === "under" && isOver) return false;
                targetPick = ouPick; // Para el filtro de cuota, usamos el pick de Over/Under
            }

            // 3. Corners
            if (filters.corners.line !== null && filters.corners.type !== null) {
                const line = filters.corners.line;
                const type = filters.corners.type;
                const cornerPick = picks.find((p) => p.market === "Córners");
                if (!cornerPick) return false;
                const sel = cornerPick.selection;
                const matchLine = parseFloat(sel.match(/[\d.]+/)?.[0] || "0");
                if (matchLine !== line) return false;
                const isOver = sel.includes("Over");
                if (type === "over" && !isOver) return false;
                if (type === "under" && isOver) return false;
                targetPick = cornerPick; // Para el filtro de cuota, usamos el pick de Corners
            }

            // 4. Resultado
            if (filters.result !== "all") {
                const resultPick = picks.find((p) => p.market === "Resultado");
                if (!resultPick) return false;
                const sel = resultPick.selection;
                if (filters.result === "home" && sel !== match.home.teamName) return false;
                if (filters.result === "away" && sel !== match.away.teamName) return false;
                if (filters.result === "draw" && sel !== "Empate") return false;
                targetPick = resultPick; // Para el filtro de cuota, usamos el pick de Resultado
            }

            // 5. Confianza
            const bestPick = picks[0];
            if (filters.confidence !== "all" && bestPick) {
                if (bestPick.confidence !== filters.confidence) return false;
            }

            // 6. Riesgo
            const trap = trapEngine(match.home, match.away, match.prediction, match.volatility);
            if (filters.risk !== "all") {
                if (trap.level !== filters.risk) return false;
            }

            // 7. Rango de cuota
            const bestOdd = bestPick?.odd || 0;
            if (bestOdd < filters.minOdd || bestOdd > filters.maxOdd) return false;

            return true;
        });
    }, [filters]);

    // ============================================================
    // CARGA DE DATOS DE PARTIDOS (últimos partidos)
    // ============================================================
    // useEffect(() => {
    //     if (activeTab !== "today" && activeTab !== "future") return;

    //     const pending = visiblePredictions.filter(
    //         match => !matchesWithData.some(m => m.matchUrl === match.matchUrl)
    //     );

    //     if (pending.length === 0) return;

    //     const loadData = async () => {
    //         const data = await Promise.all(
    //             pending.map(async (match) => {
    //                 const result = await fetchMatchData(match.home.teamId);
    //                 const result2 = await fetchMatchData(match.away.teamId);
    //                 return {
    //                     ...match,
    //                     data: [result, result2],
    //                 };
    //             })
    //         );
    //         setMatchesWithData(prev => [...prev, ...data]);
    //     };

    //     loadData();
    // }, [activeTab, visiblePredictions, matchesWithData]);

    // ============================================================
    // LAZY LOADING
    // ============================================================
    const hasMore = visibleCount < filteredPredictions.length;
    const loaderRef = useRef<HTMLDivElement>(null);

    const loadMore = useCallback(() => {
        if (hasMore) {
            setVisibleCount(prev => Math.min(prev + LOAD_MORE, filteredPredictions.length));
        }
    }, [hasMore, filteredPredictions.length]);

    useEffect(() => {
        const loader = loaderRef.current;
        if (!loader || !hasMore) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    loadMore();
                }
            },
            { root: null, rootMargin: "900px", threshold: 0 }
        );

        observer.observe(loader);
        return () => {
            observer.unobserve(loader);
        };
    }, [loaderRef.current, hasMore, loadMore]);

    useEffect(() => {
        setVisibleCount(INITIAL_VISIBLE);
    }, [activeTab, predictions]);

    // ============================================================
    // LISTA DE PARTIDOS FILTRADA CON PICKS PARA EL MODAL
    // ============================================================
    const matchesWithPicks = useMemo(() => {
        const base = (activeTab === 'today' || activeTab === 'future') && matchesWithData.length > 0
            ? matchesWithData
            : visiblePredictions;

        const filtered = applyFilters(base);

        return filtered.map((match) => {
            const picks = scoreEngine({
                home: match.home,
                away: match.away,
                pred: match.prediction,
                volatility: match.volatility,
            });
            return {
                ...match,
                scoredPicks: picks,
                bestConfidence: picks[0]?.confidence || "N/A",
            };
        });
    }, [activeTab, matchesWithData, visiblePredictions, applyFilters]);

    // Lista para renderizar (sin los picks, solo los datos del partido)
    const matches = visiblePredictions;

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <div className="w-full mx-auto px-4 ">
            {/* Barra superior */}
            <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 tracking-tight flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-indigo-500" />
                    Pronósticos de Partidos
                </h2>
                {/* <button
                    onClick={() => setShowHelp(!showHelp)}
                    className="inline-flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                    <HelpCircle className="w-4 h-4" />
                    ¿Qué significan estas estadísticas?
                </button> */}
                {/* <button
                    onClick={() => setFilterModalOpen(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-md transition-colors ml-auto"
                >
                    <Filter className="w-4 h-4" />
                    Filtros
                    {Object.keys(filters).some(
                        (key) =>
                            key !== "minOdd" &&
                            key !== "maxOdd" &&
                            (filters as any)[key] !== (defaultFilters as any)[key]
                    ) && (
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        )}
                </button> */}
            </div>

            {/* {showHelp && (
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
            )} */}

            <TabNavigation
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                todayCount={todayCount}
                futureCount={futureCount}
                pastCount={pastCount}
            />

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
                        Mostrando {matches.length} de {visiblePredictions.length} partidos
                    </p>

                    {matches.map((r) => (
                        <MatchCard
                            key={r.matchUrl}
                            prediction={r}
                            onToggle={toggleMatch}
                            isSelected={selectedMatchUrl === r.matchUrl}
                            activeTab={activeTab}
                        />
                    ))}

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

            {/* Modal de filtros */}
            <FilterModal
                isOpen={filterModalOpen}
                onClose={() => setFilterModalOpen(false)}
                filters={filters}
                onApply={(newFilters) => {
                    setFilters(newFilters);
                    setFilterModalOpen(false);
                }}
                onReset={() => {
                    setFilters(defaultFilters);
                    setFilterModalOpen(false);
                }}
                matches={matchesWithPicks}
            />
        </div>
    );
}