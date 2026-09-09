import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { ArrowLeft, Mail } from 'lucide-react'

export default function ForgotPasswordPage({ onBackToLogin }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim())

      if (error) {
        setErrorMsg('No se pudo enviar el correo de recuperación. Verifica la dirección.')
      } else {
        // Redirige a la pantalla para ingresar el código numérico enviando el email por estado
        navigate('/reset-password', { state: { email: email.trim() } })
      }
    } catch (err) {
      setErrorMsg('Ocurrió un error al conectar con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (onBackToLogin) onBackToLogin()
    else navigate('/login')
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-slate-900 rounded-xl shadow-xl border border-slate-800 text-white">
      <button
        type="button"
        onClick={handleBack}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-4 focus:outline-none cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al inicio de sesión
      </button>

      <h2 className="text-2xl font-bold text-center text-white mb-2">Restablecer Contraseña</h2>
      <p className="text-sm text-slate-400 text-center mb-6">
        Ingresa tu correo electrónico para enviarte el código de verificación.
      </p>

      {errorMsg && (
        <div className="mb-4 p-3 text-sm text-red-400 bg-red-950/50 border border-red-500/30 rounded-lg">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleResetPassword} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300">Correo Electrónico</label>
          <div className="relative mt-1">
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
              className="block w-full px-3 py-2 pl-10 bg-slate-950 border border-slate-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm placeholder-slate-500 disabled:opacity-50"
            />
            <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-md shadow focus:outline-none transition disabled:opacity-50 mt-2 cursor-pointer"
        >
          {loading ? 'Enviando...' : 'Obtener Código de Verificación'}
        </button>
      </form>
    </div>
  )
}