'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Filter, X } from 'lucide-react';
import { useTags } from '@/hooks/useTags';
import { TagBadge } from '@/components/ui/TagBadge';

export interface TagFilterProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  entityType?: string; // Optional: filter by entity_type
}

export function TagFilter({ selectedTags, onTagsChange, entityType }: TagFilterProps) {
  const { tags, loading } = useTags();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTags = entityType
    ? tags.filter(t => t.entity_type === 'all' || t.entity_type === entityType)
    : tags;

  const searchFilteredTags = searchQuery.trim()
    ? filteredTags.filter(t => 
        t.tag_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredTags;

  const handleToggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      onTagsChange(selectedTags.filter(t => t !== tagName));
    } else {
      onTagsChange([...selectedTags, tagName]);
    }
  };

  const handleClearAll = () => {
    onTagsChange([]);
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-md bg-card hover:bg-muted text-sm font-medium text-foreground"
      >
        <Filter className="h-4 w-4" />
        <span>Filter by Tags</span>
        {selectedTags.length > 0 && (
          <span className="px-1.5 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
            {selectedTags.length}
          </span>
        )}
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-80 bg-card border border-border rounded-md shadow-lg">
          {/* Header */}
          <div className="p-3 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-foreground">Filter by Tags</h3>
              {selectedTags.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs text-primary hover:text-primary-glow"
                >
                  Clear all
                </button>
              )}
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tags..."
              className="w-full px-2 py-1.5 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
          </div>

          {/* Tag List */}
          <div className="max-h-60 overflow-y-auto p-2">
            {loading && (
              <div className="px-3 py-2 text-sm text-muted-foreground">Loading tags...</div>
            )}

            {!loading && searchFilteredTags.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No tags found
              </div>
            )}

            {!loading && searchFilteredTags.length > 0 && (
              <div className="space-y-1">
                {searchFilteredTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag.tag_name);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleToggleTag(tag.tag_name)}
                      className="w-full text-left px-3 py-2 hover:bg-muted rounded flex items-center gap-2 text-sm text-foreground"
                    >
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="flex-1">{tag.tag_name}</span>
                      {isSelected && (
                        <span className="text-primary">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected Tags Display (outside popover) */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selectedTags.map((tagName) => {
            const tagData = tags.find(t => t.tag_name === tagName);
            return (
              <TagBadge
                key={tagName}
                tag={tagName}
                color={tagData?.color}
                onRemove={() => handleToggleTag(tagName)}
                size="sm"
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

