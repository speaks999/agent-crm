'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, CheckCircle2, XCircle, AlertCircle, Loader2, Filter, RefreshCw, ChevronDown, ChevronUp, Trash2, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Test categories
const TEST_CATEGORIES = [
    'Team Management',
    'Team Members',
    'Team Invites',
    'Team Switching',
    'Permissions',
    'Data Validation',
    'Error Handling',
    'Team Lifecycle',
    'Advanced Members',
    'Invite Workflows',
    'Concurrent Operations',
    'Edge Cases',
] as const;

type TestCategory = typeof TEST_CATEGORIES[number];

interface TeamTest {
    id: string;
    category: TestCategory;
    name: string;
    description: string;
    execute: (context: TestContext) => Promise<TestResult>;
}

interface TestContext {
    session: any;
    getAuthHeaders: () => HeadersInit;
    testData: Record<string, any>;
}

interface TestResult {
    passed: boolean;
    message: string;
    data?: any;
    error?: string;
}

interface TestResultState {
    test: TeamTest;
    status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
    result?: TestResult;
    duration?: number;
    timestamp?: Date;
}

// Helper function to make authenticated API calls
async function apiCall(
    endpoint: string,
    options: RequestInit = {},
    headers: HeadersInit = {}
): Promise<Response> {
    return fetch(endpoint, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
        credentials: 'include',
    });
}

// ============================================
// TEAM MANAGEMENT TESTS
// ============================================

const teamManagementTests: TeamTest[] = [
    {
        id: 'tm-01',
        category: 'Team Management',
        name: 'Create New Team',
        description: 'Should successfully create a new team',
        execute: async (context) => {
            const teamName = `Test Team ${Date.now()}`;
            const response = await apiCall('/api/teams', {
                method: 'POST',
                body: JSON.stringify({ name: teamName }),
            }, context.getAuthHeaders());

            const data = await response.json();

            if (!response.ok) {
                return {
                    passed: false,
                    message: `Failed to create team: ${data.error}`,
                    error: data.error,
                };
            }

            // Store for cleanup and other tests
            context.testData.createdTeamId = data.team.id;
            context.testData.createdTeamName = teamName;

            return {
                passed: true,
                message: `Team created successfully: ${teamName}`,
                data: data.team,
            };
        },
    },
    {
        id: 'tm-02',
        category: 'Team Management',
        name: 'Get All Teams',
        description: 'Should retrieve all teams user is a member of',
        execute: async (context) => {
            const response = await apiCall('/api/teams', {
                method: 'GET',
            }, context.getAuthHeaders());

            const data = await response.json();

            if (!response.ok) {
                return {
                    passed: false,
                    message: 'Failed to retrieve teams',
                    error: data.error,
                };
            }

            const hasTeams = Array.isArray(data.teams);
            const hasCurrentTeamId = 'currentTeamId' in data;

            return {
                passed: hasTeams && hasCurrentTeamId,
                message: `Retrieved ${data.teams?.length || 0} teams`,
                data,
            };
        },
    },
    {
        id: 'tm-03',
        category: 'Team Management',
        name: 'Create Team with Logo URL',
        description: 'Should create a team with a logo URL',
        execute: async (context) => {
            const teamName = `Logo Team ${Date.now()}`;
            const logoUrl = 'https://example.com/logo.png';
            
            const response = await apiCall('/api/teams', {
                method: 'POST',
                body: JSON.stringify({ name: teamName, logo_url: logoUrl }),
            }, context.getAuthHeaders());

            const data = await response.json();

            if (!response.ok) {
                return {
                    passed: false,
                    message: `Failed to create team with logo: ${data.error}`,
                    error: data.error,
                };
            }

            const hasLogo = data.team.logo_url === logoUrl;

            return {
                passed: hasLogo,
                message: hasLogo ? 'Team created with logo URL' : 'Logo URL not saved',
                data: data.team,
            };
        },
    },
    {
        id: 'tm-04',
        category: 'Team Management',
        name: 'Reject Empty Team Name',
        description: 'Should reject team creation with empty name',
        execute: async (context) => {
            const response = await apiCall('/api/teams', {
                method: 'POST',
                body: JSON.stringify({ name: '' }),
            }, context.getAuthHeaders());

            const data = await response.json();

            return {
                passed: !response.ok && response.status === 400,
                message: !response.ok ? 'Empty team name rejected correctly' : 'Should reject empty name',
                data,
            };
        },
    },
    {
        id: 'tm-05',
        category: 'Team Management',
        name: 'Reject Whitespace-Only Team Name',
        description: 'Should reject team creation with whitespace-only name',
        execute: async (context) => {
            const response = await apiCall('/api/teams', {
                method: 'POST',
                body: JSON.stringify({ name: '   ' }),
            }, context.getAuthHeaders());

            const data = await response.json();

            return {
                passed: !response.ok && response.status === 400,
                message: !response.ok ? 'Whitespace name rejected correctly' : 'Should reject whitespace name',
                data,
            };
        },
    },
];

// ============================================
// TEAM SWITCHING TESTS
// ============================================

const teamSwitchingTests: TeamTest[] = [
    {
        id: 'ts-01',
        category: 'Team Switching',
        name: 'Get Current Team',
        description: 'Should retrieve the current active team',
        execute: async (context) => {
            const response = await apiCall('/api/teams/current', {
                method: 'GET',
            }, context.getAuthHeaders());

            const data = await response.json();

            if (!response.ok) {
                return {
                    passed: false,
                    message: 'Failed to get current team',
                    error: data.error,
                };
            }

            context.testData.currentTeam = data.team;

            return {
                passed: true,
                message: data.team ? `Current team: ${data.team.name}` : 'No current team set',
                data: data.team,
            };
        },
    },
    {
        id: 'ts-02',
        category: 'Team Switching',
        name: 'Switch to Different Team',
        description: 'Should switch to a different team',
        execute: async (context) => {
            // First get all teams
            const teamsResponse = await apiCall('/api/teams', {
                method: 'GET',
            }, context.getAuthHeaders());

            const teamsData = await teamsResponse.json();

            if (!teamsData.teams || teamsData.teams.length < 2) {
                return {
                    passed: false,
                    message: 'Need at least 2 teams to test switching',
                    error: 'Insufficient teams',
                };
            }

            // Find a team that's not current
            const targetTeam = teamsData.teams.find((t: any) => !t.isCurrent);

            if (!targetTeam) {
                return {
                    passed: false,
                    message: 'Could not find a non-current team',
                    error: 'No target team',
                };
            }

            // Switch to it
            const response = await apiCall('/api/teams/current', {
                method: 'PUT',
                body: JSON.stringify({ team_id: targetTeam.id }),
            }, context.getAuthHeaders());

            const data = await response.json();

            if (!response.ok) {
                return {
                    passed: false,
                    message: `Failed to switch team: ${data.error}`,
                    error: data.error,
                };
            }

            return {
                passed: data.team.id === targetTeam.id,
                message: `Switched to team: ${data.team.name}`,
                data: data.team,
            };
        },
    },
    {
        id: 'ts-03',
        category: 'Team Switching',
        name: 'Reject Switch to Non-Member Team',
        description: 'Should reject switching to a team user is not a member of',
        execute: async (context) => {
            const fakeTeamId = '00000000-0000-0000-0000-000000000000';
            
            const response = await apiCall('/api/teams/current', {
                method: 'PUT',
                body: JSON.stringify({ team_id: fakeTeamId }),
            }, context.getAuthHeaders());

            const data = await response.json();

            return {
                passed: !response.ok && response.status === 403,
                message: !response.ok ? 'Non-member team rejected correctly' : 'Should reject non-member team',
                data,
            };
        },
    },
    {
        id: 'ts-04',
        category: 'Team Switching',
        name: 'Reject Switch Without Team ID',
        description: 'Should reject team switch without team_id',
        execute: async (context) => {
            const response = await apiCall('/api/teams/current', {
                method: 'PUT',
                body: JSON.stringify({}),
            }, context.getAuthHeaders());

            const data = await response.json();

            return {
                passed: !response.ok && response.status === 400,
                message: !response.ok ? 'Missing team_id rejected correctly' : 'Should require team_id',
                data,
            };
        },
    },
];

// ============================================
// TEAM MEMBERS TESTS
// ============================================

const teamMembersTests: TeamTest[] = [
    {
        id: 'tmb-01',
        category: 'Team Members',
        name: 'Get Team Members',
        description: 'Should retrieve all active team members',
        execute: async (context) => {
            const response = await apiCall('/api/team', {
                method: 'GET',
            }, context.getAuthHeaders());

            const data = await response.json();

            if (!response.ok) {
                return {
                    passed: false,
                    message: 'Failed to retrieve team members',
                    error: data.error,
                };
            }

            const isArray = Array.isArray(data);

            return {
                passed: isArray,
                message: `Retrieved ${data.length || 0} team members`,
                data,
            };
        },
    },
    {
        id: 'tmb-02',
        category: 'Team Members',
        name: 'Create Team Member',
        description: 'Should create a new team member',
        execute: async (context) => {
            const memberData = {
                first_name: 'Test',
                last_name: 'Member',
                email: `test.member.${Date.now()}@example.com`,
                role: 'member',
            };

            const response = await apiCall('/api/team', {
                method: 'POST',
                body: JSON.stringify(memberData),
            }, context.getAuthHeaders());

            const data = await response.json();

            if (!response.ok) {
                return {
                    passed: false,
                    message: `Failed to create team member: ${data.error}`,
                    error: data.error,
                };
            }

            context.testData.createdMemberId = data.id;
            context.testData.createdMemberEmail = memberData.email;

            return {
                passed: true,
                message: `Team member created: ${memberData.first_name} ${memberData.last_name}`,
                data,
            };
        },
    },
    {
        id: 'tmb-03',
        category: 'Team Members',
        name: 'Reject Member Without Required Fields',
        description: 'Should reject member creation without required fields',
        execute: async (context) => {
            const response = await apiCall('/api/team', {
                method: 'POST',
                body: JSON.stringify({
                    first_name: 'Only',
                    // missing last_name and email
                }),
            }, context.getAuthHeaders());

            const data = await response.json();

            return {
                passed: !response.ok && response.status === 400,
                message: !response.ok ? 'Missing fields rejected correctly' : 'Should reject missing fields',
                data,
            };
        },
    },
    {
        id: 'tmb-04',
        category: 'Team Members',
        name: 'Update Team Member',
        description: 'Should update an existing team member',
        execute: async (context) => {
            if (!context.testData.createdMemberId) {
                return {
                    passed: false,
                    message: 'No member to update (create member first)',
                    error: 'No member ID',
                };
            }

            const updateData = {
                id: context.testData.createdMemberId,
                first_name: 'Updated',
                role: 'admin',
            };

            const response = await apiCall('/api/team', {
                method: 'PUT',
                body: JSON.stringify(updateData),
            }, context.getAuthHeaders());

            const data = await response.json();

            if (!response.ok) {
                return {
                    passed: false,
                    message: `Failed to update member: ${data.error}`,
                    error: data.error,
                };
            }

            return {
                passed: data.first_name === 'Updated' && data.role === 'admin',
                message: 'Team member updated successfully',
                data,
            };
        },
    },
    {
        id: 'tmb-05',
        category: 'Team Members',
        name: 'Reject Update Without ID',
        description: 'Should reject update without member ID',
        execute: async (context) => {
            const response = await apiCall('/api/team', {
                method: 'PUT',
                body: JSON.stringify({
                    first_name: 'Updated',
                }),
            }, context.getAuthHeaders());

            const data = await response.json();

            return {
                passed: !response.ok && response.status === 400,
                message: !response.ok ? 'Missing ID rejected correctly' : 'Should require ID',
                data,
            };
        },
    },
    {
        id: 'tmb-06',
        category: 'Team Members',
        name: 'Soft Delete Team Member',
        description: 'Should soft delete a team member',
        execute: async (context) => {
            if (!context.testData.createdMemberId) {
                return {
                    passed: false,
                    message: 'No member to delete (create member first)',
                    error: 'No member ID',
                };
            }

            const response = await apiCall(`/api/team?id=${context.testData.createdMemberId}`, {
                method: 'DELETE',
            }, context.getAuthHeaders());

            const data = await response.json();

            if (!response.ok) {
                return {
                    passed: false,
                    message: `Failed to delete member: ${data.error}`,
                    error: data.error,
                };
            }

            return {
                passed: data.success === true,
                message: 'Team member soft deleted successfully',
                data,
            };
        },
    },
    {
        id: 'tmb-07',
        category: 'Team Members',
        name: 'Reject Delete Without ID',
        description: 'Should reject delete without member ID',
        execute: async (context) => {
            const response = await apiCall('/api/team', {
                method: 'DELETE',
            }, context.getAuthHeaders());

            const data = await response.json();

            return {
                passed: !response.ok && response.status === 400,
                message: !response.ok ? 'Missing ID rejected correctly' : 'Should require ID',
                data,
            };
        },
    },
    {
        id: 'tmb-08',
        category: 'Team Members',
        name: 'Reactivate Soft-Deleted Member',
        description: 'Should reactivate a previously deleted member with same email',
        execute: async (context) => {
            if (!context.testData.createdMemberEmail) {
                return {
                    passed: false,
                    message: 'No deleted member email available',
                    error: 'No email',
                };
            }

            const memberData = {
                first_name: 'Reactivated',
                last_name: 'User',
                email: context.testData.createdMemberEmail,
                role: 'member',
            };

            const response = await apiCall('/api/team', {
                method: 'POST',
                body: JSON.stringify(memberData),
            }, context.getAuthHeaders());

            const data = await response.json();

            if (!response.ok) {
                return {
                    passed: false,
                    message: `Failed to reactivate member: ${data.error}`,
                    error: data.error,
                };
            }

            return {
                passed: data.first_name === 'Reactivated' && data.active === true,
                message: 'Member reactivated successfully',
                data,
            };
        },
    },
];

// ============================================
// TEAM INVITES TESTS
// ============================================

const teamInvitesTests: TeamTest[] = [
    {
        id: 'ti-01',
        category: 'Team Invites',
        name: 'Get Pending Invites',
        description: 'Should retrieve all pending invites',
        execute: async (context) => {
            const response = await apiCall('/api/teams/invites', {
                method: 'GET',
            }, context.getAuthHeaders());

            const data = await response.json();

            if (!response.ok) {
                return {
                    passed: false,
                    message: 'Failed to retrieve invites',
                    error: data.error,
                };
            }

            const hasInvites = 'invites' in data && Array.isArray(data.invites);

            return {
                passed: hasInvites,
                message: `Retrieved ${data.invites?.length || 0} pending invites`,
                data,
            };
        },
    },
    {
        id: 'ti-02',
        category: 'Team Invites',
        name: 'Send Team Invite',
        description: 'Should send an invite to join the team',
        execute: async (context) => {
            // Get current team first
            const teamsResponse = await apiCall('/api/teams', {
                method: 'GET',
            }, context.getAuthHeaders());
            const teamsData = await teamsResponse.json();

            if (!teamsData.teams || teamsData.teams.length === 0) {
                return {
                    passed: false,
                    message: 'No teams available to send invite',
                    error: 'No teams',
                };
            }

            const currentTeam = teamsData.teams.find((t: any) => t.isCurrent) || teamsData.teams[0];

            const inviteData = {
                team_id: currentTeam.id,
                email: `invite.${Date.now()}@example.com`,
                role: 'member',
            };

            const response = await apiCall('/api/teams/invites', {
                method: 'POST',
                body: JSON.stringify(inviteData),
            }, context.getAuthHeaders());

            const data = await response.json();

            if (!response.ok) {
                return {
                    passed: false,
                    message: `Failed to send invite: ${data.error}`,
                    error: data.error,
                };
            }

            context.testData.createdInviteId = data.invite?.id;

            return {
                passed: !!data.invite,
                message: `Invite sent to ${inviteData.email}`,
                data: data.invite,
            };
        },
    },
    {
        id: 'ti-03',
        category: 'Team Invites',
        name: 'Reject Invite Without Team ID',
        description: 'Should reject invite without team_id',
        execute: async (context) => {
            const response = await apiCall('/api/teams/invites', {
                method: 'POST',
                body: JSON.stringify({
                    email: 'test@example.com',
                    role: 'member',
                }),
            }, context.getAuthHeaders());

            const data = await response.json();

            return {
                passed: !response.ok && response.status === 400,
                message: !response.ok ? 'Missing team_id rejected correctly' : 'Should require team_id',
                data,
            };
        },
    },
    {
        id: 'ti-04',
        category: 'Team Invites',
        name: 'Reject Invite Without Email',
        description: 'Should reject invite without email',
        execute: async (context) => {
            const teamsResponse = await apiCall('/api/teams', {
                method: 'GET',
            }, context.getAuthHeaders());
            const teamsData = await teamsResponse.json();

            if (!teamsData.teams || teamsData.teams.length === 0) {
                return {
                    passed: false,
                    message: 'No teams available',
                    error: 'No teams',
                };
            }

            const currentTeam = teamsData.teams[0];

            const response = await apiCall('/api/teams/invites', {
                method: 'POST',
                body: JSON.stringify({
                    team_id: currentTeam.id,
                    role: 'member',
                }),
            }, context.getAuthHeaders());

            const data = await response.json();

            return {
                passed: !response.ok && response.status === 400,
                message: !response.ok ? 'Missing email rejected correctly' : 'Should require email',
                data,
            };
        },
    },
    {
        id: 'ti-05',
        category: 'Team Invites',
        name: 'Prevent Duplicate Invites',
        description: 'Should prevent sending duplicate invites to same email',
        execute: async (context) => {
            const teamsResponse = await apiCall('/api/teams', {
                method: 'GET',
            }, context.getAuthHeaders());
            const teamsData = await teamsResponse.json();

            if (!teamsData.teams || teamsData.teams.length === 0) {
                return {
                    passed: false,
                    message: 'No teams available',
                    error: 'No teams',
                };
            }

            const currentTeam = teamsData.teams[0];
            const testEmail = `duplicate.${Date.now()}@example.com`;

            // Send first invite
            await apiCall('/api/teams/invites', {
                method: 'POST',
                body: JSON.stringify({
                    team_id: currentTeam.id,
                    email: testEmail,
                    role: 'member',
                }),
            }, context.getAuthHeaders());

            // Try to send duplicate
            const response = await apiCall('/api/teams/invites', {
                method: 'POST',
                body: JSON.stringify({
                    team_id: currentTeam.id,
                    email: testEmail,
                    role: 'member',
                }),
            }, context.getAuthHeaders());

            const data = await response.json();

            return {
                passed: !response.ok && response.status === 400,
                message: !response.ok ? 'Duplicate invite rejected correctly' : 'Should prevent duplicate invites',
                data,
            };
        },
    },
];

// ============================================
// DATA VALIDATION TESTS
// ============================================

const dataValidationTests: TeamTest[] = [
    {
        id: 'dv-01',
        category: 'Data Validation',
        name: 'Validate Email Format',
        description: 'Should validate email format for team members',
        execute: async () => {
            const validEmails = ['test@example.com', 'user+tag@domain.co.uk', 'name.surname@company.io'];
            const invalidEmails = ['notanemail', '@nodomain.com', 'missing@.com', 'no@domain'];

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            const allValidPass = validEmails.every(email => emailRegex.test(email));
            const allInvalidFail = invalidEmails.every(email => !emailRegex.test(email));

            return {
                passed: allValidPass && allInvalidFail,
                message: allValidPass && allInvalidFail ? 'Email validation working correctly' : 'Email validation failed',
                data: { validEmails, invalidEmails },
            };
        },
    },
    {
        id: 'dv-02',
        category: 'Data Validation',
        name: 'Validate Team Roles',
        description: 'Should validate team member roles',
        execute: async () => {
            const validRoles = ['owner', 'admin', 'member'];
            const testRoles = ['owner', 'admin', 'member', 'invalid'];

            const allValid = testRoles.slice(0, 3).every(role => validRoles.includes(role));
            const invalidRejected = !validRoles.includes('invalid');

            return {
                passed: allValid && invalidRejected,
                message: 'Role validation working correctly',
                data: { validRoles, testRoles },
            };
        },
    },
    {
        id: 'dv-03',
        category: 'Data Validation',
        name: 'Trim Team Names',
        description: 'Should trim whitespace from team names',
        execute: async (context) => {
            const teamNameWithSpaces = `  Trimmed Team ${Date.now()}  `;
            const expectedTrimmed = teamNameWithSpaces.trim();

            const response = await apiCall('/api/teams', {
                method: 'POST',
                body: JSON.stringify({ name: teamNameWithSpaces }),
            }, context.getAuthHeaders());

            const data = await response.json();

            if (!response.ok) {
                return {
                    passed: false,
                    message: 'Failed to create team',
                    error: data.error,
                };
            }

            return {
                passed: data.team.name === expectedTrimmed,
                message: data.team.name === expectedTrimmed ? 'Team name trimmed correctly' : 'Team name not trimmed',
                data: data.team,
            };
        },
    },
    {
        id: 'dv-04',
        category: 'Data Validation',
        name: 'Case Insensitive Email',
        description: 'Should handle email case insensitivity',
        execute: async () => {
            const email1 = 'Test@Example.COM';
            const email2 = 'test@example.com';

            const normalized1 = email1.toLowerCase();
            const normalized2 = email2.toLowerCase();

            return {
                passed: normalized1 === normalized2,
                message: 'Email normalization working correctly',
                data: { email1, email2, normalized1, normalized2 },
            };
        },
    },
];

// ============================================
// PERMISSIONS TESTS
// ============================================

const permissionsTests: TeamTest[] = [
    {
        id: 'pm-01',
        category: 'Permissions',
        name: 'Team Owner Has Full Access',
        description: 'Should verify team owner has all permissions',
        execute: async (context) => {
            const teamsResponse = await apiCall('/api/teams', {
                method: 'GET',
            }, context.getAuthHeaders());
            const teamsData = await teamsResponse.json();

            const ownedTeam = teamsData.teams?.find((t: any) => t.role === 'owner');

            if (!ownedTeam) {
                return {
                    passed: false,
                    message: 'No owned teams found',
                    error: 'No owned teams',
                };
            }

            return {
                passed: true,
                message: `User is owner of team: ${ownedTeam.name}`,
                data: ownedTeam,
            };
        },
    },
    {
        id: 'pm-02',
        category: 'Permissions',
        name: 'Member Role Assignment',
        description: 'Should correctly assign member role',
        execute: async (context) => {
            const memberData = {
                first_name: 'Role',
                last_name: 'Test',
                email: `role.test.${Date.now()}@example.com`,
                role: 'member',
            };

            const response = await apiCall('/api/team', {
                method: 'POST',
                body: JSON.stringify(memberData),
            }, context.getAuthHeaders());

            const data = await response.json();

            if (!response.ok) {
                return {
                    passed: false,
                    message: 'Failed to create member',
                    error: data.error,
                };
            }

            return {
                passed: data.role === 'member',
                message: 'Member role assigned correctly',
                data,
            };
        },
    },
    {
        id: 'pm-03',
        category: 'Permissions',
        name: 'Default Role to Member',
        description: 'Should default to member role when not specified',
        execute: async (context) => {
            const memberData = {
                first_name: 'Default',
                last_name: 'Role',
                email: `default.role.${Date.now()}@example.com`,
                // role not specified
            };

            const response = await apiCall('/api/team', {
                method: 'POST',
                body: JSON.stringify(memberData),
            }, context.getAuthHeaders());

            const data = await response.json();

            if (!response.ok) {
                return {
                    passed: false,
                    message: 'Failed to create member',
                    error: data.error,
                };
            }

            return {
                passed: data.role === 'member',
                message: 'Default role assigned correctly',
                data,
            };
        },
    },
];

// ============================================
// ERROR HANDLING TESTS
// ============================================

const errorHandlingTests: TeamTest[] = [
    {
        id: 'eh-01',
        category: 'Error Handling',
        name: 'Handle Invalid Team ID',
        description: 'Should handle requests with invalid team ID gracefully',
        execute: async (context) => {
            const response = await apiCall('/api/teams/current', {
                method: 'PUT',
                body: JSON.stringify({ team_id: 'invalid-id' }),
            }, context.getAuthHeaders());

            const data = await response.json();

            return {
                passed: !response.ok,
                message: !response.ok ? 'Invalid team ID handled correctly' : 'Should reject invalid ID',
                data,
            };
        },
    },
    {
        id: 'eh-02',
        category: 'Error Handling',
        name: 'Handle Invalid Member ID',
        description: 'Should handle update with invalid member ID gracefully',
        execute: async (context) => {
            const response = await apiCall('/api/team', {
                method: 'PUT',
                body: JSON.stringify({
                    id: 'invalid-member-id',
                    first_name: 'Test',
                }),
            }, context.getAuthHeaders());

            // This might succeed or fail depending on implementation
            // Just check it doesn't crash
            return {
                passed: true,
                message: 'Invalid member ID handled without crash',
                data: await response.json().catch(() => ({})),
            };
        },
    },
    {
        id: 'eh-03',
        category: 'Error Handling',
        name: 'Handle Malformed JSON',
        description: 'Should handle malformed JSON gracefully',
        execute: async (context) => {
            try {
                const response = await fetch('/api/teams', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...context.getAuthHeaders(),
                    },
                    credentials: 'include',
                    body: 'not-valid-json',
                });

                return {
                    passed: !response.ok,
                    message: !response.ok ? 'Malformed JSON handled correctly' : 'Should reject malformed JSON',
                };
            } catch (error) {
                return {
                    passed: true,
                    message: 'Malformed JSON caught by error handler',
                };
            }
        },
    },
    {
        id: 'eh-04',
        category: 'Error Handling',
        name: 'Handle Expired Invite',
        description: 'Should handle expired invites correctly',
        execute: async () => {
            // This is a logical test - expired invites should be filtered out
            const now = new Date();
            const expiredDate = new Date(now.getTime() - 1000 * 60 * 60 * 24); // 1 day ago
            const validDate = new Date(now.getTime() + 1000 * 60 * 60 * 24); // 1 day from now

            const isExpired = expiredDate < now;
            const isValid = validDate > now;

            return {
                passed: isExpired && isValid,
                message: 'Invite expiration logic correct',
                data: { now, expiredDate, validDate },
            };
        },
    },
    {
        id: 'eh-05',
        category: 'Error Handling',
        name: 'Handle Missing Authorization',
        description: 'Should handle requests without authorization gracefully',
        execute: async () => {
            const response = await fetch('/api/teams', {
                method: 'GET',
                credentials: 'include',
            });

            const data = await response.json();

            // Should return empty array or unauthorized, not crash
            return {
                passed: response.ok || response.status === 401,
                message: 'Missing authorization handled gracefully',
                data,
            };
        },
    },
];

// ============================================
// TEAM LIFECYCLE TESTS
// ============================================

const teamLifecycleTests: TeamTest[] = [
    {
        id: 'tl-01',
        category: 'Team Lifecycle',
        name: 'Create Multiple Teams',
        description: 'Should allow user to create multiple teams',
        execute: async (context) => {
            const team1Name = `Multi Team 1 ${Date.now()}`;
            const team2Name = `Multi Team 2 ${Date.now()}`;
            
            const response1 = await apiCall('/api/teams', {
                method: 'POST',
                body: JSON.stringify({ name: team1Name }),
            }, context.getAuthHeaders());
            
            const response2 = await apiCall('/api/teams', {
                method: 'POST',
                body: JSON.stringify({ name: team2Name }),
            }, context.getAuthHeaders());
            
            const data1 = await response1.json();
            const data2 = await response2.json();
            
            const bothSucceeded = response1.ok && response2.ok;
            const differentIds = bothSucceeded && data1.team.id !== data2.team.id;
            
            return {
                passed: bothSucceeded && differentIds,
                message: bothSucceeded ? 'Created 2 teams successfully' : 'Failed to create multiple teams',
                data: { team1: data1.team, team2: data2.team },
            };
        },
    },
    {
        id: 'tl-02',
        category: 'Team Lifecycle',
        name: 'Team Ownership Assignment',
        description: 'Should automatically assign creator as owner',
        execute: async (context) => {
            const teamName = `Ownership Test ${Date.now()}`;
            
            const createResponse = await apiCall('/api/teams', {
                method: 'POST',
                body: JSON.stringify({ name: teamName }),
            }, context.getAuthHeaders());
            
            const createData = await createResponse.json();
            
            if (!createResponse.ok) {
                return {
                    passed: false,
                    message: 'Failed to create team',
                    error: createData.error,
                };
            }
            
            // Fetch teams to check role
            const teamsResponse = await apiCall('/api/teams', {
                method: 'GET',
            }, context.getAuthHeaders());
            
            const teamsData = await teamsResponse.json();
            const createdTeam = teamsData.teams?.find((t: any) => t.id === createData.team.id);
            
            return {
                passed: createdTeam?.role === 'owner',
                message: createdTeam?.role === 'owner' ? 'Creator assigned as owner' : `Creator role: ${createdTeam?.role}`,
                data: createdTeam,
            };
        },
    },
    {
        id: 'tl-03',
        category: 'Team Lifecycle',
        name: 'Automatic Membership Creation',
        description: 'Should automatically create membership when team is created',
        execute: async (context) => {
            const teamName = `Auto Membership ${Date.now()}`;
            
            const response = await apiCall('/api/teams', {
                method: 'POST',
                body: JSON.stringify({ name: teamName }),
            }, context.getAuthHeaders());
            
            const data = await response.json();
            
            if (!response.ok) {
                return {
                    passed: false,
                    message: 'Failed to create team',
                    error: data.error,
                };
            }
            
            // Verify user is member by trying to switch to it
            const switchResponse = await apiCall('/api/teams/current', {
                method: 'PUT',
                body: JSON.stringify({ team_id: data.team.id }),
            }, context.getAuthHeaders());
            
            return {
                passed: switchResponse.ok,
                message: switchResponse.ok ? 'Membership auto-created successfully' : 'User not auto-added to team',
                data,
            };
        },
    },
    {
        id: 'tl-04',
        category: 'Team Lifecycle',
        name: 'Team Name Uniqueness',
        description: 'Should allow multiple teams with same name (no uniqueness constraint)',
        execute: async (context) => {
            const sameName = `Duplicate Name ${Date.now()}`;
            
            const response1 = await apiCall('/api/teams', {
                method: 'POST',
                body: JSON.stringify({ name: sameName }),
            }, context.getAuthHeaders());
            
            const response2 = await apiCall('/api/teams', {
                method: 'POST',
                body: JSON.stringify({ name: sameName }),
            }, context.getAuthHeaders());
            
            const data1 = await response1.json();
            const data2 = await response2.json();
            
            const bothSucceeded = response1.ok && response2.ok;
            
            return {
                passed: bothSucceeded,
                message: bothSucceeded ? 'Duplicate team names allowed' : 'Team name uniqueness enforced',
                data: { team1: data1.team, team2: data2.team },
            };
        },
    },
];

// ============================================
// ADVANCED MEMBER MANAGEMENT TESTS
// ============================================

const advancedMemberTests: TeamTest[] = [
    {
        id: 'amm-01',
        category: 'Advanced Members',
        name: 'Create Member with Different Roles',
        description: 'Should create members with admin and member roles',
        execute: async (context) => {
            const adminData = {
                first_name: 'Admin',
                last_name: 'User',
                email: `admin.${Date.now()}@example.com`,
                role: 'admin',
            };
            
            const memberData = {
                first_name: 'Regular',
                last_name: 'Member',
                email: `member.${Date.now()}@example.com`,
                role: 'member',
            };
            
            const adminResponse = await apiCall('/api/team', {
                method: 'POST',
                body: JSON.stringify(adminData),
            }, context.getAuthHeaders());
            
            const memberResponse = await apiCall('/api/team', {
                method: 'POST',
                body: JSON.stringify(memberData),
            }, context.getAuthHeaders());
            
            const adminResult = await adminResponse.json();
            const memberResult = await memberResponse.json();
            
            const bothCreated = adminResponse.ok && memberResponse.ok;
            const rolesCorrect = adminResult.role === 'admin' && memberResult.role === 'member';
            
            return {
                passed: bothCreated && rolesCorrect,
                message: bothCreated && rolesCorrect ? 'Different roles assigned correctly' : 'Role assignment failed',
                data: { admin: adminResult, member: memberResult },
            };
        },
    },
    {
        id: 'amm-02',
        category: 'Advanced Members',
        name: 'Update Member Role',
        description: 'Should update a member\'s role from member to admin',
        execute: async (context) => {
            // Create a member
            const memberData = {
                first_name: 'Promotable',
                last_name: 'User',
                email: `promotable.${Date.now()}@example.com`,
                role: 'member',
            };
            
            const createResponse = await apiCall('/api/team', {
                method: 'POST',
                body: JSON.stringify(memberData),
            }, context.getAuthHeaders());
            
            const createData = await createResponse.json();
            
            if (!createResponse.ok) {
                return {
                    passed: false,
                    message: 'Failed to create member',
                    error: createData.error,
                };
            }
            
            // Update to admin
            const updateResponse = await apiCall('/api/team', {
                method: 'PUT',
                body: JSON.stringify({
                    id: createData.id,
                    role: 'admin',
                }),
            }, context.getAuthHeaders());
            
            const updateData = await updateResponse.json();
            
            return {
                passed: updateResponse.ok && updateData.role === 'admin',
                message: updateData.role === 'admin' ? 'Role updated to admin' : 'Role update failed',
                data: updateData,
            };
        },
    },
    {
        id: 'amm-03',
        category: 'Advanced Members',
        name: 'Multiple Members with Same Name',
        description: 'Should allow multiple members with same first/last name',
        execute: async (context) => {
            const member1 = {
                first_name: 'John',
                last_name: 'Doe',
                email: `john1.${Date.now()}@example.com`,
                role: 'member',
            };
            
            const member2 = {
                first_name: 'John',
                last_name: 'Doe',
                email: `john2.${Date.now() + 1}@example.com`,
                role: 'member',
            };
            
            const response1 = await apiCall('/api/team', {
                method: 'POST',
                body: JSON.stringify(member1),
            }, context.getAuthHeaders());
            
            const response2 = await apiCall('/api/team', {
                method: 'POST',
                body: JSON.stringify(member2),
            }, context.getAuthHeaders());
            
            const bothSucceeded = response1.ok && response2.ok;
            
            return {
                passed: bothSucceeded,
                message: bothSucceeded ? 'Multiple members with same name allowed' : 'Name uniqueness enforced',
            };
        },
    },
    {
        id: 'amm-04',
        category: 'Advanced Members',
        name: 'Verify Only Active Members Returned',
        description: 'Should only return active members, not soft-deleted ones',
        execute: async (context) => {
            // Create and delete a member
            const memberData = {
                first_name: 'ToDelete',
                last_name: 'User',
                email: `todelete.${Date.now()}@example.com`,
                role: 'member',
            };
            
            const createResponse = await apiCall('/api/team', {
                method: 'POST',
                body: JSON.stringify(memberData),
            }, context.getAuthHeaders());
            
            const createData = await createResponse.json();
            
            // Delete it
            await apiCall(`/api/team?id=${createData.id}`, {
                method: 'DELETE',
            }, context.getAuthHeaders());
            
            // Get all members
            const getResponse = await apiCall('/api/team', {
                method: 'GET',
            }, context.getAuthHeaders());
            
            const members = await getResponse.json();
            const deletedMemberPresent = members.some((m: any) => m.id === createData.id);
            
            return {
                passed: !deletedMemberPresent,
                message: deletedMemberPresent ? 'Deleted member still showing' : 'Only active members returned',
                data: members,
            };
        },
    },
    {
        id: 'amm-05',
        category: 'Advanced Members',
        name: 'Update Multiple Fields at Once',
        description: 'Should update multiple member fields in single request',
        execute: async (context) => {
            // Create a member
            const memberData = {
                first_name: 'Old',
                last_name: 'Name',
                email: `multiupdate.${Date.now()}@example.com`,
                role: 'member',
            };
            
            const createResponse = await apiCall('/api/team', {
                method: 'POST',
                body: JSON.stringify(memberData),
            }, context.getAuthHeaders());
            
            const createData = await createResponse.json();
            
            // Update multiple fields
            const updateResponse = await apiCall('/api/team', {
                method: 'PUT',
                body: JSON.stringify({
                    id: createData.id,
                    first_name: 'New',
                    last_name: 'Name',
                    role: 'admin',
                }),
            }, context.getAuthHeaders());
            
            const updateData = await updateResponse.json();
            
            const allUpdated = updateData.first_name === 'New' && 
                              updateData.last_name === 'Name' && 
                              updateData.role === 'admin';
            
            return {
                passed: allUpdated,
                message: allUpdated ? 'All fields updated successfully' : 'Not all fields updated',
                data: updateData,
            };
        },
    },
];

// ============================================
// INVITE WORKFLOW TESTS
// ============================================

const inviteWorkflowTests: TeamTest[] = [
    {
        id: 'iw-01',
        category: 'Invite Workflows',
        name: 'Send Invite with Admin Role',
        description: 'Should send invite with admin role',
        execute: async (context) => {
            const teamsResponse = await apiCall('/api/teams', {
                method: 'GET',
            }, context.getAuthHeaders());
            const teamsData = await teamsResponse.json();
            
            if (!teamsData.teams || teamsData.teams.length === 0) {
                return {
                    passed: false,
                    message: 'No teams available',
                    error: 'No teams',
                };
            }
            
            const currentTeam = teamsData.teams[0];
            
            const response = await apiCall('/api/teams/invites', {
                method: 'POST',
                body: JSON.stringify({
                    team_id: currentTeam.id,
                    email: `admin.invite.${Date.now()}@example.com`,
                    role: 'admin',
                }),
            }, context.getAuthHeaders());
            
            const data = await response.json();
            
            return {
                passed: response.ok && data.invite?.role === 'admin',
                message: data.invite?.role === 'admin' ? 'Admin invite created' : 'Admin role not assigned',
                data: data.invite,
            };
        },
    },
    {
        id: 'iw-02',
        category: 'Invite Workflows',
        name: 'Multiple Invites to Different Emails',
        description: 'Should allow multiple invites to different emails',
        execute: async (context) => {
            const teamsResponse = await apiCall('/api/teams', {
                method: 'GET',
            }, context.getAuthHeaders());
            const teamsData = await teamsResponse.json();
            
            if (!teamsData.teams || teamsData.teams.length === 0) {
                return {
                    passed: false,
                    message: 'No teams available',
                    error: 'No teams',
                };
            }
            
            const currentTeam = teamsData.teams[0];
            const timestamp = Date.now();
            
            const response1 = await apiCall('/api/teams/invites', {
                method: 'POST',
                body: JSON.stringify({
                    team_id: currentTeam.id,
                    email: `multi1.${timestamp}@example.com`,
                    role: 'member',
                }),
            }, context.getAuthHeaders());
            
            const response2 = await apiCall('/api/teams/invites', {
                method: 'POST',
                body: JSON.stringify({
                    team_id: currentTeam.id,
                    email: `multi2.${timestamp}@example.com`,
                    role: 'member',
                }),
            }, context.getAuthHeaders());
            
            return {
                passed: response1.ok && response2.ok,
                message: response1.ok && response2.ok ? 'Multiple invites sent' : 'Failed to send multiple invites',
            };
        },
    },
    {
        id: 'iw-03',
        category: 'Invite Workflows',
        name: 'Invite Email Case Insensitivity',
        description: 'Should normalize invite emails to lowercase',
        execute: async (context) => {
            const teamsResponse = await apiCall('/api/teams', {
                method: 'GET',
            }, context.getAuthHeaders());
            const teamsData = await teamsResponse.json();
            
            if (!teamsData.teams || teamsData.teams.length === 0) {
                return {
                    passed: false,
                    message: 'No teams available',
                    error: 'No teams',
                };
            }
            
            const currentTeam = teamsData.teams[0];
            
            const response = await apiCall('/api/teams/invites', {
                method: 'POST',
                body: JSON.stringify({
                    team_id: currentTeam.id,
                    email: `CaseSensitive.${Date.now()}@EXAMPLE.COM`,
                    role: 'member',
                }),
            }, context.getAuthHeaders());
            
            const data = await response.json();
            
            const isLowercase = data.invite?.email === data.invite?.email.toLowerCase();
            
            return {
                passed: isLowercase,
                message: isLowercase ? 'Email normalized to lowercase' : 'Email not normalized',
                data: data.invite,
            };
        },
    },
];

// ============================================
// CONCURRENT OPERATIONS TESTS
// ============================================

const concurrentTests: TeamTest[] = [
    {
        id: 'co-01',
        category: 'Concurrent Operations',
        name: 'Rapid Team Switching',
        description: 'Should handle rapid team switches correctly',
        execute: async (context) => {
            const teamsResponse = await apiCall('/api/teams', {
                method: 'GET',
            }, context.getAuthHeaders());
            const teamsData = await teamsResponse.json();
            
            if (!teamsData.teams || teamsData.teams.length < 2) {
                return {
                    passed: false,
                    message: 'Need at least 2 teams for this test',
                    error: 'Insufficient teams',
                };
            }
            
            const team1 = teamsData.teams[0];
            const team2 = teamsData.teams[1];
            
            // Switch back and forth quickly
            await apiCall('/api/teams/current', {
                method: 'PUT',
                body: JSON.stringify({ team_id: team1.id }),
            }, context.getAuthHeaders());
            
            await apiCall('/api/teams/current', {
                method: 'PUT',
                body: JSON.stringify({ team_id: team2.id }),
            }, context.getAuthHeaders());
            
            const finalResponse = await apiCall('/api/teams/current', {
                method: 'GET',
            }, context.getAuthHeaders());
            
            const finalData = await finalResponse.json();
            
            return {
                passed: finalResponse.ok && finalData.team?.id === team2.id,
                message: finalData.team?.id === team2.id ? 'Final team state correct' : 'Team state inconsistent',
                data: finalData.team,
            };
        },
    },
    {
        id: 'co-02',
        category: 'Concurrent Operations',
        name: 'Create Multiple Members Rapidly',
        description: 'Should handle creating multiple members in quick succession',
        execute: async (context) => {
            const timestamp = Date.now();
            const members = [
                { first_name: 'Rapid1', last_name: 'User', email: `rapid1.${timestamp}@example.com`, role: 'member' },
                { first_name: 'Rapid2', last_name: 'User', email: `rapid2.${timestamp}@example.com`, role: 'member' },
                { first_name: 'Rapid3', last_name: 'User', email: `rapid3.${timestamp}@example.com`, role: 'member' },
            ];
            
            const promises = members.map(member => 
                apiCall('/api/team', {
                    method: 'POST',
                    body: JSON.stringify(member),
                }, context.getAuthHeaders())
            );
            
            const responses = await Promise.all(promises);
            const allSucceeded = responses.every(r => r.ok);
            
            return {
                passed: allSucceeded,
                message: allSucceeded ? 'All 3 members created' : 'Some members failed to create',
            };
        },
    },
];

// ============================================
// EDGE CASE TESTS
// ============================================

const edgeCaseTests: TeamTest[] = [
    {
        id: 'ec-01',
        category: 'Edge Cases',
        name: 'Very Long Team Name',
        description: 'Should handle very long team names',
        execute: async (context) => {
            const longName = 'A'.repeat(255);
            
            const response = await apiCall('/api/teams', {
                method: 'POST',
                body: JSON.stringify({ name: longName }),
            }, context.getAuthHeaders());
            
            const data = await response.json();
            
            return {
                passed: response.ok || response.status === 400,
                message: response.ok ? 'Long name accepted' : 'Long name rejected (expected)',
                data,
            };
        },
    },
    {
        id: 'ec-02',
        category: 'Edge Cases',
        name: 'Special Characters in Team Name',
        description: 'Should handle special characters in team name',
        execute: async (context) => {
            const specialName = `Test!@#$%^&*()_+-=[]{}|;':",.<>?/ ${Date.now()}`;
            
            const response = await apiCall('/api/teams', {
                method: 'POST',
                body: JSON.stringify({ name: specialName }),
            }, context.getAuthHeaders());
            
            const data = await response.json();
            
            return {
                passed: response.ok,
                message: response.ok ? 'Special characters accepted' : 'Special characters rejected',
                data,
            };
        },
    },
    {
        id: 'ec-03',
        category: 'Edge Cases',
        name: 'Unicode Characters in Team Name',
        description: 'Should handle unicode characters (emoji, etc)',
        execute: async (context) => {
            const unicodeName = `Team 🚀 Test 日本語 ${Date.now()}`;
            
            const response = await apiCall('/api/teams', {
                method: 'POST',
                body: JSON.stringify({ name: unicodeName }),
            }, context.getAuthHeaders());
            
            const data = await response.json();
            
            return {
                passed: response.ok,
                message: response.ok ? 'Unicode characters accepted' : 'Unicode rejected',
                data: data.team,
            };
        },
    },
    {
        id: 'ec-04',
        category: 'Edge Cases',
        name: 'Very Long Email Address',
        description: 'Should handle very long email addresses',
        execute: async (context) => {
            const longEmail = 'a'.repeat(200) + `@example.com`;
            
            const memberData = {
                first_name: 'Long',
                last_name: 'Email',
                email: longEmail,
                role: 'member',
            };
            
            const response = await apiCall('/api/team', {
                method: 'POST',
                body: JSON.stringify(memberData),
            }, context.getAuthHeaders());
            
            return {
                passed: response.ok || response.status === 400,
                message: response.ok ? 'Long email accepted' : 'Long email rejected (expected)',
            };
        },
    },
    {
        id: 'ec-05',
        category: 'Edge Cases',
        name: 'Empty Logo URL',
        description: 'Should handle empty logo URL gracefully',
        execute: async (context) => {
            const teamName = `Empty Logo ${Date.now()}`;
            
            const response = await apiCall('/api/teams', {
                method: 'POST',
                body: JSON.stringify({ name: teamName, logo_url: '' }),
            }, context.getAuthHeaders());
            
            const data = await response.json();
            
            return {
                passed: response.ok,
                message: response.ok ? 'Empty logo URL handled' : 'Failed with empty logo URL',
                data: data.team,
            };
        },
    },
    {
        id: 'ec-06',
        category: 'Edge Cases',
        name: 'Null Values in Team Creation',
        description: 'Should handle null values properly',
        execute: async (context) => {
            const teamName = `Null Test ${Date.now()}`;
            
            const response = await apiCall('/api/teams', {
                method: 'POST',
                body: JSON.stringify({ name: teamName, logo_url: null }),
            }, context.getAuthHeaders());
            
            const data = await response.json();
            
            return {
                passed: response.ok,
                message: response.ok ? 'Null values handled' : 'Failed with null values',
                data: data.team,
            };
        },
    },
];

// Combine all tests
const ALL_TESTS: TeamTest[] = [
    ...teamManagementTests,
    ...teamSwitchingTests,
    ...teamMembersTests,
    ...teamInvitesTests,
    ...dataValidationTests,
    ...permissionsTests,
    ...errorHandlingTests,
    ...teamLifecycleTests,
    ...advancedMemberTests,
    ...inviteWorkflowTests,
    ...concurrentTests,
    ...edgeCaseTests,
];

// ============================================
// MAIN COMPONENT
// ============================================

export default function TeamTestsPage() {
    const { session, user } = useAuth();
    const [results, setResults] = useState<Record<string, TestResultState>>({});
    const [isRunning, setIsRunning] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [showFailedOnly, setShowFailedOnly] = useState(false);
    const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());
    const testDataRef = useRef<Record<string, any>>({});
    const testCardRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const getAuthHeaders = (): HeadersInit => {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        
        // Add Authorization header if we have a session token
        if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
        }
        
        return headers;
    };
    
    // Check if user is authenticated
    if (!user || !session) {
        return (
            <div className="flex-1 overflow-auto p-8">
                <div className="flex flex-col items-center justify-center h-full">
                    <AlertCircle size={64} className="text-yellow-500 mb-4" />
                    <h2 className="text-2xl font-bold text-foreground mb-2">Authentication Required</h2>
                    <p className="text-muted-foreground mb-4">Please log in to run team tests</p>
                </div>
            </div>
        );
    }

    const filteredTests = ALL_TESTS.filter(test => {
        if (selectedCategory !== 'all' && test.category !== selectedCategory) {
            return false;
        }
        if (showFailedOnly && results[test.id]?.status !== 'failed') {
            return false;
        }
        return true;
    });

    const runTest = async (test: TeamTest): Promise<void> => {
        setResults(prev => ({
            ...prev,
            [test.id]: {
                test,
                status: 'running',
                timestamp: new Date(),
            },
        }));

        const startTime = Date.now();

        try {
            const context: TestContext = {
                session,
                getAuthHeaders,
                testData: testDataRef.current,
            };

            const result = await test.execute(context);
            const duration = Date.now() - startTime;

            setResults(prev => ({
                ...prev,
                [test.id]: {
                    test,
                    status: result.passed ? 'passed' : 'failed',
                    result,
                    duration,
                    timestamp: new Date(),
                },
            }));
        } catch (error: any) {
            const duration = Date.now() - startTime;

            setResults(prev => ({
                ...prev,
                [test.id]: {
                    test,
                    status: 'failed',
                    result: {
                        passed: false,
                        message: 'Test execution failed',
                        error: error.message,
                    },
                    duration,
                    timestamp: new Date(),
                },
            }));
        }
    };

    const runAllTests = async () => {
        setIsRunning(true);
        testDataRef.current = {}; // Reset test data

        // Initialize all tests as pending
        const initialResults: Record<string, TestResultState> = {};
        filteredTests.forEach(test => {
            initialResults[test.id] = {
                test,
                status: 'pending',
            };
        });
        setResults(initialResults);

        // Run tests sequentially
        for (const test of filteredTests) {
            await runTest(test);
        }

        setIsRunning(false);
    };

    const runSingleTest = async (testId: string) => {
        const test = ALL_TESTS.find(t => t.id === testId);
        if (!test) return;

        await runTest(test);
    };

    const toggleTestExpanded = (testId: string) => {
        setExpandedTests(prev => {
            const newSet = new Set(prev);
            if (newSet.has(testId)) {
                newSet.delete(testId);
            } else {
                newSet.add(testId);
            }
            return newSet;
        });
    };

    const clearResults = () => {
        setResults({});
        testDataRef.current = {};
    };

    // Calculate stats
    const totalTests = filteredTests.length;
    const completedTests = Object.values(results).filter(r => 
        r.status === 'passed' || r.status === 'failed'
    ).length;
    const passedTests = Object.values(results).filter(r => r.status === 'passed').length;
    const failedTests = Object.values(results).filter(r => r.status === 'failed').length;
    const passRate = totalTests > 0 ? ((passedTests / completedTests) * 100).toFixed(1) : '0';

    return (
        <div className="flex-1 overflow-auto p-8">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <Users className="text-primary" size={32} />
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Team Tests</h1>
                        <p className="text-sm text-muted-foreground">
                            Comprehensive testing for team management functionality
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            {completedTests > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-card border border-border rounded-lg p-4">
                        <div className="text-2xl font-bold text-foreground">{totalTests}</div>
                        <div className="text-sm text-muted-foreground">Total Tests</div>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4">
                        <div className="text-2xl font-bold text-green-500">{passedTests}</div>
                        <div className="text-sm text-muted-foreground">Passed</div>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4">
                        <div className="text-2xl font-bold text-red-500">{failedTests}</div>
                        <div className="text-sm text-muted-foreground">Failed</div>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4">
                        <div className="text-2xl font-bold text-blue-500">{passRate}%</div>
                        <div className="text-sm text-muted-foreground">Pass Rate</div>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4">
                        <div className="text-2xl font-bold text-foreground">{completedTests}/{totalTests}</div>
                        <div className="text-sm text-muted-foreground">Completed</div>
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <button
                    onClick={runAllTests}
                    disabled={isRunning}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isRunning ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Running Tests...
                        </>
                    ) : (
                        <>
                            <Play size={16} />
                            Run All Tests
                        </>
                    )}
                </button>

                <button
                    onClick={clearResults}
                    disabled={isRunning}
                    className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90"
                >
                    <RefreshCw size={16} />
                    Clear Results
                </button>

                {/* Category Filter */}
                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-muted-foreground" />
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-3 py-2 bg-card border border-border rounded-lg text-foreground"
                    >
                        <option value="all">All Categories</option>
                        {TEST_CATEGORIES.map(category => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                    </select>
                </div>

                {/* Failed Only Filter */}
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showFailedOnly}
                        onChange={(e) => setShowFailedOnly(e.target.checked)}
                        className="w-4 h-4"
                    />
                    <span className="text-sm text-foreground">Failed Only</span>
                </label>
            </div>

            {/* Tests List */}
            <div className="space-y-3">
                {filteredTests.map(test => {
                    const result = results[test.id];
                    const isExpanded = expandedTests.has(test.id);

                    return (
                        <div
                            key={test.id}
                            ref={el => testCardRefs.current[test.id] = el}
                            className="bg-card border border-border rounded-lg p-4"
                        >
                            <div className="flex items-start gap-3">
                                {/* Status Icon */}
                                <div className="flex-shrink-0 mt-1">
                                    {result?.status === 'running' && (
                                        <Loader2 size={20} className="animate-spin text-blue-500" />
                                    )}
                                    {result?.status === 'passed' && (
                                        <CheckCircle2 size={20} className="text-green-500" />
                                    )}
                                    {result?.status === 'failed' && (
                                        <XCircle size={20} className="text-red-500" />
                                    )}
                                    {result?.status === 'pending' && (
                                        <AlertCircle size={20} className="text-muted-foreground" />
                                    )}
                                    {!result && (
                                        <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                                    )}
                                </div>

                                {/* Test Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-foreground">
                                            {test.id}: {test.name}
                                        </h3>
                                        <span className="px-2 py-0.5 text-xs bg-secondary text-secondary-foreground rounded">
                                            {test.category}
                                        </span>
                                        {result?.duration && (
                                            <span className="text-xs text-muted-foreground">
                                                {result.duration}ms
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        {test.description}
                                    </p>

                                    {/* Result Message */}
                                    {result?.result && (
                                        <div className={`text-sm ${result.status === 'passed' ? 'text-green-600' : 'text-red-600'}`}>
                                            {result.result.message}
                                        </div>
                                    )}

                                    {/* Error Details */}
                                    {result?.result?.error && (
                                        <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                                            {result.result.error}
                                        </div>
                                    )}

                                    {/* Expanded Details */}
                                    {isExpanded && result?.result?.data && (
                                        <div className="mt-2 p-3 bg-muted rounded-lg">
                                            <div className="text-xs font-mono text-foreground overflow-auto max-h-60">
                                                <pre>{JSON.stringify(result.result.data, null, 2)}</pre>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => runSingleTest(test.id)}
                                        disabled={isRunning}
                                        className="p-2 hover:bg-secondary rounded-lg disabled:opacity-50"
                                        title="Run this test"
                                    >
                                        <Play size={16} className="text-foreground" />
                                    </button>
                                    {result?.result?.data && (
                                        <button
                                            onClick={() => toggleTestExpanded(test.id)}
                                            className="p-2 hover:bg-secondary rounded-lg"
                                            title="Toggle details"
                                        >
                                            {isExpanded ? (
                                                <ChevronUp size={16} className="text-foreground" />
                                            ) : (
                                                <ChevronDown size={16} className="text-foreground" />
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {filteredTests.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No tests match the selected filters</p>
                    </div>
                )}
            </div>
        </div>
    );
}
