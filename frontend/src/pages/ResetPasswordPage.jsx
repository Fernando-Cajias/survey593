import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { Eye, EyeOff, CheckCircle, KeyRound, ArrowLeft } from 'lucide-react'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const [email, setEmail] = useState(location.state?.email || '')
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [success, setSuccess] = useState(false)

  const handleUpdatePassword = async (e) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.')
      return
    }

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)
    setErrorMsg('')

    try {
      // 1. Verificamos el código OTP enviado al correo
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type: 'recovery',
      })

      if (verifyError) {
        setErrorMsg('El código de verificación es incorrecto o ha caducado.')
        setLoading(false)
        return
      }

      // 2. Si el código es válido, actualizamos la clave del usuario
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        setErrorMsg('No se pudo actualizar la contraseña. Intenta de nuevo.')
      } else {
        setSuccess(true)
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      }
    } catch (err) {
      setErrorMsg('Error al conectar con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-slate-900 rounded-xl shadow-xl border border-slate-800 text-white">
      <button
        type="button"
        onClick={() => navigate('/forgot-password')}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-4 focus:outline-none cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a solicitar código
      </button>

      <h2 className="text-2xl font-bold text-center text-white mb-2">Nueva Contraseña</h2>
      <p className="text-sm text-slate-400 text-center mb-6">
        Ingresa el código enviado a tu correo y tu nueva contraseña.
      </p>

      {errorMsg && (
        <div className="mb-4 p-3 text-sm text-red-400 bg-red-950/50 border border-red-500/30 rounded-lg">
          {errorMsg}
        </div>
      )}

      {success ? (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-center space-y-3">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
          <p className="text-sm text-emerald-300 font-medium">
            ¡Contraseña actualizada con éxito!
          </p>
          <p className="text-xs text-slate-400">
            Redirigiendo al inicio de sesión...
          </p>
        </div>
      ) : (
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          {!location.state?.email && (
            <div>
              <label className="block text-sm font-medium text-slate-300">Correo Electrónico</label>
              <input
                type="email"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 text-white rounded-md text-sm placeholder-slate-500 disabled:opacity-50"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300">Código de Verificación (OTP)</label>
            <div className="relative mt-1">
              <input
                type="text"
                required
                disabled={loading}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Ej. 123456"
                className="block w-full px-3 py-2 pl-10 bg-slate-950 border border-slate-700 text-white rounded-md text-sm placeholder-slate-500 disabled:opacity-50 tracking-widest font-mono"
              />
              <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">Nueva Contraseña</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full px-3 py-2 pr-10 bg-slate-950 border border-slate-700 text-white rounded-md text-sm placeholder-slate-500 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">Confirmar Contraseña</label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              disabled={loading}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 text-white rounded-md text-sm placeholder-slate-500 disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-md shadow focus:outline-none transition disabled:opacity-50 mt-2 cursor-pointer"
          >
            {loading ? 'Validando...' : 'Cambiar Contraseña'}
          </button>
        </form>
      )}
    </div>
  )
}