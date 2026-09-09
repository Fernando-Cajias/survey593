import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabaseClient'
import { Eye, EyeOff } from 'lucide-react'

export default function Login({ onSwitchToRegister, onForgotPassword, expectedRole = 'provider' }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Map de traducción extendido para capturar errores de Supabase
  const translateError = (errorMsg) => {
    if (!errorMsg) return ''
    const msg = errorMsg.toLowerCase()

    if (msg.includes('invalid login credentials')) {
      return 'Correo o contraseña incorrectos.'
    }
    if (msg.includes('email not confirmed')) {
      return 'El correo electrónico aún no ha sido confirmado en el sistema.'
    }
    if (msg.includes('too many requests') || msg.includes('rate limit')) {
      return 'Demasiados intentos fallidos. Por favor, espera unos minutos e intenta de nuevo.'
    }
    if (msg.includes('network error') || msg.includes('failed to fetch')) {
      return 'Error de conexión. Verifica tu acceso a internet.'
    }
    return 'Ocurrió un error al intentar iniciar sesión. Inténtalo nuevamente.'
  }

  // --- NUEVA FUNCIÓN: Inicio de Sesión con Google OAuth ---
  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setErrorMsg('')

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin, // Redirige a la URL base de tu app tras autenticar
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        setErrorMsg('Error al conectar con Google. Verifica que el proveedor esté habilitado.')
      }
    } catch (err) {
      setErrorMsg('Ocurrió un error inesperado con la autenticación de Google.')
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      // 1. Autenticar con Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setErrorMsg(translateError(authError.message))
        setLoading(false)
        return
      }

      const userId = authData.user?.id

      if (!userId) {
        setErrorMsg('No se pudo obtener la información del usuario.')
        setLoading(false)
        return
      }

      // 2. Consultar el rol del usuario en la base de datos
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId) 
        .single()

      // Determinar rol del usuario logueado
      const role = profileData?.role || authData.user?.user_metadata?.role || 'doer'

      // 3. VALIDACIÓN ESTRICTA DE ROL:
      if (role.toLowerCase() !== expectedRole.toLowerCase()) {
        await supabase.auth.signOut()
        setErrorMsg(
          `Acceso denegado: Tu cuenta pertenece al rol de "${role.toUpperCase()}". No puedes ingresar desde la sección de ${expectedRole.toUpperCase()}.`
        )
        setLoading(false)
        return
      }

      // 4. Si el rol es correcto, redirigir según el rol
      if (role === 'admin') {
        navigate('/admin')
      } else if (role === 'provider') {
        navigate('/provider')
      } else {
        navigate('/doer')
      }
    } catch (err) {
      setErrorMsg('Error al verificar los permisos del usuario.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-slate-900 rounded-xl shadow-xl border border-slate-800 text-white">
      <h2 className="text-2xl font-bold text-center text-white mb-6">Iniciar Sesión</h2>

      {/* Banner de error estilizado */}
      {errorMsg && (
        <div className="mb-4 p-3 text-sm text-red-400 bg-red-950/50 border border-red-500/30 rounded-lg animate-fade-in">
          {errorMsg}
        </div>
      )}

      {/* --- NUEVO: Botón de inicio de sesión con Google --- */}
      <button
        type="button"
        disabled={loading || googleLoading}
        onClick={handleGoogleLogin}
        className="w-full mb-4 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium rounded-md shadow flex items-center justify-center gap-3 transition cursor-pointer disabled:opacity-50"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        {googleLoading ? 'Conectando con Google...' : 'Continuar con Google'}
      </button>

      {/* Separador "O" */}
      <div className="relative my-4 flex items-center justify-center">
        <div className="border-t border-slate-800 w-full"></div>
        <span className="bg-slate-900 px-3 text-xs text-slate-500 uppercase font-semibold absolute">o</span>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300">Correo Electrónico</label>
          <input
            type="email"
            required
            disabled={loading || googleLoading}
            value={email}
            onChange={(e) => {
              if (errorMsg) setErrorMsg('')
              setEmail(e.target.value)
            }}
            placeholder="tu@correo.com"
            className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm placeholder-slate-500 disabled:opacity-50"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-slate-300">Contraseña</label>
            
            <button
              type="button"
              disabled={loading || googleLoading}
              onClick={onForgotPassword || (() => navigate('/forgot-password'))}
              className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline focus:outline-none cursor-pointer disabled:opacity-50"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              disabled={loading || googleLoading}
              value={password}
              onChange={(e) => {
                if (errorMsg) setErrorMsg('')
                setPassword(e.target.value)
              }}
              placeholder="••••••••"
              className="block w-full px-3 py-2 pr-10 bg-slate-950 border border-slate-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm placeholder-slate-500 disabled:opacity-50"
            />
            <button
              type="button"
              disabled={loading || googleLoading}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors focus:outline-none cursor-pointer disabled:opacity-50"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-md shadow focus:outline-none transition disabled:opacity-50 mt-2 cursor-pointer"
        >
          {loading ? 'Ingresando...' : 'Entrar'}
        </button>
      </form>

      {onSwitchToRegister && (
        <p className="mt-4 text-center text-sm text-slate-400">
          ¿No tienes cuenta?{' '}
          <button 
            type="button"
            disabled={loading || googleLoading}
            onClick={onSwitchToRegister} 
            className="text-emerald-400 hover:underline font-medium cursor-pointer disabled:opacity-50"
          >
            Registrarse
          </button>
        </p>
      )}
    </div>
  )
}