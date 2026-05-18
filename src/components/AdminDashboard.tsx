import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Users, Search, DollarSign, CheckCircle2, 
  XCircle, Filter, Loader2, ArrowUpRight, ArrowDownRight,
  TrendingUp, Activity, User, ChevronRight, ArrowLeft,
  Settings, Ban as BanIcon, Clock, RefreshCcw, Plus, X, Gift
} from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';

interface UserProfile {
  id: string;
  email: string;
  balance: number;
  is_banned: boolean;
  is_admin: boolean;
  created_at: string;
}

interface AdminWithdrawal {
  id: string;
  user_id: string;
  amount: number;
  method: string;
  account_details: string;
  status: 'pending' | 'completed' | 'rejected';
  created_at: string;
  profiles: {
    email: string;
  };
}

export const AdminDashboard = () => {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'withdrawals' | 'tasks' | 'activity' | 'fraud'>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [completedHistory, setCompletedHistory] = useState<any[]>([]);
  const [fraudLogs, setFraudLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', reward: 0, icon: 'Zap' });

  // Stats
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);
  const [pendingWithdrawals, setPendingWithdrawals] = useState(0);

  const fetchData = React.useCallback(async () => {
    if (!profile?.is_admin) return;
    setLoading(true);
    try {
      const [usersRes, withdrawRes, tasksRes, historyRes, fraudRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('withdrawals').select('*, profiles(email)').order('created_at', { ascending: false }),
        supabase.from('offerwall_tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('task_completions').select('*, profiles:user_id (email), offerwall_tasks:task_id (title, reward)').order('created_at', { ascending: false }),
        supabase.from('fraud_logs').select('*, profiles(email)').order('created_at', { ascending: false })
      ]);

      if (usersRes.data) {
        setUsers(usersRes.data);
        setTotalUsers(usersRes.data.length);
        setTotalBalance(usersRes.data.reduce((acc, u) => acc + (u.balance || 0), 0));
      }
      
      if (withdrawRes.data) {
        setWithdrawals(withdrawRes.data as any);
        setPendingWithdrawals(withdrawRes.data.filter(w => w.status === 'pending').length);
      }

      if (tasksRes.data) setTasks(tasksRes.data);
      if (historyRes.data) setCompletedHistory(historyRes.data);
      if (fraudRes.data) setFraudLogs(fraudRes.data);

    } catch (err) {
      console.error('Admin Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.is_admin]);

  useEffect(() => {
    if (profile?.is_admin) {
      fetchData();
      
      const channel = supabase
        .channel('admin_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, () => fetchData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'task_completions' }, () => fetchData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'fraud_logs' }, () => fetchData())
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile?.is_admin, fetchData]);

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    if (userId === user?.id) {
      alert("You cannot remove your own admin status.");
      return;
    }
    setProcessingId(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      setUsers(users.map(u => u.id === userId ? { ...u, is_admin: !currentStatus } : u));
    } catch (err) {
      console.error('Admin status update failed:', err);
      alert('Action failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleBanned = async (userId: string, currentStatus: boolean) => {
    if (userId === user?.id) {
      alert("You cannot ban yourself.");
      return;
    }
    setProcessingId(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      setUsers(users.map(u => u.id === userId ? { ...u, is_banned: !currentStatus } : u));
    } catch (err) {
      console.error('Ban status update failed:', err);
      alert('Action failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpdateBalance = async (userId: string, currentBalance: number, amount: number) => {
    setProcessingId(userId);
    try {
      const newBalance = currentBalance + amount;
      const { error } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', userId);

      if (error) throw error;
      setUsers(users.map(u => u.id === userId ? { ...u, balance: newBalance } : u));
    } catch (err) {
      console.error('Fail to update balance:', err);
      alert('Balance update failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleWithdrawalStatus = async (withdrawId: string, status: 'completed' | 'rejected') => {
    setProcessingId(withdrawId);
    try {
      const { error } = await supabase
        .from('withdrawals')
        .update({ status })
        .eq('id', withdrawId);

      if (error) throw error;
      setWithdrawals(withdrawals.map(w => w.id === withdrawId ? { ...w, status } : w));
      setPendingWithdrawals(prev => prev - 1);
    } catch (err) {
      console.error('Fail to update withdrawal:', err);
      alert('Withdrawal update failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.reward) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('offerwall_tasks')
        .insert(newTask);
      
      if (error) throw error;
      setShowTaskModal(false);
      setNewTask({ title: '', description: '', reward: 0, icon: 'Zap' });
      fetchData();
    } catch (err) {
      console.error('Task creation error:', err);
      alert('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return;
    setLoading(true);
    try {
       const { error } = await supabase
        .from('offerwall_tasks')
        .delete()
        .eq('id', taskId);
      
      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error('Task deletion error:', err);
      alert('Failed to delete task');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!profile?.is_admin) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white border border-[#e5e5e5] rounded-[32px] text-center shadow-sm">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Shield className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-[#1a1a1a] mb-3">Access Restricted</h2>
        <p className="text-[#9e9e9e] text-sm leading-relaxed mb-8">
          This area is restricted to administrators only. Your account does not have the necessary permissions.
        </p>
        <div className="space-y-4">
          <button 
            onClick={() => refreshProfile()}
            className="w-full py-4 bg-[#1a1a1a] text-white rounded-2xl font-bold hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            Verify My Status
          </button>
          <Link to="/" className="block w-full py-4 bg-white border border-[#e5e5e5] text-[#1a1a1a] rounded-2xl font-bold hover:bg-[#f9f9f9] transition-all">
            Return to Dashboard
          </Link>
          <div className="p-4 bg-[#f9f9f9] rounded-2xl text-[11px] text-[#9e9e9e] text-left">
            <p className="font-bold mb-1 uppercase tracking-widest text-[#1a1a1a]">How to gain access:</p>
            1. Go to your Supabase Dashboard<br />
            2. Open the 'profiles' table<br />
            3. Find your user record (ID: {user?.id.substring(0, 8)}...)<br />
            4. Set 'is_admin' column to TRUE<br />
            5. Click "Verify My Status" above
          </div>
        </div>
      </div>
    );
  }

  const filteredUsers = React.useMemo(() => 
    users.filter(u => u.email.toLowerCase().includes(searchQuery.toLowerCase())),
    [users, searchQuery]
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[#9e9e9e] mb-2">
            <Shield className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Admin Control Panel</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1a1a1a]">Management Console</h1>
        </div>
        <div className="flex gap-3">
          <Link to="/" className="px-5 py-2.5 bg-white border border-[#e5e5e5] rounded-xl text-sm font-semibold hover:bg-[#fcfcfc] transition-all flex items-center gap-2 shadow-sm">
            <ArrowLeft className="w-4 h-4" />
            View Dashboard
          </Link>
          <button onClick={fetchData} className="px-5 py-2.5 bg-[#1a1a1a] text-white rounded-xl text-sm font-semibold hover:bg-opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-black/10">
            <Activity className="w-4 h-4" />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Users', value: totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Assets', value: `$${totalBalance.toLocaleString()}`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Pending Withdrawals', value: pendingWithdrawals, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'System Health', value: 'Prime', icon: Shield, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat, i) => (
          <div key={stat.label} className="bg-white p-6 rounded-[28px] border border-[#e5e5e5] shadow-sm">
            <div className="flex items-center gap-4 mb-3">
              <div className={`p-3 ${stat.bg} ${stat.color} rounded-2xl`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#9e9e9e]">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold text-[#1a1a1a]">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Main Panel */}
      <div className="bg-white rounded-[32px] border border-[#e5e5e5] shadow-sm overflow-hidden">
        <div className="p-2 bg-[#fcfcfc] border-b border-[#e5e5e5] flex flex-col md:flex-row md:items-center gap-2">
          <div className="flex gap-1">
            <button 
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-[#1a1a1a] text-white shadow-md' : 'text-[#9e9e9e] hover:bg-white hover:text-[#1a1a1a]'}`}
            >
              User Management
            </button>
            <button 
              onClick={() => setActiveTab('withdrawals')}
              className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'withdrawals' ? 'bg-[#1a1a1a] text-white shadow-md' : 'text-[#9e9e9e] hover:bg-white hover:text-[#1a1a1a]'}`}
            >
              Withdrawals {pendingWithdrawals > 0 && <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingWithdrawals}</span>}
            </button>
            <button 
              onClick={() => setActiveTab('tasks')}
              className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'tasks' ? 'bg-[#1a1a1a] text-white shadow-md' : 'text-[#9e9e9e] hover:bg-white hover:text-[#1a1a1a]'}`}
            >
              Offerwall Tasks
            </button>
            <button 
              onClick={() => setActiveTab('activity')}
              className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'activity' ? 'bg-[#1a1a1a] text-white shadow-md' : 'text-[#9e9e9e] hover:bg-white hover:text-[#1a1a1a]'}`}
            >
              Activity History
            </button>
            <button 
              onClick={() => setActiveTab('fraud')}
              className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'fraud' ? 'bg-[#1a1a1a] text-white shadow-md' : 'text-[#9e9e9e] hover:bg-white hover:text-[#1a1a1a]'}`}
            >
              Fraud Logs
            </button>
          </div>
          
          <div className="md:ml-auto flex items-center gap-3 pr-4 pl-2">
            {activeTab === 'tasks' && (
              <>
                <button 
                  onClick={async () => {
                    if (!confirm('Populate tasks table with demo data?')) return;
                    setLoading(true);
                    try {
                      const demoTasks = [
                        { title: 'Connect Social Account', description: 'Link your Twitter/X account to verify your identity.', reward: 5.0, icon: 'Zap' },
                        { title: 'Join Official Discord', description: 'Join our community server and introduce yourself in #general.', reward: 10.0, icon: 'Smartphone' },
                        { title: 'Watch Welcome Video', description: 'A quick 2-minute walkthrough of our platform features.', reward: 2.5, icon: 'Play' },
                        { title: 'Daily Bonus Reward', description: 'Claim your daily loyalty reward for being active.', reward: 1.0, icon: 'Gift' },
                        { title: 'Rate Our App', description: 'Tell us what you think! Leave a 5-star review on the store.', reward: 15.0, icon: 'Trophy' },
                        { title: 'Invite a Friend', description: 'Share your referral link with a friend and earn when they join.', reward: 25.0, icon: 'Gamepad' },
                      ];
                      const { error } = await supabase.from('offerwall_tasks').insert(demoTasks);
                      if (error) throw error;
                      fetchData();
                    } catch (err) {
                      console.error('Seed error:', err);
                      alert('Failed to seed tasks');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="px-4 py-2 bg-white border border-[#e5e5e5] text-[#1a1a1a] rounded-xl text-xs font-bold hover:bg-[#f9f9f9] transition-all flex items-center gap-2"
                >
                  <Gift className="w-4 h-4" />
                  Seed Demo
                </button>
                <button 
                  onClick={() => setShowTaskModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add New Task
                </button>
              </>
            )}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9e9e9e]" />
              <input 
                type="text" 
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border border-[#e5e5e5] rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-black/5 outline-none w-64"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'users' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#f5f5f5] text-[10px] font-bold uppercase tracking-widest text-[#9e9e9e]">
                  <th className="px-8 py-6">User</th>
                  <th className="px-8 py-6">Status</th>
                  <th className="px-8 py-6">Role</th>
                  <th className="px-8 py-6 text-right">Balance</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f5]">
                <AnimatePresence mode="popLayout">
                  {filteredUsers.map((u) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      exit={{ opacity: 0 }}
                      key={u.id} 
                      className="hover:bg-[#fcfcfc] transition-colors"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${u.is_admin ? 'bg-purple-50 text-purple-600' : 'bg-[#f5f5f5] text-[#9e9e9e]'}`}>
                            {u.is_admin ? <Shield className="w-5 h-5" /> : <User className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-[#1a1a1a]">{u.email}</div>
                            <div className="text-[10px] font-mono text-[#9e9e9e] uppercase mt-0.5">{u.id.substring(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <button 
                          onClick={() => handleToggleBanned(u.id, u.is_banned)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors ${u.is_banned ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                        >
                          {u.is_banned ? 'Suspended' : 'Active'}
                        </button>
                      </td>
                      <td className="px-8 py-6">
                        <button 
                          onClick={() => handleToggleAdmin(u.id, u.is_admin)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors ${u.is_admin ? 'bg-purple-50 text-purple-600 hover:bg-purple-100' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                        >
                          {u.is_admin ? 'Admin' : 'User'}
                        </button>
                      </td>
                      <td className="px-8 py-6 text-right font-bold text-[#1a1a1a]">
                        ${u.balance?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleUpdateBalance(u.id, u.balance, 100)}
                            disabled={processingId === u.id}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-100"
                            title="Add $100"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleUpdateBalance(u.id, u.balance, -100)}
                            disabled={processingId === u.id || u.balance < 100}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                            title="Subtract $100"
                          >
                            <ArrowDownRight className="w-4 h-4" />
                          </button>
                          <button 
                            className="p-2 text-[#9e9e9e] hover:bg-[#f5f5f5] rounded-lg transition-colors"
                            title="Manage Profile"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          ) : activeTab === 'withdrawals' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#f5f5f5] text-[10px] font-bold uppercase tracking-widest text-[#9e9e9e]">
                  <th className="px-8 py-6">User/Method</th>
                  <th className="px-8 py-6">Account Details</th>
                  <th className="px-8 py-6 text-right">Amount</th>
                  <th className="px-8 py-6 text-right">Status/Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f5]">
                <AnimatePresence mode="popLayout">
                  console.log('WITHDRAWALS DATA:', withdrawals);
                  {withdrawals.map((w) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      exit={{ opacity: 0 }}
                      key={w.id} 
                      className="hover:bg-[#fcfcfc] transition-colors"
                    >
                      <td className="px-8 py-6">
                        <div className="text-sm font-bold text-[#1a1a1a]">{w.profiles?.email}</div>
                        <div className="text-[10px] font-medium text-[#9e9e9e] mt-0.5">{w.method} • {new Date(w.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-[11px] text-[#1a1a1a] font-mono bg-[#f9f9f9] p-2 rounded-lg border border-[#e5e5e5] max-w-[200px] truncate">
                          {w.account_details}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right font-bold text-[#1a1a1a]">
                        ${w.amount.toFixed(2)}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-end gap-3">
                          {w.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => {
                                  if (confirm(`Approve payment of $${w.amount} to ${w.profiles?.email}?`)) {
                                    handleWithdrawalStatus(w.id, 'completed');
                                  }
                                }}
                                disabled={processingId === w.id}
                                className="px-4 py-2 bg-green-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl hover:shadow-lg hover:shadow-green-500/20 active:scale-95 transition-all flex items-center gap-2"
                              >
                                {processingId === w.id ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <CheckCircle2 className="w-3.5 h-3.5"/>}
                                Approve
                              </button>
                              <button 
                                onClick={() => {
                                  if (confirm(`Reject this withdrawal? The user will be refunded $${w.amount}.`)) {
                                    handleWithdrawalStatus(w.id, 'rejected');
                                  }
                                }}
                                disabled={processingId === w.id}
                                className="px-4 py-2 bg-white border border-red-100 text-red-600 text-[10px] font-bold uppercase tracking-wider rounded-xl hover:bg-red-50 active:scale-95 transition-all flex items-center gap-2"
                              >
                                <XCircle className="w-3.5 h-3.5"/>
                                Reject
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end">
                              <div className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border ${
                                w.status === 'completed' 
                                  ? 'bg-green-50 text-green-600 border-green-100' 
                                  : 'bg-red-50 text-red-600 border-red-100'
                              }`}>
                                {w.status === 'completed' ? <CheckCircle2 className="w-3.5 h-3.5"/> : <XCircle className="w-3.5 h-3.5"/>}
                                {w.status}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          ) : activeTab === 'activity' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#f5f5f5] text-[10px] font-bold uppercase tracking-widest text-[#9e9e9e]">
                  <th className="px-8 py-6">User</th>
                  <th className="px-8 py-6">Task</th>
                  <th className="px-8 py-6 text-right">Reward</th>
                  <th className="px-8 py-6 text-right">Completed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f5]">
                {completedHistory.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-12 text-center text-[#9e9e9e] text-sm">
                      No activity history found.
                    </td>
                  </tr>
                ) : (
                  completedHistory.map((h) => (
                    <tr key={h.id} className="hover:bg-[#fcfcfc] transition-colors">
                      <td className="px-8 py-6">
                        <div className="text-sm font-bold text-[#1a1a1a]">{h.profiles?.email}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-sm text-[#1a1a1a]">{h.offerwall_tasks?.title}</div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="text-sm font-bold text-green-600">+${h.offerwall_tasks?.reward?.toFixed(2)}</div>
                      </td>
                      <td className="px-8 py-6 text-right text-[11px] text-[#9e9e9e] font-medium">
                        {new Date(h.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : activeTab === 'fraud' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#f5f5f5] text-[10px] font-bold uppercase tracking-widest text-[#9e9e9e]">
                  <th className="px-8 py-6">User</th>
                  <th className="px-8 py-6">Event Type</th>
                  <th className="px-8 py-6">Details</th>
                  <th className="px-8 py-6 text-right">Logged At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f5]">
                {fraudLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-12 text-center text-[#9e9e9e] text-sm">
                      No fraudulent activity detected.
                    </td>
                  </tr>
                ) : (
                  fraudLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-red-50/30 transition-colors">
                      <td className="px-8 py-6">
                        <div className="text-sm font-bold text-[#1a1a1a]">{log.profiles?.email}</div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="inline-flex px-2 py-1 rounded bg-red-100 text-red-600 text-[10px] font-bold uppercase">
                          {log.event_type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-sm text-[#1a1a1a]">{log.details}</div>
                      </td>
                      <td className="px-8 py-6 text-right text-[11px] text-[#9e9e9e] font-medium">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#f5f5f5] text-[10px] font-bold uppercase tracking-widest text-[#9e9e9e]">
                  <th className="px-8 py-6">Task</th>
                  <th className="px-8 py-6">Reward</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f5]">
                <AnimatePresence mode="popLayout">
                  {tasks.map((task) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      exit={{ opacity: 0 }}
                      key={task.id} 
                      className="hover:bg-[#fcfcfc] transition-colors"
                    >
                      <td className="px-8 py-6">
                        <div className="text-sm font-bold text-[#1a1a1a]">{task.title}</div>
                        <div className="text-[10px] text-[#9e9e9e] mt-1">{task.description}</div>
                      </td>
                      <td className="px-8 py-6">
                         <div className="text-sm font-bold text-green-600">${task.reward.toFixed(2)}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-end gap-3">
                           <button 
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </div>

        {loading && (
          <div className="p-20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#e5e5e5]" />
          </div>
        )}
      </div>

      {/* Task Modal */}
      <AnimatePresence>
        {showTaskModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTaskModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] w-full max-w-lg relative overflow-hidden shadow-2xl"
            >
              <div className="p-8 pb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#1a1a1a]">New Task</h2>
                <button 
                  onClick={() => setShowTaskModal(false)}
                  className="p-2 hover:bg-[#f5f5f5] rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-[#9e9e9e]" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9e9e9e] mb-2 block">Title</label>
                    <input 
                      type="text" 
                      value={newTask.title}
                      onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                      className="w-full bg-[#f9f9f9] border border-[#e5e5e5] rounded-2xl px-4 py-3.5 text-sm"
                      placeholder="e.g., Follow on Twitter"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9e9e9e] mb-2 block">Description</label>
                    <textarea 
                      value={newTask.description}
                      onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                      className="w-full bg-[#f9f9f9] border border-[#e5e5e5] rounded-2xl px-4 py-3.5 text-sm h-24"
                      placeholder="What should the user do?"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#9e9e9e] mb-2 block">Reward ($)</label>
                      <input 
                        type="number" 
                        value={newTask.reward}
                        onChange={(e) => setNewTask({...newTask, reward: parseFloat(e.target.value)})}
                        className="w-full bg-[#f9f9f9] border border-[#e5e5e5] rounded-2xl px-4 py-3.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#9e9e9e] mb-2 block">Icon</label>
                      <select 
                         value={newTask.icon}
                         onChange={(e) => setNewTask({...newTask, icon: e.target.value})}
                         className="w-full bg-[#f9f9f9] border border-[#e5e5e5] rounded-2xl px-4 py-3.5 text-sm"
                      >
                         <option value="Zap">Zap</option>
                         <option value="Gamepad">Gamepad</option>
                         <option value="Smartphone">Smartphone</option>
                         <option value="Play">Play</option>
                         <option value="Gift">Gift</option>
                         <option value="Trophy">Trophy</option>
                      </select>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleCreateTask}
                  className="w-full bg-[#1a1a1a] text-white rounded-2xl py-4 font-semibold hover:bg-opacity-90 transition-all shadow-xl shadow-black/10 mt-4"
                >
                  Create Task
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
