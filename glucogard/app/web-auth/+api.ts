import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, email, password } = body;

    switch (action) {
      case 'login':
        return await handleLogin(email, password);
      case 'logout':
        return await handleLogout();
      case 'verify':
        return await verifySession();
      default:
        return new Response('Invalid action', { status: 400 });
    }
  } catch (error) {
    console.error('Web auth API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

async function handleLogin(email: string, password: string) {
  if (!email || !password) {
    return Response.json({ error: 'Email and password required' }, { status: 400 });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 401 });
  }

  // Verify user is a doctor
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', data.user.id)
    .single();

  if (!profile || profile.role !== 'doctor') {
    await supabase.auth.signOut();
    return Response.json({ error: 'Access denied. Healthcare provider access only.' }, { status: 403 });
  }

  return Response.json({
    user: {
      id: data.user.id,
      email: data.user.email,
      role: profile.role,
    },
    session: data.session,
  });
}

async function handleLogout() {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ success: true });
}

async function verifySession() {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return Response.json({ error: 'No active session' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('user_id', user.id)
    .single();

  if (!profile || profile.role !== 'doctor') {
    return Response.json({ error: 'Access denied' }, { status: 403 });
  }

  return Response.json({
    user: {
      id: user.id,
      email: user.email,
      role: profile.role,
      full_name: profile.full_name,
    },
  });
}