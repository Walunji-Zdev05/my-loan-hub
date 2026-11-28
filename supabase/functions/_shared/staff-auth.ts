import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface RequestCors {
  origin: string | null;
  headers: Record<string, string>;
}

export function getRequestCors(req: Request): RequestCors | null {
  const origin = req.headers.get('Origin');
  const headers: Record<string, string> = {
    ...corsHeaders,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    Vary: 'Origin',
  };

  if (!origin) {
    return { origin: null, headers };
  }

  const allowedOrigins = (Deno.env.get('APP_ALLOWED_ORIGINS') || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (!allowedOrigins.includes(origin)) {
    return null;
  }

  return {
    origin,
    headers: {
      ...headers,
      'Access-Control-Allow-Origin': origin,
    },
  };
}

export function jsonResponse(
  body: unknown,
  status: number,
  headers: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

export function errorResponse(error: unknown, headers: Record<string, string>): Response {
  if (error instanceof HttpError) {
    return jsonResponse({ error: error.message }, error.status, headers);
  }

  console.error('Unexpected staff function error:', error instanceof Error ? error.message : 'Unknown error');
  return jsonResponse({ error: 'Internal server error' }, 500, headers);
}

export async function requireAdmin(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new HttpError(401, 'A valid staff session is required.');
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    throw new HttpError(500, 'Staff authentication is not configured.');
  }

  const token = authHeader.slice('Bearer '.length);
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token);
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    throw new HttpError(401, 'A valid staff session is required.');
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: adminRole, error: roleError } = await adminClient
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();

  if (roleError) {
    throw new HttpError(500, 'Staff permissions could not be verified.');
  }

  if (!adminRole) {
    throw new HttpError(403, 'Admin access is required.');
  }

  return { adminClient, userId };
}
