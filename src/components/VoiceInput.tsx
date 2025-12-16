'use client';

import React, { useState } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

export default function VoiceInput() {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transcript, setTranscript] = useState('');

    const handleVoiceInput = async () => {
        if (isRecording) {
            // Stop recording
            setIsRecording(false);
            setIsProcessing(true);

            // For now, we'll use a text input fallback
            // In production, you'd integrate with Web Speech API or a service like Deepgram
            const userInput = prompt('Enter your sales interaction (voice input coming soon):');

            if (userInput) {
                setTranscript(userInput);

                try {
                    const response = await fetch('/api/agent/scribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: userInput }),
                    });

                    const result = await response.json();

                    if (result.success) {
                        alert(`✅ Data saved!\n\nSummary: ${result.data.summary}\nSentiment: ${result.data.sentiment}`);
                    } else {
                        alert('❌ Error saving data');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('❌ Error processing request');
                }
            }

            setIsProcessing(false);
        } else {
            // Start recording
            setIsRecording(true);
        }
    };

    return (
        <div className="fixed bottom-8 left-8 z-50">
            <button
                onClick={handleVoiceInput}
                disabled={isProcessing}
                className={`w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${isRecording
                    ? 'bg-destructive hover:bg-destructive/90 animate-pulse'
                    : isProcessing
                        ? 'bg-muted cursor-not-allowed'
                        : 'bg-primary hover:bg-primary-glow'
                    } text-primary-foreground`}
            >
                {isProcessing ? (
                    <Loader2 size={32} className="animate-spin" />
                ) : isRecording ? (
                    <MicOff size={32} />
                ) : (
                    <Mic size={32} />
                )}
            </button>
        </div>
    );
}
