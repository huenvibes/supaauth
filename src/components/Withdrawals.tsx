import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Wallet, Send, History, AlertCircle, 
  CheckCircle2, Clock, XCircle, Loader2, ChevronRight 
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Withdrawal {
  id: string;
  amount: number;
  method: string;
  account_details: string;
  status: 'pending' | 'completed' | 'rejected';
  created_at: string;
}

export const Withdrawals = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Bank Transfer');
  const [accountDetails, setAccountDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [history, setHistory] = useState<Withdrawal[]>([]);
  const [fetchingHistory, setFetchingHistory] = useState(true);

  const MIN_WITHDRAWAL = 1;

  const fetchHistory = React.useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setFetchingHistory(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawAmount = parseFloat(amount);

    if (profile?.is_banned) {
      setError('Your account is suspended. Withdrawals are currently disabled.');
      return;
    }

    if (isNaN(withdrawAmount) || withdrawAmount < MIN_WITHDRAWAL) {
      setError(`Minimum withdrawal is $${MIN_WITHDRAWAL}`);
      return;
    }

    if (!profile || profile.balance < withdrawAmount) {
      setError('Insufficient balance');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Create withdrawal record
      const { error: withdrawError } = await supabase
        .from('withdrawals')
        .insert({
          user_id: user?.id,
          amount: withdrawAmount,
          method,
          account_details: accountDetails,
          status: 'pending'
        });

      if (withdrawError) throw withdrawError;

      setSuccess(true);
      setAmount('');
      setAccountDetails('');
      await refreshProfile();
      await fetchHistory();
    } catch (err: any) {
      console.error('Withdrawal failed:', err);
      setError(err.message || 'Failed to process withdrawal. Check SQL setup.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-sm font-medium text-[#9e9e9e] hover:text-[#1a1a1a] transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <div className="px-4 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2">
          <Wallet className="w-3.5 h-3.5" />
          Balance: ${profile?.balance?.toFixed(2) || '0.00'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[32px] border border-[#e5e5e5] shadow-sm">
            <h2 className="text-2xl font-bold mb-6 tracking-tight">Request Funds</h2>
            
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-sm"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-start gap-3 text-green-700 text-sm"
              >
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Withdrawal Requested</p>
                  <p className="text-[11px] opacity-80 mt-0.5">Your request is being processed. Funds have been deducted from your balance.</p>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#9e9e9e] mb-2 block ml-1">Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9e9e9e] font-medium">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min={MIN_WITHDRAWAL}
                    required
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setSuccess(false);
                    }}
                    placeholder="0.00"
                    className="w-full bg-[#fcfcfc] border border-[#e5e5e5] rounded-2xl py-4 pl-8 pr-4 text-lg font-bold focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all outline-none"
                  />
                </div>
                <p className="mt-2 text-[10px] text-[#9e9e9e] ml-1">Minimum withdrawal: ${MIN_WITHDRAWAL}</p>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#9e9e9e] mb-2 block ml-1">Payment Method</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full bg-[#fcfcfc] border border-[#e5e5e5] rounded-2xl py-4 px-4 text-sm font-medium outline-none"
                >
                  <option>Bank Transfer</option>
                  <option>PayPal</option>
                  <option>Crypto (USDT)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#9e9e9e] mb-2 block ml-1">Account Details</label>
                <textarea
                  required
                  value={accountDetails}
                  onChange={(e) => setAccountDetails(e.target.value)}
                  placeholder="Enter your bank details or wallet address"
                  className="w-full bg-[#fcfcfc] border border-[#e5e5e5] rounded-2xl py-4 px-4 text-sm font-medium min-h-[100px] outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1a1a1a] text-white rounded-2xl py-4 font-bold hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4 shadow-xl shadow-black/10"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Confirm Withdrawal
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* History Section */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-[32px] border border-[#e5e5e5] overflow-hidden shadow-sm h-full flex flex-col">
            <div className="p-6 border-b border-[#e5e5e5] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#f5f5f5] rounded-xl flex items-center justify-center">
                  <History className="w-5 h-5 text-[#1a1a1a]" />
                </div>
                <h2 className="font-bold text-lg">Activity History</h2>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {fetchingHistory ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="w-6 h-6 animate-spin text-[#e5e5e5]" />
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-16 h-16 bg-[#f9f9f9] rounded-full flex items-center justify-center mb-4">
                    <History className="w-8 h-8 text-[#e5e5e5]" />
                  </div>
                  <p className="text-[#1a1a1a] font-semibold">No withdrawals yet</p>
                  <p className="text-[#9e9e9e] text-sm mt-1">Your payment history will appear here.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#f5f5f5]">
                  {history.map((item) => (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={item.id}
                      className="p-6 flex items-center justify-between hover:bg-[#fcfcfc] transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                          item.status === 'completed' ? 'bg-green-50' : 
                          item.status === 'rejected' ? 'bg-red-50' : 'bg-amber-50'
                        }`}>
                          {getStatusIcon(item.status)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-[#1a1a1a] flex items-center gap-2">
                            ${item.amount.toFixed(2)}
                            <span className="text-[10px] bg-[#f5f5f5] px-2 py-0.5 rounded-full text-[#9e9e9e] uppercase tracking-widest border border-[#e5e5e5]">
                              {item.method}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#9e9e9e] mt-1 font-medium">
                            {new Date(item.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg ${
                          item.status === 'completed' ? 'text-green-600 bg-green-50' : 
                          item.status === 'rejected' ? 'text-red-600 bg-red-50' : 'text-amber-600 bg-amber-50'
                        }`}>
                          {item.status}
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#e5e5e5]" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
