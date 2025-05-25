import { supabase } from './supabaseClient';

export async function saveGame(benutzername: string, genre: string, story: any, history: any) {
  // Upsert für Kombination aus benutzername + genre
  const { error } = await supabase
    .from('spielstaende')
    .upsert({ benutzername, genre, story, history });
  return error;
}

export async function loadGame(benutzername: string, genre: string) {
  // Select für Kombination aus benutzername + genre
  const { data, error } = await supabase
    .from('spielstaende')
    .select('genre, story, history')
    .eq('benutzername', benutzername)
    .eq('genre', genre)
    .single();
  return { data, error };
}
