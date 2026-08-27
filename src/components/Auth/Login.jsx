import React, { useState } from 'react'
import { supabase } from '../../services/supabaseClient'
import { Eye, EyeOff } from 'lucide-react'

export default function Login({ onSwitchToRegister }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setErrorMsg('Correo o contraseña incorrectos.')
      } else {
        setErrorMsg(error.message)
      }
    }
    setLoading(false)
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-slate-900 rounded-xl shadow-xl border border-slate-800 text-white">
      <h2 className="text-2xl font-bold text-center text-white mb-6">Iniciar Sesión</h2>

      {errorMsg && (
        <div className="mb-4 p-3 text-sm text-red-400 bg-red-950/50 border border-red-500/30 rounded-lg">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300">Correo Electrónico</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm placeholder-slate-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300">Contraseña</label>
          <div className="relative mt-1">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="block w-full px-3 py-2 pr-10 bg-slate-950 border border-slate-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm placeholder-slate-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors focus:outline-none"
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
          className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-md shadow focus:outline-none transition disabled:opacity-50 mt-2"
        >
          {loading ? 'Ingresando...' : 'Entrar'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-400">
        ¿No tienes cuenta?{' '}
        <button 
          type="button"
          onClick={onSwitchToRegister} 
          className="text-emerald-400 hover:underline font-medium cursor-pointer"
        >
          Registrarse
        </button>
      </p>
    </div>
  )
}