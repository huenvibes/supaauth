import React from 'react';
import { useAuth } from '../AuthContext';
import { LogOut, User as UserIcon, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#1a1a1a] font-sans">
      <nav className="bg-white border-b border-[#e5e5e5] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Shield className="w-6 h-6 text-blue-600" />
              <span className="text-xl font-semibold tracking-tight">SupaAuth</span>
            </Link>
            
            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-6">
                  <div className="hidden sm:flex items-center gap-2 text-sm text-[#9e9e9e]">
                    <UserIcon className="w-4 h-4" />
                    <span>{user.email}</span>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4 text-sm font-medium">
                  <Link to="/login" className="text-[#9e9e9e] hover:text-[#1a1a1a] transition-colors">Login</Link>
                  <Link to="/signup" className="px-4 py-2 bg-[#1a1a1a] text-white rounded-full hover:bg-opacity-90 transition-all">Sign Up</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </main>
      
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-[#e5e5e5]">
        <p className="text-sm text-[#9e9e9e] text-center">
          &copy; {new Date().getFullYear()} SupaAuth. All rights reserved.
        </p>
      </footer>
    </div>
  );
};
