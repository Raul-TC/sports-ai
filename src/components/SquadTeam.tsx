import { Shirt, UserCog, AlertCircle } from "lucide-react";

const STATUS_STARTER = 1;
const STATUS_SUB = 2;
const STATUS_MISSING = 3;
const STATUS_MANAGEMENT = 4;

const POSITION_STYLE: Record<number, { label: string; cls: string }> = {
    1: { label: "POR", cls: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300" },
    2: { label: "DEF", cls: "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300" },
    3: { label: "MED", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300" },
    4: { label: "DEL", cls: "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300" },
    0: { label: "DT", cls: "bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200" },
};

function getSeasonStat(member: any, type: number): string | null {
    const s = member?.seasonStats?.find((x: any) => x.type === type);
    return s?.text ?? s?.value ?? null;
}

function getStat(player: any, name: string, fallback = "-"): string {
    if (!player?.stats || !Array.isArray(player.stats)) return fallback;
    const s = player.stats.find((x: any) => x.name === name);
    return s?.value ?? fallback;
}

function PlayerRow({ player, onClick }: { player: any; onClick?: () => void }) {
    const posId = player.position?.id ?? -1;
    const pos = POSITION_STYLE[posId] ?? {
        label: "—",
        cls: "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300",
    };
    const rating = player.ranking ?? 0;

    const seasonApps = getSeasonStat(player, 5);
    const seasonGoals = getSeasonStat(player, 1);
    const seasonAssists = getSeasonStat(player, 2);
    const minutesValue = getStat(player, "Minutes", null as any) || null;

    const ratingCls =
        rating >= 7.5 ? "bg-emerald-500 text-white"
            : rating >= 6.5 ? "bg-amber-500 text-white"
                : rating > 0 ? "bg-neutral-500 text-white"
                    : "bg-neutral-300 dark:bg-neutral-700 text-neutral-500";

    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full text-left flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer"
        >
            <div className="relative shrink-0">
                <img
                    src={`https://imagecache.365scores.com/image/upload/f_png,w_96,h_96,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v21/Athletes/${player.athleteId}`}
                    alt={player.name}
                    onError={(e) => (e.currentTarget.src = "/placeholder-player.png")}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-white dark:ring-neutral-900"
                />
                {rating > 0 && (
                    <span className={`absolute -bottom-0.5 -right-0.5 text-[8px] font-bold rounded-full w-5 h-5 flex items-center justify-center ring-1 ring-white dark:ring-neutral-900 ${ratingCls}`}>
                        {rating.toFixed(1)}
                    </span>
                )}
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${pos.cls}`}>
                        {pos.label}
                    </span>
                    {player.jerseyNumber != null && player.jerseyNumber > 0 && (
                        <span className="text-[9px] font-mono text-neutral-400">
                            #{player.jerseyNumber}
                        </span>
                    )}
                    <span className="text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                        {player.name}
                    </span>
                    {player.hasHighestRanking && (
                        <span className="text-[9px] font-bold text-amber-500">★</span>
                    )}
                </div>

                {(seasonApps || seasonGoals || seasonAssists || minutesValue) && (
                    <div className="flex items-center gap-2 text-[9px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {seasonApps && (
                            <span title="Apariciones">
                                <span className="font-semibold text-neutral-700 dark:text-neutral-300">{seasonApps}</span> PJ
                            </span>
                        )}
                        {seasonGoals && (
                            <span title="Goles">
                                <span className="font-semibold text-neutral-700 dark:text-neutral-300">{seasonGoals}</span> ⚽
                            </span>
                        )}
                        {seasonAssists && (
                            <span title="Asistencias">
                                <span className="font-semibold text-neutral-700 dark:text-neutral-300">{seasonAssists}</span> 🅰
                            </span>
                        )}
                        {minutesValue && (
                            <span className="text-neutral-400 dark:text-neutral-500">
                                · {minutesValue}'
                            </span>
                        )}
                    </div>
                )}
            </div>

            {player.substitution && (
                <span className="text-[9px] text-neutral-400 dark:text-neutral-500 shrink-0 tabular-nums">
                    {player.substitution.type === 1 ? "↓" : "↑"} {player.substitution.time}'
                </span>
            )}
        </button>
    );
}

function MissingPlayerRow({ player, onClick }: { player: any; onClick?: () => void }) {
    const isSusp = !!player.suspension;
    const reason = player.injury?.reason ?? player.suspension?.name ?? "Baja";
    const ret = player.injury?.expectedReturn;

    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full text-left flex items-center gap-2 py-1.5 px-2 rounded-lg bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 hover:bg-rose-100/60 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
        >
            <div className="relative shrink-0">
                <img
                    src={`https://imagecache.365scores.com/image/upload/f_png,w_96,h_96,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v21/Athletes/${player.athleteId}`}
                    alt={player.name}
                    onError={(e) => (e.currentTarget.src = "/placeholder-player.png")}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-rose-200 dark:ring-rose-900/50"
                />
                <span className="absolute -bottom-0.5 -right-0.5 rounded-full w-4 h-4 flex items-center justify-center bg-rose-500 text-white text-[9px] font-bold">
                    {isSusp ? "■" : "✚"}
                </span>
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                        {player.name}
                    </span>
                    {player.jerseyNumber != null && player.jerseyNumber > 0 && (
                        <span className="text-[9px] font-mono text-neutral-400">#{player.jerseyNumber}</span>
                    )}
                </div>
                <div className="text-[9px] text-rose-600 dark:text-rose-400">
                    {reason}
                    {ret && <> · Regreso: {ret}</>}
                </div>
            </div>
        </button>
    );
}

function NotCalledRow({ player, onClick }: { player: any; onClick?: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full text-left flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors opacity-75 cursor-pointer"
        >
            <img
                src={`https://imagecache.365scores.com/image/upload/f_png,w_96,h_96,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v21/Athletes/${player.athleteId}`}
                alt={player.name}
                onError={(e) => (e.currentTarget.src = "/placeholder-player.png")}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-neutral-900"
            />
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                    {player.jerseyNumber != null && player.jerseyNumber > 0 && (
                        <span className="text-[9px] font-mono text-neutral-400">#{player.jerseyNumber}</span>
                    )}
                    <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 truncate">
                        {player.name}
                    </span>
                </div>
            </div>
        </button>
    );
}

export function SquadTeam({
    teamName,
    teamId,
    roster,
    lineup,
    onPlayerClick,
}: {
    teamName: string;
    teamId: number;
    roster: any[];
    lineup: any[];
    onPlayerClick?: (p: any) => void;
}) {
    const teamRoster = (roster ?? []).filter((p) => p.competitorId === teamId);
    const lineupCompetitorId = lineup?.[0]?.competitorId;
    // Join por id (el lineup y el roster comparten id, no athleteId)
    const lineupById = new Map<number, any>();
    for (const l of lineup ?? []) {
        if (l.id != null) lineupById.set(l.id, l);
    }
    const effectiveTeamId =
        lineupCompetitorId ??
        (roster ?? []).find((p: any) => p.competitorId === teamId)?.competitorId ??
        teamId;
    const starters: any[] = [];
    const subs: any[] = [];
    const missing: any[] = [];
    const coach: any[] = [];
    const notCalled: any[] = [];

    for (const p of teamRoster) {
        const l = lineupById.get(p.id);
        if (!l) {
            notCalled.push(p);
            continue;
        }
        const merged = { ...p, ...l, name: p.name ?? l.name ?? "—" };
        if (l.status === STATUS_STARTER) starters.push(merged);
        else if (l.status === STATUS_SUB) subs.push(merged);
        else if (l.status === STATUS_MISSING) missing.push(merged);
        else if (l.status === STATUS_MANAGEMENT) coach.push(merged);
        else notCalled.push(merged);
    }

    // Si el roster no trae DT, lo sacamos del lineup
    if (coach.length === 0) {
        for (const l of lineup ?? []) {
            if (l.status === STATUS_MANAGEMENT) {
                coach.push({ ...l, name: l.name ?? "Entrenador" });
            }
        }
    }

    const totalCount = teamRoster.length;

    if (totalCount === 0) {
        return (
            <div className="text-center text-xs text-neutral-400 py-6">
                Sin plantilla disponible para {teamName}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Encabezado */}
            <div className="flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <img
                    src={`https://imagecache.365scores.com/image/upload/f_png,w_24,h_24,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v5/Competitors/${teamId}`}
                    className="w-5 h-5 object-contain"
                    alt=""
                />
                <span className="font-semibold text-xs text-neutral-800 dark:text-neutral-200 truncate">
                    {teamName}
                </span>
                <span className="ml-auto text-[10px] text-neutral-400 tabular-nums">
                    {totalCount} jugadores
                </span>
            </div>

            {/* DT */}
            {coach.length > 0 && (
                <div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1 flex items-center gap-1">
                        <UserCog className="w-3 h-3" /> Cuerpo técnico
                    </div>
                    <div className="space-y-0.5">
                        {coach.map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => onPlayerClick?.(p)}
                                className="w-full text-left flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer"
                            >
                                <img
                                    src={`https://imagecache.365scores.com/image/upload/f_png,w_96,h_96,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v21/Athletes/${p.athleteId}`}
                                    alt={p.name}
                                    onError={(e) => (e.currentTarget.src = "/placeholder-player.png")}
                                    className="w-9 h-9 rounded-full object-cover ring-2 ring-amber-300/70 dark:ring-amber-700/50"
                                />
                                <div className="text-[11px] font-semibold text-neutral-800 dark:text-neutral-200">
                                    {p.name}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Titulares */}
            {starters.length > 0 && (
                <div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1">
                        <Shirt className="w-3 h-3" /> Titulares · {starters.length}
                    </div>
                    <div className="space-y-0.5">
                        {starters.map((p) => (
                            <PlayerRow key={p.id} player={p} onClick={() => onPlayerClick?.(p)} />
                        ))}
                    </div>
                </div>
            )}

            {/* Banca */}
            {subs.length > 0 && (
                <div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-1">
                        Banca · {subs.length}
                    </div>
                    <div className="space-y-0.5">
                        {subs.map((p) => (
                            <PlayerRow key={p.id} player={p} onClick={() => onPlayerClick?.(p)} />
                        ))}
                    </div>
                </div>
            )}

            {/* Bajas */}
            {missing.length > 0 && (
                <div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Bajas · {missing.length}
                    </div>
                    <div className="space-y-1">
                        {missing.map((p) => (
                            <MissingPlayerRow key={p.id} player={p} onClick={() => onPlayerClick?.(p)} />
                        ))}
                    </div>
                </div>
            )}

            {/* Resto del plantel */}
            {notCalled.length > 0 && (
                <details className="group">
                    <summary className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 cursor-pointer hover:text-neutral-600 dark:hover:text-neutral-300 list-none flex items-center gap-1">
                        <span className="group-open:rotate-90 transition-transform inline-block">▸</span>
                        Resto del plantel · {notCalled.length}
                    </summary>
                    <div className="space-y-0.5 mt-1">
                        {notCalled.map((p) => (
                            <NotCalledRow key={p.id} player={p} onClick={() => onPlayerClick?.(p)} />
                        ))}
                    </div>
                </details>
            )}
        </div>
    );
}