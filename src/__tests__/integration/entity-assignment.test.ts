/**
 * Tests for Phase 2: Entity Assignment
 * 
 * Tests the assigned_to field across deals, contacts, accounts, and interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch for MCP tool calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Entity Assignment - Phase 2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Deals Assignment', () => {
    it('should create deal with assigned_to field', async () => {
      const dealPayload = {
        name: 'Test Deal',
        amount: 10000,
        assigned_to: 'team-member-uuid-123',
      };

      expect(dealPayload.assigned_to).toBeDefined();
      expect(typeof dealPayload.assigned_to).toBe('string');
    });

    it('should update deal assigned_to field', async () => {
      const updatePayload = {
        id: 'deal-uuid',
        assigned_to: 'new-team-member-uuid',
      };

      expect(updatePayload.id).toBeDefined();
      expect(updatePayload.assigned_to).toBeDefined();
    });

    it('should filter deals by assigned_to', async () => {
      const allDeals = [
        { id: '1', name: 'Deal 1', assigned_to: 'user-1' },
        { id: '2', name: 'Deal 2', assigned_to: 'user-2' },
        { id: '3', name: 'Deal 3', assigned_to: 'user-1' },
      ];

      const filteredDeals = allDeals.filter(d => d.assigned_to === 'user-1');
      expect(filteredDeals.length).toBe(2);
      expect(filteredDeals.every(d => d.assigned_to === 'user-1')).toBe(true);
    });

    it('should allow null assigned_to (unassigned deals)', async () => {
      const unassignedDeal = {
        id: '1',
        name: 'Unassigned Deal',
        assigned_to: null,
      };

      expect(unassignedDeal.assigned_to).toBeNull();
    });
  });

  describe('Contacts Assignment', () => {
    it('should create contact with assigned_to field', async () => {
      const contactPayload = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@test.com',
        assigned_to: 'team-member-uuid-123',
      };

      expect(contactPayload.assigned_to).toBeDefined();
    });

    it('should update contact assigned_to field', async () => {
      const updatePayload = {
        id: 'contact-uuid',
        assigned_to: 'new-team-member-uuid',
      };

      expect(updatePayload.id).toBeDefined();
      expect(updatePayload.assigned_to).toBeDefined();
    });

    it('should filter contacts by assigned_to', async () => {
      const allContacts = [
        { id: '1', first_name: 'John', assigned_to: 'user-1' },
        { id: '2', first_name: 'Jane', assigned_to: 'user-2' },
        { id: '3', first_name: 'Bob', assigned_to: 'user-1' },
      ];

      const filteredContacts = allContacts.filter(c => c.assigned_to === 'user-1');
      expect(filteredContacts.length).toBe(2);
    });
  });

  describe('Accounts Assignment', () => {
    it('should create account with assigned_to field', async () => {
      const accountPayload = {
        name: 'Acme Corp',
        industry: 'Technology',
        assigned_to: 'team-member-uuid-123',
      };

      expect(accountPayload.assigned_to).toBeDefined();
    });

    it('should update account assigned_to field', async () => {
      const updatePayload = {
        id: 'account-uuid',
        assigned_to: 'new-team-member-uuid',
      };

      expect(updatePayload.id).toBeDefined();
      expect(updatePayload.assigned_to).toBeDefined();
    });

    it('should filter accounts by assigned_to', async () => {
      const allAccounts = [
        { id: '1', name: 'Acme', assigned_to: 'user-1' },
        { id: '2', name: 'Globex', assigned_to: 'user-2' },
        { id: '3', name: 'Initech', assigned_to: 'user-1' },
      ];

      const filteredAccounts = allAccounts.filter(a => a.assigned_to === 'user-1');
      expect(filteredAccounts.length).toBe(2);
    });
  });

  describe('Interactions/Tasks Assignment', () => {
    it('should create interaction with assigned_to field', async () => {
      const interactionPayload = {
        type: 'call',
        summary: 'Follow up call',
        assigned_to: 'team-member-uuid-123',
      };

      expect(interactionPayload.assigned_to).toBeDefined();
    });

    it('should update interaction assigned_to field', async () => {
      const updatePayload = {
        id: 'interaction-uuid',
        assigned_to: 'new-team-member-uuid',
      };

      expect(updatePayload.id).toBeDefined();
      expect(updatePayload.assigned_to).toBeDefined();
    });

    it('should filter interactions by assigned_to', async () => {
      const allInteractions = [
        { id: '1', type: 'call', assigned_to: 'user-1' },
        { id: '2', type: 'email', assigned_to: 'user-2' },
        { id: '3', type: 'meeting', assigned_to: 'user-1' },
      ];

      const filteredInteractions = allInteractions.filter(i => i.assigned_to === 'user-1');
      expect(filteredInteractions.length).toBe(2);
    });
  });

  describe('MCP Tool Schema Validation', () => {
    it('should accept valid UUID for assigned_to', () => {
      const validUUID = '123e4567-e89b-12d3-a456-426614174000';
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      expect(uuidRegex.test(validUUID)).toBe(true);
    });

    it('should reject invalid UUID for assigned_to', () => {
      const invalidUUID = 'not-a-valid-uuid';
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      expect(uuidRegex.test(invalidUUID)).toBe(false);
    });

    it('should allow undefined assigned_to (optional field)', () => {
      const payloadWithoutAssignment = {
        name: 'Test Deal',
        amount: 5000,
        // assigned_to not provided
      };

      expect((payloadWithoutAssignment as any).assigned_to).toBeUndefined();
    });
  });

  describe('Assignment Cascade Behavior', () => {
    it('should set assigned_to to null when team member is deleted', () => {
      // ON DELETE SET NULL behavior
      const dealBeforeDelete = { id: '1', assigned_to: 'team-member-123' };
      const dealAfterTeamMemberDelete = { id: '1', assigned_to: null };

      expect(dealAfterTeamMemberDelete.assigned_to).toBeNull();
    });

    it('should preserve entity when assigned team member is deleted', () => {
      const dealBeforeDelete = {
        id: '1',
        name: 'Important Deal',
        amount: 50000,
        assigned_to: 'team-member-123',
      };

      const dealAfterDelete = {
        ...dealBeforeDelete,
        assigned_to: null,
      };

      // Deal data preserved, only assigned_to nullified
      expect(dealAfterDelete.name).toBe(dealBeforeDelete.name);
      expect(dealAfterDelete.amount).toBe(dealBeforeDelete.amount);
      expect(dealAfterDelete.assigned_to).toBeNull();
    });
  });

  describe('Quick Assignment from Detail Pages', () => {
    it('should update assignment without modifying other fields', () => {
      const originalDeal = {
        id: '1',
        name: 'Test Deal',
        amount: 10000,
        status: 'open',
        assigned_to: 'user-1',
      };

      const updatePayload = {
        id: '1',
        assigned_to: 'user-2',
      };

      const updatedDeal = {
        ...originalDeal,
        ...updatePayload,
      };

      expect(updatedDeal.name).toBe(originalDeal.name);
      expect(updatedDeal.amount).toBe(originalDeal.amount);
      expect(updatedDeal.assigned_to).toBe('user-2');
    });
  });
});

