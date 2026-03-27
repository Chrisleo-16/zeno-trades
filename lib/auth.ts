import { createClient } from '@/lib/client'

export interface AuthUser {
  id: string
  email: string
  name: string
}

const supabase = createClient()

let _user: AuthUser | null = null

// Initialize current user from session
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session?.user) {
    _user = {
      id: session.user.id,
      email: session.user.email ?? '',
      name: session.user.user_metadata?.name ?? session.user.email?.split('@')[0] ?? '',
    }
  }
})

// Listen for auth changes
supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.user) {
    _user = {
      id: session.user.id,
      email: session.user.email ?? '',
      name: session.user.user_metadata?.name ?? session.user.email?.split('@')[0] ?? '',
    }
  } else {
    _user = null
  }
})

export const authStore = {
  getCurrentUser: (): AuthUser | null => {
    return _user
  },

  isAuthenticated: (): boolean => {
    return _user !== null
  },

  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    if (data.user) {
      _user = {
        id: data.user.id,
        email: data.user.email ?? '',
        name: data.user.user_metadata?.name ?? data.user.email?.split('@')[0] ?? '',
      }
    }
    return _user
  },

  async register(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    })
    if (error) throw error
    if (data.user) {
      _user = {
        id: data.user.id,
        email: data.user.email ?? '',
        name: data.user.user_metadata?.name ?? data.user.email?.split('@')[0] ?? '',
      }
    }
    return _user
  },

  async logout() {
    await supabase.auth.signOut()
    _user = null
  },
}
