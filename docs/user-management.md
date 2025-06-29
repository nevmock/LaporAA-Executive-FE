# User Management Feature

## Overview
This feature provides a comprehensive CRUD interface for managing user accounts in the LaporAA system. It's only accessible to users with SuperAdmin role.

## Features

### 🔐 Access Control
- Only SuperAdmin users can access the User Management page
- Automatic redirection for non-SuperAdmin users
- Menu item only appears for SuperAdmin users in the dropdown

### 📋 User List View
- Display all users in a clean table format
- Show user avatar (initials), name, username, role, and creation date
- Real-time search functionality across all user fields
- User count statistics

### ➕ Create User
- Modal form for adding new users
- Required fields: Nama Admin, Username, Password, Role
- Password visibility toggle
- Role selection (Admin/SuperAdmin)
- Form validation

### ✏️ Edit User
- Modal form for updating existing users
- Can update: Nama Admin, Username, Password (optional), Role
- Pre-filled form with current user data
- Optional password update (leave blank to keep current)

### 🗑️ Delete User
- Confirmation modal before deletion
- Shows user name in confirmation dialog
- Permanent deletion warning

## API Integration

The feature uses the following API endpoints:

```typescript
// Get all users
GET /userLogin

// Get user by ID
GET /userLogin/:userId

// Create new user
POST /userLogin
{
  "nama_admin": "string",
  "username": "string", 
  "password": "string",
  "role": "Admin" | "SuperAdmin"
}

// Update user
PUT /userLogin/:userId
{
  "nama_admin": "string", // optional
  "username": "string",   // optional
  "password": "string",   // optional
  "role": "Admin" | "SuperAdmin" // optional
}

// Delete user
DELETE /userLogin/:userId
```

## Sample Users

The following sample admin accounts are provided:

1. **Budi G.** - Username: `budi`, Password: `budi777`
2. **Yoguntara S.** - Username: `yoguntara`, Password: `yoguntara777`
3. **Anggi A. P.** - Username: `anggi`, Password: `anggi777`
4. **Tiara R. R** - Username: `tiara`, Password: `tiara777`
5. **M. Reza A.** - Username: `reza`, Password: `reza777`

You can use the utility script in `src/utils/sampleUsers.ts` to create these users programmatically.

## File Structure

```
src/
├── app/(dashboard)/user-management/
│   └── page.tsx                    # Main user management page
├── services/
│   └── userManagementService.ts    # API service functions
├── components/
│   └── TopNavbar.tsx              # Updated with menu item
└── utils/
    └── sampleUsers.ts             # Sample user creation script
```

## Security Considerations

- Role-based access control implemented
- Password fields use proper input types
- Confirmation dialogs for destructive actions
- Form validation on required fields
- Only SuperAdmin can access the management interface

## Usage

1. Log in as a SuperAdmin user
2. Click on your avatar in the top navigation
3. Select "User Management" from the dropdown menu
4. Use the interface to create, edit, or delete users as needed

## Styling

The interface follows the existing design system:
- Tailwind CSS for styling
- Consistent color scheme with the rest of the application
- Responsive design for mobile and desktop
- Loading states and smooth transitions
- Modern modal designs with proper accessibility
