'use client';

import React, { useState } from 'react';
import { X, Pencil, GitMerge, Trash2, Search } from 'lucide-react';
import { useTags, DEFAULT_COLORS } from '@/hooks/useTags';
import { TagBadge } from '@/components/ui/TagBadge';

export interface TagManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Extended color palette (28 colors)
const EXTENDED_COLORS = [
  ...DEFAULT_COLORS,
  '#f97316', // orange
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#6366f1', // indigo
  '#a855f7', // violet
  '#d946ef', // fuchsia
  '#f43f5e', // rose
  '#84cc16', // lime
  '#eab308', // yellow
  '#64748b', // slate
  '#78716c', // stone
  '#71717a', // zinc
  '#52525b', // neutral
  '#dc2626', // red-600
  '#ea580c', // orange-600
  '#ca8a04', // amber-600
  '#65a30d', // lime-600
  '#16a34a', // green-600
  '#059669', // emerald-600
  '#0891b2', // cyan-600
  '#0284c7', // blue-600
  '#2563eb', // blue-700
  '#7c3aed', // violet-600
  '#9333ea', // purple-600
  '#c026d3', // fuchsia-600
  '#db2777', // pink-600
];

export function TagManager({ open, onOpenChange }: TagManagerProps) {
  const { tags, updateTag, deleteTag, mergeTags, getTagSuggestions } = useTags();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [mergingTag, setMergingTag] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(DEFAULT_COLORS[0]);
  const [mergeTarget, setMergeTarget] = useState('');

  if (!open) return null;

  const filteredTags = searchQuery.trim()
    ? getTagSuggestions(searchQuery, tags.length)
    : tags;

  const handleEdit = (tagId: string) => {
    const tag = tags.find(t => t.id === tagId);
    if (tag) {
      setEditingTag(tagId);
      setNewTagName(tag.tag_name);
      setNewTagColor(tag.color);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingTag || !newTagName.trim()) return;

    try {
      await updateTag(editingTag, {
        tag_name: newTagName.trim(),
        color: newTagColor,
      });
      setEditingTag(null);
      setNewTagName('');
    } catch (error) {
      console.error('Error updating tag:', error);
    }
  };

  const handleDelete = async (tagId: string) => {
    if (!confirm('Are you sure you want to delete this tag? This will not remove it from entities.')) {
      return;
    }

    try {
      await deleteTag(tagId);
    } catch (error) {
      console.error('Error deleting tag:', error);
    }
  };

  const handleMerge = async () => {
    if (!mergingTag || !mergeTarget.trim()) return;

    try {
      await mergeTags(mergingTag, mergeTarget.trim());
      setMergingTag(null);
      setMergeTarget('');
    } catch (error) {
      console.error('Error merging tags:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Manage Tags</h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tags..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Tag List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {filteredTags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center justify-between p-3 border border-slate-200 rounded-md hover:bg-slate-50"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{tag.tag_name}</div>
                    <div className="text-xs text-slate-500">
                      Used {tag.usage_count} time{tag.usage_count !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(tag.id)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600"
                    title="Edit tag"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMergingTag(tag.id)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600"
                    title="Merge tag"
                  >
                    <GitMerge className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(tag.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600"
                    title="Delete tag"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Edit Dialog */}
        {editingTag && (
          <div className="absolute inset-0 bg-white rounded-lg flex items-center justify-center">
            <div className="w-full max-w-md p-6">
              <h3 className="text-lg font-semibold mb-4">Edit Tag</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tag Name
                  </label>
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Color
                  </label>
                  <div className="grid grid-cols-7 gap-2">
                    {EXTENDED_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewTagColor(color)}
                        className={`w-10 h-10 rounded-md border-2 transition-all ${
                          newTagColor === color
                            ? 'border-slate-800 scale-110'
                            : 'border-slate-300 hover:border-slate-400'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTag(null);
                      setNewTagName('');
                    }}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Merge Dialog */}
        {mergingTag && (
          <div className="absolute inset-0 bg-white rounded-lg flex items-center justify-center">
            <div className="w-full max-w-md p-6">
              <h3 className="text-lg font-semibold mb-4">Merge Tag</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Merge into (target tag name)
                  </label>
                  <input
                    type="text"
                    value={mergeTarget}
                    onChange={(e) => setMergeTarget(e.target.value)}
                    placeholder="Enter target tag name"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleMerge}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Merge
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMergingTag(null);
                      setMergeTarget('');
                    }}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

