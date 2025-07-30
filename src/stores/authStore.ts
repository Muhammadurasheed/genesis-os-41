
import { create } from 'zustand';
import { supabase } from '../integrations/supabase/client';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  loading: boolean; // Added for compatibility
  isAuthenticated: boolean;
  emailConfirmationRequired: boolean;
  rateLimitRemaining: number;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error?: any }>;
  handleAuthCallback: () => Promise<void>;
  checkAuth: () => Promise<void>;
  initialize: () => Promise<void>;
  resendConfirmation: (email: string) => Promise<{ error?: any }>;
  clearEmailConfirmationState: () => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
      user: null,
      isLoading: false,
      loading: false,
      isAuthenticated: false,
      emailConfirmationRequired: false,
      rateLimitRemaining: 0,

      initialize: async () => {
        set({ isLoading: true, loading: true });
        try {
          // Get current session
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            set({
              user: {
                id: session.user.id,
                email: session.user.email!,
                name: session.user.user_metadata?.name || session.user.email!,
                avatar: session.user.user_metadata?.avatar_url,
              },
              isAuthenticated: true,
            });
          }

          // Set up auth state listener
          supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
              set({
                user: {
                  id: session.user.id,
                  email: session.user.email!,
                  name: session.user.user_metadata?.name || session.user.email!,
                  avatar: session.user.user_metadata?.avatar_url,
                },
                isAuthenticated: true,
                emailConfirmationRequired: false,
              });
            } else if (event === 'SIGNED_OUT') {
              set({
                user: null,
                isAuthenticated: false,
                emailConfirmationRequired: false,
              });
            }
          });
        } catch (error) {
          console.error('Initialize auth error:', error);
        } finally {
          set({ isLoading: false, loading: false });
        }
      },

      signIn: async (email: string, password: string) => {
        set({ isLoading: true, loading: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (error) {
            return { error };
          }
          
          if (data.user) {
            set({
              user: {
                id: data.user.id,
                email: data.user.email!,
                name: data.user.user_metadata?.name || data.user.email!,
                avatar: data.user.user_metadata?.avatar_url,
              },
              isAuthenticated: true,
            });
          }
          
          return {};
        } catch (error) {
          console.error('Sign in error:', error);
          return { error };
        } finally {
          set({ isLoading: false, loading: false });
        }
      },

      signUp: async (email: string, password: string, name: string) => {
        set({ isLoading: true, loading: true });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name,
              },
            },
          });
          
          if (error) {
            return { error };
          }
          
          if (data.user && !data.user.email_confirmed_at) {
            set({ emailConfirmationRequired: true });
          } else if (data.user) {
            set({
              user: {
                id: data.user.id,
                email: data.user.email!,
                name: name,
                avatar: data.user.user_metadata?.avatar_url,
              },
              isAuthenticated: true,
            });
          }
          
          return {};
        } catch (error) {
          console.error('Sign up error:', error);
          return { error };
        } finally {
          set({ isLoading: false, loading: false });
        }
      },

      signOut: async () => {
        set({ isLoading: true, loading: true });
        try {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
          
          set({
            user: null,
            isAuthenticated: false,
          });
        } catch (error) {
          console.error('Sign out error:', error);
        } finally {
          set({ isLoading: false, loading: false });
        }
      },

      signInWithGoogle: async () => {
        set({ isLoading: true, loading: true });
        try {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: `${window.location.origin}/auth/callback`,
            },
          });
          
          if (error) {
            return { error };
          }
          
          return {};
        } catch (error) {
          console.error('Google sign in error:', error);
          return { error };
        } finally {
          set({ isLoading: false, loading: false });
        }
      },

      handleAuthCallback: async () => {
        set({ isLoading: true, loading: true });
        try {
          const { data, error } = await supabase.auth.getSession();
          
          if (error) throw error;
          
          if (data.session?.user) {
            const user = data.session.user;
            set({
              user: {
                id: user.id,
                email: user.email!,
                name: user.user_metadata?.name || user.email!,
                avatar: user.user_metadata?.avatar_url,
              },
              isAuthenticated: true,
            });
          }
        } catch (error) {
          console.error('Auth callback error:', error);
          throw error;
        } finally {
          set({ isLoading: false, loading: false });
        }
      },

      checkAuth: async () => {
        set({ isLoading: true, loading: true });
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            set({
              user: {
                id: session.user.id,
                email: session.user.email!,
                name: session.user.user_metadata?.name || session.user.email!,
                avatar: session.user.user_metadata?.avatar_url,
              },
              isAuthenticated: true,
            });
          }
        } catch (error) {
          console.error('Check auth error:', error);
        } finally {
          set({ isLoading: false, loading: false });
        }
      },

      resendConfirmation: async (email: string) => {
        set({ isLoading: true, loading: true });
        try {
          const { error } = await supabase.auth.resend({
            type: 'signup',
            email,
          });
          
          if (error) {
            return { error };
          }
          
          set({ rateLimitRemaining: 60 });
          
          // Start countdown
          const countdown = setInterval(() => {
            const { rateLimitRemaining } = get();
            if (rateLimitRemaining <= 1) {
              clearInterval(countdown);
              set({ rateLimitRemaining: 0 });
            } else {
              set({ rateLimitRemaining: rateLimitRemaining - 1 });
            }
          }, 1000);
          
          return {};
        } catch (error) {
          console.error('Resend confirmation error:', error);
          return { error };
        } finally {
          set({ isLoading: false, loading: false });
        }
      },

      clearEmailConfirmationState: () => {
        set({ emailConfirmationRequired: false, rateLimitRemaining: 0 });
      },
    }));
