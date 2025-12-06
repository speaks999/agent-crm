/**
 * Unit tests for TagBadge component
 * 
 * Note: These tests require a testing framework (Jest/Vitest) and React Testing Library.
 * Run with: npm test -- TagBadge.test.tsx
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TagBadge } from '@/components/ui/TagBadge';

describe('TagBadge', () => {
  it('should render tag name', () => {
    render(<TagBadge tag="VIP" />);
    expect(screen.getByText('VIP')).toBeInTheDocument();
  });

  it('should apply custom color', () => {
    const { container } = render(<TagBadge tag="VIP" color="#3b82f6" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveStyle({ color: '#3b82f6' });
  });

  it('should use default color when not provided', () => {
    const { container } = render(<TagBadge tag="VIP" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveStyle({ color: '#A2B758' });
  });

  it('should show remove button when onRemove is provided', () => {
    const onRemove = vi.fn();
    render(<TagBadge tag="VIP" onRemove={onRemove} />);
    
    const removeButton = screen.getByLabelText('Remove VIP tag');
    expect(removeButton).toBeInTheDocument();
  });

  it('should not show remove button when onRemove is not provided', () => {
    render(<TagBadge tag="VIP" />);
    
    const removeButton = screen.queryByLabelText('Remove VIP tag');
    expect(removeButton).not.toBeInTheDocument();
  });

  it('should call onRemove when remove button is clicked', () => {
    const onRemove = vi.fn();
    render(<TagBadge tag="VIP" onRemove={onRemove} />);
    
    const removeButton = screen.getByLabelText('Remove VIP tag');
    fireEvent.click(removeButton);
    
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('should apply small size class', () => {
    const { container } = render(<TagBadge tag="VIP" size="sm" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass('text-xs');
  });

  it('should apply medium size class', () => {
    const { container } = render(<TagBadge tag="VIP" size="md" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass('text-sm');
  });

  it('should apply custom className', () => {
    const { container } = render(<TagBadge tag="VIP" className="custom-class" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass('custom-class');
  });
});

