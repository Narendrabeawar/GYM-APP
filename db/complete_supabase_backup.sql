-- ==========================================
-- 🎯 COMPLETE SUPABASE PROJECT BACKUP SQL
-- Source Project: zsqcujpctdagahxqpcff
-- Date: Generated for migration to new Supabase project
-- ==========================================
-- This script contains:
-- 1. Extensions
-- 2. All Tables with complete structure
-- 3. All Indexes
-- 4. All Foreign Keys
-- 5. All Check Constraints
-- 6. All Unique Constraints
-- 7. All RLS Policies
-- 8. All Triggers
-- 9. All Functions
-- 10. All Views
-- 11. Storage Buckets
-- 12. Storage Policies
-- ==========================================

-- ==========================================
-- 0. EXTENSIONS
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" SCHEMA extensions;

-- ==========================================
-- 1. TABLES - Create all tables in order
-- ==========================================

-- 1.1 GYMS TABLE
CREATE TABLE IF NOT EXISTS public.gyms (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    subscription_status TEXT CHECK (subscription_status IN ('active', 'inactive', 'expired')) DEFAULT 'active',
    logo_url TEXT,
    admin_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.2 BRANCHES TABLE
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    gym_id UUID,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    description TEXT,
    established_year INTEGER,
    member_capacity INTEGER,
    branch_code TEXT,
    website TEXT,
    social_media TEXT,
    whatsapp TEXT,
    operating_hours JSONB,
    holiday_hours TEXT,
    peak_hours TEXT,
    facilities TEXT[],
    amenities TEXT[],
    special_features TEXT,
    images TEXT[],
    rules TEXT,
    policies TEXT,
    emergency_contact TEXT,
    manager_name TEXT,
    certifications TEXT,
    nearby_landmarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.3 PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT CHECK (role IN ('admin', 'trainer', 'member', 'gym_admin', 'branch_admin', 'receptionist')) DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    gym_id UUID,
    branch_id UUID,
    address TEXT,
    phone TEXT
);

-- 1.4 MEMBERSHIP PLANS TABLE
CREATE TABLE IF NOT EXISTS public.membership_plans (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    duration_months INTEGER NOT NULL,
    price NUMERIC NOT NULL,
    features TEXT[],
    status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    gym_id UUID,
    discount_amount NUMERIC DEFAULT 0,
    final_amount NUMERIC,
    custom_days INTEGER,
    plan_period TEXT CHECK (plan_period IN ('monthly', 'quarterly', 'half-yearly', 'yearly', 'custom')) DEFAULT 'monthly'
);

-- 1.5 MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.members (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    address TEXT,
    emergency_contact TEXT,
    emergency_phone TEXT,
    membership_plan_id UUID,
    membership_start_date DATE,
    membership_end_date DATE,
    status TEXT CHECK (status IN ('active', 'inactive', 'suspended')) DEFAULT 'active',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    gym_id UUID,
    branch_id UUID,
    father_name TEXT,
    blood_group VARCHAR,
    height NUMERIC,
    weight NUMERIC,
    fitness_goal VARCHAR,
    medical_conditions TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relationship TEXT,
    created_by UUID
);

-- 1.6 TRAINERS TABLE
CREATE TABLE IF NOT EXISTS public.trainers (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    specialization TEXT[],
    experience_years INTEGER,
    certifications TEXT[],
    avatar_url TEXT,
    status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    gym_id UUID,
    branch_id UUID
);

-- 1.7 ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    gym_id UUID,
    member_id UUID,
    check_in_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    check_out_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    branch_id UUID
);

-- 1.8 ENQUIRIES TABLE
CREATE TABLE IF NOT EXISTS public.enquiries (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    gym_id UUID,
    branch_id UUID,
    full_name TEXT NOT NULL,
    father_name TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT NOT NULL,
    health_info TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relationship TEXT,
    enquiry_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT CHECK (status IN ('pending', 'converted', 'rejected')) DEFAULT 'pending',
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    blood_group VARCHAR,
    height NUMERIC,
    weight NUMERIC,
    fitness_goal VARCHAR,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other'))
);

-- 1.9 PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    gym_id UUID,
    member_id UUID,
    amount NUMERIC NOT NULL,
    payable_amount NUMERIC,
    discount_amount NUMERIC DEFAULT 0,
    due_amount NUMERIC DEFAULT 0,
    extra_amount NUMERIC DEFAULT 0,
    payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'upi', 'bank_transfer')),
    extra_discount NUMERIC DEFAULT 0,
    status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'completed',
    transaction_id TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    branch_id UUID
);

-- 1.10 EMPLOYEES TABLE
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    gym_id UUID,
    branch_id UUID,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    designation TEXT,
    address TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    emergency_contact TEXT,
    emergency_phone TEXT,
    joining_date DATE DEFAULT CURRENT_DATE,
    status TEXT CHECK (status IN ('active', 'inactive', 'terminated')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.11 EMPLOYEE ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS public.employee_attendance (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    employee_id UUID,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    status TEXT CHECK (status IN ('present', 'absent', 'late', 'leave')) DEFAULT 'present',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.12 TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    gym_id UUID,
    branch_id UUID,
    type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
    amount NUMERIC NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    payment_method TEXT DEFAULT 'cash',
    status TEXT DEFAULT 'completed',
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    reference_name TEXT
);

-- 1.13 TRANSACTION CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.transaction_categories (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    gym_id UUID,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('income', 'expense')) NOT NULL
);

-- 1.14 DESIGNATIONS TABLE
CREATE TABLE IF NOT EXISTS public.designations (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    branch_id UUID,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    gym_id UUID
);

-- ==========================================
-- 2. FOREIGN KEY CONSTRAINTS
-- ==========================================

-- Profiles foreign keys
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_gym_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_gym_id_fkey FOREIGN KEY (gym_id) REFERENCES public.gyms(id) ON DELETE SET NULL;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_branch_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;

-- Gyms foreign keys
ALTER TABLE public.gyms DROP CONSTRAINT IF EXISTS gyms_admin_id_fkey;
ALTER TABLE public.gyms ADD CONSTRAINT gyms_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Branches foreign keys
ALTER TABLE public.branches DROP CONSTRAINT IF EXISTS branches_gym_id_fkey;
ALTER TABLE public.branches ADD CONSTRAINT branches_gym_id_fkey FOREIGN KEY (gym_id) REFERENCES public.gyms(id) ON DELETE CASCADE;

-- Membership plans foreign keys
ALTER TABLE public.membership_plans DROP CONSTRAINT IF EXISTS membership_plans_gym_id_fkey;
ALTER TABLE public.membership_plans ADD CONSTRAINT membership_plans_gym_id_fkey FOREIGN KEY (gym_id) REFERENCES public.gyms(id) ON DELETE CASCADE;

-- Members foreign keys
ALTER TABLE public.members DROP CONSTRAINT IF EXISTS members_user_id_fkey;
ALTER TABLE public.members ADD CONSTRAINT members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.members DROP CONSTRAINT IF EXISTS members_membership_plan_id_fkey;
ALTER TABLE public.members ADD CONSTRAINT members_membership_plan_id_fkey FOREIGN KEY (membership_plan_id) REFERENCES public.membership_plans(id) ON DELETE SET NULL;

ALTER TABLE public.members DROP CONSTRAINT IF EXISTS members_gym_id_fkey;
ALTER TABLE public.members ADD CONSTRAINT members_gym_id_fkey FOREIGN KEY (gym_id) REFERENCES public.gyms(id) ON DELETE CASCADE;

ALTER TABLE public.members DROP CONSTRAINT IF EXISTS members_branch_id_fkey;
ALTER TABLE public.members ADD CONSTRAINT members_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;

ALTER TABLE public.members DROP CONSTRAINT IF EXISTS members_created_by_fkey;
ALTER TABLE public.members ADD CONSTRAINT members_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Trainers foreign keys
ALTER TABLE public.trainers DROP CONSTRAINT IF EXISTS trainers_user_id_fkey;
ALTER TABLE public.trainers ADD CONSTRAINT trainers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.trainers DROP CONSTRAINT IF EXISTS trainers_gym_id_fkey;
ALTER TABLE public.trainers ADD CONSTRAINT trainers_gym_id_fkey FOREIGN KEY (gym_id) REFERENCES public.gyms(id) ON DELETE CASCADE;

ALTER TABLE public.trainers DROP CONSTRAINT IF EXISTS trainers_branch_id_fkey;
ALTER TABLE public.trainers ADD CONSTRAINT trainers_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;

-- Attendance foreign keys
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_member_id_fkey;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;

ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_gym_id_fkey;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_gym_id_fkey FOREIGN KEY (gym_id) REFERENCES public.gyms(id) ON DELETE CASCADE;

ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_branch_id_fkey;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;

-- Enquiries foreign keys
ALTER TABLE public.enquiries DROP CONSTRAINT IF EXISTS enquiries_gym_id_fkey;
ALTER TABLE public.enquiries ADD CONSTRAINT enquiries_gym_id_fkey FOREIGN KEY (gym_id) REFERENCES public.gyms(id) ON DELETE CASCADE;

ALTER TABLE public.enquiries DROP CONSTRAINT IF EXISTS enquiries_branch_id_fkey;
ALTER TABLE public.enquiries ADD CONSTRAINT enquiries_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;

ALTER TABLE public.enquiries DROP CONSTRAINT IF EXISTS enquiries_created_by_fkey;
ALTER TABLE public.enquiries ADD CONSTRAINT enquiries_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Payments foreign keys
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_member_id_fkey;
ALTER TABLE public.payments ADD CONSTRAINT payments_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE SET NULL;

ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_gym_id_fkey;
ALTER TABLE public.payments ADD CONSTRAINT payments_gym_id_fkey FOREIGN KEY (gym_id) REFERENCES public.gyms(id) ON DELETE CASCADE;

ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_branch_id_fkey;
ALTER TABLE public.payments ADD CONSTRAINT payments_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;

-- Employees foreign keys
ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS employees_gym_id_fkey;
ALTER TABLE public.employees ADD CONSTRAINT employees_gym_id_fkey FOREIGN KEY (gym_id) REFERENCES public.gyms(id) ON DELETE CASCADE;

ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS employees_branch_id_fkey;
ALTER TABLE public.employees ADD CONSTRAINT employees_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;

-- Employee attendance foreign keys
ALTER TABLE public.employee_attendance DROP CONSTRAINT IF EXISTS employee_attendance_employee_id_fkey;
ALTER TABLE public.employee_attendance ADD CONSTRAINT employee_attendance_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

-- Transactions foreign keys
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_gym_id_fkey;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_gym_id_fkey FOREIGN KEY (gym_id) REFERENCES public.gyms(id) ON DELETE CASCADE;

ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_branch_id_fkey;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;

-- Transaction categories foreign keys
ALTER TABLE public.transaction_categories DROP CONSTRAINT IF EXISTS transaction_categories_gym_id_fkey;
ALTER TABLE public.transaction_categories ADD CONSTRAINT transaction_categories_gym_id_fkey FOREIGN KEY (gym_id) REFERENCES public.gyms(id) ON DELETE CASCADE;

-- Designations foreign keys
ALTER TABLE public.designations DROP CONSTRAINT IF EXISTS designations_gym_id_fkey;
ALTER TABLE public.designations ADD CONSTRAINT designations_gym_id_fkey FOREIGN KEY (gym_id) REFERENCES public.gyms(id) ON DELETE CASCADE;

ALTER TABLE public.designations DROP CONSTRAINT IF EXISTS designations_branch_id_fkey;
ALTER TABLE public.designations ADD CONSTRAINT designations_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;

-- ==========================================
-- 3. UNIQUE CONSTRAINTS
-- ==========================================

ALTER TABLE public.branches DROP CONSTRAINT IF EXISTS branches_email_key;
ALTER TABLE public.branches ADD CONSTRAINT branches_email_key UNIQUE (email);

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_email_key;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);

ALTER TABLE public.members DROP CONSTRAINT IF EXISTS members_email_key;
ALTER TABLE public.members ADD CONSTRAINT members_email_key UNIQUE (email);

ALTER TABLE public.trainers DROP CONSTRAINT IF EXISTS trainers_email_key;
ALTER TABLE public.trainers ADD CONSTRAINT trainers_email_key UNIQUE (email);

ALTER TABLE public.designations DROP CONSTRAINT IF EXISTS designations_branch_id_name_key;
ALTER TABLE public.designations ADD CONSTRAINT designations_branch_id_name_key UNIQUE (branch_id, name);

ALTER TABLE public.transaction_categories DROP CONSTRAINT IF EXISTS transaction_categories_gym_id_name_type_key;
ALTER TABLE public.transaction_categories ADD CONSTRAINT transaction_categories_gym_id_name_type_key UNIQUE (gym_id, name, type);

-- ==========================================
-- 4. INDEXES
-- ==========================================

CREATE UNIQUE INDEX IF NOT EXISTS attendance_pkey ON public.attendance USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS branches_pkey ON public.branches USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS designations_pkey ON public.designations USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS employee_attendance_pkey ON public.employee_attendance USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS employees_pkey ON public.employees USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS enquiries_pkey ON public.enquiries USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS gyms_pkey ON public.gyms USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS members_pkey ON public.members USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS membership_plans_pkey ON public.membership_plans USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS payments_pkey ON public.payments USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS profiles_pkey ON public.profiles USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS trainers_pkey ON public.trainers USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS transaction_categories_pkey ON public.transaction_categories USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS transactions_pkey ON public.transactions USING btree (id);

-- ==========================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designations ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 6. FUNCTIONS
-- ==========================================

-- Function: can_insert_payment
CREATE OR REPLACE FUNCTION public.can_insert_payment(p_gym_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'gym_admin', 'branch_admin', 'receptionist')
      AND gym_id = p_gym_id
  );
$$;

-- Function: handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, phone, gym_id, branch_id, address)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'member'),
    new.raw_user_meta_data->>'phone',
    CASE 
      WHEN new.raw_user_meta_data->>'gym_id' IS NULL OR new.raw_user_meta_data->>'gym_id' = '' THEN NULL 
      ELSE (new.raw_user_meta_data->>'gym_id')::uuid 
    END,
    CASE 
      WHEN new.raw_user_meta_data->>'branch_id' IS NULL OR new.raw_user_meta_data->>'branch_id' = '' THEN NULL 
      ELSE (new.raw_user_meta_data->>'branch_id')::uuid 
    END,
    new.raw_user_meta_data->>'address'
  );
  RETURN new;
END;
$$;

-- Function: sync_member_status
CREATE OR REPLACE FUNCTION public.sync_member_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- For inserts: set status based on end date (expired -> inactive, else active)
  IF (TG_OP = 'INSERT') THEN
    IF NEW.membership_end_date IS NOT NULL AND NEW.membership_end_date < now()::date THEN
      NEW.status := 'inactive';
    ELSE
      NEW.status := COALESCE(NEW.status, 'active');
    END IF;
    RETURN NEW;
  END IF;

  -- For updates: when membership dates or status change, keep them consistent
  IF (TG_OP = 'UPDATE') THEN
    -- If end date is in past => inactive
    IF NEW.membership_end_date IS NOT NULL AND NEW.membership_end_date < now()::date THEN
      NEW.status := 'inactive';
    ELSE
      -- If membership_start_date exists and end date is future or null => active
      IF NEW.membership_start_date IS NOT NULL AND (NEW.membership_end_date IS NULL OR NEW.membership_end_date >= now()::date) THEN
        NEW.status := COALESCE(NEW.status, 'active');
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

-- ==========================================
-- 6. VIEWS (Must be created before functions that reference them)
-- ==========================================

-- View: member_balances
CREATE OR REPLACE VIEW public.member_balances AS
SELECT
  member_id,
  COALESCE(SUM(COALESCE(payable_amount, 0)), 0)::numeric AS total_debit,
  COALESCE(SUM(COALESCE(amount, 0)), 0)::numeric AS total_paid,
  COALESCE(SUM(
    CASE
      WHEN extra_discount IS NULL THEN 0
      WHEN extra_discount::text ~ '^[0-9]+(\\.[0-9]+)?$' THEN extra_discount::numeric
      ELSE 0
    END
  ), 0)::numeric AS total_extra_discount,
  (
    COALESCE(SUM(COALESCE(payable_amount, 0)), 0)
    - (
        COALESCE(SUM(COALESCE(amount, 0)), 0)
        + COALESCE(SUM(
            CASE
              WHEN extra_discount IS NULL THEN 0
              WHEN extra_discount::text ~ '^[0-9]+(\\.[0-9]+)?$' THEN extra_discount::numeric
              ELSE 0
            END
          ), 0)
      )
  )::numeric AS net_balance
FROM public.payments
GROUP BY member_id;

-- View: branch_pnl
CREATE OR REPLACE VIEW public.branch_pnl AS
WITH tx AS (
  SELECT
    branch_id,
    date_trunc('day', COALESCE(date, created_at))::date AS day,
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END)::numeric AS total_transactions_income,
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END)::numeric AS total_transactions_expense
  FROM public.transactions
  GROUP BY branch_id, date_trunc('day', COALESCE(date, created_at))::date
),
pay AS (
  SELECT
    branch_id,
    date_trunc('day', created_at)::date AS day,
    SUM(COALESCE(amount,0))::numeric AS total_payments_revenue
  FROM public.payments
  GROUP BY branch_id, date_trunc('day', created_at)::date
)
SELECT
  COALESCE(tx.branch_id, pay.branch_id) AS branch_id,
  COALESCE(tx.day, pay.day) AS day,
  COALESCE(tx.total_transactions_income,0)::numeric AS total_transactions_income,
  COALESCE(tx.total_transactions_expense,0)::numeric AS total_transactions_expense,
  COALESCE(pay.total_payments_revenue,0)::numeric AS total_payments_revenue,
  (COALESCE(tx.total_transactions_income,0) + COALESCE(pay.total_payments_revenue,0))::numeric AS total_income,
  COALESCE(tx.total_transactions_expense,0)::numeric AS total_expense,
  ((COALESCE(tx.total_transactions_income,0) + COALESCE(pay.total_payments_revenue,0)) - COALESCE(tx.total_transactions_expense,0))::numeric AS net_profit
FROM tx
FULL OUTER JOIN pay
  ON tx.branch_id = pay.branch_id
  AND tx.day = pay.day;

-- ==========================================
-- 7. FUNCTIONS
-- ==========================================

-- Function: get_member_balance
CREATE OR REPLACE FUNCTION public.get_member_balance(p_member uuid)
RETURNS numeric
LANGUAGE sql
STABLE
AS $$
  SELECT (
    COALESCE(SUM(COALESCE(payable_amount,0)),0)
    - (
        COALESCE(SUM(COALESCE(amount,0)),0)
        + COALESCE(SUM(
            CASE
              WHEN extra_discount IS NULL THEN 0
              WHEN extra_discount::text ~ '^[0-9]+(\\.[0-9]+)?$' THEN extra_discount::numeric
              ELSE 0
            END
          ),0)
      )
  )::numeric AS net_balance
  FROM public.payments
  WHERE member_id = p_member;
$$;

-- Function: get_balances_for_members
CREATE OR REPLACE FUNCTION public.get_balances_for_members(p_members uuid[])
RETURNS TABLE(member_id uuid, net_balance numeric)
LANGUAGE sql
STABLE
AS $$
  SELECT mb.member_id, mb.net_balance
  FROM public.member_balances mb
  WHERE mb.member_id = ANY(p_members);
$$;

-- Function: create_payment_and_get_balance
CREATE OR REPLACE FUNCTION public.create_payment_and_get_balance(
  p_member uuid,
  p_amount numeric,
  p_payable_amount numeric,
  p_extra_discount numeric,
  p_payment_method text DEFAULT NULL,
  p_description text DEFAULT NULL
)
RETURNS TABLE(payment_id uuid, net_balance numeric)
LANGUAGE plpgsql
AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO public.payments (
    member_id, amount, payable_amount, extra_discount, payment_method, description, created_at
  )
  VALUES (
    p_member, p_amount, p_payable_amount, p_extra_discount, p_payment_method, p_description, now()
  )
  RETURNING id INTO new_id;

  RETURN QUERY
  SELECT new_id AS payment_id,
    (
      SELECT (
        COALESCE(SUM(COALESCE(payable_amount,0)),0)
        - (
            COALESCE(SUM(COALESCE(amount,0)),0)
            + COALESCE(SUM(
                CASE
                  WHEN extra_discount IS NULL THEN 0
                  WHEN extra_discount::text ~ '^[0-9]+(\\.[0-9]+)?$' THEN extra_discount::numeric
                  ELSE 0
                END
              ),0)
          )
      )::numeric
      FROM public.payments
      WHERE member_id = p_member
    ) AS net_balance;
END;
$$;

-- Function: get_member_balance_at
CREATE OR REPLACE FUNCTION public.get_member_balance_at(p_member uuid, p_as_of timestamp with time zone)
RETURNS TABLE(net_balance numeric)
LANGUAGE sql
STABLE
AS $$
  SELECT (
    COALESCE(SUM(COALESCE(payable_amount,0)),0)
    - (
        COALESCE(SUM(COALESCE(amount,0)),0)
        + COALESCE(SUM(
            CASE
              WHEN extra_discount IS NULL THEN 0
              WHEN extra_discount::text ~ '^[0-9]+(\\.[0-9]+)?$' THEN extra_discount::numeric
              ELSE 0
            END
          ),0)
      )
  )::numeric AS net_balance
  FROM public.payments
  WHERE member_id = p_member
    AND created_at <= p_as_of;
$$;

-- Function: get_branch_pnl
CREATE OR REPLACE FUNCTION public.get_branch_pnl(p_branch uuid DEFAULT NULL, p_start date DEFAULT NULL, p_end date DEFAULT NULL)
RETURNS TABLE(branch_id uuid, day date, total_income numeric, total_expense numeric, net_profit numeric)
LANGUAGE sql
STABLE
AS $$
  SELECT branch_id, day, SUM(total_income) AS total_income, SUM(total_expense) AS total_expense, SUM(net_profit) AS net_profit
  FROM public.branch_pnl
  WHERE (p_branch IS NULL OR branch_id = p_branch)
    AND (p_start IS NULL OR day >= p_start)
    AND (p_end IS NULL OR day <= p_end)
  GROUP BY branch_id, day
  ORDER BY day;
$$;

-- ==========================================
-- 8. TRIGGERS (Functions must exist before triggers)
-- ==========================================

-- Trigger: on_auth_user_created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: trg_sync_member_status
DROP TRIGGER IF EXISTS trg_sync_member_status ON public.members;
CREATE TRIGGER trg_sync_member_status
  BEFORE INSERT OR UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.sync_member_status();

-- ==========================================
-- 9. RLS POLICIES - PUBLIC SCHEMA
-- ==========================================

-- GYMS POLICIES
DROP POLICY IF EXISTS "Admins can manage all gyms" ON public.gyms;
CREATE POLICY "Admins can manage all gyms" ON public.gyms FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Gym admins can view their own gym" ON public.gyms;
CREATE POLICY "Gym admins can view their own gym" ON public.gyms FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'gym_admin' AND gym_id = public.gyms.id))
);

DROP POLICY IF EXISTS "Public can view gyms" ON public.gyms;
CREATE POLICY "Public can view gyms" ON public.gyms FOR SELECT USING (true);

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ATTENDANCE POLICIES
DROP POLICY IF EXISTS "Admins have full access" ON public.attendance;
CREATE POLICY "Admins have full access" ON public.attendance FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Gym admin access via gym_id" ON public.attendance;
CREATE POLICY "Gym admin access via gym_id" ON public.attendance FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'gym_admin' AND gym_id = public.attendance.gym_id)
);

-- BRANCHES POLICIES
DROP POLICY IF EXISTS "Admins have full access" ON public.branches;
CREATE POLICY "Admins have full access" ON public.branches FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Branch admins can view their own branch" ON public.branches;
CREATE POLICY "Branch admins can view their own branch" ON public.branches FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'branch_admin' AND branch_id = public.branches.id)
);

DROP POLICY IF EXISTS "Gym admin access via gym_id" ON public.branches;
CREATE POLICY "Gym admin access via gym_id" ON public.branches FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'gym_admin' AND gym_id = public.branches.gym_id)
);

DROP POLICY IF EXISTS "Gym staff access via gym_id" ON public.branches;
CREATE POLICY "Gym staff access via gym_id" ON public.branches FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ANY (ARRAY['gym_admin', 'trainer']) AND gym_id = public.branches.gym_id)
);

DROP POLICY IF EXISTS "Public can view active branches" ON public.branches;
CREATE POLICY "Public can view active branches" ON public.branches FOR SELECT USING (status = 'active');

-- DESIGNATIONS POLICIES
DROP POLICY IF EXISTS "Gym staff can manage designations" ON public.designations;
CREATE POLICY "Gym staff can manage designations" ON public.designations FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ANY (ARRAY['admin', 'gym_admin', 'branch_admin', 'receptionist']) AND branch_id = public.designations.branch_id)
);

-- EMPLOYEE ATTENDANCE POLICIES
DROP POLICY IF EXISTS "Gym staff can manage employee attendance" ON public.employee_attendance;
CREATE POLICY "Gym staff can manage employee attendance" ON public.employee_attendance FOR ALL USING (
    EXISTS (SELECT 1 FROM (profiles p JOIN employees e ON p.gym_id = e.gym_id) WHERE p.id = auth.uid() AND p.role = ANY (ARRAY['admin', 'gym_admin', 'branch_admin', 'receptionist']) AND e.id = public.employee_attendance.employee_id)
);

-- EMPLOYEES POLICIES
DROP POLICY IF EXISTS "Admins have full access" ON public.employees;
CREATE POLICY "Admins have full access" ON public.employees FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Gym admin access via gym_id" ON public.employees;
CREATE POLICY "Gym admin access via gym_id" ON public.employees FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'gym_admin' AND gym_id = public.employees.gym_id)
);

-- ENQUIRIES POLICIES
DROP POLICY IF EXISTS "Admins have full access" ON public.enquiries;
CREATE POLICY "Admins have full access" ON public.enquiries FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Branch staff delete by branch_id" ON public.enquiries;
CREATE POLICY "Branch staff delete by branch_id" ON public.enquiries FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ANY (ARRAY['branch_admin', 'receptionist']) AND branch_id = public.enquiries.branch_id)
);

DROP POLICY IF EXISTS "Branch staff insert by branch_id" ON public.enquiries;
CREATE POLICY "Branch staff insert by branch_id" ON public.enquiries FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ANY (ARRAY['branch_admin', 'receptionist']) AND branch_id = public.enquiries.branch_id)
);

DROP POLICY IF EXISTS "Branch staff select by branch_id" ON public.enquiries;
CREATE POLICY "Branch staff select by branch_id" ON public.enquiries FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ANY (ARRAY['branch_admin', 'receptionist']) AND branch_id = public.enquiries.branch_id)
);

DROP POLICY IF EXISTS "Branch staff update by branch_id" ON public.enquiries;
CREATE POLICY "Branch staff update by branch_id" ON public.enquiries FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ANY (ARRAY['branch_admin', 'receptionist']) AND branch_id = public.enquiries.branch_id)
);

DROP POLICY IF EXISTS "Gym admin access via gym_id" ON public.enquiries;
CREATE POLICY "Gym admin access via gym_id" ON public.enquiries FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'gym_admin' AND gym_id = public.enquiries.gym_id)
);

DROP POLICY IF EXISTS "Gym admin delete enquiries by gym_id" ON public.enquiries;
CREATE POLICY "Gym admin delete enquiries by gym_id" ON public.enquiries FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'gym_admin' AND gym_id = public.enquiries.gym_id)
);

DROP POLICY IF EXISTS "Gym admin insert enquiries by gym_id" ON public.enquiries;
CREATE POLICY "Gym admin insert enquiries by gym_id" ON public.enquiries FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'gym_admin' AND gym_id = public.enquiries.gym_id)
);

DROP POLICY IF EXISTS "Gym admin select enquiries by gym_id" ON public.enquiries;
CREATE POLICY "Gym admin select enquiries by gym_id" ON public.enquiries FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'gym_admin' AND gym_id = public.enquiries.gym_id)
);

DROP POLICY IF EXISTS "Gym admin update enquiries by gym_id" ON public.enquiries;
CREATE POLICY "Gym admin update enquiries by gym_id" ON public.enquiries FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'gym_admin' AND gym_id = public.enquiries.gym_id)
);

DROP POLICY IF EXISTS "Gym staff can manage enquiries" ON public.enquiries;
CREATE POLICY "Gym staff can manage enquiries" ON public.enquiries FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ANY (ARRAY['admin', 'gym_admin', 'branch_admin', 'receptionist']) AND gym_id = public.enquiries.gym_id)
);

-- MEMBERS POLICIES
DROP POLICY IF EXISTS "Admins and Trainers can view members" ON public.members;
CREATE POLICY "Admins and Trainers can view members" ON public.members FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ANY (ARRAY['admin', 'trainer']))
);

DROP POLICY IF EXISTS "Admins can manage members" ON public.members;
CREATE POLICY "Admins can manage members" ON public.members FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins have full access" ON public.members;
CREATE POLICY "Admins have full access" ON public.members FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Branch admin access via branch_id" ON public.members;
CREATE POLICY "Branch admin access via branch_id" ON public.members FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'branch_admin' AND branch_id = public.members.branch_id)
);

DROP POLICY IF EXISTS "Branch staff delete by branch_id" ON public.members;
CREATE POLICY "Branch staff delete by branch_id" ON public.members FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ANY (ARRAY['branch_admin', 'receptionist']) AND branch_id = public.members.branch_id)
);

DROP POLICY IF EXISTS "Branch staff insert by branch_id" ON public.members;
CREATE POLICY "Branch staff insert by branch_id" ON public.members FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ANY (ARRAY['branch_admin', 'receptionist']) AND branch_id = public.members.branch_id)
);

DROP POLICY IF EXISTS "Branch staff select by branch_id" ON public.members;
CREATE POLICY "Branch staff select by branch_id" ON public.members FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ANY (ARRAY['branch_admin', 'receptionist']) AND branch_id = public.members.branch_id)
);

DROP POLICY IF EXISTS "Branch staff update by branch_id" ON public.members;
CREATE POLICY "Branch staff update by branch_id" ON public.members FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ANY (ARRAY['branch_admin', 'receptionist']) AND branch_id = public.members.branch_id)
);

DROP POLICY IF EXISTS "Gym admin access via gym_id" ON public.members;
CREATE POLICY "Gym admin access via gym_id" ON public.members FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'gym_admin' AND gym_id = public.members.gym_id)
);

DROP POLICY IF EXISTS "Gym admin delete members by gym_id" ON public.members;
CREATE POLICY "Gym admin delete members by gym_id" ON public.members FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'gym_admin' AND gym_id = public.members.gym_id)
);

DROP POLICY IF EXISTS "Gym admin insert members by gym_id" ON public.members;
CREATE POLICY "Gym admin insert members by gym_id" ON public.members FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'gym_admin' AND gym_id = public.members.gym_id)
);

DROP POLICY IF EXISTS "Gym admin select members by gym_id" ON public.members;
CREATE POLICY "Gym admin select members by gym_id" ON public.members FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'gym_admin' AND gym_id = public.members.gym_id)
);

DROP POLICY IF EXISTS "Gym admin update members by gym_id" ON public.members;
CREATE POLICY "Gym admin update members by gym_id" ON public.members FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'gym_admin' AND gym_id = public.members.gym_id)
);

DROP POLICY IF EXISTS "Gym staff access via gym_id" ON public.members;
CREATE POLICY "Gym staff access via gym_id" ON public.members FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ANY (ARRAY['gym_admin', 'trainer']) AND gym_id = public.members.gym_id)
);

DROP POLICY IF EXISTS "Gym staff can manage members" ON public.members;
CREATE POLICY "Gym staff can manage members" ON public.members FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ANY (ARRAY['admin', 'gym_admin', 'branch_admin', 'receptionist']) AND gym_id = public.members.gym_id)
);

-- MEMBERSHIP PLANS POLICIES
DROP POLICY IF EXISTS "Admins can manage plans" ON public.membership_plans;
CREATE POLICY "Admins can manage plans" ON public.membership_plans FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins have full access" ON public.membership_plans;
CREATE POLICY "Admins have full access" ON public.membership_plans FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Gym admin access via gym_id" ON public.membership_plans;
CREATE POLICY "Gym admin access via gym_id" ON public.membership_plans FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'gym_admin' AND gym_id = public.membership_plans.gym_id)
);

DROP POLICY IF EXISTS "Gym staff access via gym_id" ON public.membership_plans;
CREATE POLICY "Gym staff access via gym_id" ON public.membership_plans FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ANY (ARRAY['gym_admin', 'trainer']) AND gym_id = public.membership_plans.gym_id)
);

DROP POLICY IF EXISTS "Plans are viewable by everyone" ON public.membership_plans;
CREATE POLICY "Plans are viewable by everyone" ON public.membership_plans FOR SELECT USING (true);

-- PAYMENTS POLICIES
DROP POLICY IF EXISTS "Admins have full access" ON public.payments;
CREATE POLICY "Admins have full access" ON public.payments FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Gym admin access via gym_id" ON public.payments;
CREATE POLICY "Gym admin access via gym_id" ON public.payments FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'gym_admin' AND gym_id = public.payments.gym_id)
);

DROP POLICY IF EXISTS "Gym staff can insert payments" ON public.payments;
CREATE POLICY "Gym staff can insert payments" ON public.payments FOR INSERT WITH CHECK (can_insert_payment(gym_id));

DROP POLICY IF EXISTS "Gym staff can manage payments" ON public.payments;
CREATE POLICY "Gym staff can manage payments" ON public.payments FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ANY (ARRAY['admin', 'gym_admin', 'branch_admin', 'receptionist']) AND gym_id = public.payments.gym_id)
);

-- TRAINERS POLICIES
DROP POLICY IF EXISTS "Admins can manage trainers" ON public.trainers;
CREATE POLICY "Admins can manage trainers" ON public.trainers FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins have full access" ON public.trainers;
CREATE POLICY "Admins have full access" ON public.trainers FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Branch admin access via branch_id" ON public.trainers;
CREATE POLICY "Branch admin access via branch_id" ON public.trainers FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'branch_admin' AND branch_id = public.trainers.branch_id)
);

DROP POLICY IF EXISTS "Branch staff access via branch_id" ON public.trainers;
CREATE POLICY "Branch staff access via branch_id" ON public.trainers FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ANY (ARRAY['branch_admin', 'receptionist']) AND branch_id = public.trainers.branch_id)
);

DROP POLICY IF EXISTS "Gym admin access via gym_id" ON public.trainers;
CREATE POLICY "Gym admin access via gym_id" ON public.trainers FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'gym_admin' AND gym_id = public.trainers.gym_id)
);

DROP POLICY IF EXISTS "Gym staff access via gym_id" ON public.trainers;
CREATE POLICY "Gym staff access via gym_id" ON public.trainers FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ANY (ARRAY['gym_admin', 'trainer']) AND gym_id = public.trainers.gym_id)
);

DROP POLICY IF EXISTS "Public can view active trainers" ON public.trainers;
CREATE POLICY "Public can view active trainers" ON public.trainers FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Trainers viewable by everyone" ON public.trainers;
CREATE POLICY "Trainers viewable by everyone" ON public.trainers FOR SELECT USING (true);

-- TRANSACTION CATEGORIES POLICIES
DROP POLICY IF EXISTS "Gym staff can manage categories" ON public.transaction_categories;
CREATE POLICY "Gym staff can manage categories" ON public.transaction_categories FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND gym_id = public.transaction_categories.gym_id)
);

-- TRANSACTIONS POLICIES
DROP POLICY IF EXISTS "Gym staff can manage transactions" ON public.transactions;
CREATE POLICY "Gym staff can manage transactions" ON public.transactions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND gym_id = public.transactions.gym_id)
);

-- ==========================================
-- 10. STORAGE BUCKETS
-- ==========================================
-- Note: If bucket creation fails due to permissions, create it manually via:
-- Supabase Dashboard → Storage → New Bucket

-- Create storage bucket for gym images
DO $$ 
BEGIN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, type)
    VALUES (
      'gym-images',
      'gym-images',
      true,
      2097152, -- 2MB limit
      ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
      'STANDARD'
    ) ON CONFLICT (id) DO UPDATE SET
      public = true,
      file_size_limit = 2097152,
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
      type = 'STANDARD';
EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Could not create storage bucket "gym-images". Please create it manually via Dashboard with these settings:';
    RAISE NOTICE '  - Name: gym-images';
    RAISE NOTICE '  - Public: true';
    RAISE NOTICE '  - File size limit: 2097152 bytes (2MB)';
    RAISE NOTICE '  - Allowed MIME types: image/jpeg, image/png, image/webp, image/jpg';
END $$;

-- ==========================================
-- 11. STORAGE POLICIES
-- ==========================================
-- Note: Storage policies may require special permissions.
-- If these fail, create them manually via Supabase Dashboard:
-- Storage → Policies → New Policy

-- Storage: Public can view gym images
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public can view gym images') THEN
        CREATE POLICY "Public can view gym images" ON storage.objects FOR SELECT USING (bucket_id = 'gym-images');
    END IF;
EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Could not create storage policy "Public can view gym images". Please create it manually via Dashboard.';
END $$;

-- Storage: Users can upload gym images
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload gym images') THEN
        CREATE POLICY "Users can upload gym images" ON storage.objects FOR INSERT WITH CHECK (
            (bucket_id = 'gym-images') AND (auth.role() = 'authenticated')
        );
    END IF;
EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Could not create storage policy "Users can upload gym images". Please create it manually via Dashboard.';
END $$;

-- Storage: Users can update own gym images
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can update own gym images') THEN
        CREATE POLICY "Users can update own gym images" ON storage.objects FOR UPDATE USING (
            (bucket_id = 'gym-images') AND ((auth.uid())::text = (storage.foldername(name))[2])
        ) WITH CHECK (
            (bucket_id = 'gym-images') AND ((auth.uid())::text = (storage.foldername(name))[2])
        );
    END IF;
EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Could not create storage policy "Users can update own gym images". Please create it manually via Dashboard.';
END $$;

-- Storage: Users can delete own gym images
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete own gym images') THEN
        CREATE POLICY "Users can delete own gym images" ON storage.objects FOR DELETE USING (
            (bucket_id = 'gym-images') AND ((auth.uid())::text = (storage.foldername(name))[2])
        );
    END IF;
EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Could not create storage policy "Users can delete own gym images". Please create it manually via Dashboard.';
END $$;

-- ==========================================
-- ✅ BACKUP COMPLETE
-- ==========================================
-- This script contains all database schema, RLS policies, triggers, functions,
-- views, storage buckets, and storage policies from the source project.
-- 
-- To restore on a new Supabase project:
-- 1. Create a new Supabase project
-- 2. Run this SQL script in the SQL Editor
-- 3. Verify all tables, policies, and functions are created correctly
-- 4. If storage policies failed, create them manually via Dashboard:
--    - Go to Storage → Policies
--    - Create policies for 'gym-images' bucket:
--      * SELECT: Public can view (bucket_id = 'gym-images')
--      * INSERT: Authenticated users (bucket_id = 'gym-images' AND auth.role() = 'authenticated')
--      * UPDATE: Own files (bucket_id = 'gym-images' AND auth.uid()::text = (storage.foldername(name))[2])
--      * DELETE: Own files (bucket_id = 'gym-images' AND auth.uid()::text = (storage.foldername(name))[2])
-- 
-- Note: This script does NOT include data migration.
-- You will need to export and import data separately if needed.
-- ==========================================

