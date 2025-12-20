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

-- 1.1 BRANCHES TABLE
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    address TEXT,
    status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
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

-- 3. MEMBERSHIP PLANS
CREATE TABLE IF NOT EXISTS public.membership_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    duration_months INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
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
    email TEXT,
    phone TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    address TEXT,
    emergency_contact TEXT,
    emergency_phone TEXT,
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
    check_in_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
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
    address TEXT NOT NULL,
    health_info TEXT, -- Medical conditions, allergies, etc.
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relationship TEXT,
    enquiry_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT CHECK (status IN ('pending', 'converted', 'rejected')) DEFAULT 'pending',
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    converted_to_member_id UUID REFERENCES public.members(id) ON DELETE SET NULL, -- Link to member after conversion
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'upi', 'bank_transfer')),
    payment_type TEXT CHECK (payment_type IN ('membership', 'personal_training', 'other')),
    status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'completed',
    transaction_id TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

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
    FOR target_table IN VALUES ('members'), ('trainers'), ('membership_plans'), ('attendance'), ('payments'), ('enquiries'), ('branches')
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
    FOR target_table IN VALUES ('members'), ('trainers'), ('attendance'), ('payments'), ('enquiries')
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
