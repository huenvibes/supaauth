import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gamepad, Smartphone, Play, CheckCircle2, 
  Loader2, ArrowRight, Star, Zap, Info, ShieldCheck,
  Trophy, Gift, ArrowLeft, XCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  icon: string;
}

interface CompletedTask {
  task_id: string;
}

export const Offerwall = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const fetchTasks = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: tasksData, error: tasksError } = await supabase
  .from('offerwall_tasks')
  .select('*');

const { data: completionsData, error: completionsError } = await supabase
  .from('task_completions')
  .select('*')
  .eq('user_id', user.id);

      if (tasksError) console.warn('Tasks fetch failed:', tasksRes.error.message);
      setTasks(tasksData || []);

      if (completionsData) {
        setCompletedTaskIds(
  new Set(completionsData.map((ct: any) => ct.task_id))
);
      }
    } catch (err) {
      console.error('Offerwall Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCompleteTask = async (task: Task) => {
    if (!user || claimingId) return;
    
    if (profile?.is_banned) {
      alert('Your account is suspended. You cannot earn rewards.');
      return;
    }

    setClaimingId(task.id);
    try {
      // 1. Log completion in DB
      // The database trigger 'on_task_completed' will automatically reward the user
      if (completeError) {
      const { error: completeError } = await supabase
        .from('task_completions')
        .insert({
          user_id: user.id,
          task_id: task.id
        });
        await supabase
  .from('profiles')
  .update({
    balance: (profile?.balance || 0) + task.reward
  })
  .eq('id', user.id);

  

      if (completeError) {
        if (completeError.code === '23505') {
            setCompletedTaskIds(prev => new Set([...Array.from(prev), task.id]));
            await refreshProfile();
            return;
        }
        throw completeError;
      }

      // 2. Update local state
      setCompletedTaskIds(new Set([...Array.from(completedTaskIds), task.id]));
      await refreshProfile();
      
    } catch (err: any) {
      console.error('Task Completion Error:', err);
      const message = err.message || 'Failed to complete task. Please try again.';
      alert(message);
    } finally {
      setClaimingId(null);
    }
  };

  const getIcon = (name: string) => {
    switch (name) {
      case 'Gamepad': return Gamepad;
      case 'Smartphone': return Smartphone;
      case 'Play': return Play;
      case 'Zap': return Zap;
      case 'Trophy': return Trophy;
      case 'Gift': return Gift;
      default: return Star;
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[#9e9e9e] mb-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-widest">Available Tasks</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1a1a1a]">Offerwall</h1>
          <p className="text-[#9e9e9e] text-sm mt-1">Complete simple tasks to earn real rewards instantly.</p>
        </div>
        <div>
           <Link to="/" className="px-5 py-2.5 bg-white border border-[#e5e5e5] rounded-xl text-sm font-semibold hover:bg-[#fcfcfc] transition-all flex items-center gap-2 shadow-sm">
            <ArrowLeft className="w-4 h-4" />
            View Dashboard
          </Link>
        </div>
      </div>

      {profile?.is_banned && (
        <div className="bg-red-50 border border-red-200 rounded-[32px] p-6 flex items-center gap-4 text-red-600">
          <XCircle className="w-6 h-6 shrink-0" />
          <div>
            <p className="font-bold">Account Suspended</p>
            <p className="text-xs opacity-80">You are currently restricted from earning rewards. Please contact support if you believe this is an error.</p>
          </div>
        </div>
      )}

      {/* Featured Promo */}
      <div className="bg-[#1a1a1a] rounded-[32px] p-8 relative overflow-hidden text-white shadow-2xl shadow-black/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[80px] -ml-32 -mb-32" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="bg-white/10 p-6 rounded-[28px] border border-white/10 backdrop-blur-md">
            <Zap className="w-10 h-10 text-amber-400 fill-amber-400" />
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold mb-2">Premium Booster Active!</h2>
            <p className="text-white/60 text-sm max-w-md">
              All tasks completed in the next 24 hours will receive a <span className="text-white font-bold">15% bonus</span> to your wallet balance.
            </p>
          </div>
          <div className="md:ml-auto">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Next Reset</div>
                <div className="text-sm font-bold font-mono">22:04:15</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <ShieldCheck className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Task Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 bg-white border border-[#e5e5e5] rounded-[32px] animate-pulse" />
          ))
        ) : (
          <AnimatePresence mode="popLayout">
            {tasks.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-white rounded-[32px] border border-[#e5e5e5] border-dashed">
                <div className="w-16 h-16 bg-[#f5f5f5] rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#9e9e9e]">
                  <Trophy className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-[#1a1a1a]">No Tasks Available</h3>
                <p className="text-[#9e9e9e] text-sm mt-2">Check back later for new opportunities to earn.</p>
              </div>
            ) : (
              tasks.map((task, i) => {
                const Icon = getIcon(task.icon);
                const isCompleted = completedTaskIds.has(task.id);
                
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={task.id}
                    className={`bg-white rounded-[32px] border border-[#e5e5e5] p-8 flex flex-col transition-all group ${isCompleted ? 'opacity-60 grayscale-[0.5]' : 'hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5'}`}
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className={`p-4 rounded-2xl ${isCompleted ? 'bg-[#f5f5f5] text-[#9e9e9e]' : 'bg-blue-50 text-blue-600 transition-transform group-hover:scale-110'}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="bg-[#fcfcfc] border border-[#e5e5e5] py-2 px-4 rounded-xl">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-[#9e9e9e] mb-0.5">Reward</div>
                        <div className="text-lg font-bold text-[#1a1a1a]">${task.reward.toFixed(2)}</div>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-[#1a1a1a] mb-2">{task.title}</h3>
                    <p className="text-[#9e9e9e] text-sm mb-8 flex-1">{task.description}</p>

                    <button
                      onClick={() => handleCompleteTask(task)}
                      disabled={isCompleted || claimingId === task.id}
                      className={`w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                        isCompleted 
                        ? 'bg-green-50 text-green-600 cursor-default' 
                        : 'bg-[#1a1a1a] text-white hover:bg-opacity-90 shadow-lg shadow-black/10'
                      }`}
                    >
                      {claimingId === task.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isCompleted ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Task Completed
                        </>
                      ) : (
                        <>
                          Complete Task
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </button>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Info Footer */}
      <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-[28px] flex items-start gap-4">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
          <Info className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-blue-900 mb-1">How it works</h4>
          <p className="text-xs text-blue-800/70 leading-relaxed">
            Simple verification checks are performed automatically. Rewards are credited to your balance instantly upon successful completion. Duplicate attempts to claim rewards are filtered by our security system.
          </p>
        </div>
      </div>
    </div>
  );
};
