import { supabase } from './supabase';

/**
 * Debug function to check profiles table access
 */
export const debugProfilesTable = async () => {
  try {
    console.log('🔍 Testing profiles table access...');
    
    // Test basic table access
    const { data, error, count } = await supabase
      .from('profiles')
      .select('id, organization_id', { count: 'exact' })
      .limit(1);
    
    console.log('📊 Profiles table test:', {
      data,
      error,
      count,
      errorCode: error?.code,
      errorMessage: error?.message
    });
    
    if (error) {
      if (error.code === 'PGRST205') {
        console.error('❌ Profiles table does not exist in public schema');
        console.log('💡 Contact backend team to ensure profiles table exists');
      } else if (error.code === 'PGRST301') {
        console.error('🔒 RLS policy is blocking access to profiles table');
        console.log('💡 Contact backend team to check RLS policies for profiles table');
      } else {
        console.error('❌ Other profiles table error:', error);
        console.log('💡 Contact backend team to investigate profiles table issues');
      }
    } else {
      console.log('✅ Profiles table is accessible, total rows:', count);
      if (data && data.length > 0) {
        console.log('📝 Sample profile structure:', data[0]);
      }
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

    console.log('✅ User organization updated successfully');
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
    console.log('🔍 Fetching user organization ID...');
    // First try to get from current user metadata
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.error('Error getting user:', error);
      return null;
    }

    // Check user metadata first (preferred method)
    const orgIdFromMetadata = user.user_metadata?.organization_id;
    if (orgIdFromMetadata) {
      console.log('📊 Organization ID found in user metadata:', orgIdFromMetadata);
      return orgIdFromMetadata;
    }

    // Fallback: check profiles table (for migration)
    console.log('🔍 Organization ID not in metadata, checking profiles table...');
    console.log('👤 User ID for profiles query:', user.id);
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    console.log('📊 Profiles query result:', { 
      profile, 
      error: profileError,
      errorCode: profileError?.code,
      errorMessage: profileError?.message 
    });

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
      console.log('🔄 Migrating organization_id from profile to user metadata...');
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
