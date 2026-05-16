import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Ban, LogOut } from 'lucide-react';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (profile?.is_banned) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4 text-center">
        <div className="max-w-md w-full bg-white p-8 rounded-[24px] border border-red-100 shadow-xl shadow-red-900/5">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Ban className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">Account Banned</h1>
          <p className="text-[#9e9e9e] text-sm mb-8">
            Your account has been suspended for violating our terms of service. 
            If you believe this is a mistake, please contact support.
          </p>
          <button
            onClick={() => signOut()}
            className="flex items-center justify-center gap-2 w-full bg-red-600 text-white rounded-xl py-3 font-medium hover:bg-red-700 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
