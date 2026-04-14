import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, RefreshCw, X } from 'lucide-react';
import { apiClient } from '../../api/client';
import { MatchCalendar } from '../../components/MatchCalendar';
import type { CalendarMatch } from '../../components/MatchCalendar';
import type { CalendarRequestMarker } from '../../components/MatchCalendar';

type CalendarStatus = 'pending' | 'accepted' | 'rejected' | 'rescheduled';

type CalendarRequest = {
    id: string;
    opponent: string;
    requestedDate: string;
    scheduledDate?: string;
    status: CalendarStatus;
    matchId?: string;
};

type DateDraft = {
    date: string;
    hour: string;
};

const hours = Array.from({ length: 24 }, (_, hour) => hour.toString().padStart(2, '0'));

const statusMeta: Record<CalendarStatus, { label: string; className: string }> = {
    pending: { label: 'Bekliyor', className: 'bg-amber-500/20 text-amber-300' },
    accepted: { label: 'Kabul Edildi', className: 'bg-green-500/20 text-primary' },
    rejected: { label: 'Reddedildi', className: 'bg-red-500/20 text-danger' },
    rescheduled: { label: 'Yeni Saat Önerildi', className: 'bg-blue-500/20 text-accent' },
};

const toInputDate = (value: string | Date) => {
    const date = value instanceof Date ? value : new Date(value);
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const toInputHour = (value: string) => new Date(value).getHours().toString().padStart(2, '0');

const buildDateTimeIso = (date: string, hour: string) => new Date(`${date}T${hour}:00:00`).toISOString();

const formatDateTime = (value: string) =>
    new Intl.DateTimeFormat('tr-TR', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));

const effectiveRequestDate = (request: CalendarRequest) => request.scheduledDate || request.requestedDate;

export const AdminCalendar = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState<CalendarRequest[]>([]);
    const [matches, setMatches] = useState<CalendarMatch[]>([]);
    const [drafts, setDrafts] = useState<Record<string, DateDraft>>({});
    const [opponent, setOpponent] = useState('');
    const [date, setDate] = useState(toInputDate(new Date()));
    const [hour, setHour] = useState('20');
    const [busyId, setBusyId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
        const [requestsRes, matchesRes] = await Promise.all([
            apiClient.get('/calendar/requests'),
            apiClient.get('/matches'),
        ]);

        setRequests((requestsRes || []) as CalendarRequest[]);

        const allMatches = ((matchesRes || []) as CalendarMatch[])
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setMatches(allMatches);
    };

    useEffect(() => {
        loadData().catch(() => setError('Takvim verileri yüklenemedi.'));
    }, []);

    const getDraft = (request: CalendarRequest) => {
        const current = effectiveRequestDate(request);
        return drafts[request.id] || {
            date: toInputDate(current),
            hour: toInputHour(current),
        };
    };

    const setDraft = (request: CalendarRequest, nextDraft: Partial<DateDraft>) => {
        setDrafts((current) => ({
            ...current,
            [request.id]: {
                ...getDraft(request),
                ...nextDraft,
            },
        }));
    };

    const handleCreateMatch = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsCreating(true);
        setError(null);

        try {
            await apiClient.post('/calendar/matches', {
                opponent: opponent.trim(),
                date: buildDateTimeIso(date, hour),
            });
            setOpponent('');
            setIsCreateModalOpen(false);
            await loadData();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Maç oluşturulamadı.');
        } finally {
            setIsCreating(false);
        }
    };

    const handleRequestAction = async (request: CalendarRequest, action: 'accept' | 'reject') => {
        setBusyId(`${request.id}-${action}`);
        setError(null);

        try {
            const body = action === 'accept'
                ? { date: buildDateTimeIso(getDraft(request).date, getDraft(request).hour) }
                : {};
            await apiClient.put(`/calendar/requests/${request.id}/${action}`, body);
            await loadData();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Talep güncellenemedi.');
        } finally {
            setBusyId(null);
        }
    };

    const calendarRequests: CalendarRequestMarker[] = requests
        .filter((request) => request.status === 'pending' || request.status === 'rescheduled')
        .map((request) => ({
            id: request.id,
            opponent: request.opponent,
            date: effectiveRequestDate(request),
            status: request.status,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const openCreateMatchModal = (dateKey: string, context: { matches: CalendarMatch[] }) => {
        if (context.matches.length > 0) {
            navigate(`/match/${context.matches[0].id}`);
            return;
        }

        setDate(dateKey);
        setOpponent('');
        setError(null);
        setIsCreateModalOpen(true);
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Takvim Yönetimi</h1>
                    <p className="text-slate-400 mt-2">Maç taleplerini yönetin veya takvimden gün seçerek maç ekleyin.</p>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-danger">
                    {error}
                </div>
            )}

            <div className="max-w-[760px] mb-10">
                <MatchCalendar
                    matches={matches}
                    requests={calendarRequests}
                    title="Maç Takvimi"
                    emptyText="Seçili günde maç veya talep yok."
                    getMatchHref={(match) => `/match/${match.id}`}
                    onDateSelect={openCreateMatchModal}
                />
            </div>

            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <section className="glass-panel w-full max-w-[420px] p-5">
                        <div className="flex items-start justify-between gap-4 mb-5">
                            <div>
                                <h2 className="text-2xl font-bold">Maç Ekle</h2>
                                <p className="text-sm text-slate-400 mt-1">
                                    {new Intl.DateTimeFormat('tr-TR', { dateStyle: 'full' }).format(new Date(`${date}T12:00:00`))}
                                </p>
                            </div>
                            <button
                                type="button"
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                                onClick={() => setIsCreateModalOpen(false)}
                                aria-label="Kapat"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateMatch}>
                            <label className="block text-sm text-slate-400 mb-2">Rakip takım</label>
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

                            <button type="submit" className="btn-primary w-full" disabled={isCreating || !opponent.trim()}>
                                {isCreating ? 'Ekleniyor...' : 'Kabul Edilmiş Maç Ekle'}
                            </button>
                        </form>
                    </section>
                </div>
            )}

            <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <RefreshCw size={24} className="text-primary" />
                    Gelen Talepler
                </h2>
                <div className="flex flex-col gap-4">
                    {requests.map((request) => {
                        const draft = getDraft(request);
                        const canChange = request.status === 'pending' || request.status === 'rescheduled';
                        const meta = statusMeta[request.status];

                        return (
                            <div key={request.id} className="glass-panel p-4">
                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-3 mb-2">
                                            <h3 className="text-xl font-bold">{request.opponent}</h3>
                                            <span className={`px-2.5 py-1 rounded text-xs font-bold ${meta.className}`}>
                                                {meta.label}
                                            </span>
                                        </div>
                                        <p className="text-slate-300">
                                            İstenen saat: <span className="font-semibold text-white">{formatDateTime(request.requestedDate)}</span>
                                        </p>
                                        {request.scheduledDate && (
                                            <p className="text-slate-300">
                                                Yeni saat: <span className="font-semibold text-white">{formatDateTime(request.scheduledDate)}</span>
                                            </p>
                                        )}
                                        {request.matchId && (
                                            <Link to={`/match/${request.matchId}`} className="text-sm text-accent hover:text-blue-300">
                                                Maç detayına git
                                            </Link>
                                        )}
                                    </div>

                                    {canChange && (
                                        <div className="min-w-full lg:min-w-[460px]">
                                            <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-3 mb-3">
                                                <input
                                                    type="date"
                                                    className="input-field !mb-0"
                                                    value={draft.date}
                                                    onChange={(event) => setDraft(request, { date: event.target.value })}
                                                />
                                                <select
                                                    className="input-field !mb-0"
                                                    value={draft.hour}
                                                    onChange={(event) => setDraft(request, { hour: event.target.value })}
                                                >
                                                    {hours.map((option) => (
                                                        <option key={option} value={option}>{option}:00</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="flex flex-wrap gap-3 justify-end">
                                                <button
                                                    type="button"
                                                    className="btn-primary"
                                                    disabled={busyId === `${request.id}-accept`}
                                                    onClick={() => handleRequestAction(request, 'accept')}
                                                >
                                                    <Check size={18} />
                                                    Kabul Et
                                                </button>
                                                <button
                                                    type="button"
                                                    className="bg-red-500/20 text-danger py-3 px-6 rounded-lg font-semibold inline-flex items-center justify-center gap-2 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                                    disabled={busyId === `${request.id}-reject`}
                                                    onClick={() => handleRequestAction(request, 'reject')}
                                                >
                                                    <X size={18} />
                                                    Reddet
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {requests.length === 0 && (
                        <div className="glass-panel text-center py-8 text-slate-400">
                            Gelen maç talebi yok.
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};
