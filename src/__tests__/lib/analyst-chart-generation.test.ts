/**
 * Unit tests for chart data generation in analyst.ts
 * 
 * Tests the analyzeAndFetchData function that generates chart configurations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeAndFetchData } from '@/lib/analyst';
import { generateObject } from 'ai';
import { openai } from '@/lib/ai';
import { supabase } from '@/lib/supabaseClient';

// Mock dependencies
vi.mock('ai', () => ({
  generateObject: vi.fn(),
}));

vi.mock('@/lib/ai', () => ({
  openai: vi.fn(),
}));

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('analyzeAndFetchData - Chart Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Chart Type Selection', () => {
    it('should select bar chart for categorical comparisons', async () => {
      const mockAnalysis = {
        table: 'deals',
        aggregation: 'count',
        groupBy: 'stage',
        chartType: 'bar',
        title: 'Deals by Stage',
      };

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        filter: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            { stage: 'Discovery', id: '1' },
            { stage: 'Proposal', id: '2' },
          ],
          error: null,
        }),
      };

      (generateObject as any).mockResolvedValue({
        object: {
          ...mockAnalysis,
          aggregation: 'count',
          groupBy: 'stage',
          filters: null,
          dateFilter: null,
          sortBy: null,
          sortOrder: null,
          limit: null,
          valueColumn: null,
        },
      });

      (supabase.from as any).mockReturnValue(mockQueryBuilder);

      const result = await analyzeAndFetchData('Show me deals by stage');

      expect(result.config.type).toBe('bar');
      expect(result.config.title).toContain('Deals');
    });

    it('should select line chart for time series data', async () => {
      const mockAnalysis = {
        table: 'deals',
        aggregation: 'sum',
        groupBy: 'created_at',
        valueColumn: 'amount',
        chartType: 'line',
        title: 'Revenue Over Time',
      };

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        filter: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            { created_at: '2024-01-01', amount: 1000 },
            { created_at: '2024-02-01', amount: 1500 },
          ],
          error: null,
        }),
      };

      (generateObject as any).mockResolvedValue({
        object: {
          ...mockAnalysis,
          filters: null,
          dateFilter: null,
          sortBy: null,
          sortOrder: null,
          limit: null,
        },
      });

      (supabase.from as any).mockReturnValue(mockQueryBuilder);

      const result = await analyzeAndFetchData('Show revenue over time');

      expect(result.config.type).toBe('line');
    });

    it('should select pie chart for distribution data', async () => {
      const mockAnalysis = {
        table: 'deals',
        aggregation: 'count',
        groupBy: 'status',
        chartType: 'pie',
        title: 'Deal Status Distribution',
      };

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        filter: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            { status: 'won', id: '1' },
            { status: 'lost', id: '2' },
            { status: 'open', id: '3' },
          ],
          error: null,
        }),
      };

      (generateObject as any).mockResolvedValue({
        object: {
          ...mockAnalysis,
          filters: null,
          dateFilter: null,
          sortBy: null,
          sortOrder: null,
          limit: null,
          valueColumn: null,
        },
      });

      (supabase.from as any).mockReturnValue(mockQueryBuilder);

      const result = await analyzeAndFetchData('Show deal status distribution');

      expect(result.config.type).toBe('pie');
    });
  });

  describe('Data Aggregation', () => {
    it('should aggregate count by group', async () => {
      const mockData = [
        { stage: 'Discovery', id: '1' },
        { stage: 'Discovery', id: '2' },
        { stage: 'Proposal', id: '3' },
      ];

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        filter: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      (generateObject as any).mockResolvedValue({
        object: {
          table: 'deals',
          aggregation: 'count',
          groupBy: 'stage',
          chartType: 'bar',
          title: 'Deals by Stage',
          filters: null,
          dateFilter: null,
          sortBy: null,
          sortOrder: null,
          limit: null,
          valueColumn: null,
        },
      });

      (supabase.from as any).mockReturnValue(mockQueryBuilder);

      const result = await analyzeAndFetchData('Count deals by stage');

      expect(result.data).toEqual([
        { stage: 'Discovery', count: 2 },
        { stage: 'Proposal', count: 1 },
      ]);
      expect(result.config.xAxis).toBe('stage');
      expect(result.config.yAxis).toBe('count');
    });

    it('should aggregate sum by group', async () => {
      const mockData = [
        { stage: 'Discovery', amount: 1000 },
        { stage: 'Discovery', amount: 2000 },
        { stage: 'Proposal', amount: 5000 },
      ];

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        filter: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      (generateObject as any).mockResolvedValue({
        object: {
          table: 'deals',
          aggregation: 'sum',
          groupBy: 'stage',
          valueColumn: 'amount',
          chartType: 'bar',
          title: 'Revenue by Stage',
          filters: null,
          dateFilter: null,
          sortBy: null,
          sortOrder: null,
          limit: null,
        },
      });

      (supabase.from as any).mockReturnValue(mockQueryBuilder);

      const result = await analyzeAndFetchData('Show total revenue by stage');

      expect(result.data).toEqual([
        { stage: 'Discovery', total: 3000 },
        { stage: 'Proposal', total: 5000 },
      ]);
      expect(result.config.yAxis).toBe('total');
    });

    it('should calculate average by group', async () => {
      const mockData = [
        { stage: 'Discovery', amount: 1000 },
        { stage: 'Discovery', amount: 2000 },
        { stage: 'Proposal', amount: 5000 },
      ];

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        filter: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      (generateObject as any).mockResolvedValue({
        object: {
          table: 'deals',
          aggregation: 'avg',
          groupBy: 'stage',
          valueColumn: 'amount',
          chartType: 'bar',
          title: 'Average Deal Value by Stage',
          filters: null,
          dateFilter: null,
          sortBy: null,
          sortOrder: null,
          limit: null,
        },
      });

      (supabase.from as any).mockReturnValue(mockQueryBuilder);

      const result = await analyzeAndFetchData('Show average deal value by stage');

      expect(result.data).toEqual([
        { stage: 'Discovery', average: 1500 },
        { stage: 'Proposal', average: 5000 },
      ]);
      expect(result.config.yAxis).toBe('average');
    });
  });

  describe('Chart Configuration', () => {
    it('should set correct axis keys for aggregated data', async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        filter: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [{ stage: 'Discovery', id: '1' }],
          error: null,
        }),
      };

      (generateObject as any).mockResolvedValue({
        object: {
          table: 'deals',
          aggregation: 'count',
          groupBy: 'stage',
          chartType: 'bar',
          title: 'Test Chart',
          filters: null,
          dateFilter: null,
          sortBy: null,
          sortOrder: null,
          limit: null,
          valueColumn: null,
        },
      });

      (supabase.from as any).mockReturnValue(mockQueryBuilder);

      const result = await analyzeAndFetchData('Test query');

      expect(result.config.xAxis).toBe('stage');
      expect(result.config.yAxis).toBe('count');
    });

    it('should handle non-aggregated data', async () => {
      const mockData = [
        { name: 'Deal 1', amount: 1000 },
        { name: 'Deal 2', amount: 2000 },
      ];

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        filter: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      (generateObject as any).mockResolvedValue({
        object: {
          table: 'deals',
          aggregation: 'none',
          chartType: 'table',
          title: 'All Deals',
          filters: null,
          dateFilter: null,
          sortBy: null,
          sortOrder: null,
          limit: 100,
          groupBy: null,
          valueColumn: null,
        },
      });

      (supabase.from as any).mockReturnValue(mockQueryBuilder);

      const result = await analyzeAndFetchData('List all deals');

      expect(result.data).toEqual(mockData);
      expect(result.config.type).toBe('table');
    });
  });
});

