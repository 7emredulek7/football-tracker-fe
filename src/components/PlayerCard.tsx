import React from 'react';

interface PlayerCardProps {
    player: {
        id: string;
        firstName: string;
        lastName: string;
        number: number;
        isGuest: boolean;
    };
    stats?: {
        goals: number;
        assists: number;
        matchesPlayed: number;
        averageRating: number;
    };
    onClick?: () => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, stats, onClick }) => {
    return (
        <div
            className={`glass-panel relative overflow-hidden border-t-4 ${player.isGuest ? 'border-t-accent' : 'border-t-primary'} ${onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all' : ''}`}
            onClick={onClick}
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-bold">
                        {player.firstName} {player.lastName}
                    </h3>
                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${player.isGuest ? 'bg-blue-500/20 text-accent' : 'bg-green-500/20 text-primary'}`}>
                        {player.isGuest ? 'Misafir' : 'Kadro'}
                    </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xl font-bold text-slate-400">
                    {player.number}
                </div>
            </div>

            {stats && (
                <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-white/10">
                    <div className="text-center">
                        <div className="text-xs text-slate-400">M</div>
                        <div className="font-bold">{stats.matchesPlayed}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xs text-slate-400">G</div>
                        <div className="font-bold">{stats.goals}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xs text-slate-400">A</div>
                        <div className="font-bold">{stats.assists}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xs text-slate-400">Ort</div>
                        <div className="font-bold text-success">
                            {stats.averageRating ? stats.averageRating.toFixed(1) : '-'}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
