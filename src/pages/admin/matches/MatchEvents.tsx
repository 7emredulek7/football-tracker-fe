import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../../api/client';
import { AlertDialog } from '../../../components/AlertDialog';

export const MatchEvents = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [match, setMatch] = useState<any>(null);
    const [players, setPlayers] = useState<any[]>([]);

    // Local state for Events
    const [goalsFor, setGoalsFor] = useState(0);
    const [goalsAgainst, setGoalsAgainst] = useState(0);
    const [playerStats, setPlayerStats] = useState<Record<string, { goals: number; assists: number }>>({});

    const [ratings, setRatings] = useState<Record<string, number>>({});

    const [isSaving, setIsSaving] = useState(false);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);

    useEffect(() => {
        const fetchMatch = async () => {
            try {
                const [m, p] = await Promise.all([
                    apiClient.get(`/matches/${id}`),
                    apiClient.get('/players')
                ]);
                setMatch(m);
                setPlayers(p || []);

                // initialize default rating 6 and zero goals/assists for players who played
                if (m && m.lineup) {
                    const initRatings: Record<string, number> = {};
                    const initStats: Record<string, { goals: number; assists: number }> = {};
                    m.lineup.forEach((l: any) => {
                        initRatings[l.playerId] = 6;
                        initStats[l.playerId] = { goals: 0, assists: 0 };
                    });
                    setRatings({ ...initRatings });
                    setPlayerStats({ ...initStats });
                }
            } catch (err) {
                console.error('Failed to load match for events', err);
            }
        };
        fetchMatch();
    }, [id]);

    if (!match) return <div className="p-16 text-center text-slate-400">Maç bilgileri yükleniyor...</div>;

    const handleSaveAll = async () => {
        setIsSaving(true);
        try {
            // 1. Update Match score
            let result = 'Draw';
            if (goalsFor > goalsAgainst) result = 'Win';
            if (goalsFor < goalsAgainst) result = 'Loss';

            await apiClient.put(`/matches/${id}`, {
                score: { for: goalsFor, against: goalsAgainst },
                result: result
            });

            // 2. Expand per-player stats into individual events
            const expandedEvents: { type: string; playerId: string }[] = [];
            Object.entries(playerStats).forEach(([playerId, stats]) => {
                for (let i = 0; i < stats.goals; i++) expandedEvents.push({ type: 'goal', playerId });
                for (let i = 0; i < stats.assists; i++) expandedEvents.push({ type: 'assist', playerId });
            });
            if (expandedEvents.length > 0) {
                await apiClient.post(`/matches/${id}/events`, expandedEvents);
            }

            // 3. Save ratings
            const scoresArray = Object.keys(ratings).map(pId => ({
                playerId: pId,
                score: ratings[pId]
            }));

            await apiClient.post(`/matches/${id}/ratings`, {
                scores: scoresArray
            });

            navigate(`/match/${id}`);
        } catch (err) {
            console.error(err);
            setAlertMessage('İstatistikler kaydedilemedi.');
        } finally {
            setIsSaving(false);
        }
    };

    // Only players in the lineup
    const activePlayers = players.filter(p => match.lineup.some((l: any) => l.playerId === p.id));

    return (
        <div className="max-w-[800px] mx-auto">
            <div className="page-header mb-4">
                <h1 className="page-title">Maç İstatistikleri ve Puanlamalar</h1>
            </div>
            <p className="text-slate-400 mb-8 text-lg">
                <span className="font-bold text-white">{match.opponent}</span> maçının gollerini kaydedin ve oyunculara puan verin.
            </p>

            <AlertDialog
                isOpen={!!alertMessage}
                title="Hata"
                message={alertMessage || ''}
                onClose={() => setAlertMessage(null)}
            />

            {/* Part 1: Score */}
            <div className="glass-panel mb-8">
                <h2 className="text-xl font-bold mb-4 border-b border-white/10 pb-2">
                    Maç Sonucu
                </h2>
                <div className="flex gap-8 items-center justify-center">
                    <div className="text-center">
                        <label className="block text-success font-black uppercase tracking-widest mb-2">Bizim Takım</label>
                        <input
                            type="number"
                            min="0"
                            value={goalsFor}
                            onChange={e => setGoalsFor(parseInt(e.target.value) || 0)}
                            onFocus={e => e.target.select()}
                            className="p-3 text-5xl w-24 text-center bg-black/20 border border-white/10 text-white rounded-xl focus:outline-none focus:border-success focus:ring-2 focus:ring-success/20 transition-all font-black"
                        />
                    </div>
                    <span className="text-5xl text-slate-600 font-light translate-y-2">-</span>
                    <div className="text-center">
                        <label className="block text-danger font-black uppercase tracking-widest mb-2">Rakip</label>
                        <input
                            type="number"
                            min="0"
                            value={goalsAgainst}
                            onChange={e => setGoalsAgainst(parseInt(e.target.value) || 0)}
                            onFocus={e => e.target.select()}
                            className="p-3 text-5xl w-24 text-center bg-black/20 border border-white/10 text-white rounded-xl focus:outline-none focus:border-danger focus:ring-2 focus:ring-danger/20 transition-all font-black"
                        />
                    </div>
                </div>
            </div>

            {/* Part 2: Goals & Assists per player */}
            <div className="glass-panel mb-8">
                <h2 className="text-xl font-bold mb-6 border-b border-white/10 pb-2">Gol ve Asistler</h2>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
                    {activePlayers.map(p => (
                        <div key={p.id} className="bg-black/20 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                            <div className="font-semibold mb-3">{p.firstName} {p.lastName}</div>
                            <div className="flex gap-3">
                                <div className="flex-1 text-center">
                                    <label className="block text-xs text-success font-bold uppercase tracking-wider mb-1.5">Goller</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={playerStats[p.id]?.goals ?? 0}
                                        onChange={e => setPlayerStats(prev => ({ ...prev, [p.id]: { ...prev[p.id], goals: parseInt(e.target.value) || 0 } }))}
                                        onFocus={e => e.target.select()}
                                        className="w-full p-2 text-center bg-white/10 text-white border border-white/20 rounded-lg outline-none focus:border-success focus:ring-1 focus:ring-success/20 font-bold text-xl transition-all"
                                    />
                                </div>
                                <div className="flex-1 text-center">
                                    <label className="block text-xs text-primary font-bold uppercase tracking-wider mb-1.5">Asistler</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={playerStats[p.id]?.assists ?? 0}
                                        onChange={e => setPlayerStats(prev => ({ ...prev, [p.id]: { ...prev[p.id], assists: parseInt(e.target.value) || 0 } }))}
                                        onFocus={e => e.target.select()}
                                        className="w-full p-2 text-center bg-white/10 text-white border border-white/20 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 font-bold text-xl transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Part 3: Ratings */}
            <div className="glass-panel mb-8">
                <h2 className="text-xl font-bold mb-6 border-b border-white/10 pb-2">
                    Kadroyu Puanla (0-10)
                </h2>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                    {activePlayers.map(p => (
                        <div key={p.id} className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                            <span className="font-semibold">{p.firstName} {p.lastName}</span>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={ratings[p.id]}
                                    onChange={e => setRatings({ ...ratings, [p.id]: parseInt(e.target.value) || 0 })}
                                    className="w-16 p-2 text-center bg-white/10 text-white border border-white/20 rounded-lg outline-none focus:border-primary font-bold text-lg"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <button onClick={handleSaveAll} className="btn-primary w-full text-xl py-4 shadow-[0_8px_24px_rgba(16,185,129,0.3)] hover:-translate-y-1" disabled={isSaving}>
                {isSaving ? 'Maç Kaydediliyor...' : 'Tüm İstatistikleri Kaydet ve Bitir'}
            </button>

        </div>
    );
};
