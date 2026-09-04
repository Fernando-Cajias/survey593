import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar información del usuario y su rol desde la base de datos de Supabase
  const fetchUserProfile = async (sessionUser) => {
    if (!sessionUser) {
      setCurrentUser(null);
      setLoading(false);
      return;
    }

    try {
      // Intentar obtener el rol y datos desde la tabla 'profiles'
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionUser.id)
        .single();

      // Determinar rol (prioridad: tabla profiles -> user_metadata -> 'doer' por defecto)
      const userRole = profile?.role || sessionUser.user_metadata?.role || 'doer';

      setCurrentUser({
        id: sessionUser.id,
        email: sessionUser.email,
        role: userRole,
        ...profile,
      });
    } catch (error) {
      console.error('Error al cargar perfil de usuario:', error);
      setCurrentUser({
        id: sessionUser.id,
        email: sessionUser.email,
        role: sessionUser.user_metadata?.role || 'doer',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Obtener la sesión activa de Supabase al iniciar la app
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchUserProfile(session?.user || null);
    });

    // 2. Escuchar cambios de sesión en tiempo real (login, logout, refresco)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user);
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Función de logout conectada a Supabase
  const logout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setCurrentUser(null);
    setLoading(false);
  };

  // Función para actualizar datos de perfil
  const updateProfile = async (updates) => {
    if (!currentUser) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: currentUser.id, ...updates });

      if (!error) {
        setCurrentUser((prev) => ({ ...prev, ...updates }));
      }
    } catch (err) {
      console.error('Error al actualizar perfil:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isAuthenticated: Boolean(currentUser),
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};