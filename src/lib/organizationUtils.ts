import { supabase } from './supabase';

/**
 * Debug function to check profiles table access
 */
export const debugProfilesTable = async () => {
  try {
  // Testing profiles table access
    
    // Test basic table access
  const { error, count } = await supabase
      .from('profiles')
      .select('id, organization_id', { count: 'exact' })
      .limit(1);
    
  // Profiles table test completed
    
    if (error) {
      if (error.code === 'PGRST205') {
        console.error('❌ Profiles table does not exist in public schema');
  // Contact backend team to ensure profiles table exists
      } else if (error.code === 'PGRST301') {
        console.error('🔒 RLS policy is blocking access to profiles table');
  // Contact backend team to check RLS policies for profiles table
      } else {
        console.error('❌ Other profiles table error:', error);
  // Contact backend team to investigate profiles table issues
      }
    } else {
  // Profiles table is accessible
    }
    
    return { success: !error, error, count };
  } catch (error) {
    console.error('💥 Unexpected error testing profiles table:', error);
    return { success: false, error, count: 0 };
  }
};

/**
 * Updates user metadata with organization_id for existing users
 * This is useful for migrating existing users to the new organization system
 */
export const updateUserOrganization = async (organizationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.updateUser({
      data: {
        organization_id: organizationId
      }
    });

    if (error) {
      console.error('Error updating user organization:', error);
      return false;
    }

  // User organization updated successfully
    return true;
  } catch (error) {
    console.error('💥 Unexpected error updating user organization:', error);
    return false;
  }
};

/**
 * Gets organization_id from user metadata
 * Fallback to profiles table if not in metadata (for migration scenarios)
 */
export const getUserOrganizationId = async (): Promise<string | null> => {
  try {
  // Fetching user organization ID
    // First try to get from current user metadata
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.error('Error getting user:', error);
      return null;
    }

    // Check user metadata first (preferred method)
    const orgIdFromMetadata = user.user_metadata?.organization_id;
    if (orgIdFromMetadata) {
      return orgIdFromMetadata;
    }

    // Fallback: check profiles table (for migration)
  // Organization ID not in metadata, checking profiles table
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

  // Profiles query result processed

    if (profileError) {
      console.warn('⚠️ Error querying profiles table:', profileError);
      if (profileError.code === 'PGRST116') {
        console.warn('⚠️ No profile found for user ID:', user.id);
      } else if (profileError.code === 'PGRST301') {
        console.error('🔒 RLS policy blocking access to profiles table');
      } else {
        console.error('❌ Unexpected profiles query error:', profileError);
      }
      return null;
    }

    if (!profile) {
      console.warn('⚠️ No organization found in profiles table - profile is null');
      return null;
    }

    const orgIdFromProfile = profile.organization_id;
    
    // If found in profiles but not in metadata, update metadata
    if (orgIdFromProfile) {
  // Migrating organization_id from profile to user metadata
      const updated = await updateUserOrganization(orgIdFromProfile);
      if (updated) {
        return orgIdFromProfile;
      }
    }

    return null;
  } catch (error) {
    console.error('💥 Error getting user organization ID:', error);
    return null;
  }
};
