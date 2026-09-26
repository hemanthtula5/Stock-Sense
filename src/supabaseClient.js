import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pztittwqbhsrvbojwoij.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6dGl0dHdxYmhzcnZib2p3b2lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzODQ2MzIsImV4cCI6MjEwNTk2MDYzMn0.V87rEJfVoIezxo5WFK9PDlmVFqFLoftbdw2tgrFkj2c';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
