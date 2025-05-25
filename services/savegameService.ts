import { supabase } from './supabaseClient';

export async function saveGame(benutzername: string, genre: string, story: any, history: any) {
  const { error } = await supabase
    .from('spielstaende')
    .upsert({ benutzername, genre, story, history });
  return error;
}

export async function loadGame(benutzername: string) {
  const { data, error } = await supabase
    .from('spielstaende')
    .select('genre, story, history')
    .eq('benutzername', benutzername)
    .single();
  return { data, error };
}
