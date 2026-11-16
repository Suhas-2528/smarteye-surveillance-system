import { useState, useEffect } from 'react';
import AppSelector from './components/AppSelector';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import UserLogin from './components/user/UserLogin';
import UserDashboard from './components/user/UserDashboard';
import { AppPortal } from './types';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import { ErrorBoundary } from './components/FirebaseErrorHandlers';

export default function App() {
  const [portal, setPortal] = useState<AppPortal>('selector');
  const [adminName, setAdminName] = useState('System Administrator');
  const [facultyName, setFacultyName] = useState('Faculty Member');

  useEffect(() => {
    // Check URL parameters for direct app launch: e.g. ?app=admin or ?app=user
    const params = new URLSearchParams(window.location.search);
    const appParam = params.get('app');
    if (appParam === 'admin') {
      setPortal('admin-auth');
    } else if (appParam === 'user') {
      setPortal('user-auth');
    } else {
      setPortal('selector');
    }
  }, []);

  const handleAdminLogin = (name: string, uid?: string) => {
    setAdminName(name || 'System Administrator');
    setPortal('admin-app');
  };

  const handleUserLogin = (name: string, uid?: string) => {
    setFacultyName(name || 'Faculty Member');
    setPortal('user-app');
  };

  const handleAdminLogout = () => {
    setPortal('admin-auth');
  };

  const handleUserLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('SignOut error:', e);
    }
    setPortal('user-auth');
  };

  const handleReturnToHub = () => {
    setPortal('selector');
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen font-sans bg-[#05070c]">
        {/* Application Hub / Entrance Selector */}
        {portal === 'selector' && (
          <AppSelector onSelectPortal={(selected) => setPortal(selected)} />
        )}

        {/* APPLICATION 1: ADMIN CONTROL SYSTEM */}
        {portal === 'admin-auth' && (
          <AdminLogin
            onLogin={handleAdminLogin}
            onBack={handleReturnToHub}
          />
        )}

        {portal === 'admin-app' && (
          <AdminDashboard
            adminName={adminName}
            onLogout={handleAdminLogout}
            onSwitchPortal={handleReturnToHub}
          />
        )}

        {/* APPLICATION 2: FACULTY SURVEILLANCE & WORKSPACE */}
        {portal === 'user-auth' && (
          <UserLogin
            onLogin={handleUserLogin}
            onBack={handleReturnToHub}
          />
        )}

        {portal === 'user-app' && (
          <UserDashboard
            facultyName={facultyName}
            onLogout={handleUserLogout}
            onSwitchPortal={handleReturnToHub}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
