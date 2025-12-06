'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { useTags, DEFAULT_COLORS } from '@/hooks/useTags';
import { TagBadge } from './TagBadge';

export interface TagInputProps {
  value: string[]; // Array of tag names
  onChange: (tags: string[]) => void; // Callback when selection changes
  entityType: 'account' | 'contact' | 'deal' | 'interaction' | 'organization' | 'project' | 'task';
  label?: string;
  placeholder?: string;
  className?: string;
}

export function TagInput({
  value,
  onChange,
  entityType,
  label,
  placeholder = 'Add tags...',
  className = '',
}: TagInputProps) {
  const { tags, getOrCreateTag, getTagSuggestions, loading } = useTags();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLORS[0]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowColorPicker(false);
        setSearchQuery('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const suggestions = getTagSuggestions(searchQuery, 10);
  const isCreatingNew = searchQuery.trim() && 
    !suggestions.some(t => t.tag_name.toLowerCase() === searchQuery.toLowerCase().trim()) &&
    !value.includes(searchQuery.trim());

  const handleSelectTag = async (tagName: string) => {
    if (!value.includes(tagName)) {
      try {
        await getOrCreateTag(tagName);
        onChange([...value, tagName]);
      } catch (error) {
        console.error('Error selecting tag:', error);
      }
    }
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleCreateTag = async () => {
    const trimmedName = newTagName.trim();
    if (!trimmedName || value.includes(trimmedName)) {
      setShowColorPicker(false);
      setNewTagName('');
      return;
    }

    try {
      await getOrCreateTag(trimmedName, selectedColor);
      onChange([...value, trimmedName]);
      setNewTagName('');
      setShowColorPicker(false);
      setSearchQuery('');
      setIsOpen(false);
    } catch (error) {
      console.error('Error creating tag:', error);
    }
  };

  const handleRemoveTag = (tagName: string) => {
    onChange(value.filter(t => t !== tagName));
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
      )}

      {/* Selected Tags Display */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {value.map((tagName) => {
            const tagData = tags.find(t => t.tag_name === tagName);
            return (
              <TagBadge
                key={tagName}
                tag={tagName}
                color={tagData?.color}
                onRemove={() => handleRemoveTag(tagName)}
                size="sm"
              />
            );
          })}
        </div>
      )}

      {/* Dropdown Trigger */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 0);
          }
        }}
        className="w-full text-left px-3 py-2 border border-slate-300 rounded-md bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
      >
        <span className="text-slate-500">{placeholder}</span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {/* Search Input */}
          <div className="p-2 border-b border-slate-200">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowColorPicker(false);
              }}
              placeholder="Search or create tag..."
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>

          {/* Suggestions List */}
          {!showColorPicker && (
            <div className="py-1">
              {loading && (
                <div className="px-3 py-2 text-sm text-slate-500">Loading...</div>
              )}

              {!loading && suggestions.length > 0 && (
                <>
                  {suggestions.map((tag) => {
                    const isSelected = value.includes(tag.tag_name);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleSelectTag(tag.tag_name)}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span>{tag.tag_name}</span>
                          <span className="text-xs text-slate-400">
                            ({tag.usage_count})
                          </span>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-indigo-600" />}
                      </button>
                    );
                  })}
                </>
              )}

              {/* Create New Tag Option */}
              {isCreatingNew && (
                <button
                  type="button"
                  onClick={() => {
                    setNewTagName(searchQuery.trim());
                    setShowColorPicker(true);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm text-indigo-600"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create &quot;{searchQuery.trim()}&quot;</span>
                </button>
              )}

              {!loading && suggestions.length === 0 && !isCreatingNew && (
                <div className="px-3 py-2 text-sm text-slate-500">
                  No tags found. Type to create a new one.
                </div>
              )}
            </div>
          )}

          {/* Color Picker */}
          {showColorPicker && (
            <div className="p-3 border-t border-slate-200">
              <div className="mb-2 text-sm font-medium text-slate-700">
                Choose a color for &quot;{newTagName}&quot;
              </div>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {DEFAULT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-10 h-10 rounded-md border-2 transition-all ${
                      selectedColor === color
                        ? 'border-slate-800 scale-110'
                        : 'border-slate-300 hover:border-slate-400'
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCreateTag}
                  className="flex-1 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                >
                  Create Tag
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowColorPicker(false);
                    setNewTagName('');
                  }}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 text-sm rounded-md hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

