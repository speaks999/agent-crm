/**
 * Integration tests for deduplication in MCP tools
 * 
 * Tests that MCP tools properly detect and prevent duplicates
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

// Note: These tests require the MCP server to be running
// They test the deduplication integration at the MCP tool level
// For unit tests of deduplication functions, see deduplication.test.ts

// Mock the deduplication module
const mockCheckDuplicateContact = vi.fn();
const mockCheckDuplicateDeal = vi.fn();

vi.mock('../../../../mcp-server/utils/deduplication', () => ({
    checkDuplicateContact: mockCheckDuplicateContact,
    checkDuplicateDeal: mockCheckDuplicateDeal,
}));

// Import after mocking
import { handleContactTool } from '../../../../mcp-server/tools/contacts';
import { handleDealTool } from '../../../../mcp-server/tools/deals';

const createMockSupabase = () => {
    const mockFrom = vi.fn();
    const mockSelect = vi.fn();
    const mockInsert = vi.fn();
    const mockSingle = vi.fn();
    const mockEq = vi.fn();
    const mockIlike = vi.fn();

    mockFrom.mockReturnValue({
        select: mockSelect,
        insert: mockInsert,
    });

    mockSelect.mockReturnValue({
        ilike: mockIlike,
        eq: mockEq,
    });

    mockInsert.mockReturnValue({
        select: mockSelect,
    });

    mockSelect.mockReturnValue({
        single: mockSingle,
    });

    mockEq.mockReturnValue({
        ilike: mockIlike,
    });

    return {
        from: mockFrom,
        mockSelect,
        mockInsert,
        mockSingle,
        mockEq,
        mockIlike,
    };
};

describe('MCP Tools - Contact Deduplication', () => {
    let mockSupabase: ReturnType<typeof createMockSupabase>;
    let supabase: SupabaseClient;

    beforeEach(() => {
        mockSupabase = createMockSupabase();
        supabase = mockSupabase as any;
        vi.clearAllMocks();
    });

    it('should block contact creation when strong duplicate detected', async () => {
        const duplicateResult = {
            isDuplicate: true,
            duplicateMatches: [
                {
                    id: 'existing-contact-id',
                    similarity: 1.0,
                    matchReason: 'Exact email match',
                    data: {
                        id: 'existing-contact-id',
                        first_name: 'John',
                        last_name: 'Doe',
                        email: 'john@example.com',
                    },
                },
            ],
            suggestedAction: 'merge' as const,
            message: 'Strong duplicate detected',
        };

        mockCheckDuplicateContact.mockResolvedValue(duplicateResult);

        const result = await handleContactTool(
            {
                params: {
                    name: 'create_contact',
                    arguments: {
                        first_name: 'John',
                        last_name: 'Doe',
                        email: 'john@example.com',
                    },
                },
            },
            supabase
        );

        expect(result?.isError).toBe(true);
        expect(result?.content[0].text).toContain('Strong duplicate detected');
        expect(result?.content[0].text).toContain('existing-contact-id');
        expect(result?.structuredContent?.duplicateMatches).toBeDefined();
        expect(result?.structuredContent?.suggestedAction).toBe('merge');
    });

    it('should warn but allow contact creation when moderate duplicate detected', async () => {
        const duplicateResult = {
            isDuplicate: true,
            duplicateMatches: [
                {
                    id: 'existing-contact-id',
                    similarity: 0.7,
                    matchReason: 'Name and account match',
                    data: {
                        id: 'existing-contact-id',
                        first_name: 'John',
                        last_name: 'Doe',
                    },
                },
            ],
            suggestedAction: 'update' as const,
            message: 'Possible duplicate detected',
        };

        mockCheckDuplicateContact.mockResolvedValue(duplicateResult);

        const newContact = {
            id: 'new-contact-id',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@example.com',
        };

        mockSupabase.mockSingle.mockResolvedValue({
            data: newContact,
            error: null,
        });

        const result = await handleContactTool(
            {
                params: {
                    name: 'create_contact',
                    arguments: {
                        first_name: 'John',
                        last_name: 'Doe',
                        email: 'john.doe@example.com',
                        account_id: 'account-1',
                    },
                },
            },
            supabase
        );

        expect(result?.isError).toBeFalsy();
        expect(result?.content[0].text).toContain('Possible duplicate detected');
        expect(result?.content[0].text).toContain('created successfully');
        expect(result?.structuredContent?.contacts).toBeDefined();
    });

    it('should create contact normally when no duplicates found', async () => {
        const noDuplicateResult = {
            isDuplicate: false,
            duplicateMatches: [],
            suggestedAction: 'create' as const,
            message: 'No duplicates found',
        };

        mockCheckDuplicateContact.mockResolvedValue(noDuplicateResult);

        const newContact = {
            id: 'new-contact-id',
            first_name: 'Unique',
            last_name: 'Person',
            email: 'unique@example.com',
        };

        mockSupabase.mockSingle.mockResolvedValue({
            data: newContact,
            error: null,
        });

        const result = await handleContactTool(
            {
                params: {
                    name: 'create_contact',
                    arguments: {
                        first_name: 'Unique',
                        last_name: 'Person',
                        email: 'unique@example.com',
                    },
                },
            },
            supabase
        );

        expect(result?.isError).toBeFalsy();
        expect(result?.content[0].text).toContain('created successfully');
        expect(result?.content[0].text).not.toContain('duplicate');
        expect(result?.structuredContent?.contacts[0].id).toBe('new-contact-id');
    });

    it('should handle unique constraint violation and return duplicate info', async () => {
        const noDuplicateResult = {
            isDuplicate: false,
            duplicateMatches: [],
            suggestedAction: 'create' as const,
            message: 'No duplicates found',
        };

        mockCheckDuplicateContact
            .mockResolvedValueOnce(noDuplicateResult)
            .mockResolvedValueOnce({
                isDuplicate: true,
                duplicateMatches: [
                    {
                        id: 'existing-id',
                        similarity: 1.0,
                        matchReason: 'Exact email match',
                        data: { id: 'existing-id', first_name: 'John', last_name: 'Doe' },
                    },
                ],
                suggestedAction: 'merge' as const,
                message: 'Strong duplicate detected',
            });

        // First call succeeds (no duplicate detected initially)
        // But database constraint violation occurs
        mockSupabase.mockSingle.mockResolvedValue({
            data: null,
            error: {
                code: '23505',
                message: 'duplicate key value violates unique constraint',
            },
        });

        const result = await handleContactTool(
            {
                params: {
                    name: 'create_contact',
                    arguments: {
                        first_name: 'John',
                        last_name: 'Doe',
                        email: 'john@example.com',
                    },
                },
            },
            supabase
        );

        expect(result?.isError).toBe(true);
        expect(result?.content[0].text).toContain('Duplicate detected');
    });
});

describe('MCP Tools - Deal Deduplication', () => {
    let mockSupabase: ReturnType<typeof createMockSupabase>;
    let supabase: SupabaseClient;

    beforeEach(() => {
        mockSupabase = createMockSupabase();
        supabase = mockSupabase as any;
        vi.clearAllMocks();
    });

    it('should block deal creation when strong duplicate detected', async () => {
        const duplicateResult = {
            isDuplicate: true,
            duplicateMatches: [
                {
                    id: 'existing-deal-id',
                    similarity: 0.95,
                    matchReason: 'Exact name and account match',
                    data: {
                        id: 'existing-deal-id',
                        name: 'Enterprise License',
                        account_id: 'account-1',
                        stage: 'Discovery',
                    },
                },
            ],
            suggestedAction: 'merge' as const,
            message: 'Strong duplicate detected',
        };

        mockCheckDuplicateDeal.mockResolvedValue(duplicateResult);

        const result = await handleDealTool(
            {
                params: {
                    name: 'create_deal',
                    arguments: {
                        name: 'Enterprise License',
                        account_id: 'account-1',
                        stage: 'Discovery',
                    },
                },
            },
            supabase
        );

        expect(result?.isError).toBe(true);
        expect(result?.content[0].text).toContain('Strong duplicate detected');
        expect(result?.content[0].text).toContain('existing-deal-id');
        expect(result?.structuredContent?.duplicateMatches).toBeDefined();
    });

    it('should warn but allow deal creation when moderate duplicate detected', async () => {
        const duplicateResult = {
            isDuplicate: true,
            duplicateMatches: [
                {
                    id: 'existing-deal-id',
                    similarity: 0.8,
                    matchReason: 'Exact name match',
                    data: {
                        id: 'existing-deal-id',
                        name: 'Test Deal',
                    },
                },
            ],
            suggestedAction: 'update' as const,
            message: 'Possible duplicate detected',
        };

        mockCheckDuplicateDeal.mockResolvedValue(duplicateResult);

        const newDeal = {
            id: 'new-deal-id',
            name: 'Test Deal',
            stage: 'Proposal',
        };

        mockSupabase.mockSingle.mockResolvedValue({
            data: newDeal,
            error: null,
        });

        const result = await handleDealTool(
            {
                params: {
                    name: 'create_deal',
                    arguments: {
                        name: 'Test Deal',
                        stage: 'Proposal',
                    },
                },
            },
            supabase
        );

        expect(result?.isError).toBeFalsy();
        expect(result?.content[0].text).toContain('Possible duplicate detected');
        expect(result?.content[0].text).toContain('created successfully');
    });

    it('should create deal normally when no duplicates found', async () => {
        const noDuplicateResult = {
            isDuplicate: false,
            duplicateMatches: [],
            suggestedAction: 'create' as const,
            message: 'No duplicates found',
        };

        mockCheckDuplicateDeal.mockResolvedValue(noDuplicateResult);

        const newDeal = {
            id: 'new-deal-id',
            name: 'Unique Deal',
            stage: 'Discovery',
        };

        mockSupabase.mockSingle.mockResolvedValue({
            data: newDeal,
            error: null,
        });

        const result = await handleDealTool(
            {
                params: {
                    name: 'create_deal',
                    arguments: {
                        name: 'Unique Deal',
                        stage: 'Discovery',
                    },
                },
            },
            supabase
        );

        expect(result?.isError).toBeFalsy();
        expect(result?.content[0].text).toContain('created successfully');
        expect(result?.content[0].text).not.toContain('duplicate');
    });
});

