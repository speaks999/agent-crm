import { z } from 'zod';

// Database Entity Types
export interface Account {
    id: string;
    name: string;
    industry?: string | null;
    website?: string | null;
    created_at: string;
    updated_at: string;
}

export interface Contact {
    id: string;
    account_id?: string | null;
    first_name: string;
    last_name: string;
    email?: string | null;
    phone?: string | null;
    role?: string | null;
    created_at: string;
    updated_at: string;
}

export interface Deal {
    id: string;
    account_id?: string | null;
    pipeline_id?: string | null;
    name: string;
    amount?: number | null;
    stage: string;
    close_date?: string | null;
    status: 'open' | 'won' | 'lost';
    created_at: string;
    updated_at: string;
}

export interface Pipeline {
    id: string;
    name: string;
    stages: string[];
}

export interface Interaction {
    id: string;
    contact_id?: string | null;
    deal_id?: string | null;
    type: 'call' | 'meeting' | 'email' | 'note';
    summary?: string | null;
    transcript?: string | null;
    audio_url?: string | null;
    sentiment?: string | null;
    created_at: string;
}

// Zod Schemas for Input Validation
export const CreateAccountSchema = z.object({
    name: z.string().min(1).describe('Company name'),
    industry: z.string().optional().describe('Industry sector'),
    website: z.string().url().optional().describe('Company website URL'),
    tags: z.array(z.string()).optional().describe('Array of tag names'),
});

export const UpdateAccountSchema = z.object({
    id: z.string().uuid().describe('Account ID'),
    name: z.string().min(1).optional().describe('Company name'),
    industry: z.string().optional().describe('Industry sector'),
    website: z.string().url().optional().describe('Company website URL'),
    tags: z.array(z.string()).optional().describe('Array of tag names'),
});

export const CreateContactSchema = z.object({
    first_name: z.string().min(1).describe('First name'),
    last_name: z.string().min(1).describe('Last name'),
    account_id: z.string().uuid().optional().describe('Associated account ID'),
    email: z.string().email().optional().describe('Email address'),
    phone: z.string().optional().describe('Phone number'),
    role: z.string().optional().describe('Job title or role'),
    tags: z.array(z.string()).optional().describe('Array of tag names'),
});

export const UpdateContactSchema = z.object({
    id: z.string().uuid().describe('Contact ID'),
    first_name: z.string().min(1).optional().describe('First name'),
    last_name: z.string().min(1).optional().describe('Last name'),
    account_id: z.string().uuid().optional().describe('Associated account ID'),
    email: z.string().email().optional().describe('Email address'),
    phone: z.string().optional().describe('Phone number'),
    role: z.string().optional().describe('Job title or role'),
    tags: z.array(z.string()).optional().describe('Array of tag names'),
});

export const CreateDealSchema = z.object({
    name: z.string().min(1).describe('Deal name'),
    account_id: z.string().uuid().optional().describe('Associated account ID'),
    pipeline_id: z.string().uuid().optional().describe('Pipeline ID'),
    amount: z.number().optional().describe('Deal value'),
    stage: z.string().min(1).describe('Current stage'),
    close_date: z.string().optional().describe('Expected close date (YYYY-MM-DD)'),
    status: z.enum(['open', 'won', 'lost']).default('open').describe('Deal status'),
    tags: z.array(z.string()).optional().describe('Array of tag names'),
});

export const UpdateDealSchema = z.object({
    id: z.string().uuid().describe('Deal ID'),
    name: z.string().min(1).optional().describe('Deal name'),
    account_id: z.string().uuid().optional().describe('Associated account ID'),
    pipeline_id: z.string().uuid().optional().describe('Pipeline ID'),
    amount: z.number().optional().describe('Deal value'),
    stage: z.string().optional().describe('Current stage'),
    close_date: z.string().optional().describe('Expected close date (YYYY-MM-DD)'),
    status: z.enum(['open', 'won', 'lost']).optional().describe('Deal status'),
    tags: z.array(z.string()).optional().describe('Array of tag names'),
});

export const CreatePipelineSchema = z.object({
    name: z.string().min(1).describe('Pipeline name'),
    stages: z.array(z.string()).min(1).describe('List of pipeline stages'),
});

export const UpdatePipelineSchema = z.object({
    id: z.string().uuid().describe('Pipeline ID'),
    name: z.string().min(1).optional().describe('Pipeline name'),
    stages: z.array(z.string()).min(1).optional().describe('List of pipeline stages'),
});

export const CreateInteractionSchema = z.object({
    type: z.enum(['call', 'meeting', 'email', 'note']).describe('Interaction type'),
    contact_id: z.string().uuid().optional().describe('Associated contact ID'),
    deal_id: z.string().uuid().optional().describe('Associated deal ID'),
    summary: z.string().optional().describe('Brief summary'),
    transcript: z.string().optional().describe('Full transcript or notes'),
    audio_url: z.string().url().optional().describe('URL to audio recording'),
    sentiment: z.string().optional().describe('Sentiment analysis result'),
});

export const UpdateInteractionSchema = z.object({
    id: z.string().uuid().describe('Interaction ID'),
    type: z.enum(['call', 'meeting', 'email', 'note']).optional().describe('Interaction type'),
    contact_id: z.string().uuid().optional().describe('Associated contact ID'),
    deal_id: z.string().uuid().optional().describe('Associated deal ID'),
    summary: z.string().optional().describe('Brief summary'),
    transcript: z.string().optional().describe('Full transcript or notes'),
    audio_url: z.string().url().optional().describe('URL to audio recording'),
    sentiment: z.string().optional().describe('Sentiment analysis result'),
});
