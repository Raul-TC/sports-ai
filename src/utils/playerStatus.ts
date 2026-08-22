// utils/playerStatus.ts
export interface PlayerStatus {
    id: number;
    name: string;
    position: string;
    status: 'injury' | 'suspension' | 'doubtful';
    reason: string;
    expectedReturn?: string;
    ranking: number;
    importance: 'high' | 'medium' | 'low';
    imageVersion?: number;
    athleteId?: number;
}

export function extractMissingPlayers(
    competitor: any,
    allMembers: any[] // la lista completa de miembros del juego
): PlayerStatus[] {
    const lineupsMembers = competitor || [];
    const missing: PlayerStatus[] = [];

    // Crear un mapa de miembros por ID para búsqueda rápida
    const membersMap = new Map<number, any>();
    for (const m of allMembers) {
        membersMap.set(m.id, m);
    }

    for (const member of lineupsMembers) {
        if (member.status !== 3 && member.status !== 5) continue;

        const position = member.position?.name || 'Desconocida';
        const ranking = member.ranking || 0;

        // Buscar el miembro completo en la lista de members del juego
        const fullMember = membersMap.get(member.id);
        const name = fullMember?.name || member.name || `Jugador ${member.id}`;
        const athleteId = fullMember?.athleteId || member.athleteId;
        const imageVersion = fullMember?.imageVersion || member.imageVersion;

        let importance: 'high' | 'medium' | 'low' = 'low';
        const isForward = position.includes('Delantero');
        const isGoalkeeper = position.includes('Portero');
        if (ranking >= 7.0 || (isForward && ranking >= 6.5) || isGoalkeeper) {
            importance = 'high';
        } else if (ranking >= 6.0) {
            importance = 'medium';
        }

        let status: 'injury' | 'suspension' | 'doubtful' = 'injury';
        let reason = '';
        let expectedReturn = undefined;

        if (member.injury) {
            status = member.status === 5 ? 'doubtful' : 'injury';
            reason = member.injury.reason || 'Lesión';
            expectedReturn = member.injury.expectedReturn;
        } else if (member.suspension) {
            status = 'suspension';
            reason = member.suspension.name || 'Sanción';
        }

        missing.push({
            id: member.id,
            name,
            position,
            status,
            reason,
            expectedReturn,
            ranking,
            importance,
            imageVersion,
            athleteId,
        });
    }

    return missing;
}