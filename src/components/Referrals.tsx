import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Share2, Copy, CheckCircle2, 
  ArrowLeft, Award, TrendingUp, DollarSign,
  Info, Loader2, Sparkles, Gift
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ReferralRecord {
  id: string;
  referred_id: string;
  bonus_amount: number;
  created_at: string;
  referred_email?: string;
}

export const Referrals = () => {
  const { user, profile } = useAuth();
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      fetchReferrals();
    }
  }, [user]);

  const fetchReferrals = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch referral records
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // For each referral, try to get the email of the referred person (if possible)
      // This might fail if RLS is strict, but we'll try for UI purposes
      const records = data || [];
      const enrichedRecords = await Promise.all(records.map(async (record) => {
        const { data: userData } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', record.referred_id)
          .single();
        return { ...record, referred_email: userData?.email || 'New User' };
      }));

      setReferrals(enrichedRecords);
    } catch (err) {
      console.error('Fetch Referrals Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const referralLink = `${window.location.origin}/signup?ref=${profile?.referral_code}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalEarnings = referrals.reduce((acc, curr) => acc + curr.bonus_amount, 0);

  return (
    <div className="space-y-8 pb-20 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[#9e9e9e] mb-2">
            <Users className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-bold uppercase tracking-widest">Referral Program</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1a1a1a]">Refer & Earn</h1>
          <p className="text-[#9e9e9e] text-sm mt-1">Invite friends and earn $0.10 for every new sign-up.</p>
        </div>
        <div>
           <Link to="/" className="px-5 py-2.5 bg-white border border-[#e5e5e5] rounded-xl text-sm font-semibold hover:bg-[#fcfcfc] transition-all flex items-center gap-2 shadow-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Referral Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1a1a1a] rounded-[32px] p-8 relative overflow-hidden text-white shadow-2xl shadow-black/10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[80px] -ml-32 -mb-32" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                  <Share2 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Your Referral Link</h2>
                  <p className="text-white/40 text-xs">Share this link to start earning rewards.</p>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Your Referral Link</label>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between group overflow-hidden">
                    <code className="text-sm font-mono text-white/80 truncate mr-4">
                      {referralLink}
                    </code>
                    <button 
                      onClick={copyToClipboard}
                      className="flex-shrink-0 bg-white text-[#1a1a1a] p-3 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/20"
                      title="Copy Link"
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Your Referral Code</label>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between group overflow-hidden">
                    <code className="text-lg font-bold font-mono text-white tracking-widest">
                      {profile?.referral_code || "NO CODE"}
                    </code>
                    <button 
                      onClick={() => {
                        if (profile?.referral_code) {
                          navigator.clipboard.writeText(profile.referral_code);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }
                      }}
                      className="flex-shrink-0 bg-blue-600 text-white p-3 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/20"
                      title="Copy Code"
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <p className="text-[10px] text-blue-200">
                    If the link doesn't work for certain users, they can just enter your code <b>{profile?.referral_code}</b> during signup!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-[#e5e5e5] p-6 rounded-[28px] shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                  <Users className="w-5 h-5" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#9e9e9e]">Total Referrals</div>
              </div>
              <div className="text-3xl font-bold text-[#1a1a1a]">{referrals.length}</div>
            </div>
            
            <div className="bg-white border border-[#e5e5e5] p-6 rounded-[28px] shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-green-50 rounded-xl text-green-600">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#9e9e9e]">Total Earned</div>
              </div>
              <div className="text-3xl font-bold text-[#1a1a1a]">${totalEarnings.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white border border-[#e5e5e5] p-8 rounded-[32px] shadow-sm h-full flex flex-col">
            <h3 className="text-lg font-bold text-[#1a1a1a] mb-6">How it works</h3>
            <div className="space-y-8 flex-1">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs flex-shrink-0">1</div>
                <div>
                  <p className="text-sm font-bold text-[#1a1a1a] mb-1">Share your link</p>
                  <p className="text-xs text-[#9e9e9e] leading-relaxed">Send your unique link to friends and family over WhatsApp, Email or Twitter.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs flex-shrink-0">2</div>
                <div>
                  <p className="text-sm font-bold text-[#1a1a1a] mb-1">They Sign Up</p>
                  <p className="text-xs text-[#9e9e9e] leading-relaxed">Your friends use your link to create their new Revonix account.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs flex-shrink-0">3</div>
                <div>
                  <p className="text-sm font-bold text-[#1a1a1a] mb-1">Receive Reward</p>
                  <p className="text-xs text-[#9e9e9e] leading-relaxed">Once they sign up, you'll instantly receive a $0.10 bonus to your wallet!</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-[#f9f9f9] rounded-2xl flex items-start gap-3">
              <Info className="w-4 h-4 text-[#9e9e9e] mt-0.5" />
              <p className="text-[10px] text-[#9e9e9e] leading-relaxed">
                Self-referrals are strictly prohibited. Our system monitors IP and device identifiers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Referral History */}
      <div className="bg-white border border-[#e5e5e5] rounded-[32px] shadow-sm overflow-hidden">
        <div className="p-8 border-b border-[#f5f5f5] flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#1a1a1a]">Recent Referrals</h3>
          <Award className="w-5 h-5 text-amber-500" />
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
             <div className="p-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-[#9e9e9e] text-sm">Loading your referral history...</p>
            </div>
          ) : referrals.length === 0 ? (
            <div className="p-20 text-center">
              <div className="w-16 h-16 bg-[#f9f9f9] rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-[#e5e5e5]" />
              </div>
              <p className="text-[#1a1a1a] font-bold">No referrals yet</p>
              <p className="text-[#9e9e9e] text-sm max-w-[240px] mx-auto mt-2">
                Share your link above to start inviting your friends and earning rewards!
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fcfcfc] text-[10px] font-bold uppercase tracking-widest text-[#9e9e9e]">
                  <th className="px-8 py-4">Referred User</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4">Earnings</th>
                  <th className="px-8 py-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f5]">
                {referrals.map((record) => (
                  <tr key={record.id} className="hover:bg-[#fcfcfc] transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px]">
                          {record.referred_email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1a1a1a]">{record.referred_email}</p>
                          <p className="text-[10px] text-[#9e9e9e]">ID: {record.referred_id.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        Completed
                      </div>
                    </td>
                    <td className="px-8 py-6 font-bold text-sm text-[#1a1a1a]">
                      +${record.bonus_amount.toFixed(2)}
                    </td>
                    <td className="px-8 py-6 text-right text-[11px] text-[#9e9e9e]">
                      {new Date(record.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
