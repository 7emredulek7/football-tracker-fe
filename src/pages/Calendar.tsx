import { useEffect, useState } from 'react';
import { Send, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { MatchCalendar } from '../components/MatchCalendar';
import type { CalendarMatch, CalendarRequestMarker } from '../components/MatchCalendar';

const hours = Array.from({ length: 24 }, (_, hour) => hour.toString().padStart(2, '0'));

const toInputDate = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const buildDateTimeIso = (date: string, hour: string) => new Date(`${date}T${hour}:00:00`).toISOString();

export const Calendar = () => {
    const navigate = useNavigate();
    const [matches, setMatches] = useState<CalendarMatch[]>([]);
    const [requests, setRequests] = useState<CalendarRequestMarker[]>([]);
    const [opponent, setOpponent] = useState('');
    const [date, setDate] = useState(toInputDate(new Date()));
    const [hour, setHour] = useState('20');
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const todayKey = toInputDate(new Date());
    const isPastDate = date < todayKey;

    const loadCalendar = async () => {
        const [matchesRes, requestsRes] = await Promise.all([
            apiClient.get('/matches'),
            apiClient.get('/calendar/public-requests'),
        ]);

        const allMatches = ((matchesRes || []) as CalendarMatch[])
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const activeRequests = ((requestsRes || []) as { id: string; opponent: string; requestedDate: string; scheduledDate?: string; status?: string }[])
            .map((request) => ({
                id: request.id,
                opponent: request.opponent,
                date: request.scheduledDate || request.requestedDate,
                status: request.status,
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setMatches(allMatches);
        setRequests(activeRequests);
    };

    useEffect(() => {
        loadCalendar()
            .catch(() => {
                setMatches([]);
                setRequests([]);
            });
    }, []);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsSubmitting(true);
        setMessage(null);
        setError(null);

        if (isPastDate) {
            setError('Geçmiş günler için maç talebi gönderilemez.');
            setIsSubmitting(false);
            return;
        }

        try {
            await apiClient.post('/calendar/requests', {
                opponent: opponent.trim(),
                date: buildDateTimeIso(date, hour),
            });
            setOpponent('');
            setMessage('Talebiniz alındı. Takım sahibi yanıtladığında takvim güncellenecek.');
            await loadCalendar();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Maç talebi gönderilemedi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openRequestModal = (dateKey: string, context: { matches: CalendarMatch[] }) => {
        if (context.matches.length > 0) {
            navigate(`/match/${context.matches[0].id}`);
            return;
        }

        setDate(dateKey);
        setMessage(null);
        setError(null);
        setIsRequestModalOpen(true);
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Maç Takvimi</h1>
                    <p className="text-slate-400 mt-2">Rakip takım talebi gönderin veya yaklaşan maçları kontrol edin.</p>
                </div>
            </div>

            <div className="max-w-[760px]">
                <MatchCalendar
                    matches={matches}
                    requests={requests}
                    title="Maç Takvimi"
                    emptyText="Seçili günde maç veya talep yok."
                    getMatchHref={(match) => `/match/${match.id}`}
                    onDateSelect={openRequestModal}
                />
            </div>

            {isRequestModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <section className="glass-panel w-full max-w-[420px] p-5">
                        <div className="flex items-start justify-between gap-4 mb-5">
                            <div>
                                <h2 className="text-2xl font-bold">Maç Talebi</h2>
                                <p className="text-sm text-slate-400 mt-1">
                                    {new Intl.DateTimeFormat('tr-TR', { dateStyle: 'full' }).format(new Date(`${date}T12:00:00`))}
                                </p>
                            </div>
                            <button
                                type="button"
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                                onClick={() => setIsRequestModalOpen(false)}
                                aria-label="Kapat"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {isPastDate ? (
                            <div>
                                <p className="text-danger text-sm mb-4">Geçmiş günler için maç talebi gönderilemez.</p>
                                <button type="button" className="btn-secondary w-full" onClick={() => setIsRequestModalOpen(false)}>
                                    Kapat
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <label className="block text-sm text-slate-400 mb-2">Takım adı</label>
                                <input
                                    required
                                    className="input-field"
                                    value={opponent}
                                    onChange={(event) => setOpponent(event.target.value)}
                                    placeholder="Örn. Kırmızı Kaplanlar"
                                />

                                <label className="block text-sm text-slate-400 mb-2">Saat</label>
                                <select
                                    className="input-field"
                                    value={hour}
                                    onChange={(event) => setHour(event.target.value)}
                                >
                                    {hours.map((option) => (
                                        <option key={option} value={option}>{option}:00</option>
                                    ))}
                                </select>

                                {message && <p className="text-primary text-sm mb-4">{message}</p>}
                                {error && <p className="text-danger text-sm mb-4">{error}</p>}

                                <button type="submit" className="btn-primary w-full" disabled={isSubmitting || !opponent.trim()}>
                                    <Send size={18} />
                                    {isSubmitting ? 'Gönderiliyor...' : 'Talep Gönder'}
                                </button>
                            </form>
                        )}
                    </section>
                </div>
            )}
        </div>
    );
};
