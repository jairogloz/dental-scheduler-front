// If UserProfile is defined elsewhere, import from the correct path:
// import type { UserProfile } from '../lib/types' 

// Or define the UserProfile type here if not exported anywhere:
export type UserProfile = {
  id: string
  email: string
  org_id: string
  roles: ('admin' | 'doctor' | 'receptionist')[]
}

/**
 * Utility functions for working with user roles
 */

export const hasRole = (userProfile: UserProfile | null, role: 'admin' | 'doctor' | 'receptionist'): boolean => {
  return userProfile?.roles?.includes(role) ?? false
}

export const hasAnyRole = (userProfile: UserProfile | null, roles: ('admin' | 'doctor' | 'receptionist')[]): boolean => {
  return roles.some(role => hasRole(userProfile, role))
}

export const isAdmin = (userProfile: UserProfile | null): boolean => {
  return hasRole(userProfile, 'admin')
}

export const isDoctor = (userProfile: UserProfile | null): boolean => {
  return hasRole(userProfile, 'doctor')
}

export const isReceptionist = (userProfile: UserProfile | null): boolean => {
  return hasRole(userProfile, 'receptionist')
}

export const isDoctorOrAdmin = (userProfile: UserProfile | null): boolean => {
  return hasAnyRole(userProfile, ['doctor', 'admin'])
}

export const getRoleDisplayText = (userProfile: UserProfile | null): string => {
  if (!userProfile?.roles || userProfile.roles.length === 0) {
    return 'Sin rol'
  }

  // Capitalize and join roles
  return userProfile.roles
    .map((role: 'admin' | 'doctor' | 'receptionist') => role.charAt(0).toUpperCase() + role.slice(1))
    .join(', ')
}

/**
 * Examples of usage:
 * 
 * const { userProfile } = useAuth()
 * 
 * // Check single role
 * if (isAdmin(userProfile)) {
 *   // Show admin features
 * }
 * 
 * // Check multiple roles
 * if (isDoctorOrAdmin(userProfile)) {
 *   // Show doctor or admin features
 * }
 * 
 * // Check any specific roles
 * if (hasAnyRole(userProfile, ['doctor', 'admin'])) {
 *   // User has at least one of these roles
 * }
 * 
 * // Display roles in UI
 * <span>{getRoleDisplayText(userProfile)}</span>
 * // Output: "Doctor, Admin" or "Receptionist" etc.
 */
