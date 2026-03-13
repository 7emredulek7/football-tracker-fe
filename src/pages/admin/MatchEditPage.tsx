import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { FormationGrid } from '../../components/FormationGrid';
import { AlertDialog } from '../../components/AlertDialog';

export const MatchEditPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [players, setPlayers] = useState<any[]>([]);
    const [lineup, setLineup] = useState<{ position: string; playerId: string }[]>([]);
    const [opponent, setOpponent] = useState('');
    const [date, setDate] = useState('');
    const [goalsFor, setGoalsFor] = useState(0);
    const [goalsAgainst, setGoalsAgainst] = useState(0);
    const [playerStats, setPlayerStats] = useState<Record<string, { goals: number; assists: number }>>({});

    const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [match, p] = await Promise.all([
                    apiClient.get(`/matches/${id}`),
                    apiClient.get('/players'),
                ]);
                setPlayers(p || []);
                setOpponent(match.opponent || '');
                setDate(match.date ? match.date.split('T')[0] : new Date().toISOString().split('T')[0]);
                setLineup(match.lineup || []);
                setGoalsFor(match.score?.for ?? 0);
                setGoalsAgainst(match.score?.against ?? 0);

                // Aggregate existing events into per-player stats
                const stats: Record<string, { goals: number; assists: number }> = {};
                (match.lineup || []).forEach((l: any) => {
                    stats[l.playerId] = { goals: 0, assists: 0 };
                });
                (match.events || []).forEach((ev: any) => {
                    if (!stats[ev.playerId]) stats[ev.playerId] = { goals: 0, assists: 0 };
                    if (ev.type === 'goal') stats[ev.playerId].goals++;
                    else if (ev.type === 'assist') stats[ev.playerId].assists++;
                });
                setPlayerStats(stats);
            } catch (err) {
                console.error('Failed to load match for editing', err);
            }
        };
        fetchData();
    }, [id]);

    const handlePositionClick = (position: string) => {
        setSelectedPosition(position);
    };

    const handleAssignPlayer = (playerId: string) => {
        if (!selectedPosition) return;
        let newLineup = lineup.filter(l => l.playerId !== playerId);
        newLineup = newLineup.filter(l => l.position !== selectedPosition);
        newLineup.push({ position: selectedPosition, playerId });
        setLineup(newLineup);

        // Ensure stats entry exists for newly added player
        setPlayerStats(prev => ({
            ...prev,
            [playerId]: prev[playerId] ?? { goals: 0, assists: 0 },
        }));

        setSelectedPosition(null);
    };

    const clearPosition = () => {
        if (!selectedPosition) return;
        setLineup(lineup.filter(l => l.position !== selectedPosition));
        setSelectedPosition(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!opponent) return;

        setIsSaving(true);
        try {
            let result = 'Draw';
            if (goalsFor > goalsAgainst) result = 'Win';
            if (goalsFor < goalsAgainst) result = 'Loss';

            // Expand per-player stats back into individual event objects
            const expandedEvents: { type: string; playerId: string }[] = [];
            Object.entries(playerStats).forEach(([playerId, stats]) => {
                for (let i = 0; i < stats.goals; i++) expandedEvents.push({ type: 'goal', playerId });
                for (let i = 0; i < stats.assists; i++) expandedEvents.push({ type: 'assist', playerId });
            });

            await apiClient.put(`/matches/${id}`, {
                date: new Date(date).toISOString(),
                opponent,
                lineup,
                score: { for: goalsFor, against: goalsAgainst },
                result,
                events: expandedEvents,
            });

            navigate(`/match/${id}`);
        } catch (err) {
            console.error('Failed to update match', err);
            setAlertMessage('Maç güncellenemedi.');
            setIsSaving(false);
        }
    };

    const activePlayers = players.filter(p => lineup.some(l => l.playerId === p.id));

    return (
        <div>
            <div className="page-header mb-8">
                <h1 className="page-title">Maçı Düzenle</h1>
            </div>

            <AlertDialog
                isOpen={!!alertMessage}
                title="Hata"
                message={alertMessage || ''}
                onClose={() => setAlertMessage(null)}
            />

            <form onSubmit={handleSave}>
                {/* Date & Opponent */}
                <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6 mb-6">
                    <div>
                        <label className="block mb-2 text-slate-400">Tarih</label>
                        <input
                            type="date"
                            required
                            className="input-field"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-slate-400">Rakip Takım İsmi</label>
                        <input
                            type="text"
                            required
                            placeholder="Örn. Kırmızı Kaplanlar"
                            className="input-field"
                            value={opponent}
                            onChange={e => setOpponent(e.target.value)}
                        />
                    </div>
                </div>

                {/* Score */}
                <div className="glass-panel mb-8">
                    <h2 className="text-xl font-bold mb-4 border-b border-white/10 pb-2">Maç Sonucu</h2>
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

                {/* Lineup */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 mb-8">
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Kadro</h2>
                        <FormationGrid
                            lineup={lineup}
                            players={players}
                            interactive={true}
                            onPositionClick={handlePositionClick}
                        />
                    </div>

                    <div className="glass-panel self-start">
                        <h2 className="text-xl font-bold mb-4 border-b border-white/10 pb-2">
                            {selectedPosition ? `${selectedPosition} Pozisyonunu Değiştir` : 'Seçmek için tıkla'}
                        </h2>
                        {selectedPosition ? (
                            <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2">
                                <button
                                    type="button"
                                    onClick={clearPosition}
                                    className="p-3 bg-red-500/10 text-danger border border-red-500/20 rounded-lg text-left cursor-pointer mb-4 hover:bg-red-500/20 transition-colors"
                                >
                                    Pozisyonu temizle
                                </button>
                                {players.map(p => {
                                    const isAssigned = lineup.some(l => l.playerId === p.id && l.position !== selectedPosition);
                                    return (
                                        <button
                                            type="button"
                                            key={p.id}
                                            onClick={() => handleAssignPlayer(p.id)}
                                            className={`p-3 rounded-lg text-left cursor-pointer flex justify-between items-center transition-colors
                                                ${isAssigned ? 'bg-white/5 text-slate-400 opacity-50' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                                        >
                                            <span className="font-medium">{p.firstName} {p.lastName}</span>
                                            <span className="text-primary font-bold">#{p.number}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Kadroyu değiştirmek için bir pozisyona tıklayın.
                            </p>
                        )}
                    </div>
                </div>

                {/* Goals & Assists */}
                {activePlayers.length > 0 && (
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
                )}

                <div className="flex gap-4">
                    <button type="button" onClick={() => navigate(`/match/${id}`)} className="btn-secondary">
                        İptal
                    </button>
                    <button type="submit" className="btn-primary" disabled={isSaving || !opponent}>
                        {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                    </button>
                </div>
            </form>
        </div>
    );
};
