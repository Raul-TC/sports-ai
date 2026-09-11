export function FormationPitch({
    teamName,
    teamId,
    lineup,
    formation,
    roster,
    onPlayerClick,
}: {
    teamName: string;
    teamId: number;
    lineup: any[];
    formation?: string;
    roster: any[];
    onPlayerClick?: (p: any) => void;
}) {
    const starters = (lineup ?? []).filter(
        (p) => p.status === 1 && p.yardFormation
    );

    if (starters.length === 0) {
        return (
            <div className="text-center text-xs text-neutral-400 py-6">
                Sin alineación confirmada
            </div>
        );
    }

    // Merge con roster para nombre / dorsal
    const rosterById = new Map<number, any>();
    for (const p of roster ?? []) rosterById.set(p.id, p);
    const merged = starters.map((p) => ({
        ...p,
        name: p.name ?? rosterById.get(p.id)?.name ?? "—",
        jerseyNumber: p.jerseyNumber ?? rosterById.get(p.id)?.jerseyNumber ?? null,
        athleteId: p.athleteId ?? rosterById.get(p.id)?.athleteId,
    }));

    // Anillo por posición
    const ringByPosition = (posId: number) =>
        posId === 1 ? "ring-amber-300"
            : posId === 2 ? "ring-blue-300"
                : posId === 3 ? "ring-emerald-300"
                    : "ring-rose-300";
    return (
        <div className="space-y-2">
            {/* Header */}
            <div className="flex items-center gap-2">
                <img
                    src={`https://imagecache.365scores.com/image/upload/f_png,w_24,h_24,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v5/Competitors/${teamId}`}
                    className="w-5 h-5 object-contain"
                    alt=""
                />
                <span className="font-semibold text-xs text-neutral-800 dark:text-neutral-200 truncate">
                    {teamName}
                </span>
                {formation && (
                    <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                        {formation}
                    </span>
                )}
            </div>

            {/* Cancha */}
            <div className="relative w-full aspect-[3/4.4] rounded-xl overflow-hidden bg-gradient-to-b from-emerald-600 to-emerald-800 ring-1 ring-emerald-900/40">
                {/* Líneas (sobre el borde, sangradas) */}
                <div className="absolute inset-2 border border-white/25 rounded-sm" />
                <div className="absolute left-2 right-2 top-1/2 h-px bg-white/20" />
                <div className="absolute top-2 bottom-2 left-1/2 w-px bg-white/20" />
                <div className="absolute left-1/2 top-1/2 w-14 h-14 -translate-x-1/2 -translate-y-1/2 border border-white/20 rounded-full" />
                {/* Área grande abajo */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[55%] h-[14%] border border-b-0 border-white/20" />
                {/* Área chica abajo */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[28%] h-[6%] border border-b-0 border-white/20" />
                {/* Área grande arriba */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[55%] h-[14%] border border-t-0 border-white/20" />
                {/* Área chica arriba */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[28%] h-[6%] border border-t-0 border-white/20" />

                {/* Zona de jugadores con padding interno (clave para no cortar) */}
                <div className="absolute inset-x-[14%] inset-y-[8%]">
                    {merged.map((p) => {
                        // fieldLine: 0 (arco propio) → 100 (arco rival). Invertimos para poner GK abajo.
                        const top = `${100 - (p.yardFormation.fieldLine ?? 50)}%`;
                        const left = `${p.yardFormation.fieldSide ?? 50}%`;

                        return (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => onPlayerClick?.(p)}
                                style={{ top, left }}
                                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 group cursor-pointer"
                            >
                                <div className="relative">
                                    <img
                                        src={`https://imagecache.365scores.com/image/upload/f_png,w_48,h_48,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v21/Athletes/${p.athleteId}`}
                                        alt={p.name}
                                        onError={(e) =>
                                            (e.currentTarget.src = "/placeholder-player.png")
                                        }
                                        className={`w-9 h-9 rounded-full object-cover ring-2 ${ringByPosition(p.position?.id ?? -1)} shadow-md group-hover:scale-110 transition-transform`}
                                    />
                                    {p.jerseyNumber != null && p.jerseyNumber > 0 && (
                                        <span className="absolute -bottom-1 -right-1 text-[8px] font-bold bg-neutral-900 text-white rounded-full w-4 h-4 flex items-center justify-center ring-1 ring-white">
                                            {p.jerseyNumber}
                                        </span>
                                    )}
                                </div>
                                <span className="text-[9px] font-semibold text-white bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded whitespace-nowrap">
                                    {p.name.split(" ").slice(-1)[0]}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}