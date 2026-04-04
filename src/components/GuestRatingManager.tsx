import { useState } from 'react';
import { apiClient } from '../api/client';

interface GuestRatingEntry {
    playerId: string;
    playerName: string;
    token: string;
    used: boolean;
}

interface Props {
    matchId: string;
    guestRatingTokens: GuestRatingEntry[];
    onTokensChange: (tokens: GuestRatingEntry[]) => void;
}

function initials(name: string) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
}

export const GuestRatingManager = ({ matchId, guestRatingTokens, onTokensChange }: Props) => {
    const [generating, setGenerating] = useState(false);
    const [copiedToken, setCopiedToken] = useState<string | null>(null);

    const frontendURL = window.location.origin;

    const handleGenerate = async () => {
        if (generating) return;
        setGenerating(true);
        try {
            const result: { playerId: string; playerName: string; token: string; url: string; used: boolean }[] =
                await apiClient.post(`/matches/${matchId}/guest-ratings`, {});
            if (result && result.length > 0) {
                const tokens = result.map(r => ({
                    playerId: r.playerId,
                    playerName: r.playerName,
                    token: r.token,
                    used: r.used,
                }));
                onTokensChange(tokens);
            }
        } catch (err: any) {
            console.error('Failed to generate guest rating links', err);
        } finally {
            setGenerating(false);
        }
    };

    const copyLink = (token: string) => {
        navigator.clipboard.writeText(`${frontendURL}/guest-rate/${token}`);
        setCopiedToken(token);
        setTimeout(() => setCopiedToken(null), 2000);
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Konuk Oyuncu Puanlaması</h2>

            {guestRatingTokens.length === 0 ? (
                <div className="text-center py-4">
                    <p className="text-slate-500 text-xs leading-relaxed mb-3">
                        Kadrodaki konuk oyuncular için puanlama bağlantıları oluşturun.
                    </p>
                    <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={generating}
                        className="px-4 py-2 text-sm font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        {generating ? 'Oluşturuluyor...' : 'Bağlantıları Oluştur'}
                    </button>
                </div>
            ) : (
                <div className="flex flex-wrap gap-3 justify-start">
                    {guestRatingTokens.map(g => (
                        <div
                            key={g.token}
                            className="flex flex-col items-center gap-1.5 w-16 group cursor-pointer"
                            onClick={() => !g.used && copyLink(g.token)}
                            title={g.used ? `${g.playerName} puanladı` : 'Bağlantıyı kopyala'}
                        >
                            <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-white font-bold text-sm shadow-[0_4px_12px_rgba(0,0,0,0.3)] relative transition-transform group-hover:scale-105
                                ${g.used
                                    ? 'bg-amber-800 border-amber-600/50 opacity-60'
                                    : 'bg-amber-600 border-amber-400/90'
                                }`}
                            >
                                {initials(g.playerName)}
                                {g.used && (
                                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full border border-background flex items-center justify-center text-[9px] font-bold">
                                        ✓
                                    </span>
                                )}
                                {copiedToken === g.token && (
                                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap z-10">
                                        Kopyalandı!
                                    </span>
                                )}
                            </div>
                            <div className="text-xs text-center font-semibold text-white bg-black/50 px-1.5 py-0.5 rounded w-full overflow-hidden text-ellipsis whitespace-nowrap">
                                {g.playerName}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
