// Test script to create an expired member for testing renewal functionality
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function createExpiredMember() {
  try {
    // Read environment variables
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const env = envContent.split('\n').reduce((acc, line) => {
      const [key, value] = line.split('=');
      if (key && value) {
        acc[key] = value.replace(/['"]/g, '');
      }
      return acc;
    }, {});

    const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

    // Get user info
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('User not authenticated');
      return;
    }

    const gymId = user.user_metadata?.gym_id;
    const branchId = user.user_metadata?.branch_id;

    if (!gymId || !branchId) {
      console.error('Gym ID or Branch ID not found');
      return;
    }

    // Create an expired member (membership_end_date in the past)
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 30); // 30 days ago

    const { data, error } = await supabase
      .from('members')
      .insert({
        gym_id: gymId,
        branch_id: branchId,
        user_id: user.id,
        full_name: 'Test Expired Member',
        email: 'expired@test.com',
        phone: '9999999999',
        address: 'Test Address',
        gender: 'male',
        membership_plan_id: null, // No plan assigned
        membership_start_date: '2024-01-01',
        membership_end_date: expiredDate.toISOString().split('T')[0], // Past date
        status: 'active'
      })
      .select();

    if (error) {
      console.error('Error creating expired member:', error);
    } else {
      console.log('Expired member created successfully:', data);
    }

  } catch (error) {
    console.error('Script error:', error);
  }
}

createExpiredMember();
