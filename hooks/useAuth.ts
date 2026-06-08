import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data);
    setLoading(false);
  }

  async function updateProfile(updates: Partial<UserProfile>) {
    if (!session) return null;
    const { data } = await supabase
      .from('users')
      .update(updates)
      .eq('id', session.user.id)
      .select()
      .single();
    if (data) setProfile(data);
    return data;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  const isGuest = session?.user?.is_anonymous === true;

  return { session, profile, loading, isGuest, updateProfile, signOut };
}
