import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { FormationGrid } from '../components/FormationGrid';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { AlertDialog } from '../components/AlertDialog';

export const MatchDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isOwner } = useAuth();
    const [match, setMatch] = useState<any>(null);
    const [players, setPlayers] = useState<any[]>([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);

    useEffect(() => {
        const fetchMatchDetails = async () => {
            try {
                const [m, p] = await Promise.all([
                    apiClient.get(`/matches/${id}`),
                    apiClient.get('/players')
                ]);
                setMatch(m);
                setPlayers(p || []);
            } catch (err) {
                console.error('Failed to load match detail', err);
            }
        };
        fetchMatchDetails();
    }, [id]);

    if (!match) return <div className="p-16 text-center text-slate-400">Maç bilgileri yükleniyor...</div>;

    const isWin = match.result === 'Win';
    const isLoss = match.result === 'Loss';
    const resultText = isWin ? 'Galibiyet' : isLoss ? 'Mağlubiyet' : 'Beraberlik';
    const resultColor = isWin ? '#22c55e' : isLoss ? '#ef4444' : '#94a3b8';

    // Helpers to get player names
    const getPlayerName = (pid: string) => {
        const p = players.find(x => x.id === pid);
        return p ? `${p.firstName} ${p.lastName}` : 'Bilinmeyen Oyuncu';
    };

    const confirmDeleteMatch = async () => {
        try {
            await apiClient.delete(`/matches/${id}`);
            navigate('/');
        } catch (err: any) {
            console.error('Failed to delete match', err);
            setShowDeleteConfirm(false);
            setTimeout(() => setAlertMessage(err.message || 'Maç silinemedi.'), 100);
        }
    };

    const handleDeleteMatch = () => {
        setShowDeleteConfirm(true);
    };

    // Calculate average ratings from all owner votes
    const playerAverages: { playerId: string, score: number }[] = [];
    if (match.ratings && match.ratings.length > 0) {
        const sums: Record<string, { total: number, count: number }> = {};
        match.ratings.forEach((rating: any) => {
            if (rating.scores) {
                rating.scores.forEach((s: any) => {
                    if (!sums[s.playerId]) sums[s.playerId] = { total: 0, count: 0 };
                    sums[s.playerId].total += s.score;
                    sums[s.playerId].count += 1;
                });
            }
        });
        Object.keys(sums).forEach(pid => {
            playerAverages.push({
                playerId: pid,
                score: sums[pid].total / sums[pid].count
            });
        });
    }

    return (
        <div className="max-w-[1000px] mx-auto">
            <div className="flex justify-between items-center mb-6">
                <button onClick={() => navigate(-1)} className="btn-secondary px-3 py-1.5 text-sm inline-flex border border-white/10 hover:border-white/20 hover:bg-white/5">
                    ← Geri Dön
                </button>
                {isOwner && (
                    <button onClick={handleDeleteMatch} className="btn-secondary px-3 py-1.5 text-sm inline-flex border border-red-500/30 text-danger hover:bg-red-500/10 hover:border-red-500/50 transition-colors">
                        <Trash2 size={16} className="mr-2" /> Maçı Sil
                    </button>
                )}
            </div>

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="Maçı Sil"
                message="Bu maçı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
                confirmText="Evet, Sil"
                cancelText="İptal"
                onConfirm={confirmDeleteMatch}
                onCancel={() => setShowDeleteConfirm(false)}
            />

            <AlertDialog
                isOpen={!!alertMessage}
                title="İşlem Başarısız"
                message={alertMessage || ''}
                onClose={() => setAlertMessage(null)}
            />

            <div className="glass-panel mb-8 border-b-4" style={{ borderColor: resultColor }}>
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-left">
                        <h1 className="text-3xl font-black mb-1">{match.opponent} Maçı</h1>
                        <p className="text-slate-400">
                            {format(new Date(match.date), 'dd MMMM yyyy, EEEE', { locale: tr })}
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-center">
                            <div className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Bizim Takım</div>
                            <div
                                className="text-6xl font-black tracking-widest leading-none bg-clip-text text-transparent"
                                style={{
                                    background: `linear-gradient(135deg, ${resultColor} 0%, rgba(255,255,255,0.8) 100%)`,
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}
                            >
                                {match.score.for}
                            </div>
                        </div>
                        <span className="text-4xl text-slate-600 font-light">-</span>
                        <div className="text-center">
                            <div className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Rakip</div>
                            <div className="text-6xl font-black text-slate-500 tracking-widest leading-none">
                                {match.score.against}
                            </div>
                        </div>
                    </div>

                    <div
                        className="px-6 py-2 rounded-lg font-bold uppercase tracking-wider"
                        style={{
                            background: `color-mix(in srgb, ${resultColor} 15%, transparent)`,
                            color: resultColor
                        }}
                    >
                        {resultText}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_350px] gap-8">
                <div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        Takım Kadrosu
                    </h2>
                    <div className="glass-panel p-2">
                        <FormationGrid lineup={match.lineup} players={players} />
                    </div>
                </div>

                <div className="flex flex-col gap-8">
                    <div className="glass-panel p-6">
                        <h2 className="text-lg font-bold mb-4 border-b border-white/10 pb-2">Gol ve Asistler</h2>
                        {(() => {
                            const stats: Record<string, { goals: number; assists: number }> = {};
                            (match.events || []).forEach((ev: any) => {
                                if (ev.type === 'goal') {
                                    if (!stats[ev.playerId]) stats[ev.playerId] = { goals: 0, assists: 0 };
                                    stats[ev.playerId].goals++;
                                    if (ev.assistPlayerId) {
                                        if (!stats[ev.assistPlayerId]) stats[ev.assistPlayerId] = { goals: 0, assists: 0 };
                                        stats[ev.assistPlayerId].assists++;
                                    }
                                } else if (ev.type === 'assist') {
                                    if (!stats[ev.playerId]) stats[ev.playerId] = { goals: 0, assists: 0 };
                                    stats[ev.playerId].assists++;
                                }
                            });
                            const entries = Object.entries(stats);
                            return entries.length > 0 ? (
                                <ul className="flex flex-col gap-2">
                                    {entries.map(([pid, s]) => (
                                        <li key={pid} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
                                            <span className="font-semibold text-slate-100">{getPlayerName(pid)}</span>
                                            <div className="flex gap-3 text-sm font-bold">
                                                {s.goals > 0 && <span className="text-success">⚽ {s.goals}</span>}
                                                {s.assists > 0 && <span className="text-primary">🎯 {s.assists}</span>}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-slate-400 text-sm italic">Gol kaydedilmedi.</p>
                            );
                        })()}
                    </div>

                    <div className="glass-panel p-6">
                        <h2 className="text-lg font-bold mb-4 border-b border-white/10 pb-2">Oyuncu Puanlamaları (Ort)</h2>
                        {playerAverages.length > 0 ? (
                            <ul className="flex flex-col gap-2">
                                {playerAverages.map((r: any, i: number) => (
                                    <li key={i} className="flex justify-between items-center py-2 px-3 rounded hover:bg-white/5 transition-colors">
                                        <span className="font-medium">{getPlayerName(r.playerId)}</span>
                                        <span className="bg-slate-900 px-3 py-1 rounded font-bold text-success border border-white/10">
                                            {r.score.toFixed(1)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-slate-400 text-sm italic">Puanlama henüz yapılmadı.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
