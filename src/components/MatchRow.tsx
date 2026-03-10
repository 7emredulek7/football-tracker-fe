import React from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface MatchRowProps {
    match: {
        id: string;
        date: string;
        opponent: string;
        score: {
            for: number;
            against: number;
        };
        result: string;
    };
    onClick?: () => void;
}

export const MatchRow: React.FC<MatchRowProps> = ({ match, onClick }) => {
    const isWin = match.result === 'Win';
    const isLoss = match.result === 'Loss';

    // Mapping statuses to Turkish 
    const resultText = isWin ? 'Galibiyet' : isLoss ? 'Mağlubiyet' : 'Beraberlik';

    const resultBorderColor = isWin ? 'border-l-success' : isLoss ? 'border-l-danger' : 'border-l-slate-400';
    const resultTextColor = isWin ? 'text-success' : isLoss ? 'text-danger' : 'text-slate-400';
    const resultBgColor = isWin ? 'bg-green-500/10' : isLoss ? 'bg-red-500/10' : 'bg-slate-400/10';

    return (
        <div
            className={`glass-panel flex justify-between items-center p-4 mb-3 border-l-4 ${resultBorderColor} ${onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5' : ''}`}
            onClick={onClick}
        >
            <div>
                <div className="text-sm text-slate-400 mb-1">
                    {format(new Date(match.date), 'dd MMM yyyy', { locale: tr })}
                </div>
                <div className="text-xl font-bold">
                    {match.opponent} Maçı
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="text-2xl font-black tracking-widest">
                    {match.score.for} - {match.score.against}
                </div>
                <div className={`px-3 py-1 rounded box-border font-bold text-sm uppercase ${resultBgColor} ${resultTextColor}`}>
                    {resultText}
                </div>
            </div>
        </div>
    );
};
