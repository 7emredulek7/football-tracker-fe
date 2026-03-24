import { useState } from 'react';
import { apiClient } from '../api/client';

interface WatcherEntry {
    name: string;
    token: string;
    used: boolean;
}

interface Props {
    matchId: string;
    watchers: WatcherEntry[];
    onWatchersChange: (watchers: WatcherEntry[]) => void;
}

function initials(name: string) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
}

export const WatcherManager = ({ matchId, watchers, onWatchersChange }: Props) => {
    const [nameInput, setNameInput] = useState('');
    const [adding, setAdding] = useState(false);
    const [copiedToken, setCopiedToken] = useState<string | null>(null);

    const frontendURL = window.location.origin;

    const handleAdd = async () => {
        const name = nameInput.trim();
        if (!name || adding) return;

        setAdding(true);
        try {
            const result: { name: string; token: string; url: string }[] = await apiClient.post(
                `/matches/${matchId}/watchers`,
                { names: [name] }
            );
            if (result && result.length > 0) {
                onWatchersChange([...watchers, { name: result[0].name, token: result[0].token, used: false }]);
            }
            setNameInput('');
        } catch (err) {
            console.error('Failed to add watcher', err);
        } finally {
            setAdding(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
        }
    };

    const copyLink = (token: string) => {
        navigator.clipboard.writeText(`${frontendURL}/rate/${token}`);
        setCopiedToken(token);
        setTimeout(() => setCopiedToken(null), 2000);
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">İzleyiciler</h2>

            {/* Add row — no <form> to avoid nesting inside parent form */}
            <div className="flex gap-2 mb-4 items-stretch">
                <input
                    type="text"
                    className="input-field flex-1 !mb-0"
                    placeholder="İzleyici adı ekle"
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <button
                    type="button"
                    onClick={handleAdd}
                    disabled={adding || !nameInput.trim()}
                    className="px-4 py-3 text-base font-semibold rounded-lg bg-primary text-white hover:bg-primary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                    {adding ? '...' : 'Ekle'}
                </button>
            </div>

            {/* Watcher circles */}
            {watchers.length === 0 ? (
                <p className="text-slate-500 text-xs text-center py-4 leading-relaxed">
                    Maçı izleyen kişileri ekleyin.<br />Her izleyiciye özel bir bağlantı oluşturulur.
                </p>
            ) : (
                <div className="flex flex-wrap gap-3 justify-start">
                    {watchers.map(w => (
                        <div
                            key={w.token}
                            className="flex flex-col items-center gap-1.5 w-16 group cursor-pointer"
                            onClick={() => !w.used && copyLink(w.token)}
                            title={w.used ? `${w.name} puanladı` : `Bağlantıyı kopyala`}
                        >
                            <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-white font-bold text-sm shadow-[0_4px_12px_rgba(0,0,0,0.3)] relative transition-transform group-hover:scale-105
                                ${w.used
                                    ? 'bg-violet-800 border-violet-600/50 opacity-60'
                                    : 'bg-violet-600 border-violet-400/90'
                                }`}
                            >
                                {initials(w.name)}
                                {w.used && (
                                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full border border-background flex items-center justify-center text-[9px] font-bold">
                                        ✓
                                    </span>
                                )}
                                {copiedToken === w.token && (
                                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap z-10">
                                        Kopyalandı!
                                    </span>
                                )}
                            </div>
                            <div className="text-xs text-center font-semibold text-white bg-black/50 px-1.5 py-0.5 rounded w-full overflow-hidden text-ellipsis whitespace-nowrap">
                                {w.name}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
