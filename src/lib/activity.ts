import { SupabaseClient } from '@supabase/supabase-js';

type LogParams = {
  caseId?: string;
  action: string;
  details?: Record<string, unknown>;
};

/**
 * Log an activity event. Fire-and-forget — errors are silently logged to console.
 */
export async function logActivity(
  supabase: SupabaseClient,
  { caseId, action, details = {} }: LogParams
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Try to resolve display name
    let userName = user.email?.split('@')[0] || 'Unknown';

    // Check user_profiles first (lab staff)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();

    if (profile?.display_name) {
      userName = profile.display_name;
    } else {
      // Check doctors table
      const { data: doctor } = await supabase
        .from('doctors')
        .select('name')
        .eq('auth_user_id', user.id)
        .single();
      if (doctor?.name) {
        userName = doctor.name;
      }
    }

    await supabase.from('activity_log').insert({
      case_id: caseId || null,
      user_id: user.id,
      user_name: userName,
      action,
      details,
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}
