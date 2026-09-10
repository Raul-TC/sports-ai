"use client";

import { useEffect, useState } from "react";
import { X, Loader2, BarChart3 } from "lucide-react";

interface MatchStatsModalProps {
    gameId: number | null;
    onClose: () => void;
}

export function MatchStatsModal({ gameId, onClose }: MatchStatsModalProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (gameId === null || gameId === undefined) return;

        const numericId = Number(gameId);
        if (!numericId || isNaN(numericId)) {
            setError("ID de partido inválido");
            return;
        }

        setLoading(true);
        setError(null);
        setData(null);

        fetch(`/api/match-stats?gameId=${numericId}`)
            .then(async (res) => {
                const json = await res.json();
                if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
                return json;
            })
            .then(setData)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [gameId]);

    // Cerrar con ESC
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [onClose]);

    // Bloquear scroll del body
    useEffect(() => {
        if (gameId) document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, [gameId]);

    if (gameId === null || gameId === undefined) return null;

    const game = data?.games?.[0];
    const home = game?.homeCompetitor;
    const away = game?.awayCompetitor;
    const statistics: any[] = data?.statistics || [];

    // Agrupar estadísticas por nombre
    const statsByName = new Map<string, { home: any; away: any; meta: any }>();
    statistics.forEach((s: any) => {
        if (!statsByName.has(s.name)) {
            statsByName.set(s.name, { home: null, away: null, meta: s });
        }
        const entry = statsByName.get(s.name)!;
        if (s.competitorId === home?.id) entry.home = s;
        else if (s.competitorId === away?.id) entry.away = s;
    });

    // Agrupar por categoría
    const grouped: Record<string, Array<{ name: string; home: any; away: any; meta: any }>> = {};
    statsByName.forEach((entry, name) => {
        const cat = entry.meta?.categoryName || "General";
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push({ name, ...entry });
    });

    const sortedCategories = Object.keys(grouped).sort((a, b) => {
        const orderA = grouped[a][0]?.meta?.categoryOrder ?? 99;
        const orderB = grouped[b][0]?.meta?.categoryOrder ?? 99;
        return orderA - orderB;
    });

    const renderBar = (homeVal: number, awayVal: number) => {
        const total = homeVal + awayVal;
        if (total === 0) return null;
        const homePct = (homeVal / total) * 100;
        return (
            <div className="flex h-1 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800 my-1.5">
                <div
                    className="bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${homePct}%` }}
                />
                <div
                    className="bg-gradient-to-r from-rose-400 to-rose-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${100 - homePct}%` }}
                />
            </div>
        );
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-neutral-950/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header con marcador */}
                <div className="relative overflow-hidden">
                    {/* Fondo con gradiente */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-rose-500/10" />
                    <div className="absolute -top-20 -right-20 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-rose-500/10 rounded-full blur-3xl" />

                    {/* Botón cerrar */}
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-all duration-200 hover:scale-105"
                        aria-label="Cerrar"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* Contenido del header */}
                    <div className="relative px-5 pt-5 pb-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-6 gap-2">
                                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                                <span className="text-xs text-neutral-500">Cargando...</span>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center gap-2 py-4">
                                <div className="text-2xl">⚠️</div>
                                <div className="text-sm text-rose-600 dark:text-rose-400 text-center">{error}</div>
                            </div>
                        ) : game ? (
                            <>
                                {/* Competición + fecha */}
                                <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">
                                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                                        {game.competitionDisplayName || "Partido"}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-neutral-400" />
                                    <span>
                                        {new Date(game.startTime).toLocaleDateString("es-MX", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </span>
                                </div>

                                {/* Marcador */}
                                <div className="grid grid-cols-3 items-center gap-3">
                                    {/* Local */}
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="p-2 rounded-full bg-white dark:bg-neutral-800 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                                            <img
                                                src={`https://imagecache.365scores.com/image/upload/f_png,w_48,h_48,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v5/Competitors/${home.id}`}
                                                className="w-10 h-10 object-contain"
                                                alt=""
                                            />
                                        </div>
                                        <span className="font-semibold text-xs text-center truncate w-full text-neutral-800 dark:text-neutral-200">
                                            {home.name}
                                        </span>
                                    </div>

                                    {/* Marcador central */}
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-3xl sm:text-4xl font-black tracking-tight ${home.score > away.score ? "text-indigo-600 dark:text-indigo-400" : "text-neutral-800 dark:text-neutral-200"}`}>
                                                {home.score}
                                            </span>
                                            <span className="text-2xl text-neutral-300 dark:text-neutral-600 font-light">–</span>
                                            <span className={`text-3xl sm:text-4xl font-black tracking-tight ${away.score > home.score ? "text-rose-600 dark:text-rose-400" : "text-neutral-800 dark:text-neutral-200"}`}>
                                                {away.score}
                                            </span>
                                        </div>
                                        <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-medium">
                                            {home.score === away.score ? "Empate" : home.score > away.score ? `${home.name} gana` : `${away.name} gana`}
                                        </span>
                                    </div>

                                    {/* Visitante */}
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="p-2 rounded-full bg-white dark:bg-neutral-800 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                                            <img
                                                src={`https://imagecache.365scores.com/image/upload/f_png,w_48,h_48,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v5/Competitors/${away.id}`}
                                                className="w-10 h-10 object-contain"
                                                alt=""
                                            />
                                        </div>
                                        <span className="font-semibold text-xs text-center truncate w-full text-neutral-800 dark:text-neutral-200">
                                            {away.name}
                                        </span>
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>

                {/* Contenido scrolleable */}
                {!loading && !error && game && (
                    <div className="overflow-y-auto max-h-[calc(92vh-200px)] px-5 pb-5 custom-scrollbar scroll-fade">
                        {sortedCategories.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-2 text-neutral-400">
                                <BarChart3 className="w-8 h-8 opacity-40" />
                                <span className="text-sm">Sin estadísticas detalladas</span>
                            </div>
                        ) : (
                            <div className="space-y-5 mt-2">
                                {sortedCategories.map((cat, catIdx) => (
                                    <div
                                        key={cat}
                                        className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                                        style={{ animationDelay: `${catIdx * 40}ms` }}
                                    >
                                        {/* Encabezado categoría */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-neutral-200 to-transparent dark:via-neutral-700" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 px-2">
                                                {cat}
                                            </span>
                                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-neutral-200 to-transparent dark:via-neutral-700" />
                                        </div>

                                        {/* Stats */}
                                        <div className="space-y-3">
                                            {grouped[cat].map((item) => {
                                                const homeVal = parseFloat(item.home?.value) || 0;
                                                const awayVal = parseFloat(item.away?.value) || 0;
                                                const homeWins = homeVal > awayVal;
                                                const awayWins = awayVal > homeVal;
                                                return (
                                                    <div key={item.name}>
                                                        <div className="grid grid-cols-3 items-center gap-2">
                                                            <span className={`text-xs font-bold text-left ${homeWins ? "text-indigo-600 dark:text-indigo-400" : "text-neutral-700 dark:text-neutral-300"}`}>
                                                                {item.home?.value ?? "–"}
                                                            </span>
                                                            <span className="text-[10px] text-center text-neutral-500 dark:text-neutral-400 font-medium truncate">
                                                                {item.name}
                                                            </span>
                                                            <span className={`text-xs font-bold text-right ${awayWins ? "text-rose-600 dark:text-rose-400" : "text-neutral-700 dark:text-neutral-300"}`}>
                                                                {item.away?.value ?? "–"}
                                                            </span>
                                                        </div>
                                                        {renderBar(homeVal, awayVal)}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}