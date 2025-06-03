import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../config/supabase';
import { AuthContextType, User } from '../types/auth';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const convertSupabaseUser = async (supabaseUser: SupabaseUser | null): Promise<User | null> => {
  if (!supabaseUser) {
    console.log('👤 Nenhum usuário Supabase para converter');
    return null;
  }

  console.log('🔄 Convertendo usuário Supabase:', supabaseUser.id);

  try {
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('id', supabaseUser.id)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Erro ao verificar usuário existente:', checkError);
      throw checkError;
    }

    if (!existingUser) {
      console.log('➕ Criando novo registro de usuário...');
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{
          id: supabaseUser.id,
          email: supabaseUser.email,
          is_admin: false,
          is_active: true,
          character_name: null
        }])
        .select()
        .single();

      if (createError) {
        console.error('❌ Erro ao criar usuário:', createError);
        throw createError;
      }
      console.log('✅ Novo usuário criado com sucesso:', newUser);
      return {
        id: supabaseUser.id,
        email: supabaseUser.email,
        character_name: null,
        is_admin: false,
        is_active: true,
        created_at: newUser.created_at,
        updated_at: newUser.updated_at,
      };
    }
    console.log('✅ Usando dados do usuário existente:', existingUser);
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      character_name: existingUser.character_name,
      is_admin: existingUser.is_admin,
      is_active: existingUser.is_active,
      created_at: existingUser.created_at,
      updated_at: existingUser.updated_at,
    };
  } catch (error) {
    console.error('❌ Erro em convertSupabaseUser:', error);
    throw error;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoadingState] = useState(true);
  const [error, setErrorState] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const setUser = (newUser: User | null) => {
    console.log(' L setUser called:', newUser ? { id: newUser.id, email: newUser.email } : null);
    setUserState(newUser);
  };
  const setLoading = (newLoading: boolean) => {
    console.log(` L setLoading called: ${newLoading}`);
    setLoadingState(newLoading);
  };
  const setError = (newError: string | null) => {
    console.log(` L setError called: ${newError}`);
    setErrorState(newError);
  };

  const handleAuthStateChange = useCallback(async (session: Session | null, source: string) => {
    console.log(`🔄 [${source}] Handling auth state change. Session:`, session ? session.user?.id : 'No session');

    if (!mountedRef.current) {
      console.log(`🛑 [${source}] mountedRef is false, aborting handleAuthStateChange.`);
      return;
    }

    try {
      const convertedUser = await convertSupabaseUser(session?.user ?? null);
      if (mountedRef.current) {
        console.log(`✅ [${source}] User converted:`, convertedUser ? { id: convertedUser.id, email: convertedUser.email } : null);
        setUser(convertedUser);
        setError(null);
        console.log(`✅ [${source}] State updated. User: ${!!convertedUser}, Error: null`);
      } else {
        console.log(`🛑 [${source}] mountedRef became false during conversion.`);
      }
    } catch (err) {
      console.error(`❌ [${source}] Error in handleAuthStateChange (during convertSupabaseUser):`, err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Erro ao processar usuário');
        setUser(null);
        console.log(`❌ [${source}] State updated with error. User: null, Error: ${err instanceof Error ? err.message : 'Erro ao processar usuário'}`);
      } else {
        console.log(`🛑 [${source}] mountedRef became false during error handling.`);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        console.log(`🏁 [${source}] handleAuthStateChange finished. Loading: false. mountedRef: ${mountedRef.current}`);
      } else {
        console.log(`🏁 [${source}] handleAuthStateChange finished, but component unmounted. Would have set Loading: false. mountedRef: ${mountedRef.current}`);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    console.log(`🚀 AuthProvider Mounted/Effect Ran. mountedRef: ${mountedRef.current}`);
    setLoading(true);

    const initializeAuth = async () => {
      console.log('🌟 Initializing Auth...');
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('❌ Error in getSession during initializeAuth:', sessionError);
          if (mountedRef.current) {
            setError(sessionError.message);
            setUser(null);
            setLoading(false);
          }
          return;
        }
        console.log('🌟 Session from getSession (initializeAuth):', session ? session.user?.id : 'No session');
        await handleAuthStateChange(session, 'initializeAuth');
      } catch (err) {
        console.error('❌ Error during initializeAuth catch block:', err);
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Erro crítico ao inicializar autenticação');
          setUser(null);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log(`🎧 AuthStateChanged Event: ${_event}, Session User:`, session?.user?.id ?? 'None');
      if (!mountedRef.current) {
        console.log('🛑 AuthProvider unmounted (or effect re-ran and this is old sub), skipping onAuthStateChange handler.');
        return;
      }
      await handleAuthStateChange(session, `onAuthStateChange (${_event})`);
    });

    return () => {
      console.log(`🧹 AuthProvider Cleanup (Effect Unmount/Re-run). mountedRef will be set to false.`);
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [handleAuthStateChange]);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      console.log('🔑 Tentando login:', email);
      const response = await supabase.auth.signInWithPassword({ email, password });
      if (response.error) {
        console.error('❌ Erro no login:', response.error);
        setError(response.error.message === 'Invalid login credentials' 
          ? 'Email ou senha incorretos' 
          : `Erro ao fazer login: ${response.error.message}`);
        setLoading(false);
        throw response.error;
      }
      if (!response.data.user) {
        const msg = 'Nenhum dado de usuário retornado';
        console.error('❌', msg);
        setError(msg);
        setLoading(false);
        throw new Error(msg);
      }
      console.log('✅ Login bem-sucedido:', response.data.user.id);
      return response;
    } catch (err) {
      console.error('❌ Erro na função de login (catch geral):', err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Erro ao fazer login');
        setLoading(false);
      }
      throw err;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      await supabase.auth.signUp({ email, password });
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'An error occurred during sign up');
        setLoading(false);
      }
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      setLoading(true);
      await supabase.auth.signOut();
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'An error occurred during sign out');
        setLoading(false);
      }
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      setLoading(true);
      await supabase.auth.resetPasswordForEmail(email);
      setLoading(false);
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'An error occurred during password reset');
        setLoading(false);
      }
      throw err;
    }
  };

  const updateUser = async (data: Partial<User>) => {
    try {
      setError(null);
      if (!user) throw new Error('No user logged in');
      const { error: updateError } = await supabase
        .from('users')
        .update(data)
        .eq('id', user.id);
      if (updateError) throw updateError;
      setUserState(prev => prev ? { ...prev, ...data } : null);
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'An error occurred while updating user');
      }
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export default AuthContext; 