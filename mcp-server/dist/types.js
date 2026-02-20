import { z } from 'zod';
// Zod Schemas for Input Validation
export const CreateAccountSchema = z.object({
    name: z.string().min(1).describe('Company name'),
    industry: z.string().optional().describe('Industry sector'),
    website: z.union([z.string().url(), z.literal('')]).optional().describe('Company website URL'),
    tags: z.array(z.string()).optional().describe('Array of tag names'),
    assigned_to: z.string().uuid().optional().describe('Team member UUID to assign this account to'),
    team_id: z.string().uuid().optional().describe('Team ID this account belongs to'),
});
export const UpdateAccountSchema = z.object({
    id: z.string().uuid().describe('Account ID'),
    name: z.string().min(1).optional().describe('Company name'),
    industry: z.string().optional().describe('Industry sector'),
    website: z.union([z.string().url(), z.literal('')]).optional().describe('Company website URL'),
    tags: z.array(z.string()).optional().describe('Array of tag names'),
    assigned_to: z.string().uuid().nullable().optional().describe('Team member UUID to assign this account to'),
    team_id: z.string().uuid().optional().describe('Team ID this account belongs to'),
});
export const CreateContactSchema = z.object({
    first_name: z.string().min(1).describe('First name'),
    last_name: z.string().min(1).describe('Last name'),
    account_id: z.string().uuid().optional().describe('Associated account ID'),
    email: z.string().email().optional().describe('Email address'),
    phone: z.string().optional().describe('Phone number'),
    role: z.string().optional().describe('Job title or role'),
    tags: z.array(z.string()).optional().describe('Array of tag names'),
    assigned_to: z.string().uuid().optional().describe('Team member UUID to assign this contact to'),
    team_id: z.string().uuid().optional().describe('Team ID this contact belongs to'),
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
    assigned_to: z.string().uuid().nullable().optional().describe('Team member UUID to assign this contact to'),
    team_id: z.string().uuid().optional().describe('Team ID this contact belongs to'),
});
export const CreateDealSchema = z.object({
    name: z.string().min(1).describe('Deal name'),
    account_id: z.string().uuid().optional().describe('Associated account ID'),
    pipeline_id: z.string().uuid().optional().describe('Pipeline ID'),
    amount: z.number().optional().describe('Deal value'),
    stage: z.string().min(1).default('New').describe('Current stage (defaults to "New")'),
    close_date: z.string().optional().describe('Expected close date (YYYY-MM-DD)'),
    status: z.enum(['open', 'won', 'lost']).default('open').describe('Deal status'),
    tags: z.array(z.string()).optional().describe('Array of tag names'),
    assigned_to: z.string().uuid().optional().describe('Team member UUID to assign this deal to'),
    team_id: z.string().uuid().optional().describe('Team ID this deal belongs to'),
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
    assigned_to: z.string().uuid().nullable().optional().describe('Team member UUID to assign this deal to'),
    team_id: z.string().uuid().optional().describe('Team ID this deal belongs to'),
});
export const CreatePipelineSchema = z.object({
    name: z.string().min(1).describe('Pipeline name'),
    stages: z.array(z.string()).min(1).describe('List of pipeline stages'),
    team_id: z.string().uuid().optional().describe('Team ID this pipeline belongs to'),
});
export const UpdatePipelineSchema = z.object({
    id: z.string().uuid().describe('Pipeline ID'),
    name: z.string().min(1).optional().describe('Pipeline name'),
    stages: z.array(z.string()).min(1).optional().describe('List of pipeline stages'),
    team_id: z.string().uuid().optional().describe('Team ID this pipeline belongs to'),
});
const interactionTypes = ['call', 'meeting', 'email', 'note'];
// Map common variations to standard types
function normalizeInteractionType(val) {
    if (!val || typeof val !== 'string')
        return 'note';
    const normalized = val.toLowerCase().trim();
    // Call variations
    if (['call', 'phone', 'phone call', 'phone_call', 'call_task', 'telephone'].includes(normalized)) {
        return 'call';
    }
    // Meeting variations
    if (['meeting', 'meet', 'appointment', 'schedule', 'scheduled'].includes(normalized)) {
        return 'meeting';
    }
    // Email variations
    if (['email', 'mail', 'e-mail', 'message'].includes(normalized)) {
        return 'email';
    }
    // Note/task variations
    if (['note', 'notes', 'task', 'todo', 'to-do', 'reminder', 'follow-up', 'followup', 'follow_up'].includes(normalized)) {
        return 'note';
    }
    // Default to note if unrecognized
    return 'note';
}
export const CreateInteractionSchema = z.object({
    type: z.preprocess(normalizeInteractionType, z.enum(interactionTypes)).describe('Interaction type: call, meeting, email, or note'),
    contact_id: z.string().uuid().optional().describe('Associated contact ID'),
    deal_id: z.string().uuid().optional().describe('Associated deal ID'),
    summary: z.string().optional().describe('Brief summary or title of the interaction/task'),
    transcript: z.string().optional().describe('Full transcript, notes, or detailed description'),
    audio_url: z.string().url().optional().describe('URL to audio recording'),
    sentiment: z.string().optional().describe('Sentiment analysis result'),
    title: z.string().optional().describe('Task title - will be used as summary if summary not provided'),
    description: z.string().optional().describe('Task description - will be used as transcript if transcript not provided'),
    due_date: z.string().optional().describe('Due date for the task in ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)'),
    assigned_to: z.string().uuid().optional().describe('Team member UUID to assign this interaction/task to'),
    team_id: z.string().uuid().optional().describe('Team ID this interaction belongs to'),
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
    assigned_to: z.string().uuid().nullable().optional().describe('Team member UUID to assign this interaction/task to'),
    team_id: z.string().uuid().optional().describe('Team ID this interaction belongs to'),
});
//# sourceMappingURL=types.js.map