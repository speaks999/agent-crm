/**
 * Unit tests for TagInput component
 * 
 * Note: These tests require a testing framework (Jest/Vitest) and React Testing Library.
 * Run with: npm test -- TagInput.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TagInput } from '@/components/ui/TagInput';
import { useTags } from '@/hooks/useTags';

// Mock the useTags hook
vi.mock('@/hooks/useTags', () => ({
  useTags: vi.fn(),
  DEFAULT_COLORS: ['#A2B758', '#3b82f6'],
}));

describe('TagInput', () => {
  const mockOnChange = vi.fn();
  const mockGetOrCreateTag = vi.fn();
  const mockGetTagSuggestions = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useTags as any).mockReturnValue({
      tags: [
        { id: '1', tag_name: 'VIP', color: '#A2B758', entity_type: 'all', usage_count: 10, created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: '2', tag_name: 'Enterprise', color: '#3b82f6', entity_type: 'all', usage_count: 5, created_at: '2024-01-01', updated_at: '2024-01-01' },
      ],
      loading: false,
      error: null,
      getOrCreateTag: mockGetOrCreateTag,
      getTagSuggestions: mockGetTagSuggestions,
      DEFAULT_COLORS: ['#A2B758', '#3b82f6'],
    });

    mockGetTagSuggestions.mockReturnValue([
      { id: '1', tag_name: 'VIP', color: '#A2B758', entity_type: 'all', usage_count: 10, created_at: '2024-01-01', updated_at: '2024-01-01' },
    ]);
  });

  it('should render with label', () => {
    render(
      <TagInput
        value={[]}
        onChange={mockOnChange}
        entityType="contact"
        label="Tags"
      />
    );
    expect(screen.getByText('Tags')).toBeInTheDocument();
  });

  it('should display selected tags', () => {
    render(
      <TagInput
        value={['VIP', 'Enterprise']}
        onChange={mockOnChange}
        entityType="contact"
      />
    );
    expect(screen.getByText('VIP')).toBeInTheDocument();
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
  });

  it('should open dropdown when button is clicked', async () => {
    render(
      <TagInput
        value={[]}
        onChange={mockOnChange}
        entityType="contact"
      />
    );

    const button = screen.getByText('Add tags...');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search or create tag...')).toBeInTheDocument();
    });
  });

  it('should filter suggestions based on search input', async () => {
    render(
      <TagInput
        value={[]}
        onChange={mockOnChange}
        entityType="contact"
      />
    );

    const button = screen.getByText('Add tags...');
    fireEvent.click(button);

    await waitFor(() => {
      const input = screen.getByPlaceholderText('Search or create tag...');
      fireEvent.change(input, { target: { value: 'VIP' } });
    });

    expect(mockGetTagSuggestions).toHaveBeenCalled();
  });

  it('should call onChange when tag is removed', () => {
    render(
      <TagInput
        value={['VIP']}
        onChange={mockOnChange}
        entityType="contact"
      />
    );

    const removeButton = screen.getByLabelText('Remove VIP tag');
    fireEvent.click(removeButton);

    expect(mockOnChange).toHaveBeenCalledWith([]);
  });

  it('should show create option for new tag', async () => {
    mockGetTagSuggestions.mockReturnValue([]);

    render(
      <TagInput
        value={[]}
        onChange={mockOnChange}
        entityType="contact"
      />
    );

    const button = screen.getByText('Add tags...');
    fireEvent.click(button);

    await waitFor(() => {
      const input = screen.getByPlaceholderText('Search or create tag...');
      fireEvent.change(input, { target: { value: 'NewTag' } });
    });

    await waitFor(() => {
      expect(screen.getByText(/Create "NewTag"/)).toBeInTheDocument();
    });
  });
});

