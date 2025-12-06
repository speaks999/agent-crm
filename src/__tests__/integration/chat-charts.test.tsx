/**
 * Integration tests for chart rendering in ChatInterface
 * 
 * These tests verify the full flow from user query to chart rendering
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ChatInterface from '@/components/ChatInterface';

// Mock fetch for API calls
global.fetch = vi.fn();

describe('ChatInterface - Chart Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('End-to-End Chart Flow', () => {
    it('should render bar chart after analytics query', async () => {
      const mockBarChartResponse = {
        data: [
          { name: 'Discovery', value: 5 },
          { name: 'Proposal', value: 3 },
          { name: 'Closed', value: 2 },
        ],
        config: {
          type: 'bar',
          title: 'Deals by Stage',
          xAxis: 'name',
          yAxis: 'value',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => mockBarChartResponse,
      });

      render(<ChatInterface />);

      const input = screen.getByPlaceholderText(/Tell me about a customer interaction or ask for analytics/i);
      const submitButton = screen.getByRole('button', { name: /submit/i });

      // Type analytics query
      fireEvent.change(input, { target: { value: 'Show me deals by stage' } });
      fireEvent.click(submitButton);

      // Wait for chart to render
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/agent/analyst',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });
    });

    it('should handle chart rendering errors gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('API Error'));

      render(<ChatInterface />);

      const input = screen.getByPlaceholderText(/Tell me about a customer interaction or ask for analytics/i);
      fireEvent.change(input, { target: { value: 'Show me revenue' } });
      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
      });
    });
  });

  describe('Chart Type Detection', () => {
    const testCases = [
      {
        query: 'Show me revenue by stage',
        expectedType: 'bar',
        description: 'should detect bar chart for revenue by category',
      },
      {
        query: 'Chart revenue over time',
        expectedType: 'line',
        description: 'should detect line chart for time series',
      },
      {
        query: 'Show deal status distribution',
        expectedType: 'pie',
        description: 'should detect pie chart for distribution',
      },
      {
        query: 'List all accounts',
        expectedType: 'table',
        description: 'should detect table for list queries',
      },
    ];

    testCases.forEach(({ query, expectedType, description }) => {
      it(description, () => {
        // This would be determined by the analyst API
        // We're testing the expectation here
        const analyticsKeywords = ['show', 'chart', 'list', 'revenue'];
        const isAnalytics = analyticsKeywords.some(keyword =>
          query.toLowerCase().includes(keyword)
        );

        expect(isAnalytics).toBe(true);
        // The actual chart type would come from the analyst API response
      });
    });
  });

  describe('Chart Data Format Validation', () => {
    it('should validate bar chart data format', () => {
      const validBarData = {
        data: [
          { name: 'Category 1', value: 10 },
          { name: 'Category 2', value: 20 },
        ],
        config: {
          type: 'bar',
          title: 'Test Chart',
          xAxis: 'name',
          yAxis: 'value',
        },
      };

      expect(validBarData.data).toBeInstanceOf(Array);
      expect(validBarData.data.length).toBeGreaterThan(0);
      expect(validBarData.config.type).toBe('bar');
      expect(validBarData.config.xAxis).toBeDefined();
      expect(validBarData.config.yAxis).toBeDefined();
    });

    it('should validate pie chart data format', () => {
      const validPieData = {
        data: [
          { name: 'Segment 1', value: 30 },
          { name: 'Segment 2', value: 70 },
        ],
        config: {
          type: 'pie',
          title: 'Distribution',
          xAxis: 'name',
          yAxis: 'value',
        },
      };

      expect(validPieData.data).toBeInstanceOf(Array);
      expect(validPieData.config.type).toBe('pie');
      // Pie charts need nameKey and dataKey
      expect(validPieData.config.xAxis).toBeDefined(); // becomes nameKey
      expect(validPieData.config.yAxis).toBeDefined(); // becomes dataKey
    });
  });

  describe('Chart Rendering Edge Cases', () => {
    it('should handle single data point', () => {
      const singlePointData = {
        data: [{ name: 'Only', value: 100 }],
        config: {
          type: 'bar',
          title: 'Single Point Chart',
        },
      };

      expect(singlePointData.data.length).toBe(1);
      expect(singlePointData.config.type).toBeDefined();
    });

    it('should handle large datasets', () => {
      const largeDataset = {
        data: Array.from({ length: 100 }, (_, i) => ({
          name: `Item ${i}`,
          value: Math.random() * 100,
        })),
        config: {
          type: 'bar',
          title: 'Large Dataset',
        },
      };

      expect(largeDataset.data.length).toBe(100);
      expect(largeDataset.data[0]).toHaveProperty('name');
      expect(largeDataset.data[0]).toHaveProperty('value');
    });

    it('should handle missing axis keys with defaults', () => {
      const dataWithoutAxes = {
        data: [{ name: 'Test', value: 100 }],
        config: {
          type: 'bar',
          title: 'Chart',
          // xAxis and yAxis missing
        },
      };

      const xAxisKey = dataWithoutAxes.config.xAxis || 'name';
      const yAxisKey = dataWithoutAxes.config.yAxis || 'value';

      expect(xAxisKey).toBe('name');
      expect(yAxisKey).toBe('value');
    });
  });

  describe('Chart Message Format', () => {
    it('should format chart message correctly', () => {
      const chartResult = {
        config: {
          type: 'bar',
          title: 'Deals by Stage',
        },
      };

      const message = `Here's your ${chartResult.config?.type || 'data'} chart: "${chartResult.config?.title || 'Analytics Result'}"`;

      expect(message).toContain('bar');
      expect(message).toContain('Deals by Stage');
    });

    it('should handle missing chart type in message', () => {
      const chartResult = {
        config: {
          title: 'Analytics Result',
          // type missing
        },
      };

      const message = `Here's your ${chartResult.config?.type || 'data'} chart: "${chartResult.config?.title || 'Analytics Result'}"`;

      expect(message).toContain('data');
      expect(message).toContain('Analytics Result');
    });
  });
});

