# RBAC Implementation Guide for Luminari

## Overview
This guide explains how to integrate Role-Based Access Control (RBAC) into your Luminari application.

## Files Created

1. **`src/config/permissions.js`** - Defines roles, modules, and permission mappings
2. **`src/context/AuthContext.js`** - Authentication context with login/logout
3. **`src/components/Login.js`** - Login page component
4. **`src/components/Login.css`** - Login page styles
5. **`src/components/ProtectedRoute.js`** - Route protection component
6. **Updated: `src/components/layout/Sidebar.js`** - Now filters menu items based on permissions

## Integration Steps

### Step 1: Update App.js

You need to wrap your app with `AuthProvider` and protect routes with `ProtectedRoute`:

```javascript
// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import AppLayout from './AppLayout';
import HomePage from './components/HomePage';
import ProtocolGenerator from './components/ProtocolGenerator';
import UnifiedRegulatoryGenerator from './components/UnifiedRegulatoryGenerator';
import DiseaseDiagnosis from './components/DiseaseDiagnosis';
import QueryAssistant from './components/QueryAssistant';
import EnhancedMedicalAnalysis from './components/EnhancedMedicalAnalysis';
import ExcelAnalysis from './components/ExcelAnalysis';
import ClinicalDossierCompiler from './components/ClinicalDossierCompiler';
import SkinDiseaseDetector from './components/SkinDiseaseDetector';
import LungCancerDetector from './components/LungCancerDetector';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route - Login */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes - Wrapped in AppLayout */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/protocol" element={<ProtocolGenerator />} />
                    <Route path="/unified-regulatory" element={<UnifiedRegulatoryGenerator />} />
                    <Route path="/diagnosis" element={<DiseaseDiagnosis />} />
                    <Route path="/diagnosis/dermatology" element={<SkinDiseaseDetector />} />
                    <Route path="/diagnosis/pulmonology" element={<LungCancerDetector />} />
                    <Route path="/query" element={<QueryAssistant />} />
                    <Route path="/enhanced-analysis" element={<EnhancedMedicalAnalysis />} />
                    <Route path="/excel-analysis" element={<ExcelAnalysis />} />
                    <Route path="/clinical-dossier" element={<ClinicalDossierCompiler />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
```

### Step 2: Update Header Component (Optional)

Add a logout button to your header:

```javascript
// In src/components/layout/Header.js
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Inside your Header component:
const { user, logout } = useAuth();
const navigate = useNavigate();

const handleLogout = () => {
  logout();
  navigate('/login');
};

// Add this button in your header JSX:
<button onClick={handleLogout} className="logout-button">
  Logout ({user?.email})
</button>
```

## Available Demo Users

The mock authentication system includes these demo users:

### 1. Admin User
- **Email**: `admin@luminari.com`
- **Password**: `admin123`
- **Access**: Full access to all modules

### 2. Query Only User
- **Email**: `user.query@luminari.com`
- **Password**: `query123`
- **Access**: Home + Ask Lumina only

### 3. Full Access User
- **Email**: `user.full@luminari.com`
- **Password**: `full123`
- **Access**: All modules (same as admin)

### 4. Custom User
- **Email**: `user.custom@luminari.com`
- **Password**: `custom123`
- **Access**: Home + Ask Lumina + Protocol Generator

## Adding Backend API Integration

### Step 1: Replace Mock Login

In `src/context/AuthContext.js`, replace the `mockLogin` function with actual API calls:

```javascript
const login = async (email, password) => {
  try {
    const response = await fetch('https://your-api.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      const userData = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        permissions: data.user.permissions, // For custom roles
        token: data.token
      };

      setUser(userData);
      localStorage.setItem('luminari_user', JSON.stringify(userData));
      return { success: true };
    } else {
      return { success: false, error: data.message || 'Login failed' };
    }
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Login failed. Please try again.' };
  }
};
```

### Step 2: Add Token to API Requests

Update your API service to include the auth token:

```javascript
// src/services/api.js
const getAuthToken = () => {
  const user = localStorage.getItem('luminari_user');
  if (user) {
    const userData = JSON.parse(user);
    return userData.token;
  }
  return null;
};

// Add to all your API calls:
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getAuthToken()}`
}
```

## Creating New Roles

To add a new role, update `src/config/permissions.js`:

```javascript
export const ROLES = {
  // ... existing roles
  ANALYSIS_ONLY: 'analysis_only'
};

export const ROLE_PERMISSIONS = {
  // ... existing permissions
  [ROLES.ANALYSIS_ONLY]: [
    MODULES.HOME,
    MODULES.ENHANCED_ANALYSIS,
    MODULES.EXCEL_ANALYSIS
  ]
};
```

## Backend User Schema Example

Your backend should return user data in this format:

```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "query_only",  // Or "custom"
    "permissions": null    // Or ["home", "query", "protocol"] for custom roles
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Security Considerations

1. **Never trust frontend-only security** - Always verify permissions on the backend
2. **Use HTTPS** for all API calls
3. **Store tokens securely** - Consider using httpOnly cookies instead of localStorage
4. **Implement token refresh** - Add refresh token logic for better UX
5. **Add rate limiting** - Protect your login endpoint from brute force attacks
6. **Validate on backend** - Every API endpoint should check user permissions

## Testing

Test the RBAC system:

1. Login as different users
2. Verify sidebar only shows accessible modules
3. Try to manually navigate to restricted routes (should show 403)
4. Check that logout works properly
5. Verify token persistence across page refreshes

## Troubleshooting

### Issue: "useAuth must be used within an AuthProvider"
**Solution**: Make sure App.js is wrapped with `<AuthProvider>`

### Issue: Sidebar still shows all items
**Solution**: Verify `checkAccess` is imported and used in Sidebar.js

### Issue: Protected routes not working
**Solution**: Check that routes are wrapped with `<ProtectedRoute>`

### Issue: Login redirects to wrong page
**Solution**: Check the `from` parameter in Login.js navigation

## Next Steps

1. Connect to your real backend API
2. Add password reset functionality
3. Implement "Remember Me" feature
4. Add multi-factor authentication (MFA)
5. Create admin panel for user management
6. Add audit logging for security events
