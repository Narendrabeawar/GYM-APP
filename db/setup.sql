-- ==========================================
-- 🎯 GYM MANAGEMENT SYSTEM - FULL SETUP SQL
-- Idempotent (Safe to run multiple times)
-- Includes RLS policy fixes for enquiry conversion
-- ==========================================

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. GYMS TABLE
CREATE TABLE IF NOT EXISTS public.gyms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    subscription_status TEXT CHECK (subscription_status IN ('active', 'inactive', 'expired')) DEFAULT 'active',
    logo_url TEXT,
    admin_id UUID, -- Will be linked to profiles later
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.1 BRANCHES TABLE (Enhanced with comprehensive branch information)
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    address TEXT,
    status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',

    -- Basic Information
    description TEXT,
    established_year INTEGER,
    member_capacity INTEGER,
    branch_code TEXT,
    website TEXT,
    social_media TEXT,
    whatsapp TEXT,

    -- Operating Hours
    operating_hours JSONB, -- Store weekly schedule as JSON
    holiday_hours TEXT,
    peak_hours TEXT,

    -- Facilities & Amenities
    facilities TEXT[], -- Array of facility names
    amenities TEXT[], -- Array of amenity names
    special_features TEXT,

    -- Gallery
    images TEXT[], -- Array of image URLs

    -- Additional Information
    rules TEXT, -- Gym rules & regulations
    policies TEXT, -- Membership policies
    emergency_contact TEXT,
    manager_name TEXT,
    certifications TEXT,
    nearby_landmarks TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. PROFILES TABLE (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    role TEXT CHECK (role IN ('admin', 'trainer', 'member', 'gym_admin', 'branch_admin', 'receptionist')) DEFAULT 'member',
    gym_id UUID REFERENCES public.gyms(id) ON DELETE SET NULL,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Safely update profiles schema for existing databases
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'trainer', 'member', 'gym_admin', 'branch_admin', 'receptionist'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.gyms ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
-- Ensure members table has father_name column (safe to run multiple times)
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS father_name TEXT;
-- Ensure branches table has images column (safe to run multiple times)
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS images TEXT[];
-- Ensure branches table has other expected columns used by the app
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS facilities TEXT[];
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS amenities TEXT[];
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS operating_hours JSONB;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS holiday_hours TEXT;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS peak_hours TEXT;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS special_features TEXT;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS member_capacity INTEGER;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS established_year INTEGER;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS branch_code TEXT;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS social_media TEXT;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS rules TEXT;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS policies TEXT;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS manager_name TEXT;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS certifications TEXT;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS nearby_landmarks TEXT;

-- Ensure membership_plans table has new columns (safe to run multiple times)
ALTER TABLE public.membership_plans ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.membership_plans ADD COLUMN IF NOT EXISTS final_amount DECIMAL(10,2);
ALTER TABLE public.membership_plans ADD COLUMN IF NOT EXISTS custom_days INTEGER;
ALTER TABLE public.membership_plans ADD COLUMN IF NOT EXISTS plan_period TEXT CHECK (plan_period IN ('monthly', 'quarterly', 'half-yearly', 'yearly', 'custom')) DEFAULT 'monthly';

-- 3. MEMBERSHIP PLANS
CREATE TABLE IF NOT EXISTS public.membership_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    duration_months INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    final_amount DECIMAL(10,2),
    custom_days INTEGER,
    plan_period TEXT CHECK (plan_period IN ('monthly', 'quarterly', 'half-yearly', 'yearly', 'custom')) DEFAULT 'monthly',
    features TEXT[],
    status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. MEMBERS
CREATE TABLE IF NOT EXISTS public.members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    father_name TEXT,
    email TEXT,
    phone TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    address TEXT,
    blood_group VARCHAR(10),
    height DECIMAL(5, 2),
    weight DECIMAL(5, 2),
    fitness_goal VARCHAR(255),
    medical_conditions TEXT,
    -- Emergency contact (legacy) kept for compatibility
    emergency_contact TEXT,
    emergency_phone TEXT,
    -- New explicit emergency contact fields (preferred snake_case for API)
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relationship TEXT,
    membership_plan_id UUID REFERENCES public.membership_plans(id) ON DELETE SET NULL,
    membership_start_date DATE,
    membership_end_date DATE,
    status TEXT CHECK (status IN ('active', 'inactive', 'suspended')) DEFAULT 'active',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TRAINERS
CREATE TABLE IF NOT EXISTS public.trainers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    specialization TEXT[],
    experience_years INTEGER,
    certifications TEXT[],
    avatar_url TEXT,
    status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. ATTENDANCE
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    check_in_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    check_out_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. ENQUIRIES (New member enquiries before registration)
CREATE TABLE IF NOT EXISTS public.enquiries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    father_name TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    date_of_birth DATE,                                    -- Date of birth for enquiry personal info
    gender TEXT CHECK (gender IN ('male', 'female', 'other')), -- Gender: male, female, or other
    address TEXT NOT NULL,
    health_info TEXT,
    blood_group VARCHAR(10),
    height DECIMAL(5, 2),
    weight DECIMAL(5, 2),
    fitness_goal VARCHAR(255),
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relationship TEXT,
    enquiry_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT CHECK (status IN ('pending', 'converted', 'rejected')) DEFAULT 'pending',
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    converted_to_member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    payable_amount DECIMAL(10,2),
    discount_amount DECIMAL(10,2) DEFAULT 0,
    due_amount DECIMAL(10,2) DEFAULT 0,
    extra_amount DECIMAL(10,2) DEFAULT 0,
    payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'upi', 'bank_transfer')),
    extra_discount DECIMAL(10,2) DEFAULT 0,
    status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'completed',
    transaction_id TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8.1 EMPLOYEES (Attendance System - Separate from login profiles)
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
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

-- 8.3 DESIGNATIONS
-- Used to store reusable designations for employees per gym
CREATE TABLE IF NOT EXISTS public.designations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (branch_id, name)
);

-- 8.2 EMPLOYEE ATTENDANCE
CREATE TABLE IF NOT EXISTS public.employee_attendance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    check_in_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    check_out_time TIMESTAMP WITH TIME ZONE,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    status TEXT CHECK (status IN ('present', 'absent', 'late', 'leave')) DEFAULT 'present',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Ensure existing database has an up-to-date CHECK constraint that allows 'leave'.
-- This will drop the old constraint (if present) and recreate it including 'leave'.
-- Run this during migrations or when applying setup.sql to an existing database.
ALTER TABLE public.employee_attendance
  DROP CONSTRAINT IF EXISTS employee_attendance_status_check;

ALTER TABLE public.employee_attendance
  ADD CONSTRAINT employee_attendance_status_check
  CHECK (status = ANY (ARRAY['present'::text, 'absent'::text, 'late'::text, 'leave'::text]));

-- For existing databases: make check_in_time nullable so we can set it to NULL
-- when marking an employee absent or on leave.
ALTER TABLE IF EXISTS public.employee_attendance
  ALTER COLUMN check_in_time DROP NOT NULL;

-- ==========================================
-- 🔐 ROW LEVEL SECURITY (RLS)
-- ==========================================

DO $$ 
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE 'ALTER TABLE public.' || table_name || ' ENABLE ROW LEVEL SECURITY';
    END LOOP;
END $$;

-- Ensure INSERT policy exists for payments (WITH CHECK) so authenticated gym staff can insert rows
-- Helper function used by INSERT policy (avoids referencing NEW inside DO block)
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

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Gym staff can insert payments') THEN
        CREATE POLICY "Gym staff can insert payments" ON public.payments
        FOR INSERT
        WITH CHECK (
            public.can_insert_payment(gym_id)
        );
    END IF;
END $$;

-- ==========================================
-- MEMBER BALANCES VIEW & RPCs
-- Provides per-member aggregated net balance used by UI
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

-- RPC: get_member_balance(p_member uuid) -> numeric
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

-- RPC: get_balances_for_members(p_members uuid[]) -> table (member_id, net_balance)
CREATE OR REPLACE FUNCTION public.get_balances_for_members(p_members uuid[])
RETURNS TABLE(member_id uuid, net_balance numeric)
LANGUAGE sql
STABLE
AS $$
  SELECT mb.member_id, mb.net_balance
  FROM public.member_balances mb
  WHERE mb.member_id = ANY(p_members);
$$;

-- RPC: create_payment_and_get_balance(...) -> returns inserted payment id and updated net_balance
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

-- RPC: get_member_balance_at(member uuid, as_of timestamptz) -> returns net_balance as of given timestamp
CREATE OR REPLACE FUNCTION public.get_member_balance_at(p_member uuid, p_as_of timestamptz)
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

-- ==========================================
-- BRANCH P&L VIEW + RPC
-- Aggregates transactions and payments per branch and day
-- ==========================================
-- Corrected branch_pnl view: aggregate payments and transactions separately then join to avoid duplication
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

-- RPC: get_branch_pnl(branch, start_date, end_date)
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



-- POLICIES (Idempotent using DO blocks)

-- GYMS
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage all gyms') THEN
        CREATE POLICY "Admins can manage all gyms" ON public.gyms FOR ALL USING (
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Gym admins can view their own gym') THEN
        CREATE POLICY "Gym admins can view their own gym" ON public.gyms FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'gym_admin' AND gym_id = public.gyms.id))
        );
    END IF;
END $$;

-- PROFILES
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public profiles are viewable by everyone') THEN
        CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;

-- MULTI-TENANCY POLICIES (For members, trainers, etc.)
DO $$
DECLARE
    target_table TEXT;
BEGIN
    FOR target_table IN VALUES ('members'), ('trainers'), ('membership_plans'), ('attendance'), ('employees'), ('payments'), ('enquiries'), ('branches')
    LOOP
        -- Admin: Can do everything
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = target_table AND policyname = 'Admins have full access') THEN
            EXECUTE 'CREATE POLICY "Admins have full access" ON public.' || target_table || ' FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ''admin''))';
        END IF;
        
        -- Gym Admin: Access based on gym_id
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = target_table AND policyname = 'Gym admin access via gym_id') THEN
            EXECUTE 'CREATE POLICY "Gym admin access via gym_id" ON public.' || target_table || ' FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ''gym_admin'' AND gym_id = public.' || target_table || '.gym_id))';
        END IF;

        -- Branch Admin: Access based on branch_id (if table has it)
        -- Note: For now, members/trainers/attendance/payments will use gym_id for Gym Admin and branch_id for Branch Admin
    END LOOP;
END $$;

-- BRANCH ADMIN & RECEPTIONIST SPECIFIC ACCESS
DO $$
DECLARE
    target_table TEXT;
BEGIN
    FOR target_table IN VALUES ('members'), ('trainers'), ('attendance'), ('employees'), ('payments'), ('enquiries')
    LOOP
        -- Add branch_id column to tables if not exists for better isolation
        EXECUTE 'ALTER TABLE public.' || target_table || ' ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL';
    END LOOP;
END $$;

-- FIXED GYM-BASED POLICIES (Replaces problematic branch-specific policies)
-- These allow all gym staff to manage their gym's data regardless of branch
DO $$ BEGIN
    -- Drop problematic branch-specific policies
    DROP POLICY IF EXISTS "Branch staff access via branch_id" ON public.enquiries;
    DROP POLICY IF EXISTS "Branch staff access via branch_id" ON public.payments;
    DROP POLICY IF EXISTS "Branch staff access via branch_id" ON public.members;

    -- Create gym-based policies for enquiries
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'enquiries' AND policyname = 'Gym staff can manage enquiries') THEN
        CREATE POLICY "Gym staff can manage enquiries" ON public.enquiries FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid()
                AND role IN ('admin', 'gym_admin', 'branch_admin', 'receptionist')
                AND gym_id = public.enquiries.gym_id
            )
        );
    END IF;

    -- Create gym-based policies for payments
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Gym staff can manage payments') THEN
        CREATE POLICY "Gym staff can manage payments" ON public.payments FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid()
                AND role IN ('admin', 'gym_admin', 'branch_admin', 'receptionist')
                AND gym_id = public.payments.gym_id
            )
        );
    END IF;

    -- Create gym-based policies for members
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'members' AND policyname = 'Gym staff can manage members') THEN
        CREATE POLICY "Gym staff can manage members" ON public.members FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid()
                AND role IN ('admin', 'gym_admin', 'branch_admin', 'receptionist')
                AND gym_id = public.members.gym_id
            )
        );
    END IF;

    -- Create specific policies for employee_attendance (no direct gym_id column)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'employee_attendance' AND policyname = 'Gym staff can manage employee attendance') THEN
        CREATE POLICY "Gym staff can manage employee attendance" ON public.employee_attendance FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.profiles p
                JOIN public.employees e ON p.gym_id = e.gym_id
                WHERE p.id = auth.uid()
                AND p.role IN ('admin', 'gym_admin', 'branch_admin', 'receptionist')
                AND e.id = public.employee_attendance.employee_id
            )
        );
    END IF;
END $$;

-- BRANCH SPECIFIC POLICIES
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Branch admins can view their own branch') THEN
        CREATE POLICY "Branch admins can view their own branch" ON public.branches
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid()
                AND role = 'branch_admin'
                AND branch_id = public.branches.id
            )
        );
    END IF;

    -- Create branch-based policy for designations
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'designations' AND policyname = 'Gym staff can manage designations') THEN
        CREATE POLICY "Gym staff can manage designations" ON public.designations FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid()
                AND role IN ('admin', 'gym_admin', 'branch_admin', 'receptionist')
                AND branch_id = public.designations.branch_id
            )
        );
    END IF;
END $$;

-- ==========================================
-- ⚡ FUNCTIONS & TRIGGERS
-- ==========================================

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- 🗂️ SUPABASE STORAGE SETUP
-- ==========================================

-- Create storage bucket for gym images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gym-images',
  'gym-images',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
) ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- ⚠️  STORAGE POLICIES SETUP REQUIRED
-- ==========================================
-- Storage policies cannot be created via SQL in Supabase due to permissions.
-- Please set up the following policies manually in your Supabase Dashboard:
--
-- 1. Go to Storage → gym-images bucket → Policies
-- 2. Create the following policies:
--
-- Policy 1: "Users can upload gym images"
-- - Operation: INSERT
-- - Policy: bucket_id = 'gym-images' AND auth.role() = 'authenticated'
--
-- Policy 2: "Public can view gym images"
-- - Operation: SELECT
-- - Policy: bucket_id = 'gym-images'
--
-- Policy 3: "Users can update own gym images"
-- - Operation: UPDATE
-- - Policy: bucket_id = 'gym-images' AND auth.uid()::text = (storage.foldername(name))[2]
--
-- Policy 4: "Users can delete own gym images"
-- - Operation: DELETE
-- - Policy: bucket_id = 'gym-images' AND auth.uid()::text = (storage.foldername(name))[2]
--
-- These policies allow authenticated users to upload/update/delete their own images
-- while allowing public access to view all gym images.

-- ==========================================
-- 🧪 TEST STORAGE SETUP (Optional)
-- ==========================================
-- You can run this after setup to verify storage is working:
-- SELECT * FROM storage.buckets WHERE id = 'gym-images';

-- ==========================================
-- 🌱 SEED DATA (Optional Initial Plans)
-- ==========================================
-- Note: These plans won't have a gym_id initially unless you assign one.
-- Skipping for now to avoid FK errors if no gyms exist.

-- ==========================================
-- 🔁 MEMBER STATUS SYNC (Idempotent)
-- Ensures `members.status` reflects membership_end_date and keeps it synced
-- ==========================================

-- 1) Update existing members whose membership_end_date is in the past
--    Set status to 'inactive' (you can change to 'expired' if preferred)
UPDATE public.members
SET status = 'inactive'
WHERE membership_end_date IS NOT NULL
  AND membership_end_date < now()::date
  AND status IS DISTINCT FROM 'inactive';

-- 2) Trigger function to keep status in sync on INSERT/UPDATE
CREATE OR REPLACE FUNCTION public.sync_member_status()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3) Trigger to run the function before insert or update on members
DROP TRIGGER IF EXISTS trg_sync_member_status ON public.members;
CREATE TRIGGER trg_sync_member_status
BEFORE INSERT OR UPDATE OF membership_end_date, membership_start_date, status ON public.members
FOR EACH ROW
EXECUTE PROCEDURE public.sync_member_status();

-- Note: If you want a daily job to mark rows expired without updates, schedule a cron job
-- using pg_cron or an external scheduler that runs the UPDATE above once per day.

-- ==========================================
-- 🏥 HEALTH INFORMATION COLUMNS (Safe for existing databases)
-- ==========================================

-- Add health columns to members table (if not exists)
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10);
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS height DECIMAL(5, 2);
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS weight DECIMAL(5, 2);
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS fitness_goal VARCHAR(255);
-- Add emergency contact columns to members table (safe for existing databases)
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS medical_conditions TEXT;

-- Add health columns to enquiries table (if not exists)
ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10);
ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS height DECIMAL(5, 2);
ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS weight DECIMAL(5, 2);
ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS fitness_goal VARCHAR(255);

-- ==========================================
-- 💰 TRANSACTIONS & BOOKKEEPING
-- ==========================================

-- 1. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category TEXT NOT NULL,
    reference_name TEXT,
    description TEXT,
    payment_method TEXT DEFAULT 'cash',
    status TEXT DEFAULT 'completed',
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Transaction Categories (for dropdown and suggestions)
CREATE TABLE IF NOT EXISTS public.transaction_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
    UNIQUE(gym_id, name, type)
);

-- 3. RLS Policies
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_categories ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Gym staff can manage transactions') THEN
        CREATE POLICY "Gym staff can manage transactions" ON public.transactions FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() 
                AND gym_id = public.transactions.gym_id
                AND role IN ('admin', 'gym_admin', 'branch_admin', 'receptionist')
            )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transaction_categories' AND policyname = 'Gym staff can manage categories') THEN
        CREATE POLICY "Gym staff can manage categories" ON public.transaction_categories FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid()
                AND gym_id = public.transaction_categories.gym_id
                AND role IN ('admin', 'gym_admin', 'branch_admin', 'receptionist')
            )
        );
    END IF;
END $$;

-- Migration: Add new columns to enquiries table for existing databases
-- These ALTER TABLE statements will only add columns if they don't already exist
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other'));

-- Add comments to document the new columns
COMMENT ON COLUMN enquiries.date_of_birth IS 'Date of birth for enquiry personal information';
COMMENT ON COLUMN enquiries.gender IS 'Gender selection: male, female, or other';

-- Migration: Add gym_id column to designations table
ALTER TABLE designations ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE;

-- Populate gym_id for existing designations based on branch_id
UPDATE designations
SET gym_id = branches.gym_id
FROM branches
WHERE designations.branch_id = branches.id AND designations.gym_id IS NULL;
