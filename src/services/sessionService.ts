import { Session } from '../types';
import { supabase } from '../config/supabase';
import { PostgrestError } from '@supabase/supabase-js';

// Helper para converter dados do Supabase para o tipo Session do frontend
// Lida especialmente com a conversão de strings de data para objetos Date
const mapSupabaseToFrontendSession = (supabaseSession: any): Session => {
  return {
    ...supabaseSession,
    start_datetime: new Date(supabaseSession.start_datetime),
    end_datetime: new Date(supabaseSession.end_datetime),
    created_at: new Date(supabaseSession.created_at),
    // killed_monsters e looted_items já devem vir como JSONB/objetos
  };
};

class SessionService {
  // private readonly STORAGE_KEY = 'tibia_sessions'; // Não mais necessário

  // private generateId(): string { // O ID será gerado pelo Supabase (uuid)
  //   return Math.random().toString(36).substr(2, 9);
  // }

  async getAllSessions(): Promise<Session[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('[SessionService] getAllSessions: No user logged in');
      return [];
    }

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('start_datetime', { ascending: false });

    if (error) {
      console.error('[SessionService] Error fetching sessions:', error);
      return [];
    }
    return data ? data.map(mapSupabaseToFrontendSession) : [];
  }

  async getSessionsByDate(date: Date): Promise<Session[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('start_datetime', startDate.toISOString())
      .lt('start_datetime', endDate.toISOString())
      .order('start_datetime', { ascending: false });

    if (error) {
      console.error('[SessionService] Error fetching sessions by date:', error);
      return [];
    }
    return data ? data.map(mapSupabaseToFrontendSession) : [];
  }

  async addSession(sessionData: Omit<Session, 'id' | 'user_id' | 'created_at'>): Promise<Session | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('[SessionService] addSession: User not logged in');
      throw new Error('Usuário não autenticado. Não é possível adicionar sessão.');
    }

    const sessionToInsert = {
      ...sessionData,
      user_id: user.id,
      // id é gerado pelo Supabase
      // created_at é gerado pelo Supabase (default now())
    };

    // Certifique-se de que as datas estão no formato ISO para o Supabase
    // Se sessionData já tiver objetos Date, o Supabase client geralmente lida bem.
    // Caso contrário, formate para ISO string aqui.
    // Exemplo, se start_datetime e end_datetime forem strings:
    // sessionToInsert.start_datetime = new Date(sessionData.start_datetime).toISOString();
    // sessionToInsert.end_datetime = new Date(sessionData.end_datetime).toISOString();


    const { data, error }: { data: Session[] | null, error: PostgrestError | null } = await supabase
      .from('sessions')
      .insert([sessionToInsert])
      .select();

    if (error) {
      console.error('[SessionService] Error adding session:', error);
      throw error;
    }

    if (data && data.length > 0) {
      // A data retornada já deve ter o id e created_at do banco
      return mapSupabaseToFrontendSession(data[0]);
    }
    return null;
  }

  async getSessionById(id: string): Promise<Session | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('id', id)
      .single(); // Espera um único resultado

    if (error) {
      console.error('[SessionService] Error fetching session by ID:', error);
      return null;
    }
    return data ? mapSupabaseToFrontendSession(data) : null;
  }

  async deleteSession(id: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('[SessionService] deleteSession: User not logged in');
      return false;
    }

    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('user_id', user.id) // Garante que o usuário só pode deletar suas próprias sessões (RLS também protege)
      .eq('id', id);

    if (error) {
      console.error('[SessionService] Error deleting session:', error);
      return false;
    }
    return true; // Supabase delete não retorna dados por padrão, sucesso se não houver erro.
  }
}

export const sessionService = new SessionService(); 