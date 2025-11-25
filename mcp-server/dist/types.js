import { z } from 'zod';
// Zod Schemas for Input Validation
export const CreateAccountSchema = z.object({
    name: z.string().min(1).describe('Company name'),
    industry: z.string().optional().describe('Industry sector'),
    website: z.string().url().optional().describe('Company website URL'),
});
export const UpdateAccountSchema = z.object({
    id: z.string().uuid().describe('Account ID'),
    name: z.string().min(1).optional().describe('Company name'),
    industry: z.string().optional().describe('Industry sector'),
    website: z.string().url().optional().describe('Company website URL'),
});
export const CreateContactSchema = z.object({
    first_name: z.string().min(1).describe('First name'),
    last_name: z.string().min(1).describe('Last name'),
    account_id: z.string().uuid().optional().describe('Associated account ID'),
    email: z.string().email().optional().describe('Email address'),
    phone: z.string().optional().describe('Phone number'),
    role: z.string().optional().describe('Job title or role'),
});
export const UpdateContactSchema = z.object({
    id: z.string().uuid().describe('Contact ID'),
    first_name: z.string().min(1).optional().describe('First name'),
    last_name: z.string().min(1).optional().describe('Last name'),
    account_id: z.string().uuid().optional().describe('Associated account ID'),
    email: z.string().email().optional().describe('Email address'),
    phone: z.string().optional().describe('Phone number'),
    role: z.string().optional().describe('Job title or role'),
});
export const CreateDealSchema = z.object({
    name: z.string().min(1).describe('Deal name'),
    account_id: z.string().uuid().optional().describe('Associated account ID'),
    pipeline_id: z.string().uuid().optional().describe('Pipeline ID'),
    amount: z.number().optional().describe('Deal value'),
    stage: z.string().min(1).describe('Current stage'),
    close_date: z.string().optional().describe('Expected close date (YYYY-MM-DD)'),
    status: z.enum(['open', 'won', 'lost']).default('open').describe('Deal status'),
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
//# sourceMappingURL=types.js.map