import React from 'react';

interface PositionEntry {
    position: string;
    playerId: string;
}

interface Player {
    id: string;
    firstName: string;
    lastName: string;
    number: number;
}

interface FormationGridProps {
    lineup: PositionEntry[];
    players: Player[];
    onPositionClick?: (position: string) => void;
    interactive?: boolean;
}

// Map the grid sections to their respective position identifiers
const GRID_ROWS = [
    { id: 'F', label: 'Forvet', slots: ['F1', 'F2', 'F3'] },
    { id: 'M', label: 'Orta Saha', slots: ['M1', 'M2', 'M3', 'M4'] },
    { id: 'D', label: 'Defans', slots: ['D1', 'D2', 'D3'] },
    { id: 'GK', label: 'Kaleci', slots: ['GK'] },
];

export const FormationGrid: React.FC<FormationGridProps> = ({
    lineup,
    players,
    onPositionClick,
    interactive = false
}) => {

    const getPlayerInPosition = (position: string) => {
        const entry = lineup.find(l => l.position === position);
        if (!entry) return null;
        return players.find(p => p.id === entry.playerId) || null;
    };

    return (
        <div className="bg-gradient-to-b from-primary/10 to-primary/5 border border-primary/20 rounded-2xl py-8 px-4 flex flex-col gap-10 relative overflow-hidden min-h-[600px] justify-between">
            {/* Field lines aesthetic */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10 -translate-y-1/2" />
            <div className="absolute top-1/2 left-1/2 w-24 h-24 border-2 border-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />

            {GRID_ROWS.map((row) => (
                <div key={row.id} className="flex justify-center gap-4 relative z-10 w-full">
                    {row.slots.map(slot => {
                        const player = getPlayerInPosition(slot);
                        const isActive = !!player;

                        return (
                            <div
                                key={slot}
                                onClick={() => onPositionClick && onPositionClick(slot)}
                                className={`w-20 flex flex-col items-center gap-2 transition-all duration-200 
                  ${interactive ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
                  ${isActive || interactive ? 'opacity-100' : 'opacity-40'}
                  ${interactive && !isActive ? 'scale-95' : ''}
                `}
                            >
                                <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-white font-bold text-lg
                  ${isActive
                                        ? (slot === 'GK' ? 'bg-accent border-white/90 shadow-[0_4px_12px_rgba(0,0,0,0.3)]' : 'bg-primary border-white/90 shadow-[0_4px_12px_rgba(0,0,0,0.3)]')
                                        : 'bg-white/10 border-white/20'
                                    }
                `}>
                                    {isActive ? player.number : '+'}
                                </div>

                                <div className={`text-xs text-center px-1.5 py-0.5 rounded
                  ${isActive ? 'font-semibold text-white bg-black/50 overflow-hidden text-ellipsis whitespace-nowrap max-w-full' : 'text-slate-400 font-normal'}
                `}>
                                    {isActive ? player.firstName : slot}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};
