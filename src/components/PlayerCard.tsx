import React from 'react';

interface PlayerCardProps {
    player: {
        id: string;
        firstName: string;
        lastName: string;
        number?: number;
        isGuest: boolean;
    };
    stats?: {
        goals: number;
        assists: number;
        matchesPlayed: number;
        averageRating: number;
        averageRatingGiven?: number;
        ratingGivenCount?: number;
    };
    onClick?: () => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, stats, onClick }) => {
    const goalRate = stats?.matchesPlayed ? stats.goals / stats.matchesPlayed : 0;
    const assistRate = stats?.matchesPlayed ? stats.assists / stats.matchesPlayed : 0;
    const ratingGiven = stats?.ratingGivenCount ? stats.averageRatingGiven : null;

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
                {!player.isGuest && (
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xl font-bold text-slate-400">
                        {player.number ?? '-'}
                    </div>
                )}
            </div>

            {stats && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
                    <div className="grid grid-cols-4 gap-2">
                        <StatNumber label="M" value={stats.matchesPlayed} />
                        <StatNumber label="G" value={stats.goals} />
                        <StatNumber label="A" value={stats.assists} />
                        <StatNumber label="Ort" value={formatRating(stats.averageRating)} highlight />
                    </div>

                    <div className="space-y-3">
                        <StatBar
                            label="Gol / maç"
                            value={formatRate(goalRate)}
                            percent={percentOf(goalRate, 1)}
                            barClassName="bg-primary"
                        />
                        <StatBar
                            label="Asist / maç"
                            value={formatRate(assistRate)}
                            percent={percentOf(assistRate, 1)}
                            barClassName="bg-accent"
                        />
                        <StatBar
                            label="Verdiği puan"
                            value={ratingGiven == null ? '-' : formatRating(ratingGiven)}
                            percent={ratingGiven == null ? 0 : percentOf(ratingGiven, 10)}
                            barClassName="bg-violet-400"
                            muted={ratingGiven == null}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

const StatNumber = ({ label, value, highlight = false }: { label: string; value: React.ReactNode; highlight?: boolean }) => (
    <div className="text-center">
        <div className="text-xs text-slate-400">{label}</div>
        <div className={`font-bold ${highlight ? 'text-success' : ''}`}>{value}</div>
    </div>
);

const StatBar = ({
    label,
    value,
    percent,
    barClassName,
    muted = false,
}: {
    label: string;
    value: string;
    percent: number;
    barClassName: string;
    muted?: boolean;
}) => (
    <div>
        <div className="flex items-center justify-between gap-3 text-xs mb-1">
            <span className="text-slate-400 truncate">{label}</span>
            <span className={`font-semibold tabular-nums ${muted ? 'text-slate-500' : 'text-slate-100'}`}>{value}</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden" aria-label={`${label}: ${value}`}>
            <div
                className={`h-full rounded-full ${muted ? 'bg-slate-600' : barClassName}`}
                style={{ width: `${percent}%` }}
            />
        </div>
    </div>
);

const percentOf = (value: number, max: number) => {
    if (!Number.isFinite(value) || max <= 0) return 0;
    return Math.max(0, Math.min(100, (value / max) * 100));
};

const formatRating = (value?: number | null) => {
    if (!value) return '-';
    return value.toFixed(1);
};

const formatRate = (value: number) => {
    if (!Number.isFinite(value) || value === 0) return '0.00';
    if (value >= 10) return value.toFixed(0);
    return value.toFixed(2);
};
