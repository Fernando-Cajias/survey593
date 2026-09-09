import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from './Sidebar';

export const Layout = ({ allowedRoles }) => {
  const { currentUser, isAuthenticated, loading } = useAuth();

  // 1. Si el contexto todavía está validando la sesión en Supabase, mostramos pantalla de carga.
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1121] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm">Cargando sesión...</p>
        </div>
      </div>
    );
  }

  // 2. Si ya terminó de cargar y definitivamente NO está autenticado -> al Login
  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  // 3. Si no tiene el rol permitido para esta sección -> redirigir a su Dashboard correspondiente
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    const defaultRoute =
      currentUser.role === 'provider'
        ? '/provider'
        : currentUser.role === 'admin'
        ? '/admin'
        : '/doer';
    return <Navigate to={defaultRoute} replace />;
  }

  // 4. Sesión y rol válidos -> Renderizar vista
  return (
    <div className="min-h-screen bg-[#0B1121] flex">
      <Sidebar />
      <main className="ml-64 flex-1 p-8 overflow-y-auto min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};