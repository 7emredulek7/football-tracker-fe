import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../api/client';

export const GuestRatePage = () => {
    const { token } = useParams<{ token: string }>();

    const [context, setContext] = useState<any>(null);
    const [players, setPlayers] = useState<any[]>([]);
    const [scores, setScores] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        Promise.all([
            apiClient.get(`/guest-ratings/${token}`),
            apiClient.get('/players'),
        ]).then(([ctx, playersData]: any[]) => {
            setContext(ctx);

            const lineupIds = new Set((ctx.lineup || []).map((e: any) => e.playerId));
            // Exclude the guest player themselves (self-rating prevention)
            const lineupPlayers = (playersData || []).filter(
                (p: any) => lineupIds.has(p.id) && p.id !== ctx.playerId
            );
            setPlayers(lineupPlayers);

            const initial: Record<string, number> = {};
            lineupPlayers.forEach((p: any) => { initial[p.id] = 5; });
            setScores(initial);
        }).catch((err: any) => {
            setError(err.message || 'Geçersiz veya hatalı bağlantı.');
        }).finally(() => setLoading(false));
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const scoreList = Object.entries(scores).map(([playerId, score]) => ({ playerId, score }));
            await apiClient.post(`/guest-ratings/${token}/ratings`, { scores: scoreList });
            setSubmitted(true);
        } catch (err: any) {
            setError(err.message || 'Puanlama gönderilemedi.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-slate-400">Yükleniyor...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="glass-panel max-w-md w-full text-center p-8">
                    <div className="text-4xl mb-4">🔗</div>
                    <h1 className="text-xl font-bold mb-2">Geçersiz Bağlantı</h1>
                    <p className="text-slate-400 text-sm">{error}</p>
                </div>
            </div>
        );
    }

    if (context?.alreadyRated || submitted) {
        const name = context?.playerName ?? '';
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="glass-panel max-w-md w-full text-center p-8">
                    <div className="text-4xl mb-4">✅</div>
                    <h1 className="text-xl font-bold mb-2">
                        {submitted ? `Teşekkürler, ${name}!` : 'Zaten Puanladınız'}
                    </h1>
                    <p className="text-slate-400 text-sm">
                        {submitted
                            ? 'Puanlamalarınız başarıyla kaydedildi.'
                            : 'Bu maç için daha önce puanlama gönderdiniz.'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-8 px-4">
            <div className="max-w-[600px] mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-black mb-1">
                        <span className="text-white">Maç </span>
                        <span className="text-primary">Puanlaması</span>
                    </h1>
                    <p className="text-slate-400">
                        vs {context.opponent} — {new Date(context.date).toLocaleDateString('tr-TR')}
                    </p>
                    <p className="text-slate-500 text-sm mt-1">
                        Puanlayan: <span className="text-white font-semibold">{context.playerName}</span>
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
                                        onChange={e => setScores(prev => ({ ...prev, [p.id]: parseInt(e.target.value) }))}
                                        className="flex-1 accent-emerald-500"
                                    />
                                    <span className="w-6 text-right font-bold text-primary">{scores[p.id] ?? 5}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button type="submit" className="btn-primary w-full" disabled={submitting}>
                        {submitting ? 'Gönderiliyor...' : 'Puanlamaları Gönder'}
                    </button>
                </form>
            </div>
        </div>
    );
};
