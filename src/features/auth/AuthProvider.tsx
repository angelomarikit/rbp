import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { LoadingScreen } from '../../components/ui/LoadingScreen.tsx'
import { friendlyError } from '../../lib/friendlyError.ts'
import { RESELLER_SELECT, type ResellerRecord } from '../reseller/types.ts'
import { supabase, supabaseConfigured } from '../../lib/supabase.ts'

export type AccountRole = 'admin' | 'customer' | 'reseller'

export type Profile = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  role: AccountRole
}

type AuthContextValue = {
  configured: boolean
  loading: boolean
  session: Session | null
  user: User | null
  profile: Profile | null
  reseller: ResellerRecord | null
  profileError: string | null
  refreshProfile: () => Promise<Profile | null>
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null; role: AccountRole | null; resellerStatus: string | null }>
  signUp: (input: {
    fullName: string
    email: string
    password: string
    phone: string
  }) => Promise<{ error: string | null; needsVerification: boolean; role: AccountRole | null }>
  sendPasswordReset: (email: string) => Promise<{ error: string | null }>
  updatePassword: (password: string) => Promise<{ error: string | null }>
  updateEmail: (email: string) => Promise<{ error: string | null }>
  updateProfile: (patch: { fullName: string; phone: string }) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function destinationForRole(role: AccountRole, resellerStatus?: string | null) {
  if (role === 'admin') return '/admin/dashboard'
  if (role === 'reseller') {
    return resellerStatus === 'approved' ? '/reseller/dashboard' : '/reseller/pending'
  }
  return '/account/dashboard'
}

export function accountHomeForUser(profile: Profile | null, reseller: ResellerRecord | null) {
  if (!profile) return '/login'
  return destinationForRole(profile.role, reseller?.status)
}

async function fetchProfile(user: User): Promise<{ profile: Profile | null; error: string | null }> {
  if (!supabase) return { profile: null, error: 'Accounts are not available right now.' }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, role')
    .eq('id', user.id)
    .maybeSingle()

  if (error) return { profile: null, error: friendlyError(error, 'We could not open your account.') }

  if (!data) {
    const { data: created, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        full_name: typeof user.user_metadata.full_name === 'string' ? user.user_metadata.full_name : '',
        phone: typeof user.user_metadata.phone === 'string' ? user.user_metadata.phone : null,
        role: 'customer',
      })
      .select('id, full_name, email, phone, role')
      .single()
    if (insertError) {
      return {
        profile: null,
        error: 'We could not open your account. Please sign in again.',
      }
    }
    return { profile: created as Profile, error: null }
  }

  const profile = data as Profile
  if (user.email && profile.email !== user.email) {
    const { error: emailError } = await supabase.from('profiles').update({ email: user.email }).eq('id', user.id)
    if (!emailError) profile.email = user.email
  }
  return { profile, error: null }
}

async function fetchReseller(userId: string): Promise<ResellerRecord | null> {
  if (!supabase) return null
  const { data } = await supabase
    .from('resellers')
    .select(RESELLER_SELECT)
    .eq('profile_id', userId)
    .maybeSingle()
  return (data as ResellerRecord | null) ?? null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [reseller, setReseller] = useState<ResellerRecord | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [loading, setLoading] = useState(supabaseConfigured)
  const [signingOut, setSigningOut] = useState(false)

  const applyUser = useCallback(async (user: User | null) => {
    if (!user) {
      setProfile(null)
      setReseller(null)
      setProfileError(null)
      return null
    }
    const result = await fetchProfile(user)
    setProfile(result.profile)
    setProfileError(result.error)
    if (result.profile?.role === 'reseller') {
      setReseller(await fetchReseller(user.id))
    } else {
      setReseller(null)
    }
    return result.profile
  }, [])

  useEffect(() => {
    if (!supabase) return

    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      void applyUser(data.session?.user ?? null).finally(() => {
        if (active) setLoading(false)
      })
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      void applyUser(next?.user ?? null).finally(() => setLoading(false))
    })

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [applyUser])

  const refreshProfile = useCallback(async () => {
    return applyUser(session?.user ?? null)
  }, [applyUser, session?.user])

  const value = useMemo<AuthContextValue>(
    () => ({
      configured: supabaseConfigured,
      loading,
      session,
      user: session?.user ?? null,
      profile,
      reseller,
      profileError,
      refreshProfile,
      async signIn(email, password) {
        if (!supabase) return { error: 'Sign-in is not available right now.', role: null, resellerStatus: null }
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (error || !data.user) {
          return { error: friendlyError(error, 'Sign in failed. Check the email and password.'), role: null, resellerStatus: null }
        }
        const next = await applyUser(data.user)
        const resellerStatus =
          next?.role === 'reseller' && data.user ? ((await fetchReseller(data.user.id))?.status ?? null) : null
        return {
          error: next ? null : 'Signed in, but the account could not be opened.',
          role: next?.role ?? null,
          resellerStatus,
        }
      },
      async signUp(input) {
        if (!supabase) return { error: 'Registration is not available right now.', needsVerification: false, role: null }
        const { data, error } = await supabase.auth.signUp({
          email: input.email.trim(),
          password: input.password,
          options: {
            data: { full_name: input.fullName.trim(), phone: input.phone.trim() },
            emailRedirectTo: `${window.location.origin}/login`,
          },
        })
        if (error || !data.user) {
          return { error: friendlyError(error, 'The account could not be created.'), needsVerification: false, role: null }
        }
        if (!data.session) return { error: null, needsVerification: true, role: null }
        const next = await applyUser(data.user)
        return { error: next ? null : 'The account was created, but it could not be opened.', needsVerification: false, role: next?.role ?? null }
      },
      async sendPasswordReset(email) {
        if (!supabase) return { error: 'Accounts are not available right now.' }
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        return { error: error ? friendlyError(error, 'The reset email could not be sent.') : null }
      },
      async updatePassword(password) {
        if (!supabase) return { error: 'Accounts are not available right now.' }
        const { error } = await supabase.auth.updateUser({ password })
        return { error: error ? friendlyError(error, 'The password could not be updated.') : null }
      },
      async updateEmail(email) {
        if (!supabase) return { error: 'Accounts are not available right now.' }
        const { error } = await supabase.auth.updateUser(
          { email: email.trim() },
          { emailRedirectTo: `${window.location.origin}/account/settings` },
        )
        return { error: error ? friendlyError(error, 'The email could not be updated.') : null }
      },
      async updateProfile(patch) {
        if (!supabase || !session?.user) return { error: 'Sign in to update your profile.' }
        const { error } = await supabase
          .from('profiles')
          .update({ full_name: patch.fullName.trim(), phone: patch.phone.trim() })
          .eq('id', session.user.id)
        if (error) return { error: friendlyError(error, 'The profile could not be saved.') }
        await supabase.auth.updateUser({
          data: { full_name: patch.fullName.trim(), phone: patch.phone.trim() },
        })
        await applyUser(session.user)
        return { error: null }
      },
      async signOut() {
        setSigningOut(true)
        setSession(null)
        setProfile(null)
        setReseller(null)
        try {
          if (supabase) await supabase.auth.signOut({ scope: 'local' })
        } catch {
          /* The local session is already cleared. */
        }
        window.location.replace('/')
      },
    }),
    [applyUser, loading, profile, reseller, profileError, refreshProfile, session],
  )

  return (
    <AuthContext.Provider value={value}>
      {signingOut ? <LoadingScreen label="Signing out" full /> : null}
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used within AuthProvider')
  return value
}
