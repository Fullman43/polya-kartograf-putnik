import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { toast } from "@/hooks/use-toast";

export const useAuth = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      // Всегда очищаем локальное состояние и перенаправляем, даже если есть ошибка
      await supabase.auth.signOut();
      
      // Очищаем локальное состояние
      setSession(null);
      setUser(null);
      
      toast({
        title: "Выход выполнен",
        description: "Вы успешно вышли из аккаунта",
      });
      
      navigate("/auth");
    } catch (error) {
      // Даже при ошибке очищаем состояние и перенаправляем
      console.error("Ошибка при выходе:", error);
      setSession(null);
      setUser(null);
      navigate("/auth");
    }
  };

  return {
    user,
    session,
    loading,
    signOut,
  };
};
