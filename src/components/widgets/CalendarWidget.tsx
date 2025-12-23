'use client';

import React, { useState } from 'react';
import { WidgetWrapper } from './WidgetWrapper';
import { WidgetProps } from './types';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface Event {
    id: string;
    title: string;
    date: Date;
    type: 'meeting' | 'call' | 'deadline';
}

// Mock events - in production these would come from calendar integration
const MOCK_EVENTS: Event[] = [
    { id: '1', title: 'Client Demo', date: new Date(Date.now() + 86400000), type: 'meeting' },
    { id: '2', title: 'Follow-up Call', date: new Date(Date.now() + 172800000), type: 'call' },
    { id: '3', title: 'Proposal Due', date: new Date(Date.now() + 259200000), type: 'deadline' },
    { id: '4', title: 'Team Sync', date: new Date(Date.now() + 345600000), type: 'meeting' },
];

export function CalendarWidget({ config, onRemove, onResize, onSettings, onDragStart, isDragging }: WidgetProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events] = useState<Event[]>(MOCK_EVENTS);

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };
    
    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const isToday = (day: number) => {
        const today = new Date();
        return day === today.getDate() && 
               currentDate.getMonth() === today.getMonth() && 
               currentDate.getFullYear() === today.getFullYear();
    };

    const hasEvent = (day: number) => {
        return events.some(e => {
            const eventDate = new Date(e.date);
            return eventDate.getDate() === day &&
                   eventDate.getMonth() === currentDate.getMonth() &&
                   eventDate.getFullYear() === currentDate.getFullYear();
        });
    };

    const upcomingEvents = events
        .filter(e => e.date >= new Date())
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, 3);

    const getEventColor = (type: Event['type']) => {
        switch (type) {
            case 'meeting': return 'bg-purple-500';
            case 'call': return 'bg-green-500';
            case 'deadline': return 'bg-red-500';
        }
    };

    return (
        <WidgetWrapper config={config} onRemove={onRemove} onResize={onResize} onSettings={onSettings} onDragStart={onDragStart} isDragging={isDragging}>
            <div className="space-y-4">
                {/* Calendar Header */}
                <div className="flex items-center justify-between">
                    <button onClick={prevMonth} className="p-1 hover:bg-muted rounded-md transition-colors">
                        <ChevronLeft size={16} className="text-muted-foreground" />
                    </button>
                    <span className="font-semibold text-foreground text-sm">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </span>
                    <button onClick={nextMonth} className="p-1 hover:bg-muted rounded-md transition-colors">
                        <ChevronRight size={16} className="text-muted-foreground" />
                    </button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 text-center">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                        <div key={i} className="text-xs text-muted-foreground font-medium py-1">{day}</div>
                    ))}
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                        <div key={`empty-${i}`} />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        return (
                            <div
                                key={day}
                                className={`text-xs py-1 rounded-md relative cursor-pointer hover:bg-muted transition-colors ${
                                    isToday(day) ? 'bg-primary text-primary-foreground font-bold' : 'text-foreground'
                                }`}
                            >
                                {day}
                                {hasEvent(day) && (
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Upcoming Events */}
                {config.size !== 'small' && (
                    <div className="border-t border-border pt-3 space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Upcoming</p>
                        {upcomingEvents.map((event) => (
                            <div key={event.id} className="flex items-center gap-2 text-sm">
                                <div className={`w-2 h-2 rounded-full ${getEventColor(event.type)}`} />
                                <span className="text-foreground truncate flex-1">{event.title}</span>
                                <span className="text-xs text-muted-foreground">
                                    {event.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </WidgetWrapper>
    );
}

