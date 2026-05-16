import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { Mail, Lock, Loader2, AlertCircle, CheckCircle2, Star } from 'lucide-react';

export const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref.toUpperCase());
    }
  }, [searchParams]);


  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. If referral code provided, verify it exists
      let referrerId: string | null = null;
      const trimmedRef = referralCode.trim().toUpperCase();
      
      if (trimmedRef) {
        const { data: referrer, error: refError } = await supabase
          .from('profiles')
          .select('id')
          .eq('referral_code', trimmedRef)
          .single();
        
        if (refError || !referrer) {
           throw new Error('Invalid referral code. Please check and try again or leave blank.');
        }
        referrerId = referrer.id;
      }
      const signupPromise = supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            referrer_id: referrerId
          }
        }
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Signup request timed out.')), 15000)
      );

      const { data, error: signupError } = await (Promise.race([signupPromise, timeoutPromise]) as any);

      if (signupError) throw signupError;
      
      const newUser = data?.user;
      if (newUser) {
  const referralCode =
    Math.random().toString(36).substring(2, 8).toUpperCase();

  await supabase.from('profiles').insert([
    {
      id: newUser.id,
      email: email,
      referral_code: referralCode,
      referred_by: referrerId,
    },
  ]);
}

      if (data?.user && data?.session === null) {
        setSuccess(true);
      } else if (data?.session) {
        navigate('/');
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white p-8 rounded-[24px] shadow-sm border border-[#e5e5e5] text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-semibold mb-4">Check your email</h1>
          <p className="text-[#9e9e9e] mb-8">
            We've sent a verification link to <span className="font-medium text-[#1a1a1a]">{email}</span>.
          </p>
          <Link
            to="/login"
            className="inline-block w-full bg-[#1a1a1a] text-white rounded-xl py-3 font-medium hover:bg-opacity-90 transition-all"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white p-8 rounded-[24px] shadow-sm border border-[#e5e5e5]">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight mb-2">Create Account</h1>
          <p className="text-[#9e9e9e] text-sm">Join Revonix today</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-sm"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#9e9e9e] mb-1.5 ml-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9e9e9e]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#fcfcfc] border border-[#e5e5e5] rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-sm"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#9e9e9e] mb-1.5 ml-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9e9e9e]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#fcfcfc] border border-[#e5e5e5] rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-sm"
                placeholder="Create a strong password"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#9e9e9e] mb-1.5 ml-1">
              Referral Code (Optional)
            </label>
            <div className="relative">
              <Star className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9e9e9e]" />
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                className="w-full bg-[#fcfcfc] border border-[#e5e5e5] rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-sm font-mono"
                placeholder="PROMO123"
              />
            </div>
            <p className="mt-2 text-[11px] text-[#9e9e9e] leading-relaxed px-1">
              By signing up, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1a1a1a] text-white rounded-xl py-3 font-medium hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm">
          <span className="text-[#9e9e9e]">Already have an account? </span>
          <Link to="/login" className="text-blue-600 font-medium hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
