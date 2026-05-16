import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { AlertCircle, ExternalLink } from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  balance: number;
  referral_code: string;
  referred_by: string | null;
  is_banned: boolean;
  is_admin: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const generateReferralCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string, email?: string) => {
    try {
      console.log('Fetching profile for userId:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, balance, referral_code, referred_by, is_banned, is_admin, created_at')
        .eq('id', userId)
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating one...');
          // Try to get referral data from current session user if available
          const { data: sessionData } = await supabase.auth.getSession();
          const referrerId = sessionData.session?.user.user_metadata?.referrer_id;

          const newReferralCode = generateReferralCode();
          const { data: created, error: createError } = await supabase.from('profiles').upsert({
            id: userId,
            email: email || '',
            referral_code: newReferralCode,
            balance: 0,
            is_admin: false,
            is_banned: false,
            referred_by: referrerId || null
          }).select().single();
          console.log("PROFILE DATA:", created);

          if (createError) {
            console.error('Error creating profile:', createError);
            throw createError;
          }
          if (created) {
            console.log('Profile created successfully:', created);
            setProfile(created as Profile);
          }
        } else {
          console.log("PROFILE DATA:", data);
          console.error('Error fetching profile:', error);
          throw error;
        }
      } else if (data) {
        console.log('Profile fetched successfully:', data);
        setProfile(data as Profile);
        setLoading(false);
      }
    } catch (err) {
      console.error('fetchProfile catch block:', err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    // Single listener for auth state changes
    // This fires INTIAL_SESSION immediately and then updates on every event
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!isMounted) return;
      
      const currentUser = currentSession?.user ?? null;
      setSession(currentSession);
      setUser(currentUser);
      
      if (currentUser) {
        fetchProfile(currentUser.id, currentUser.email)
  .catch((err) => {
    console.error("Profile fetch error:", err);
    setProfile(null);
  })
  .finally(() => {
    setLoading(false);
  });
      } else {
        setProfile(null);
      }
      
      
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Real-time profile updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`profile:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, 
        (payload) => {
          if (payload.new) setProfile(payload.new as Profile);
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
      // Success immediate redirect is handled by ProtectedRoute/Auth listener
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id, user.email);
  }, [user, fetchProfile]);

  const value = useMemo(() => ({
    user,
    profile,
    session,
    loading,
    signOut,
    refreshProfile,
  }), [user, profile, session, loading, signOut, refreshProfile]);

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white p-8 rounded-[24px] shadow-sm border border-[#e5e5e5] text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-semibold mb-3 tracking-tight">Configuration Required</h1>
          <p className="text-[#9e9e9e] text-sm leading-relaxed mb-8">
            To use this application, you need to provide your Supabase project credentials. 
            Please add them to your environment variables.
          </p>
          
          <div className="space-y-3 text-left">
            <div className="p-3 bg-[#fcfcfc] border border-[#e5e5e5] rounded-xl">
              <code className="text-[11px] font-mono text-[#1a1a1a]">VITE_SUPABASE_URL</code>
            </div>
            <div className="p-3 bg-[#fcfcfc] border border-[#e5e5e5] rounded-xl">
              <code className="text-[11px] font-mono text-[#1a1a1a]">VITE_SUPABASE_ANON_KEY</code>
            </div>
          </div>

          <a 
            href="https://supabase.com/dashboard" 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-8 flex items-center justify-center gap-2 w-full bg-[#1a1a1a] text-white rounded-xl py-3 text-sm font-medium hover:bg-opacity-90 transition-all"
          >
            Go to Supabase Dashboard
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
