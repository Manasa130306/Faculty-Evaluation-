'use server';

import { createClient } from '@/lib/supabase/server';

export async function changePasswordAction(currentPassword: string, newPassword: string) {
  try {
    const supabase = await createClient();

    // 1. Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user || !user.email) {
      return { success: false, message: 'Not authenticated or missing email.' };
    }

    // 2. Re-authenticate to verify current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      return { success: false, message: 'Current password is incorrect.' };
    }

    // 3. Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return { success: false, message: updateError.message };
    }

    return { success: true, message: 'Password updated successfully.' };
  } catch (err: any) {
    console.error('changePasswordAction error:', err);
    return { success: false, message: err.message || 'An error occurred.' };
  }
}
