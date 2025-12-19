-- Make a specific user an admin
-- Ensure the user has already signed up in Supabase Auth before running this

INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', 'Admin User'),
    'admin'
FROM auth.users
WHERE email = 'admin@admin.com'
ON CONFLICT (id) DO UPDATE 
SET role = 'admin';
