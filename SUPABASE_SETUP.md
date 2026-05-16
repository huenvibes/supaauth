# Supabase Database Setup

Run the following SQL in your Supabase SQL Editor to set up the profiles table and automatic profile creation.

### 1. Create Profiles Table
```sql
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  balance decimal(12,2) default 0.00 not null,
  is_banned boolean default false not null,
  is_admin boolean default false not null,
  last_claim_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Create Policies
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- ADMIN: All-access policy for profiles
create policy "Admins can manage all profiles" on profiles
  for all
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true))
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- 9. Fraud Logs
create table public.fraud_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  event_type text not null,
  details text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.fraud_logs enable row level security;

create policy "Admins can view fraud logs" on fraud_logs
  for select using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));
```

### 2. Set Up Automatic Profile Creation
This trigger automatically creates a entry in the `public.profiles` table whenever a user signs up.

```sql
-- Create the function
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, balance)
  values (new.id, new.email, 0);
  return new;
end;
$$ language plpgsql security definer;

-- Create the trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Create Withdrawals Table
create table public.withdrawals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  amount decimal(12,2) not null,
  method text not null,
  account_details text not null,
  status text default 'pending' check (status in ('pending', 'completed', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.withdrawals enable row level security;

-- Create Policies
create policy "Users can view their own withdrawals." on withdrawals
  for select using (auth.uid() = user_id);

create policy "Users can create their own withdrawals." on withdrawals
  for insert with check (auth.uid() = user_id);

-- ADMIN: All-access policy for withdrawals
create policy "Admins can manage all withdrawals" on withdrawals
  for all
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true))
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- 4. Create Offerwall Tasks
create table public.offerwall_tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  reward decimal(12,2) not null,
  icon text default 'Gift',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.task_completions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  task_id uuid references public.offerwall_tasks not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, task_id)
);

-- Enable RLS
alter table public.offerwall_tasks enable row level security;
alter table public.task_completions enable row level security;

-- Policies for tasks
create policy "Tasks are viewable by everyone." on offerwall_tasks
  for select using (true);

create policy "Admins can manage tasks" on offerwall_tasks
  for all
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true))
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- Policies for task_completions
create policy "Users can view their own completed tasks." on task_completions
  for select using (auth.uid() = user_id);

create policy "Users can log their own completions." on task_completions
  for insert with check (auth.uid() = user_id);

create policy "Admins can view all completed tasks" on task_completions
  for select using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- 8. Task Completion Reward Trigger
-- Automatically updates user balance when a task is completed
create or replace function public.handle_task_completion()
returns trigger as $$
declare
  task_reward decimal(12,2);
  user_banned boolean;
  last_claim timestamp with time zone;
begin
  -- 1. Check if user is banned
  select is_banned, last_claim_at into user_banned, last_claim from public.profiles where id = new.user_id;
  if user_banned then
    insert into public.fraud_logs (user_id, event_type, details)
    values (new.user_id, 'banned_user_claim_attempt', 'Banned user tried to claim task: ' || new.task_id);
    raise exception 'Account is suspended';
  end if;

  -- 2. Check for rapid claims (5 second cooldown)
  if last_claim is not null and (now() - last_claim) < interval '5 seconds' then
    insert into public.fraud_logs (user_id, event_type, details)
    values (new.user_id, 'rapid_claim_detected', 'User claimed tasks too quickly (under 5s interval)');
    raise exception 'Claims are too frequent. Please wait a moment.';
  end if;

  -- Get the reward amount from the task
  select reward into task_reward from public.offerwall_tasks where id = new.task_id;
  
  -- Update user balance and last claim time
  update public.profiles
  set balance = balance + task_reward,
      last_claim_at = now()
  where id = new.user_id;
  
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_task_completed on public.task_completions;
create trigger on_task_completed
  after insert on public.task_completions
  for each row execute function public.handle_task_completion();

-- 5. Referral System
alter table public.profiles add column if not exists referral_code text unique;
alter table public.profiles add column if not exists referred_by uuid references auth.users;

-- 6. Referrals Table
create table if not exists public.referrals (
  id uuid default gen_random_uuid() primary key,
  referrer_id uuid references auth.users not null,
  referred_id uuid references auth.users not null unique,
  bonus_amount decimal(12,2) default 0.10 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  check (referrer_id <> referred_id) -- Prevent self-referral at DB level
);

-- Enable RLS
alter table public.referrals enable row level security;

-- Policies for referrals
create policy "Users can view their own sent referrals" on referrals
  for select using (auth.uid() = referrer_id);

create policy "Users can view who referred them" on referrals
  for select using (auth.uid() = referred_id);

-- Update trigger function to handle referral code generation and metadata
create or replace function public.handle_new_user()
returns trigger as $$
declare
  ref_code list;
  new_ref_code text;
  referrer_id uuid;
begin
  -- 1. Generate unique 6-character referral code for the new user
  -- Loop to ensure uniqueness if needed, though gen_random_uuid is very safe
  new_ref_code := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 6));
  
  -- 2. Extract referrer_id from signup metadata if it exists
  begin
    referrer_id := (new.raw_user_meta_data->>'referrer_id')::uuid;
    
    -- Anti-fraud: Prevent self-referral
    if referrer_id = new.id then
      referrer_id := null;
      insert into public.fraud_logs (user_id, event_type, details)
      values (new.id, 'self_referral_attempt', 'User tried to refer themselves');
    end if;
  exception when others then
    referrer_id := null;
  end;

  -- 3. Insert the new profile
  insert into public.profiles (id, email, balance, referral_code, referred_by)
  values (new.id, new.email, 0, new_ref_code, referrer_id);

  -- 4. If referred, log the referral record to trigger the bonus
  if referrer_id is not null then
    insert into public.referrals (referrer_id, referred_id, bonus_amount)
    values (referrer_id, new.id, 0.10);
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Ensure trigger exists
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger to handle referral bonus automatically and securely
create or replace function public.handle_referral_bonus()
returns trigger as $$
begin
  -- Update referrer balance
  update public.profiles
  set balance = balance + new.bonus_amount
  where id = new.referrer_id;
  
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_referral_created on public.referrals;
create trigger on_referral_created
  after insert on public.referrals
  for each row execute function public.handle_referral_bonus();

-- 10. Withdrawal Balance Trigger
-- Automatically deducts balance when a withdrawal is created
create or replace function public.handle_new_withdrawal()
returns trigger as $$
declare
  user_balance decimal(12,2);
begin
  -- 1. Check user balance
  select balance into user_balance from public.profiles where id = new.user_id;
  
  if user_balance < new.amount then
    raise exception 'Insufficient balance';
  end if;

  -- 2. Deduct balance
  update public.profiles
  set balance = balance - new.amount
  where id = new.user_id;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_withdrawal_created on public.withdrawals;
create trigger on_withdrawal_created
  before insert on public.withdrawals
  for each row execute function public.handle_new_withdrawal();

-- 11. Withdrawal Refund Trigger
-- Refunds the user's balance if a withdrawal is rejected
create or replace function public.handle_withdrawal_status_change()
returns trigger as $$
begin
  if (new.status = 'rejected' and old.status = 'pending') then
    update public.profiles
    set balance = balance + new.amount
    where id = new.user_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_withdrawal_updated on public.withdrawals;
create trigger on_withdrawal_updated
  before update on public.withdrawals
  for each row execute function public.handle_withdrawal_status_change();
```
