'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Tag {
  id: string;
  tag_name: string;
  color: string; // Hex color (e.g., '#A2B758')
  entity_type: string; // 'all' for universal tags
  usage_count: number; // For ranking suggestions
  created_at: string;
  updated_at: string;
}

export const DEFAULT_COLORS = [
  '#A2B758', // primary lime
  '#0A2C19', // secondary forest
  '#22c55e', // success green
  '#f59e0b', // warning amber
  '#3b82f6', // info blue
  '#ef4444', // destructive red
  '#8b5cf6', // purple
  '#ec4899', // pink
];

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch all tags, sorted by usage_count DESC
  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('tags')
        .select('*')
        .order('usage_count', { ascending: false });

      if (fetchError) throw fetchError;
      setTags(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch tags'));
      console.error('Error fetching tags:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get or create a tag (increment usage if exists, create if not)
  const getOrCreateTag = useCallback(async (
    tagName: string,
    color: string = DEFAULT_COLORS[0]
  ): Promise<Tag> => {
    try {
      // Check if tag exists
      const { data: existing } = await supabase
        .from('tags')
        .select('*')
        .eq('tag_name', tagName)
        .single();

      if (existing) {
        // Increment usage count
        const { data: updated, error: updateError } = await supabase
          .from('tags')
          .update({ 
            usage_count: existing.usage_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (updateError) throw updateError;
        
        // Update local state
        setTags(prev => prev.map(t => t.id === existing.id ? updated : t));
        return updated;
      } else {
        // Create new tag
        const { data: newTag, error: createError } = await supabase
          .from('tags')
          .insert({
            tag_name: tagName,
            color,
            entity_type: 'all',
            usage_count: 1,
          })
          .select()
          .single();

        if (createError) throw createError;
        
        // Update local state
        setTags(prev => [...prev, newTag]);
        return newTag;
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get or create tag');
      setError(error);
      throw error;
    }
  }, []);

  // Update tag name/color
  const updateTag = useCallback(async (
    tagId: string,
    updates: { tag_name?: string; color?: string }
  ): Promise<Tag> => {
    try {
      const { data: updated, error: updateError } = await supabase
        .from('tags')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tagId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update local state
      setTags(prev => prev.map(t => t.id === tagId ? updated : t));
      return updated;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update tag');
      setError(error);
      throw error;
    }
  }, []);

  // Delete a tag (does NOT remove from entities automatically)
  const deleteTag = useCallback(async (tagId: string): Promise<void> => {
    try {
      const { error: deleteError } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId);

      if (deleteError) throw deleteError;

      // Update local state
      setTags(prev => prev.filter(t => t.id !== tagId));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete tag');
      setError(error);
      throw error;
    }
  }, []);

  // Merge two tags (combine usage counts and delete source)
  const mergeTags = useCallback(async (
    sourceTagId: string,
    targetTagName: string
  ): Promise<void> => {
    try {
      const sourceTag = tags.find(t => t.id === sourceTagId);
      if (!sourceTag) throw new Error('Source tag not found');

      // Find target tag
      const { data: targetTag } = await supabase
        .from('tags')
        .select('*')
        .eq('tag_name', targetTagName)
        .single();

      if (targetTag) {
        // Combine usage counts
        await supabase
          .from('tags')
          .update({
            usage_count: targetTag.usage_count + sourceTag.usage_count,
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetTag.id);
      } else {
        // Create target tag with source's usage count
        await supabase
          .from('tags')
          .insert({
            tag_name: targetTagName,
            color: sourceTag.color,
            entity_type: sourceTag.entity_type,
            usage_count: sourceTag.usage_count,
          });
      }

      // Delete source tag
      await deleteTag(sourceTagId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to merge tags');
      setError(error);
      throw error;
    }
  }, [tags, deleteTag]);

  // Get tag suggestions for autocomplete
  const getTagSuggestions = useCallback((
    input: string,
    limit: number = 10
  ): Tag[] => {
    if (!input.trim()) {
      return tags.slice(0, limit);
    }

    const lowerInput = input.toLowerCase();
    return tags
      .filter(tag => tag.tag_name.toLowerCase().includes(lowerInput))
      .slice(0, limit);
  }, [tags]);

  // Real-time subscription
  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    const setupSubscription = () => {
      channel = supabase
        .channel('tags_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tags',
          },
          () => {
            // Refresh tags on any change
            fetchTags();
          }
        )
        .subscribe();

      return () => {
        if (channel) {
          supabase.removeChannel(channel);
        }
      };
    };

    const cleanup = setupSubscription();
    fetchTags(); // Initial fetch

    return cleanup;
  }, [fetchTags]);

  return {
    tags,
    loading,
    error,
    fetchTags,
    getOrCreateTag,
    updateTag,
    deleteTag,
    mergeTags,
    getTagSuggestions,
    DEFAULT_COLORS,
  };
}

