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
      // Si el rol ingresado no coincide con el rol esperado de esta pantalla
      if (role.toLowerCase() !== expectedRole.toLowerCase()) {
        // Cierra la sesión inmediatamente por seguridad
        await supabase.auth.signOut()

        // Muestra la alerta en español y BLOQUEA el acceso
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

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300">Correo Electrónico</label>
          <input
            type="email"
            required
            disabled={loading}
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
            
            {/* Botón / Link ¿Olvidaste tu contraseña? */}
            <button
              type="button"
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
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
          disabled={loading}
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
            disabled={loading}
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