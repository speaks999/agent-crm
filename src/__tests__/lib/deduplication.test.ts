/**
 * Unit tests for deduplication functions
 * 
 * Tests the duplicate detection and merging logic for contacts and deals
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    checkDuplicateContact,
    checkDuplicateDeal,
    mergeContacts,
    mergeDeals,
    type DeduplicationResult,
} from '@/lib/deduplication';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock Supabase client
const createMockSupabase = () => {
    const mockFrom = vi.fn();
    const mockSelect = vi.fn();
    const mockIlike = vi.fn();
    const mockEq = vi.fn();
    const mockUpdate = vi.fn();
    const mockDelete = vi.fn();
    const mockInsert = vi.fn();
    const mockSingle = vi.fn();

    mockFrom.mockReturnValue({
        select: mockSelect,
        update: mockUpdate,
        delete: mockDelete,
        insert: mockInsert,
    });

    mockSelect.mockReturnValue({
        ilike: mockIlike,
        eq: mockEq,
        single: mockSingle,
    });

    mockIlike.mockReturnValue({
        ilike: mockIlike,
        eq: mockEq,
    });

    mockEq.mockReturnValue({
        eq: mockEq,
        ilike: mockIlike,
    });

    mockUpdate.mockReturnValue({
        eq: mockEq,
        select: mockSelect,
    });

    mockDelete.mockReturnValue({
        eq: mockEq,
    });

    return {
        from: mockFrom,
        mockSelect,
        mockIlike,
        mockEq,
        mockUpdate,
        mockDelete,
        mockInsert,
        mockSingle,
    };
};

describe('Deduplication - Contacts', () => {
    let mockSupabase: ReturnType<typeof createMockSupabase>;
    let supabase: SupabaseClient;

    beforeEach(() => {
        mockSupabase = createMockSupabase();
        supabase = mockSupabase as any;
        vi.clearAllMocks();
    });

    describe('checkDuplicateContact', () => {
        it('should detect duplicate by exact email match', async () => {
            const existingContact = {
                id: 'contact-1',
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com',
                phone: '555-1234',
                account_id: null,
            };

            mockSupabase.mockIlike.mockResolvedValue({
                data: [existingContact],
                error: null,
            });

            const result = await checkDuplicateContact(supabase, {
                first_name: 'John',
                last_name: 'Smith',
                email: 'john@example.com',
                phone: null,
                account_id: null,
            });

            expect(result.isDuplicate).toBe(true);
            expect(result.duplicateMatches).toHaveLength(1);
            expect(result.duplicateMatches[0].similarity).toBe(1.0);
            expect(result.duplicateMatches[0].matchReason).toBe('Exact email match');
            expect(result.suggestedAction).toBe('merge');
        });

        it('should detect duplicate by phone number', async () => {
            const existingContact = {
                id: 'contact-2',
                first_name: 'Jane',
                last_name: 'Doe',
                email: null,
                phone: '555-5678',
                account_id: null,
            };

            // Mock phone search - returns all contacts, we filter in code
            mockSupabase.mockSelect.mockResolvedValue({
                data: [existingContact],
                error: null,
            });

            const result = await checkDuplicateContact(supabase, {
                first_name: 'Jane',
                last_name: 'Smith',
                email: null,
                phone: '555-5678',
                account_id: null,
            });

            expect(result.isDuplicate).toBe(true);
            expect(result.duplicateMatches[0].similarity).toBe(0.9);
            expect(result.duplicateMatches[0].matchReason).toBe('Exact phone match');
        });

        it('should detect duplicate by name and account', async () => {
            const existingContact = {
                id: 'contact-3',
                first_name: 'Bob',
                last_name: 'Johnson',
                email: null,
                phone: null,
                account_id: 'account-1',
            };

            mockSupabase.mockIlike.mockResolvedValue({
                data: [existingContact],
                error: null,
            });

            const result = await checkDuplicateContact(supabase, {
                first_name: 'Bob',
                last_name: 'Johnson',
                email: null,
                phone: null,
                account_id: 'account-1',
            });

            expect(result.isDuplicate).toBe(true);
            expect(result.duplicateMatches[0].similarity).toBe(0.7);
            expect(result.duplicateMatches[0].matchReason).toBe('Name and account match');
            expect(result.suggestedAction).toBe('update');
        });

        it('should not detect duplicate when no matches found', async () => {
            mockSupabase.mockIlike.mockResolvedValue({
                data: [],
                error: null,
            });

            mockSupabase.mockSelect.mockResolvedValue({
                data: [],
                error: null,
            });

            const result = await checkDuplicateContact(supabase, {
                first_name: 'Unique',
                last_name: 'Person',
                email: 'unique@example.com',
                phone: null,
                account_id: null,
            });

            expect(result.isDuplicate).toBe(false);
            expect(result.duplicateMatches).toHaveLength(0);
            expect(result.suggestedAction).toBe('create');
        });

        it('should prioritize email match over name match', async () => {
            const emailMatch = {
                id: 'contact-email',
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com',
                phone: null,
                account_id: null,
            };

            const nameMatch = {
                id: 'contact-name',
                first_name: 'John',
                last_name: 'Doe',
                email: null,
                phone: null,
                account_id: null,
            };

            mockSupabase.mockIlike.mockResolvedValue({
                data: [emailMatch],
                error: null,
            });

            mockSupabase.mockSelect.mockResolvedValue({
                data: [nameMatch],
                error: null,
            });

            const result = await checkDuplicateContact(supabase, {
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com',
                phone: null,
                account_id: null,
            });

            expect(result.duplicateMatches).toHaveLength(1);
            expect(result.duplicateMatches[0].id).toBe('contact-email');
            expect(result.duplicateMatches[0].similarity).toBe(1.0);
        });

        it('should normalize phone numbers for comparison', async () => {
            const existingContact = {
                id: 'contact-phone',
                first_name: 'Test',
                last_name: 'User',
                email: null,
                phone: '(555) 123-4567',
                account_id: null,
            };

            mockSupabase.mockSelect.mockResolvedValue({
                data: [existingContact],
                error: null,
            });

            const result = await checkDuplicateContact(supabase, {
                first_name: 'Test',
                last_name: 'User',
                email: null,
                phone: '555-123-4567',
                account_id: null,
            });

            expect(result.isDuplicate).toBe(true);
            expect(result.duplicateMatches[0].similarity).toBe(0.9);
        });
    });

    describe('mergeContacts', () => {
        it('should merge two contacts successfully', async () => {
            const sourceContact = {
                id: 'source-id',
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com',
                phone: null,
                role: 'Manager',
                account_id: null,
                tags: ['VIP'],
            };

            const targetContact = {
                id: 'target-id',
                first_name: 'John',
                last_name: 'Doe',
                email: null,
                phone: '555-1234',
                role: null,
                account_id: 'account-1',
                tags: ['Enterprise'],
            };

            mockSupabase.mockSingle
                .mockResolvedValueOnce({ data: sourceContact, error: null })
                .mockResolvedValueOnce({ data: targetContact, error: null })
                .mockResolvedValueOnce({
                    data: {
                        ...targetContact,
                        email: 'john@example.com',
                        phone: '555-1234',
                        role: 'Manager',
                        account_id: 'account-1',
                        tags: ['VIP', 'Enterprise'],
                    },
                    error: null,
                });

            mockSupabase.mockEq.mockResolvedValue({ error: null });

            const result = await mergeContacts(supabase, 'source-id', 'target-id');

            expect(result.success).toBe(true);
            expect(result.mergedContact).toBeDefined();
            expect(result.mergedContact?.email).toBe('john@example.com');
            expect(result.mergedContact?.phone).toBe('555-1234');
            expect(result.mergedContact?.tags).toContain('VIP');
            expect(result.mergedContact?.tags).toContain('Enterprise');
        });

        it('should handle merge when source contact not found', async () => {
            mockSupabase.mockSingle.mockResolvedValueOnce({
                data: null,
                error: { message: 'Not found' },
            });

            const result = await mergeContacts(supabase, 'invalid-id', 'target-id');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Source contact not found');
        });

        it('should update interactions when merging contacts', async () => {
            const sourceContact = { id: 'source-id', first_name: 'John', last_name: 'Doe' };
            const targetContact = { id: 'target-id', first_name: 'John', last_name: 'Doe' };

            mockSupabase.mockSingle
                .mockResolvedValueOnce({ data: sourceContact, error: null })
                .mockResolvedValueOnce({ data: targetContact, error: null })
                .mockResolvedValueOnce({ data: targetContact, error: null });

            mockSupabase.mockEq.mockResolvedValue({ error: null });

            await mergeContacts(supabase, 'source-id', 'target-id');

            // Verify interactions were updated
            expect(mockSupabase.from).toHaveBeenCalledWith('interactions');
            expect(mockSupabase.mockUpdate).toHaveBeenCalled();
        });
    });
});

describe('Deduplication - Deals', () => {
    let mockSupabase: ReturnType<typeof createMockSupabase>;
    let supabase: SupabaseClient;

    beforeEach(() => {
        mockSupabase = createMockSupabase();
        supabase = mockSupabase as any;
        vi.clearAllMocks();
    });

    describe('checkDuplicateDeal', () => {
        it('should detect duplicate by exact name and account match', async () => {
            const existingDeal = {
                id: 'deal-1',
                name: 'Enterprise License',
                account_id: 'account-1',
                stage: 'Discovery',
                amount: 50000,
            };

            mockSupabase.mockIlike.mockResolvedValue({
                data: [existingDeal],
                error: null,
            });

            const result = await checkDuplicateDeal(supabase, {
                name: 'Enterprise License',
                account_id: 'account-1',
                stage: 'Discovery',
            });

            expect(result.isDuplicate).toBe(true);
            expect(result.duplicateMatches[0].similarity).toBe(0.95);
            expect(result.duplicateMatches[0].matchReason).toBe('Exact name and account match');
            expect(result.suggestedAction).toBe('merge');
        });

        it('should detect duplicate by name and account with same stage', async () => {
            const existingDeal = {
                id: 'deal-2',
                name: 'Annual Contract',
                account_id: 'account-2',
                stage: 'Proposal',
                amount: 100000,
            };

            mockSupabase.mockIlike.mockResolvedValue({
                data: [existingDeal],
                error: null,
            });

            const result = await checkDuplicateDeal(supabase, {
                name: 'Annual Contract',
                account_id: 'account-2',
                stage: 'Proposal',
            });

            expect(result.isDuplicate).toBe(true);
            expect(result.duplicateMatches[0].similarity).toBe(1.0);
            expect(result.duplicateMatches[0].matchReason).toContain('same stage');
        });

        it('should detect duplicate by name only (no account)', async () => {
            const existingDeal = {
                id: 'deal-3',
                name: 'Test Deal',
                account_id: null,
                stage: 'Lead',
                amount: null,
            };

            mockSupabase.mockIlike.mockResolvedValue({
                data: [existingDeal],
                error: null,
            });

            const result = await checkDuplicateDeal(supabase, {
                name: 'Test Deal',
                account_id: null,
                stage: 'Lead',
            });

            expect(result.isDuplicate).toBe(true);
            expect(result.duplicateMatches[0].similarity).toBe(0.8);
            expect(result.duplicateMatches[0].matchReason).toBe('Exact name match');
            expect(result.suggestedAction).toBe('update');
        });

        it('should not detect duplicate when no matches found', async () => {
            mockSupabase.mockIlike.mockResolvedValue({
                data: [],
                error: null,
            });

            const result = await checkDuplicateDeal(supabase, {
                name: 'Unique Deal',
                account_id: 'account-1',
                stage: 'Discovery',
            });

            expect(result.isDuplicate).toBe(false);
            expect(result.duplicateMatches).toHaveLength(0);
            expect(result.suggestedAction).toBe('create');
        });

        it('should handle case-insensitive name matching', async () => {
            const existingDeal = {
                id: 'deal-4',
                name: 'Enterprise License',
                account_id: 'account-1',
                stage: 'Discovery',
                amount: 50000,
            };

            mockSupabase.mockIlike.mockResolvedValue({
                data: [existingDeal],
                error: null,
            });

            const result = await checkDuplicateDeal(supabase, {
                name: 'ENTERPRISE LICENSE',
                account_id: 'account-1',
                stage: 'Discovery',
            });

            expect(result.isDuplicate).toBe(true);
        });
    });

    describe('mergeDeals', () => {
        it('should merge two deals and sum amounts', async () => {
            const sourceDeal = {
                id: 'source-deal',
                name: 'Enterprise License',
                account_id: 'account-1',
                amount: 50000,
                stage: 'Discovery',
                status: 'open',
                close_date: null,
                tags: ['VIP'],
            };

            const targetDeal = {
                id: 'target-deal',
                name: 'Enterprise License',
                account_id: 'account-1',
                amount: 30000,
                stage: 'Proposal',
                status: 'open',
                close_date: null,
                tags: ['Enterprise'],
            };

            mockSupabase.mockSingle
                .mockResolvedValueOnce({ data: sourceDeal, error: null })
                .mockResolvedValueOnce({ data: targetDeal, error: null })
                .mockResolvedValueOnce({
                    data: {
                        ...targetDeal,
                        amount: 80000, // Sum of both amounts
                        tags: ['VIP', 'Enterprise'],
                    },
                    error: null,
                });

            mockSupabase.mockEq.mockResolvedValue({ error: null });

            const result = await mergeDeals(supabase, 'source-deal', 'target-deal');

            expect(result.success).toBe(true);
            expect(result.mergedDeal).toBeDefined();
            expect(result.mergedDeal?.amount).toBe(80000);
            expect(result.mergedDeal?.tags).toContain('VIP');
            expect(result.mergedDeal?.tags).toContain('Enterprise');
        });

        it('should handle merge when target deal not found', async () => {
            mockSupabase.mockSingle
                .mockResolvedValueOnce({ data: { id: 'source' }, error: null })
                .mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });

            const result = await mergeDeals(supabase, 'source-deal', 'invalid-id');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Target deal not found');
        });

        it('should update interactions when merging deals', async () => {
            const sourceDeal = { id: 'source-deal', name: 'Test Deal' };
            const targetDeal = { id: 'target-deal', name: 'Test Deal' };

            mockSupabase.mockSingle
                .mockResolvedValueOnce({ data: sourceDeal, error: null })
                .mockResolvedValueOnce({ data: targetDeal, error: null })
                .mockResolvedValueOnce({ data: targetDeal, error: null });

            mockSupabase.mockEq.mockResolvedValue({ error: null });

            await mergeDeals(supabase, 'source-deal', 'target-deal');

            // Verify interactions were updated
            expect(mockSupabase.from).toHaveBeenCalledWith('interactions');
            expect(mockSupabase.mockUpdate).toHaveBeenCalled();
        });
    });
});

describe('Deduplication - Edge Cases', () => {
    let mockSupabase: ReturnType<typeof createMockSupabase>;
    let supabase: SupabaseClient;

    beforeEach(() => {
        mockSupabase = createMockSupabase();
        supabase = mockSupabase as any;
        vi.clearAllMocks();
    });

    it('should handle null email gracefully', async () => {
        mockSupabase.mockIlike.mockResolvedValue({
            data: [],
            error: null,
        });

        const result = await checkDuplicateContact(supabase, {
            first_name: 'John',
            last_name: 'Doe',
            email: null,
            phone: null,
            account_id: null,
        });

        expect(result.isDuplicate).toBe(false);
    });

    it('should handle empty string email', async () => {
        mockSupabase.mockIlike.mockResolvedValue({
            data: [],
            error: null,
        });

        const result = await checkDuplicateContact(supabase, {
            first_name: 'John',
            last_name: 'Doe',
            email: '',
            phone: null,
            account_id: null,
        });

        expect(result.isDuplicate).toBe(false);
    });

    it('should handle phone numbers with different formats', async () => {
        const existingContact = {
            id: 'contact-phone',
            first_name: 'Test',
            last_name: 'User',
            phone: '5551234567',
            account_id: null,
        };

        mockSupabase.mockSelect.mockResolvedValue({
            data: [existingContact],
            error: null,
        });

        const result = await checkDuplicateContact(supabase, {
            first_name: 'Test',
            last_name: 'User',
            email: null,
            phone: '(555) 123-4567',
            account_id: null,
        });

        expect(result.isDuplicate).toBe(true);
    });

    it('should not match phone numbers that are too short', async () => {
        const existingContact = {
            id: 'contact-short',
            first_name: 'Test',
            last_name: 'User',
            phone: '123',
            account_id: null,
        };

        mockSupabase.mockSelect.mockResolvedValue({
            data: [existingContact],
            error: null,
        });

        const result = await checkDuplicateContact(supabase, {
            first_name: 'Test',
            last_name: 'User',
            email: null,
            phone: '123',
            account_id: null,
        });

        // Should not match because phone is too short (< 10 digits)
        expect(result.isDuplicate).toBe(false);
    });
});

