import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';

export const PlayerRateMatch = () => {
    const { id } = useParams<{ id: string }>();
    const { playerId } = useAuth();
    const navigate = useNavigate();

    const [match, setMatch] = useState<any>(null);
    const [players, setPlayers] = useState<any[]>([]);
    const [scores, setScores] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        Promise.all([
            apiClient.get(`/matches/${id}`),
            apiClient.get('/players'),
        ]).then(([matchData, playersData]: any[]) => {
            setMatch(matchData);

            const lineupIds = new Set((matchData.lineup || []).map((e: any) => e.playerId));
            const lineupPlayers = (playersData || []).filter((p: any) => lineupIds.has(p.id) && p.id !== playerId);
            setPlayers(lineupPlayers);

            const initial: Record<string, number> = {};
            lineupPlayers.forEach((p: any) => { initial[p.id] = 5; });
            setScores(initial);
        }).catch((err: any) => {
            setError(err.message || 'Maç yüklenemedi.');
        }).finally(() => setLoading(false));
    }, [id]);

    const inLineup = match?.lineup?.some((e: any) => e.playerId === playerId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const scoreList = Object.entries(scores).map(([playerId, score]) => ({ playerId, score }));
            await apiClient.post(`/matches/${id}/ratings`, { scores: scoreList });
            navigate('/player');
        } catch (err: any) {
            setError(err.message || 'Puanlama gönderilemedi.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="text-center p-16 text-slate-400">Yükleniyor...</div>;
    }

    if (error) {
        return (
            <div className="max-w-[600px] mx-auto mt-8">
                <div className="glass-panel text-center p-8">
                    <p className="text-danger">{error}</p>
                    <button onClick={() => navigate('/player')} className="btn-secondary mt-4">Geri Dön</button>
                </div>
            </div>
        );
    }

    if (!inLineup) {
        return (
            <div className="max-w-[600px] mx-auto mt-8">
                <div className="glass-panel text-center p-8">
                    <p className="text-slate-400">Bu maçın kadrosunda yer almıyorsun.</p>
                    <button onClick={() => navigate('/player')} className="btn-secondary mt-4">Geri Dön</button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[600px] mx-auto">
            <div className="page-header">
                <h1 className="page-title">Maç Puanlaması</h1>
                <p className="text-slate-400 mt-1">
                    vs {match.opponent} — {new Date(match.date).toLocaleDateString('tr-TR')}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="glass-panel">
                <p className="text-slate-400 mb-6 text-sm">Her oyuncu için 0–10 arası puan ver.</p>

                <div className="space-y-4 mb-8">
                    {players.map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between gap-4">
                            <span className="font-semibold min-w-[140px]">
                                {p.firstName} {p.lastName}
                            </span>
                            <div className="flex items-center gap-3 flex-1">
                                <input
                                    type="range"
                                    min={0}
                                    max={10}
                                    value={scores[p.id] ?? 5}
                                    onChange={(e) => setScores(prev => ({ ...prev, [p.id]: parseInt(e.target.value) }))}
                                    className="flex-1 accent-emerald-500"
                                />
                                <span className="w-6 text-right font-bold text-primary">{scores[p.id] ?? 5}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex gap-3">
                    <button type="submit" className="btn-primary flex-1" disabled={submitting}>
                        {submitting ? 'Gönderiliyor...' : 'Puanlamaları Gönder'}
                    </button>
                    <button type="button" onClick={() => navigate('/player')} className="btn-secondary">
                        İptal
                    </button>
                </div>
            </form>
        </div>
    );
};
