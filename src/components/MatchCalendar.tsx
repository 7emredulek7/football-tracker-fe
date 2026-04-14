import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Send } from 'lucide-react';

export type CalendarMatch = {
    id: string;
    date: string;
    opponent: string;
};

export type CalendarRequestMarker = {
    id: string;
    date: string;
    opponent: string;
    status?: string;
};

type MatchCalendarProps = {
    matches: CalendarMatch[];
    requests?: CalendarRequestMarker[];
    title?: string;
    emptyText?: string;
    getMatchHref?: (match: CalendarMatch) => string;
    onDateSelect?: (dateKey: string) => void;
};

const weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

const toDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const formatMonth = (date: Date) =>
    new Intl.DateTimeFormat('tr-TR', {
        month: 'long',
        year: 'numeric',
    }).format(date);

const formatTime = (value: string) =>
    new Intl.DateTimeFormat('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));

const getMatchTime = (value: string) => {
    const date = new Date(value);
    const looksDateOnly = date.getUTCHours() === 0 && date.getUTCMinutes() === 0 && date.getUTCSeconds() === 0;
    return looksDateOnly ? null : formatTime(value);
};

export const MatchCalendar = ({
    matches,
    requests = [],
    title = 'Takvim',
    emptyText = 'Bu gün için maç yok.',
    getMatchHref,
    onDateSelect,
}: MatchCalendarProps) => {
    const todayKey = toDateKey(new Date());
    const [visibleMonth, setVisibleMonth] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });
    const [selectedKey, setSelectedKey] = useState(todayKey);

    const matchesByDate = useMemo(() => {
        return matches.reduce<Record<string, CalendarMatch[]>>((acc, match) => {
            const key = toDateKey(new Date(match.date));
            acc[key] = [...(acc[key] || []), match];
            return acc;
        }, {});
    }, [matches]);

    const requestsByDate = useMemo(() => {
        return requests.reduce<Record<string, CalendarRequestMarker[]>>((acc, request) => {
            const key = toDateKey(new Date(request.date));
            acc[key] = [...(acc[key] || []), request];
            return acc;
        }, {});
    }, [requests]);

    const calendarDays = useMemo(() => {
        const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
        const mondayOffset = (firstDay.getDay() + 6) % 7;
        const firstCell = new Date(firstDay);
        firstCell.setDate(firstDay.getDate() - mondayOffset);

        return Array.from({ length: 42 }, (_, index) => {
            const cellDate = new Date(firstCell);
            cellDate.setDate(firstCell.getDate() + index);
            return cellDate;
        });
    }, [visibleMonth]);

    const selectedMatches = matchesByDate[selectedKey] || [];
    const selectedRequests = selectedMatches.length > 0 ? [] : requestsByDate[selectedKey] || [];

    const moveMonth = (direction: -1 | 1) => {
        setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
    };

    const selectDate = (date: Date) => {
        const key = toDateKey(date);
        setSelectedKey(key);
        onDateSelect?.(key);
    };

    return (
        <section className="glass-panel p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <CalendarDays size={21} className="text-primary" />
                    {title}
                </h2>
                <div className="flex items-center justify-between sm:justify-end gap-2">
                    <button
                        type="button"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 transition-colors"
                        onClick={() => moveMonth(-1)}
                        aria-label="Önceki ay"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <div className="min-w-[132px] text-center text-sm font-bold capitalize">
                        {formatMonth(visibleMonth)}
                    </div>
                    <button
                        type="button"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 transition-colors"
                        onClick={() => moveMonth(1)}
                        aria-label="Sonraki ay"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-1.5">
                {weekDays.map((day) => (
                    <div key={day} className="text-center text-[10px] sm:text-xs font-bold text-slate-400 uppercase py-1">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {calendarDays.map((date) => {
                    const key = toDateKey(date);
                    const dayMatches = matchesByDate[key] || [];
                    const dayRequests = dayMatches.length > 0 ? [] : requestsByDate[key] || [];
                    const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
                    const isToday = key === todayKey;
                    const isSelected = key === selectedKey;
                    const hasMatch = dayMatches.length > 0;
                    const hasRequest = dayRequests.length > 0;

                    return (
                        <button
                            type="button"
                            key={key}
                            onClick={() => selectDate(date)}
                            className={`min-h-[42px] sm:min-h-[62px] rounded-lg border p-1.5 text-left transition-colors overflow-hidden
                                ${isSelected ? 'border-primary bg-emerald-500/15' : hasMatch ? 'border-primary/60 bg-emerald-500/10' : hasRequest ? 'border-amber-300/50 bg-amber-500/10' : 'border-white/10 bg-slate-900/35 hover:bg-white/5'}
                                ${isCurrentMonth ? 'text-slate-50' : 'text-slate-600'}
                            `}
                        >
                            <div className="flex items-center justify-between gap-1 mb-1">
                                <span className={`text-xs sm:text-sm font-bold ${isToday ? 'text-primary' : ''}`}>
                                    {date.getDate()}
                                </span>
                                {hasMatch && (
                                    <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                                )}
                                {!hasMatch && hasRequest && (
                                    <span className="h-2 w-2 rounded-full bg-amber-300 shrink-0" />
                                )}
                            </div>
                            <div className="hidden sm:flex flex-col gap-0.5">
                                {dayMatches.slice(0, 1).map((match) => (
                                    <span key={match.id} className="truncate rounded bg-primary/20 px-1 py-0.5 text-[10px] text-primary">
                                        {[getMatchTime(match.date), match.opponent].filter(Boolean).join(' ')}
                                    </span>
                                ))}
                                {dayRequests.slice(0, 1).map((request) => (
                                    <span key={request.id} className="truncate rounded bg-amber-500/15 px-1 py-0.5 text-[10px] text-amber-300">
                                        {formatTime(request.date)} {request.opponent}
                                    </span>
                                ))}
                                {dayMatches.length > 1 && (
                                    <span className="text-[10px] text-slate-400">+{dayMatches.length - 1} maç</span>
                                )}
                                {dayRequests.length > 1 && (
                                    <span className="text-[10px] text-slate-400">+{dayRequests.length - 1} talep</span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="mt-4 border-t border-white/10 pt-3">
                <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="font-bold text-sm sm:text-base">
                        {new Intl.DateTimeFormat('tr-TR', { dateStyle: 'full' }).format(new Date(`${selectedKey}T12:00:00`))}
                    </h3>
                    {selectedMatches.length > 0 && (
                        <span className="px-2.5 py-1 rounded bg-emerald-500/15 text-primary text-xs font-bold">
                            {selectedMatches.length} maç
                        </span>
                    )}
                    {selectedRequests.length > 0 && (
                        <span className="px-2.5 py-1 rounded bg-amber-500/15 text-amber-300 text-xs font-bold">
                            {selectedRequests.length} talep
                        </span>
                    )}
                </div>

                {selectedMatches.length === 0 && selectedRequests.length === 0 ? (
                    <p className="text-slate-400 text-sm">{emptyText}</p>
                ) : (
                    <div className="flex flex-col gap-2">
                        {selectedMatches.map((match) => {
                            const matchTime = getMatchTime(match.date);
                            const content = (
                                <div className="flex items-center justify-between gap-3 rounded-lg bg-white/5 px-3 py-2">
                                    <span className="font-semibold truncate">{match.opponent}</span>
                                    {matchTime && (
                                        <span className="flex items-center gap-1 text-primary text-sm font-semibold shrink-0">
                                            <Clock size={15} />
                                            {matchTime}
                                        </span>
                                    )}
                                </div>
                            );

                            if (!getMatchHref) {
                                return <div key={match.id}>{content}</div>;
                            }

                            return (
                                <Link key={match.id} to={getMatchHref(match)} className="text-white no-underline hover:text-white">
                                    {content}
                                </Link>
                            );
                        })}
                        {selectedRequests.map((request) => (
                            <div key={request.id} className="flex items-center justify-between gap-3 rounded-lg bg-amber-500/10 px-3 py-2">
                                <span className="font-semibold truncate">{request.opponent}</span>
                                <span className="flex items-center gap-1 text-amber-300 text-sm font-semibold shrink-0">
                                    <Send size={15} />
                                    {formatTime(request.date)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};
