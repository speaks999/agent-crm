'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Loader2, RefreshCw, Clock, MapPin } from 'lucide-react';

interface Event {
    id: string;
    insightly_id: number;
    title: string;
    start_date_utc: string;
    end_date_utc: string;
    location?: string;
    all_day: boolean;
}

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        fetchEvents();
    }, []);

    async function fetchEvents() {
        try {
            const response = await fetch('/api/insightly/events');
            const data = await response.json();
            setEvents(data);
        } catch (error) {
            console.error('Failed to fetch events:', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function syncEvents() {
        setIsSyncing(true);
        try {
            const response = await fetch('/api/insightly/events/sync', {
                method: 'POST',
            });
            const result = await response.json();
            if (result.success) {
                await fetchEvents();
            }
        } catch (error) {
            console.error('Failed to sync events:', error);
        } finally {
            setIsSyncing(false);
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-indigo-600" size={40} />
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Events</h2>
                    <p className="text-slate-500 mt-1">{events.length} events</p>
                </div>
                <button
                    onClick={syncEvents}
                    disabled={isSyncing}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
                    {isSyncing ? 'Syncing...' : 'Sync from Insightly'}
                </button>
            </div>

            <div className="space-y-4">
                {events.map((event) => (
                    <div
                        key={event.id}
                        className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-indigo-200"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                                <CalendarIcon size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-slate-800">
                                    {event.title}
                                </h3>
                                <div className="flex items-center gap-1 text-sm text-slate-500 mt-2">
                                    <Clock size={14} />
                                    <span>
                                        {new Date(event.start_date_utc).toLocaleString()}
                                        {!event.all_day && ` - ${new Date(event.end_date_utc).toLocaleTimeString()}`}
                                    </span>
                                </div>
                                {event.location && (
                                    <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                                        <MapPin size={14} />
                                        <span>{event.location}</span>
                                    </div>
                                )}
                                {event.all_day && (
                                    <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                        All Day
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {events.length === 0 && (
                <div className="text-center py-12">
                    <CalendarIcon className="mx-auto text-slate-300" size={64} />
                    <p className="text-slate-500 mt-4">No events found</p>
                    <button
                        onClick={syncEvents}
                        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Sync from Insightly
                    </button>
                </div>
            )}
        </div>
    );
}
