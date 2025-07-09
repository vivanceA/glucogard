import { supabase } from './supabase';
import type { Database } from '@/types/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'patient' | 'doctor';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
}

export async function signUp(email: string, password: string, fullName: string, role: UserRole) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: role,
      }
    }
  });

  if (authError) {
    throw authError;
  }

  // The database trigger 'on_auth_user_created' will now handle
  // creating records in 'profiles' and the role-specific table ('patients' or 'doctors').

  return authData;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
  
  // Clear any stored data in AsyncStorage
  try {
    await AsyncStorage.removeItem('selectedRole');
    await AsyncStorage.removeItem('hasSeenOnboarding');
    await AsyncStorage.removeItem('hasSeenDashboard');
  } catch (e) {
    console.error('Error clearing AsyncStorage during sign out:', e);
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  console.log('[getCurrentUser] Attempting to get user session...');
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

  if (authError) {
    if (authError.message === 'Auth session missing!') {
      console.log('[getCurrentUser] No active session found - user is not authenticated.');
    } else {
      console.error('[getCurrentUser] Error getting auth user:', authError.message);
    }
    return null;
  }

  if (!authUser) {
    console.log('[getCurrentUser] No authenticated user found in session.');
    return null;
  }

  console.log(`[getCurrentUser] Auth user found: ID=${authUser.id}, Email=${authUser.email}`);

  console.log(`[getCurrentUser] Attempting to fetch profile for user ID: ${authUser.id}`);
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('user_id', authUser.id)
    .single();

  if (profileError) {
    console.error(`[getCurrentUser] Error fetching profile for user ID ${authUser.id}:`, profileError.message);
    // Do not return null immediately if it's a 'PGRST116' (0 rows) error,
    // as that's handled by the !profile check.
    // For other errors, it might be appropriate to return null.
    if (profileError.code !== 'PGRST116') { // PGRST116: "The result contains 0 rows"
        return null;
    }
  }

  if (!profile) {
    console.log(`[getCurrentUser] No profile found for user ID: ${authUser.id}. This will result in a null user object.`);
    return null;
  }

  console.log(`[getCurrentUser] Profile found for user ID ${authUser.id}:`, profile);

  const resultUser: AuthUser = {
    id: authUser.id,
    email: authUser.email!,
    role: profile.role,
    full_name: profile.full_name,
  };
  console.log('[getCurrentUser] Successfully constructed AuthUser object:', resultUser);
  return resultUser;
}