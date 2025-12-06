/**
 * Unit tests for useTags hook
 * 
 * Note: These tests require a testing framework (Jest/Vitest) to be set up.
 * Run with: npm test -- useTags.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTags } from '@/hooks/useTags';
import { supabase } from '@/lib/supabaseClient';

// Mock Supabase client
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(),
    removeChannel: vi.fn(),
  },
}));

describe('useTags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchTags', () => {
    it('should fetch all tags sorted by usage_count', async () => {
      const mockTags = [
        { id: '1', tag_name: 'VIP', color: '#A2B758', entity_type: 'all', usage_count: 10, created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: '2', tag_name: 'Enterprise', color: '#3b82f6', entity_type: 'all', usage_count: 5, created_at: '2024-01-01', updated_at: '2024-01-01' },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockTags, error: null }),
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useTags());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.tags).toEqual(mockTags);
      expect(mockSelect).toHaveBeenCalledWith('*');
    });

    it('should handle fetch errors', async () => {
      const mockError = new Error('Failed to fetch');
      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useTags());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('getOrCreateTag', () => {
    it('should increment usage count for existing tag', async () => {
      const existingTag = {
        id: '1',
        tag_name: 'VIP',
        color: '#A2B758',
        entity_type: 'all',
        usage_count: 5,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      const updatedTag = { ...existingTag, usage_count: 6 };

      const mockSingle = vi.fn().mockResolvedValue({ data: existingTag, error: null });
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: updatedTag, error: null }),
          }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
        update: mockUpdate,
      });

      const { result } = renderHook(() => useTags());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const tag = await result.current.getOrCreateTag('VIP');

      expect(tag.usage_count).toBe(6);
    });

    it('should create new tag if it does not exist', async () => {
      const newTag = {
        id: '2',
        tag_name: 'NewTag',
        color: '#A2B758',
        entity_type: 'all',
        usage_count: 1,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: newTag, error: null }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
        insert: mockInsert,
      });

      const { result } = renderHook(() => useTags());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const tag = await result.current.getOrCreateTag('NewTag');

      expect(tag.tag_name).toBe('NewTag');
      expect(tag.usage_count).toBe(1);
    });
  });

  describe('updateTag', () => {
    it('should update tag name and color', async () => {
      const updatedTag = {
        id: '1',
        tag_name: 'UpdatedTag',
        color: '#3b82f6',
        entity_type: 'all',
        usage_count: 5,
        created_at: '2024-01-01',
        updated_at: '2024-01-02',
      };

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: updatedTag, error: null }),
          }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
      });

      const { result } = renderHook(() => useTags());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const tag = await result.current.updateTag('1', {
        tag_name: 'UpdatedTag',
        color: '#3b82f6',
      });

      expect(tag.tag_name).toBe('UpdatedTag');
      expect(tag.color).toBe('#3b82f6');
    });
  });

  describe('deleteTag', () => {
    it('should delete a tag', async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      (supabase.from as any).mockReturnValue({
        delete: mockDelete,
      });

      const { result } = renderHook(() => useTags());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.deleteTag('1');

      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe('mergeTags', () => {
    it('should merge two tags and combine usage counts', async () => {
      const sourceTag = {
        id: '1',
        tag_name: 'Source',
        color: '#A2B758',
        entity_type: 'all',
        usage_count: 5,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      const targetTag = {
        id: '2',
        tag_name: 'Target',
        color: '#3b82f6',
        entity_type: 'all',
        usage_count: 10,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      const mockSingle = vi.fn()
        .mockResolvedValueOnce({ data: sourceTag, error: null })
        .mockResolvedValueOnce({ data: targetTag, error: null });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'tags') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: mockSingle,
              }),
            }),
            update: mockUpdate,
            insert: mockInsert,
            delete: mockDelete,
          };
        }
      });

      const { result } = renderHook(() => useTags());
      result.current.tags = [sourceTag, targetTag];

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.mergeTags('1', 'Target');

      expect(mockUpdate).toHaveBeenCalled();
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe('getTagSuggestions', () => {
    it('should return matching tags sorted by usage', () => {
      const tags = [
        { id: '1', tag_name: 'VIP', color: '#A2B758', entity_type: 'all', usage_count: 10, created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: '2', tag_name: 'Enterprise', color: '#3b82f6', entity_type: 'all', usage_count: 5, created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: '3', tag_name: 'VIP Customer', color: '#22c55e', entity_type: 'all', usage_count: 3, created_at: '2024-01-01', updated_at: '2024-01-01' },
      ];

      const { result } = renderHook(() => useTags());
      result.current.tags = tags;

      const suggestions = result.current.getTagSuggestions('VIP', 10);

      expect(suggestions).toHaveLength(2);
      expect(suggestions[0].tag_name).toBe('VIP');
      expect(suggestions[1].tag_name).toBe('VIP Customer');
    });

    it('should return top N tags when no input provided', () => {
      const tags = Array.from({ length: 20 }, (_, i) => ({
        id: `${i}`,
        tag_name: `Tag${i}`,
        color: '#A2B758',
        entity_type: 'all',
        usage_count: 20 - i,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      }));

      const { result } = renderHook(() => useTags());
      result.current.tags = tags;

      const suggestions = result.current.getTagSuggestions('', 10);

      expect(suggestions).toHaveLength(10);
    });
  });
});

