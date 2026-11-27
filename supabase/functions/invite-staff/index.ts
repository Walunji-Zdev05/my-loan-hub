import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const allowedOrigins = (Deno.env.get('APP_ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

function corsHeaders(origin: string | null): HeadersInit {
  const allowed = origin && allowedOrigins.includes(origin);
  return {
    ...(allowed ? { 'Access-Control-Allow-Origin': origin } : {}),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  headers: HeadersInit,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

const staffRoles = new Set(['admin', 'approver', 'loan_officer']);

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin');
  const headers = corsHeaders(origin);

  if (origin && !allowedOrigins.includes(origin)) {
    return jsonResponse({ error: 'Origin is not allowed.' }, 403, headers);
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405, headers);
  }

  const authorization = req.headers.get('Authorization');
  const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!accessToken) {
    return jsonResponse({ error: 'Authentication is required.' }, 401, headers);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey || allowedOrigins.length === 0) {
    console.error('Staff invitation function is missing required environment configuration.');
    return jsonResponse({ error: 'Staff invitations are not configured.' }, 503, headers);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // Verify the caller's JWT with Auth; never trust a role supplied by the browser.
    const { data: authData, error: authError } = await adminClient.auth.getUser(accessToken);

    if (authError || !authData.user) {
      return jsonResponse({ error: 'Your session is invalid or expired.' }, 401, headers);
    }

    const { data: callerRole, error: roleError } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', authData.user.id)
      .maybeSingle();

    if (roleError) {
      console.error('Unable to verify inviter role:', roleError);
      return jsonResponse({ error: 'Unable to verify staff permissions.' }, 500, headers);
    }

    if (callerRole?.role !== 'admin') {
      return jsonResponse({ error: 'Only Admins can invite staff.' }, 403, headers);
    }

    let payload: { email?: unknown; role?: unknown };

    try {
      payload = await req.json();
    } catch {
      return jsonResponse({ error: 'A valid JSON request body is required.' }, 400, headers);
    }

    const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
    const role = typeof payload.role === 'string' ? payload.role : '';

    if (
      !email ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return jsonResponse({ error: 'Enter a valid email address.' }, 400, headers);
    }

    if (!staffRoles.has(role)) {
      return jsonResponse({ error: 'Select a valid staff role.' }, 400, headers);
    }

    if (!origin) {
      return jsonResponse({ error: 'The application origin could not be verified.' }, 400, headers);
    }

    const { data: invitation, error: invitationError } =
      await adminClient.auth.admin.inviteUserByEmail(email, {
        redirectTo: new URL('/login', origin).toString(),
      });

    if (invitationError || !invitation.user) {
      console.error('Staff invitation failed:', invitationError);
      return jsonResponse(
        { error: 'The invitation could not be sent. The email may already belong to an account.' },
        400,
        headers,
      );
    }

    const { error: insertRoleError } = await adminClient
      .from('user_roles')
      .insert({ user_id: invitation.user.id, role });

    if (insertRoleError) {
      console.error('Unable to assign invited staff role:', insertRoleError);

      // Avoid leaving an Auth account that has no corresponding staff role.
      const { error: rollbackError } = await adminClient.auth.admin.deleteUser(invitation.user.id);
      if (rollbackError) {
        console.error('Unable to roll back incomplete staff invitation:', rollbackError);
      }

      return jsonResponse(
        { error: 'The invitation could not be completed. No staff access was granted.' },
        500,
        headers,
      );
    }

    return jsonResponse(
      { success: true, message: 'Staff invitation sent.', email, role },
      201,
      headers,
    );
  } catch (error) {
    console.error('Unexpected staff invitation error:', error);
    return jsonResponse({ error: 'An unexpected error occurred.' }, 500, headers);
  }
});
