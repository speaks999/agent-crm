# Team Tests Documentation

## Overview

Comprehensive test suite for all team management functionality in the Agent CRM application. The test suite includes **65+ tests** across **12 categories**, covering all aspects of team operations, member management, invitations, permissions, error handling, and edge cases.

## Test Location

**UI Test Page**: `/admin/team-tests`
**Test File**: `src/app/(dashboard)/admin/team-tests/page.tsx`

## Test Categories

### 1. Team Management (5 tests)
Tests for creating and managing teams.

#### TM-01: Create New Team
- **Description**: Should successfully create a new team
- **Tests**: Team creation with valid name, ownership assignment, membership creation

#### TM-02: Get All Teams
- **Description**: Should retrieve all teams user is a member of
- **Tests**: API response structure, teams array, currentTeamId field

#### TM-03: Create Team with Logo URL
- **Description**: Should create a team with a logo URL
- **Tests**: Logo URL persistence

#### TM-04: Reject Empty Team Name
- **Description**: Should reject team creation with empty name
- **Tests**: Validation of required fields, proper error status (400)

#### TM-05: Reject Whitespace-Only Team Name
- **Description**: Should reject team creation with whitespace-only name
- **Tests**: String trimming and validation

---

### 2. Team Switching (4 tests)
Tests for switching between teams and managing current team context.

#### TS-01: Get Current Team
- **Description**: Should retrieve the current active team
- **Tests**: Current team retrieval, preference persistence

#### TS-02: Switch to Different Team
- **Description**: Should switch to a different team
- **Tests**: Team switching functionality, preference updates

#### TS-03: Reject Switch to Non-Member Team
- **Description**: Should reject switching to a team user is not a member of
- **Tests**: Permission validation, proper error status (403)

#### TS-04: Reject Switch Without Team ID
- **Description**: Should reject team switch without team_id
- **Tests**: Required parameter validation, proper error status (400)

---

### 3. Team Members (8 tests)
Tests for managing team members (CRUD operations).

#### TMB-01: Get Team Members
- **Description**: Should retrieve all active team members
- **Tests**: Member list retrieval, active member filtering

#### TMB-02: Create Team Member
- **Description**: Should create a new team member
- **Tests**: Member creation with all required fields

#### TMB-03: Reject Member Without Required Fields
- **Description**: Should reject member creation without required fields
- **Tests**: Validation of first_name, last_name, email

#### TMB-04: Update Team Member
- **Description**: Should update an existing team member
- **Tests**: Partial updates, field modifications

#### TMB-05: Reject Update Without ID
- **Description**: Should reject update without member ID
- **Tests**: Required ID validation

#### TMB-06: Soft Delete Team Member
- **Description**: Should soft delete a team member
- **Tests**: Soft delete (active=false), data preservation

#### TMB-07: Reject Delete Without ID
- **Description**: Should reject delete without member ID
- **Tests**: Required ID validation for deletion

#### TMB-08: Reactivate Soft-Deleted Member
- **Description**: Should reactivate a previously deleted member with same email
- **Tests**: Member reactivation, duplicate email handling

---

### 4. Team Invites (5 tests)
Tests for team invitation system.

#### TI-01: Get Pending Invites
- **Description**: Should retrieve all pending invites
- **Tests**: Invite list retrieval, pending status filtering

#### TI-02: Send Team Invite
- **Description**: Should send an invite to join the team
- **Tests**: Invite creation, email notification trigger

#### TI-03: Reject Invite Without Team ID
- **Description**: Should reject invite without team_id
- **Tests**: Required field validation

#### TI-04: Reject Invite Without Email
- **Description**: Should reject invite without email
- **Tests**: Required field validation

#### TI-05: Prevent Duplicate Invites
- **Description**: Should prevent sending duplicate invites to same email
- **Tests**: Duplicate prevention logic

---

### 5. Data Validation (4 tests)
Tests for data validation and sanitization.

#### DV-01: Validate Email Format
- **Description**: Should validate email format for team members
- **Tests**: Email regex validation, valid/invalid email detection

#### DV-02: Validate Team Roles
- **Description**: Should validate team member roles
- **Tests**: Role validation (owner, admin, member)

#### DV-03: Trim Team Names
- **Description**: Should trim whitespace from team names
- **Tests**: String trimming, whitespace removal

#### DV-04: Case Insensitive Email
- **Description**: Should handle email case insensitivity
- **Tests**: Email normalization to lowercase

---

### 6. Permissions (3 tests)
Tests for role-based permissions and access control.

#### PM-01: Team Owner Has Full Access
- **Description**: Should verify team owner has all permissions
- **Tests**: Owner role identification

#### PM-02: Member Role Assignment
- **Description**: Should correctly assign member role
- **Tests**: Role assignment on creation

#### PM-03: Default Role to Member
- **Description**: Should default to member role when not specified
- **Tests**: Default role assignment

---

### 7. Error Handling (5 tests)
Tests for graceful error handling and edge cases.

#### EH-01: Handle Invalid Team ID
- **Description**: Should handle requests with invalid team ID gracefully
- **Tests**: Invalid UUID handling, proper error responses

#### EH-02: Handle Invalid Member ID
- **Description**: Should handle update with invalid member ID gracefully
- **Tests**: Invalid ID handling without crashes

#### EH-03: Handle Malformed JSON
- **Description**: Should handle malformed JSON gracefully
- **Tests**: JSON parsing error handling

#### EH-04: Handle Expired Invite
- **Description**: Should handle expired invites correctly
- **Tests**: Expiration date logic, invite filtering

#### EH-05: Handle Missing Authorization
- **Description**: Should handle requests without authorization gracefully
- **Tests**: Unauthenticated request handling


---

### 8. Team Lifecycle (4 tests)
Tests for complete team lifecycle operations.

#### TL-01: Create Multiple Teams
- **Description**: Should allow user to create multiple teams
- **Tests**: Multiple team creation, unique IDs

#### TL-02: Team Ownership Assignment
- **Description**: Should automatically assign creator as owner
- **Tests**: Auto-ownership on creation

#### TL-03: Automatic Membership Creation
- **Description**: Should automatically create membership when team is created
- **Tests**: Auto-membership, user can access team

#### TL-04: Team Name Uniqueness
- **Description**: Should allow multiple teams with same name (no uniqueness constraint)
- **Tests**: Duplicate name handling

---

### 9. Advanced Member Management (5 tests)
Tests for complex member operations.

#### AMM-01: Create Member with Different Roles
- **Description**: Should create members with admin and member roles
- **Tests**: Multiple role types

#### AMM-02: Update Member Role
- **Description**: Should update a member's role from member to admin
- **Tests**: Role promotion/demotion

#### AMM-03: Multiple Members with Same Name
- **Description**: Should allow multiple members with same first/last name
- **Tests**: Name duplicate handling

#### AMM-04: Verify Only Active Members Returned
- **Description**: Should only return active members, not soft-deleted ones
- **Tests**: Soft delete filtering

#### AMM-05: Update Multiple Fields at Once
- **Description**: Should update multiple member fields in single request
- **Tests**: Bulk field updates

---

### 10. Invite Workflows (3 tests)
Tests for invitation workflows and scenarios.

#### IW-01: Send Invite with Admin Role
- **Description**: Should send invite with admin role
- **Tests**: Role specification in invites

#### IW-02: Multiple Invites to Different Emails
- **Description**: Should allow multiple invites to different emails
- **Tests**: Bulk invite sending

#### IW-03: Invite Email Case Insensitivity
- **Description**: Should normalize invite emails to lowercase
- **Tests**: Email normalization

---

### 11. Concurrent Operations (2 tests)
Tests for handling concurrent operations.

#### CO-01: Rapid Team Switching
- **Description**: Should handle rapid team switches correctly
- **Tests**: Race condition handling, state consistency

#### CO-02: Create Multiple Members Rapidly
- **Description**: Should handle creating multiple members in quick succession
- **Tests**: Parallel operations

---

### 12. Edge Cases (6 tests)
Tests for edge cases and boundary conditions.

#### EC-01: Very Long Team Name
- **Description**: Should handle very long team names
- **Tests**: 255+ character names

#### EC-02: Special Characters in Team Name
- **Description**: Should handle special characters in team name
- **Tests**: !@#$%^&*() handling

#### EC-03: Unicode Characters in Team Name
- **Description**: Should handle unicode characters (emoji, etc)
- **Tests**: Emoji, international characters

#### EC-04: Very Long Email Address
- **Description**: Should handle very long email addresses
- **Tests**: 200+ character emails

#### EC-05: Empty Logo URL
- **Description**: Should handle empty logo URL gracefully
- **Tests**: Empty string handling

#### EC-06: Null Values in Team Creation
- **Description**: Should handle null values properly
- **Tests**: Null value handling

---

## API Endpoints Tested

### Teams API (`/api/teams`)
- **GET**: List all teams user is a member of
- **POST**: Create a new team

### Current Team API (`/api/teams/current`)
- **GET**: Get the user's current active team
- **PUT**: Switch to a different team

### Team Invites API (`/api/teams/invites`)
- **GET**: Get all pending invites for the current user
- **POST**: Send an invite to join a team
- **PUT**: Accept or decline an invite

### Team Members API (`/api/team`)
- **GET**: List all active team members
- **POST**: Create a new team member
- **PUT**: Update an existing team member
- **DELETE**: Soft delete a team member

---

## Test Features

### UI Features
- **Real-time Test Execution**: Run all tests or individual tests
- **Category Filtering**: Filter tests by category
- **Failed Tests Filter**: View only failed tests
- **Test Results Display**: Visual status indicators (passed/failed/running)
- **Detailed Error Information**: Expandable error details and response data
- **Performance Metrics**: Test duration tracking
- **Statistics Dashboard**: Pass rate, total tests, completed tests

### Test Data Management
- **Test Data Tracking**: Automatic tracking of created test data
- **Sequential Execution**: Tests run sequentially to handle dependencies
- **Shared Test Context**: Tests can share data via testDataRef
- **Authentication**: Uses real authentication headers from AuthContext

### Status Indicators
- ✅ **Passed**: Green checkmark
- ❌ **Failed**: Red X
- ⏳ **Running**: Blue spinning loader
- ⏸️ **Pending**: Gray alert circle

---

## Test Execution Flow

1. **Initialization**: Test page loads with all tests in pending state
2. **Authentication**: Gets auth headers from AuthContext
3. **Sequential Execution**: Tests run one after another
4. **Data Tracking**: Created resources (teams, members, invites) are tracked
5. **Shared Context**: Test data is shared between tests for dependencies
6. **Results Display**: Real-time updates with status, duration, and messages

---

## Test Data Cleanup

The test suite creates real data in the database during execution:
- Teams
- Team memberships
- Team members
- Team invites

**Note**: Currently, test data is not automatically cleaned up. Consider adding a cleanup function similar to the MCP Tests page to delete test data after execution.

---

## Dependencies

- **React**: UI framework
- **Next.js**: App router and API routes
- **AuthContext**: Authentication and session management
- **Lucide React**: Icons
- **Tailwind CSS**: Styling

---

## Running the Tests

1. Navigate to `/admin/team-tests` in your application
2. Click "Run All Tests" to execute all tests
3. Or click the play button on individual tests to run them one at a time
4. Use filters to view specific categories or failed tests only
5. Click the expand button on test results to view detailed response data

---

## Test Coverage

### ✅ Covered Areas
- Team creation and retrieval
- Team switching and current team management
- Team member CRUD operations
- Soft delete and reactivation
- Team invitations
- Duplicate prevention
- Data validation and sanitization
- Role-based permissions
- Error handling and edge cases
- API response validation
- Authentication requirements

### 🚧 Potential Future Tests
- Team deletion
- Team ownership transfer
- Bulk member operations
- Invite expiration handling
- Team settings management
- Audit logging
- Rate limiting
- Concurrent operation handling
- Team member limits
- Email notification verification

---

## Best Practices

1. **Run tests in a development environment**: Tests create real database records
2. **Review failed tests**: Check error details and response data
3. **Sequential dependencies**: Some tests depend on data created by previous tests
4. **Authentication required**: Ensure you're logged in before running tests
5. **Database state**: Tests may affect database state, run in isolated environment

---

## Troubleshooting

### Common Issues

**Tests failing with "Unauthorized"**
- Ensure you're logged in with a valid session
- Check authentication headers are being sent

**Tests failing with "No team found"**
- Create at least one team first
- Some tests require existing teams

**Dependency failures**
- Run tests sequentially, not in parallel
- Some tests depend on data created by previous tests

**Database errors**
- Check Supabase connection
- Verify database schema is up to date
- Check RLS policies

---

## Maintenance

### Updating Tests
When updating team functionality:
1. Update corresponding test cases
2. Add new tests for new features
3. Update this documentation
4. Run full test suite to ensure no regressions

### Adding New Tests
1. Define test in appropriate category array
2. Follow naming convention (ID: category abbreviation + number)
3. Implement execute function with TestContext
4. Return TestResult with passed/failed status and descriptive message
5. Update documentation

---

## Contact

For questions or issues with the test suite, please refer to the main project documentation or contact the development team.
