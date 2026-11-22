export function friendlyError(input: unknown, fallback = 'Something went wrong. Please try again.') {
  const message = input instanceof Error ? input.message : typeof input === 'string' ? input : ''
  const text = message.toLowerCase()
  if (!text.trim()) return fallback
  if (text.includes('invalid login') || text.includes('invalid credentials')) return 'That email or password is not right.'
  if (text.includes('email not confirmed')) return 'Confirm your email, then sign in.'
  if (text.includes('user already registered') || text.includes('already been registered')) return 'An account with that email already exists.'
  if (text.includes('password') && (text.includes('weak') || text.includes('least'))) return 'Use a password of at least 8 characters.'
  if (text.includes('jwt') || text.includes('row-level') || text.includes('permission') || text.includes('not authorized') || text.includes('42501')) return 'You do not have permission to do that.'
  if (text.includes('duplicate') || text.includes('unique') || text.includes('23505')) return 'That is already saved.'
  if (text.includes('network') || text.includes('failed to fetch') || text.includes('timeout') || text.includes('load failed')) return 'The connection failed. Check your internet and try again.'
  if (text.includes('storage') || text.includes('payload too large') || text.includes('mime')) return 'That file could not be uploaded. Try a smaller JPG or PNG.'
  if (
    text.includes('supabase') ||
    text.includes('postgres') ||
    text.includes('pgrst') ||
    text.includes('schema') ||
    text.includes('relation') ||
    text.includes('column') ||
    text.includes('violates') ||
    /[{}[\]]/.test(message) ||
    message.length > 160
  ) {
    return fallback
  }
  return message
}
