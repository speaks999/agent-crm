import { z } from 'zod';
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
export declare const CreateAccountSchema: z.ZodObject<{
    name: z.ZodString;
    industry: z.ZodOptional<z.ZodString>;
    website: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodLiteral<"">]>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    assigned_to: z.ZodOptional<z.ZodString>;
    team_id: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const UpdateAccountSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    industry: z.ZodOptional<z.ZodString>;
    website: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodLiteral<"">]>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    assigned_to: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    team_id: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const CreateContactSchema: z.ZodObject<{
    first_name: z.ZodString;
    last_name: z.ZodString;
    account_id: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    assigned_to: z.ZodOptional<z.ZodString>;
    team_id: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const UpdateContactSchema: z.ZodObject<{
    id: z.ZodString;
    first_name: z.ZodOptional<z.ZodString>;
    last_name: z.ZodOptional<z.ZodString>;
    account_id: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    assigned_to: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    team_id: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const CreateDealSchema: z.ZodObject<{
    name: z.ZodString;
    account_id: z.ZodOptional<z.ZodString>;
    pipeline_id: z.ZodOptional<z.ZodString>;
    amount: z.ZodOptional<z.ZodNumber>;
    stage: z.ZodDefault<z.ZodString>;
    close_date: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<{
        open: "open";
        won: "won";
        lost: "lost";
    }>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    assigned_to: z.ZodOptional<z.ZodString>;
    team_id: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const UpdateDealSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    account_id: z.ZodOptional<z.ZodString>;
    pipeline_id: z.ZodOptional<z.ZodString>;
    amount: z.ZodOptional<z.ZodNumber>;
    stage: z.ZodOptional<z.ZodString>;
    close_date: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        open: "open";
        won: "won";
        lost: "lost";
    }>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    assigned_to: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    team_id: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const CreatePipelineSchema: z.ZodObject<{
    name: z.ZodString;
    stages: z.ZodArray<z.ZodString>;
    team_id: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const UpdatePipelineSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    stages: z.ZodOptional<z.ZodArray<z.ZodString>>;
    team_id: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const CreateInteractionSchema: z.ZodObject<{
    type: z.ZodPipe<z.ZodTransform<"call" | "meeting" | "email" | "note", unknown>, z.ZodEnum<{
        call: "call";
        meeting: "meeting";
        email: "email";
        note: "note";
    }>>;
    contact_id: z.ZodOptional<z.ZodString>;
    deal_id: z.ZodOptional<z.ZodString>;
    summary: z.ZodOptional<z.ZodString>;
    transcript: z.ZodOptional<z.ZodString>;
    audio_url: z.ZodOptional<z.ZodString>;
    sentiment: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    due_date: z.ZodOptional<z.ZodString>;
    assigned_to: z.ZodOptional<z.ZodString>;
    team_id: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const UpdateInteractionSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodOptional<z.ZodEnum<{
        call: "call";
        meeting: "meeting";
        email: "email";
        note: "note";
    }>>;
    contact_id: z.ZodOptional<z.ZodString>;
    deal_id: z.ZodOptional<z.ZodString>;
    summary: z.ZodOptional<z.ZodString>;
    transcript: z.ZodOptional<z.ZodString>;
    audio_url: z.ZodOptional<z.ZodString>;
    sentiment: z.ZodOptional<z.ZodString>;
    assigned_to: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    team_id: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
//# sourceMappingURL=types.d.ts.map