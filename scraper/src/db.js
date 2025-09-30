import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Save a program to Supabase
 */
export async function saveProgram(programData) {
  const { data, error } = await supabase
    .from('subsidy_programs')
    .insert([{
      title: programData.title,
      url: programData.url,
      foerderart: programData.foerderart,
      foerdergebiet: programData.foerdergebiet,
      foerderbereich: programData.foerderbereich,
      foerderberechtigte: programData.foerderberechtigte,
      foerdergeber: programData.foerdergeber,
      kurztext: programData.kurztext,
      volltext: programData.volltext,
      rechtliche_voraussetzungen: programData.rechtliche_voraussetzungen,
      richtlinie: programData.richtlinie,
      ansprechpartner: programData.ansprechpartner,
      scraped_at: programData.scraped_at
    }])
    .select();

  if (error) {
    throw new Error(`Failed to save program: ${error.message}`);
  }

  return data[0];
}

/**
 * Check if a program URL already exists in database
 */
export async function programExists(url) {
  const { data, error } = await supabase
    .from('subsidy_programs')
    .select('id')
    .eq('url', url)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw new Error(`Failed to check program existence: ${error.message}`);
  }

  return !!data;
}

/**
 * Get count of scraped programs
 */
export async function getScrapedCount() {
  const { count, error } = await supabase
    .from('subsidy_programs')
    .select('*', { count: 'exact', head: true });

  if (error) {
    throw new Error(`Failed to get count: ${error.message}`);
  }

  return count;
}