// src/services/functions.ts
//
// supabase.functions.invoke automatically attaches the current session's
// access token as the Authorization header when one exists, and falls back
// to the anon key otherwise — which is exactly what we want: guest-facing
// functions (create-order, verify-payment) work with no session, and
// admin-only functions (create-staff, manage-staff) get the logged-in
// admin's JWT for free as long as this is called after sign-in.

import { supabase } from '@/lib/supabase'

export class FunctionCallError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'FunctionCallError'
    this.status = status
  }
}

export async function callFunction<TResponse = unknown>(
  name: string,
  body: Record<string, unknown>,
): Promise<TResponse> {
  const { data, error } = await supabase.functions.invoke(name, { body })

  if (error) {
    // supabase-js surfaces non-2xx responses as a generic FunctionsHttpError;
    // the actual `{ error: string }` body we return from our functions is on
    // error.context, when present.
    const context = (error as { context?: { json?: () => Promise<{ error?: string }> } }).context
    if (context?.json) {
      try {
        const parsed = await context.json()
        throw new FunctionCallError(parsed?.error ?? error.message)
      } catch {
        // fall through to generic message below
      }
    }
    throw new FunctionCallError(error.message)
  }

  return data as TResponse
}
