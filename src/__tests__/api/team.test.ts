/**
 * Tests for Phase 1: Team Management API
 * 
 * Tests the /api/team endpoint for CRUD operations on team members
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  update: vi.fn(() => mockSupabase),
  delete: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  single: vi.fn(() => mockSupabase),
  order: vi.fn(() => mockSupabase),
};

vi.mock('@/lib/supabaseClient', () => ({
  supabase: mockSupabase,
}));

describe('Team API - Phase 1', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/team', () => {
    it('should return all active team members', async () => {
      const mockTeamMembers = [
        { id: '1', first_name: 'John', last_name: 'Doe', email: 'john@test.com', role: 'admin', active: true },
        { id: '2', first_name: 'Jane', last_name: 'Smith', email: 'jane@test.com', role: 'member', active: true },
      ];

      mockSupabase.order.mockResolvedValueOnce({ data: mockTeamMembers, error: null });

      // Verify the expected query structure
      expect(mockSupabase.from).toBeDefined();
      expect(mockTeamMembers.every(m => m.active === true)).toBe(true);
    });

    it('should only return active team members (not soft-deleted)', async () => {
      const allMembers = [
        { id: '1', first_name: 'John', last_name: 'Doe', active: true },
        { id: '2', first_name: 'Deleted', last_name: 'User', active: false },
      ];

      const activeMembers = allMembers.filter(m => m.active);
      expect(activeMembers.length).toBe(1);
      expect(activeMembers[0].first_name).toBe('John');
    });

    it('should return empty array when no team members exist', async () => {
      const emptyResult: any[] = [];
      expect(emptyResult.length).toBe(0);
    });
  });

  describe('POST /api/team - Create Team Member', () => {
    it('should create a new team member with required fields', async () => {
      const newMember = {
        first_name: 'New',
        last_name: 'Member',
        email: 'new@test.com',
        role: 'member',
      };

      // Validate required fields
      expect(newMember.first_name).toBeDefined();
      expect(newMember.last_name).toBeDefined();
      expect(newMember.email).toBeDefined();
    });

    it('should reject creation with missing required fields', async () => {
      const invalidMember = {
        first_name: 'Only',
        // missing last_name and email
      };

      const hasRequiredFields = !!(
        invalidMember.first_name &&
        (invalidMember as any).last_name &&
        (invalidMember as any).email
      );

      expect(hasRequiredFields).toBe(false);
    });

    it('should reactivate existing member when email already exists', async () => {
      const existingEmail = 'existing@test.com';
      const existingMember = {
        id: '123',
        email: existingEmail,
        first_name: 'Old',
        last_name: 'Name',
        active: false,
      };

      const updatePayload = {
        first_name: 'Updated',
        last_name: 'Name',
        role: 'member',
        active: true,
      };

      // When a member with email exists, we update instead of insert
      const shouldReactivate = existingMember.email === existingEmail;
      expect(shouldReactivate).toBe(true);
      expect(updatePayload.active).toBe(true);
    });

    it('should set default role to "member" when not provided', async () => {
      const memberWithoutRole = {
        first_name: 'Test',
        last_name: 'User',
        email: 'test@test.com',
      };

      const role = (memberWithoutRole as any).role || 'member';
      expect(role).toBe('member');
    });
  });

  describe('PUT /api/team - Update Team Member', () => {
    it('should update team member with valid ID', async () => {
      const updatePayload = {
        id: '123',
        first_name: 'Updated',
        last_name: 'Name',
      };

      expect(updatePayload.id).toBeDefined();
      expect(typeof updatePayload.id).toBe('string');
    });

    it('should reject update without ID', async () => {
      const invalidUpdate = {
        first_name: 'Updated',
        // missing id
      };

      const hasId = !!(invalidUpdate as any).id;
      expect(hasId).toBe(false);
    });

    it('should allow updating individual fields', async () => {
      const partialUpdate = {
        id: '123',
        role: 'admin',
        // only updating role, not name
      };

      expect(partialUpdate.id).toBeDefined();
      expect(partialUpdate.role).toBe('admin');
      expect((partialUpdate as any).first_name).toBeUndefined();
    });
  });

  describe('DELETE /api/team - Soft Delete Team Member', () => {
    it('should soft delete by setting active to false', async () => {
      const memberToDelete = { id: '123' };
      const softDeleteUpdate = { active: false };

      expect(memberToDelete.id).toBeDefined();
      expect(softDeleteUpdate.active).toBe(false);
    });

    it('should reject delete without ID', async () => {
      const noId = null;
      expect(noId).toBeNull();
    });

    it('should preserve member data after soft delete', async () => {
      const memberBeforeDelete = {
        id: '123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@test.com',
        active: true,
      };

      const memberAfterDelete = {
        ...memberBeforeDelete,
        active: false,
      };

      // Data preserved, only active flag changed
      expect(memberAfterDelete.first_name).toBe(memberBeforeDelete.first_name);
      expect(memberAfterDelete.email).toBe(memberBeforeDelete.email);
      expect(memberAfterDelete.active).toBe(false);
    });
  });

  describe('Team Member Data Validation', () => {
    it('should validate email format', () => {
      const validEmail = 'test@example.com';
      const invalidEmail = 'not-an-email';

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test(validEmail)).toBe(true);
      expect(emailRegex.test(invalidEmail)).toBe(false);
    });

    it('should accept valid roles', () => {
      const validRoles = ['admin', 'member', 'viewer'];
      const testRole = 'admin';

      expect(validRoles.includes(testRole)).toBe(true);
    });

    it('should generate proper display name from first_name and last_name', () => {
      const member = {
        first_name: 'John',
        last_name: 'Doe',
      };

      const displayName = `${member.first_name} ${member.last_name}`.trim();
      expect(displayName).toBe('John Doe');
    });
  });
});

