import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Key, Clock, Settings, User, Terminal, 
  Wallet, RefreshCcw, Plus, ChevronRight, X, Mail, Calendar, AlertCircle, Send, Gift, Users, Copy, CheckCircle2, Share2, XCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';

import { Link, useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isAddingFunds, setIsAddingFunds] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const referralLink = React.useMemo(() => 
    `${window.location.origin}/signup?ref=${profile?.referral_code || ''}`,
    [profile?.referral_code]
  );
  
  const copyLink = React.useCallback(() => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [referralLink]);

  const stats = React.useMemo(() => [
    { label: 'Total Balance', value: `$${profile?.balance?.toFixed(2) || '0.00'}`, icon: Wallet, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Security Level', value: 'High', icon: Key, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Last Login', value: user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Today', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
  ], [profile?.balance, user?.last_sign_in_at]);

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    await refreshProfile();
    setTimeout(() => setIsRefreshing(false), 600);
  }, [refreshProfile]);

  const quickActions = [
    { title: 'Earn Rewards', icon: Gift, desc: 'Complete daily tasks', path: '/offerwall' },
    { title: 'Invite Friends', icon: Users, desc: 'Earn $0.10 per referral', path: '/referrals' },
    { title: 'Withdraw Funds', icon: Send, desc: 'Minimum $1.00', path: '/withdraw' },
    { title: 'Admin Console', icon: Shield, desc: 'Balance & Payouts', path: '/admin', adminOnly: true },
    { title: 'API Access', icon: Terminal, desc: 'Manage access keys', path: '#' },
  ];

  const visibleActions = quickActions.filter(a => {
    if (a.adminOnly) return profile?.is_admin;
    return true;
  });

  return (
    <div className="space-y-8 pb-20">
      {profile?.is_banned && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-[32px] p-8 flex flex-col md:flex-row items-center gap-6 text-red-600 shadow-lg shadow-red-500/5"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center shrink-0">
            <XCircle className="w-8 h-8" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-xl font-bold mb-1">Account Suspended</h2>
            <p className="text-sm opacity-80 leading-relaxed">
              Your account has been flagged for suspicious activity. Earning rewards and requesting withdrawals are currently disabled. If you believe this is a mistake, please contact support.
            </p>
          </div>
          <button className="px-6 py-3 bg-red-600 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-all">
            Contact Support
          </button>
        </motion.div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1a1a1a]">Dashboard</h1>
          <p className="text-[#9e9e9e] mt-1">
            Status: <span className="text-green-600 font-medium">Connected</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 bg-white border border-[#e5e5e5] rounded-xl text-sm font-medium hover:bg-[#fcfcfc] transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button 
            onClick={() => setShowEditModal(true)}
            className="px-4 py-2 bg-[#1a1a1a] text-white rounded-xl text-sm font-medium hover:bg-opacity-90 transition-all shadow-md shadow-black/10"
          >
            Update Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-[28px] border border-[#e5e5e5] shadow-sm group hover:border-blue-200 hover:shadow-md transition-all relative overflow-hidden"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3.5 ${stat.bg} rounded-2xl ${stat.color} transition-transform group-hover:scale-110`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#9e9e9e]">
                {stat.label}
              </span>
            </div>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold text-[#1a1a1a] tracking-tight">{stat.value}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <section className="bg-white rounded-[28px] border border-[#e5e5e5] overflow-hidden shadow-sm">
            <div className="p-6 border-b border-[#e5e5e5] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="font-semibold text-lg text-[#1a1a1a]">User Profile</h2>
              </div>
              <button 
                onClick={() => setShowEditModal(true)}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Edit
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#f5f5f5] rounded-full flex items-center justify-center text-[#9e9e9e]">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#1a1a1a]">{profile?.email || user?.email}</div>
                  <div className="text-xs text-[#9e9e9e]">ID: {user?.id.substring(0, 8)}...</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-[#f5f5f5]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#9e9e9e]">
                    <Mail className="w-3 h-3" />
                    Verified
                  </div>
                  <div className="text-sm font-medium">{user?.email_confirmed_at ? 'Yes' : 'Pending'}</div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#9e9e9e]">
                    <Calendar className="w-3 h-3" />
                    Joined
                  </div>
                  <div className="text-sm font-medium text-[#1a1a1a]">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Recently'}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-[28px] border border-[#e5e5e5] overflow-hidden shadow-sm">
            <div className="p-6 border-b border-[#e5e5e5] flex items-center justify-between">
              <h2 className="font-semibold">Quick Actions</h2>
            </div>
            <div className="p-2">
              {visibleActions.map((action) => (
                <button 
                  key={action.title} 
                  onClick={() => {
                    if (action.path !== '#') {
                      navigate(action.path);
                    }
                  }}
                  className="w-full p-4 flex items-center gap-4 hover:bg-[#f9f9f9] rounded-2xl transition-colors group"
                >
                  <div className="w-10 h-10 bg-[#f5f5f5] rounded-xl flex items-center justify-center text-[#9e9e9e] group-hover:bg-white group-hover:shadow-sm transition-all">
                    <action.icon className="w-5 h-5 transition-colors group-hover:text-blue-600" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="text-sm font-semibold text-[#1a1a1a]">{action.title}</div>
                    <div className="text-xs text-[#9e9e9e]">{action.desc}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#e5e5e5] group-hover:text-[#1a1a1a] transition-colors" />
                </button>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-[28px] border border-[#e5e5e5] overflow-hidden shadow-sm">
            <div className="p-6 border-b border-[#e5e5e5] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="font-semibold text-lg text-[#1a1a1a]">Referral Program</h2>
              </div>
              <Link to="/referrals" className="text-xs font-bold text-blue-600 hover:underline">View History</Link>
            </div>
            <div className="p-8">
              <div className="bg-[#fcfcfc] border border-[#e5e5e5] rounded-2xl p-6 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#9e9e9e] mb-2"> Your Referral Code </div>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold font-mono text-[#1a1a1a] tracking-widest">
                      {profile?.referral_code || '...'}
                    </div>
                    <button 
                      onClick={copyLink}
                      className="p-3 bg-[#1a1a1a] text-white rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md shadow-black/10 flex items-center gap-2 text-xs"
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied' : 'Copy Link'}
                    </button>
                  </div>
                  <p className="mt-4 text-[10px] text-[#9e9e9e]">Earn $5.00 for every friend who signs up using your link.</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-[#1a1a1a] text-white rounded-[28px] overflow-hidden shadow-2xl shadow-black/20 flex flex-col h-full">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Terminal className="w-5 h-5 text-green-400" />
                <h2 className="font-semibold text-white/90">Activity Logs</h2>
              </div>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
              </div>
            </div>
            <div className="p-8 font-mono text-[11px] leading-relaxed flex-1 space-y-4">
              <div className="space-y-2">
                <div className="flex gap-4">
                  <span className="text-white/30">[09:21:44]</span>
                  <span className="text-green-400">auth_session_init</span>
                  <span className="text-white/50">token=verified</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-white/30">[10:05:12]</span>
                  <span className="text-blue-400">profile_sync</span>
                  <span className="text-white/50">status=200</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-white/30">[10:05:13]</span>
                  <span className="text-purple-400">balance_fetch</span>
                  <span className="text-white/50">val={profile?.balance || 0}</span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-white/5 text-white/40">
                // System Metadata
                <pre className="mt-2 text-[10px] bg-white/5 p-4 rounded-xl text-white/60">
                  {JSON.stringify({
                    provider: user?.app_metadata.provider,
                    role: user?.role,
                    aud: user?.aud,
                    email_verified: !!user?.email_confirmed_at
                  }, null, 2)}
                </pre>
              </div>
              <div className="mt-4 animate-pulse inline-block w-2 h-4 bg-white/30" />
            </div>
          </section>
        </div>
      </div>

      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] w-full max-w-lg relative overflow-hidden shadow-2xl"
            >
              <div className="p-8 pb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#1a1a1a]">Edit Profile</h2>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-[#f5f5f5] rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-[#9e9e9e]" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9e9e9e] mb-2 block">Display Email</label>
                    <input 
                      type="text" 
                      disabled
                      value={user?.email || ''} 
                      className="w-full bg-[#f9f9f9] border border-[#e5e5e5] rounded-2xl px-4 py-3.5 text-sm text-[#9e9e9e] cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9e9e9e] mb-2 block">Account Created</label>
                    <div className="text-sm font-medium px-1">
                      {profile?.created_at ? new Date(profile.created_at).toLocaleString() : 'Just now'}
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex items-start gap-4">
                    <Shield className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <h4 className="text-sm font-semibold text-blue-900">Security Note</h4>
                      <p className="text-xs text-blue-800/80 mt-1">
                        Email updates are handled through the security panel to ensure account integrity.
                      </p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="w-full bg-[#1a1a1a] text-white rounded-2xl py-4 font-semibold hover:bg-opacity-90 transition-all shadow-xl shadow-black/10 mt-4"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

