import React, { useState } from 'react'
import { supabase } from '../../services/supabaseClient'

export default function RegisterKYC({ onSwitchToLogin }) {
  const [role, setRole] = useState('doer') // 'doer' o 'provider'
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cedula, setCedula] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // 1. Validación Regex para formato de correo electrónico
  const validateEmail = (emailStr) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return emailRegex.test(emailStr)
  }

  // 2. Validación avanzada de complejidad de contraseña
  const validatePasswordSecurity = (pass) => {
    if (pass.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres.'
    }
    if (!/[A-Z]/.test(pass)) {
      return 'La contraseña debe incluir al menos una letra mayúscula.'
    }
    if (!/[a-z]/.test(pass)) {
      return 'La contraseña debe incluir al menos una letra minúscula.'
    }
    if (!/[0-9]/.test(pass)) {
      return 'La contraseña debe incluir al menos un número.'
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) {
      return 'La contraseña debe incluir al menos un carácter especial (ej: @, #, $, %).'
    }
    return null
  }

  // Traductor de mensajes de error de Supabase al español
  const translateError = (errorMsg) => {
    if (!errorMsg) return ''
    const msg = errorMsg.toLowerCase()

    if (
      msg.includes('duplicate key') || 
      msg.includes('users_cedula_key') || 
      msg.includes('already exists') ||
      msg.includes('unique constraint') ||
      msg.includes('database error saving new user')
    ) {
      return 'La cédula de identidad o información ingresada ya se encuentra registrada.'
    }

    if (msg.includes('user already registered')) {
      return 'Este correo electrónico ya se encuentra registrado.'
    }

    if (msg.includes('email rate limit exceeded')) {
      return 'Has superado el límite de correos enviados. Espera unos minutos e inténtalo de nuevo.'
    }
    if (msg.includes('password should be at least')) {
      return 'La contraseña debe tener al menos 8 caracteres.'
    }
    if (msg.includes('invalid format') || msg.includes('invalid email')) {
      return 'El formato del correo electrónico no es válido.'
    }

    return errorMsg
  }

  // Algoritmo para validar Cédula de Identidad Ecuatoriana (Módulo 10)
  const validarCedulaEcuador = (ced) => {
    if (ced.length !== 10) return false
    const digitoRegion = parseInt(ced.substring(0, 2))
    if (digitoRegion < 1 || digitoRegion > 24) return false

    const ultimoDigito = parseInt(ced.substring(9, 10))
    let suma = 0
    for (let i = 0; i < 9; i++) {
      let mult = parseInt(ced.charAt(i)) * (i % 2 === 0 ? 2 : 1)
      if (mult > 9) mult -= 9
      suma += mult
    }
    const digitoVerificador = (Math.ceil(suma / 10) * 10) - suma
    return (digitoVerificador === 10 ? 0 : digitoVerificador) === ultimoDigito
  }

  // --- REGISTRO DIRECTO CON GOOGLE ---
  const handleGoogleRegister = async () => {
    setErrorMsg('')
    setGoogleLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          data: {
            role: role,
            kyc_status: role === 'doer' ? 'pending_kyc' : 'n/a',
          },
        },
      })

      if (error) {
        setErrorMsg('Error al conectar con Google. Inténtalo nuevamente.')
      }
    } catch (err) {
      setErrorMsg(translateError(err.message))
    } finally {
      setGoogleLoading(false)
    }
  }

  // --- REGISTRO MANUAL POR CORREO Y CONTRASEÑA ---
  const handleRegister = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!validateEmail(email)) {
      setErrorMsg('Ingresa un correo electrónico con formato válido (ej: usuario@dominio.com).')
      return
    }

    const passwordError = validatePasswordSecurity(password)
    if (passwordError) {
      setErrorMsg(passwordError)
      return
    }

    if (role === 'doer' && !validarCedulaEcuador(cedula)) {
      setErrorMsg('La cédula ingresada no es válida para Ecuador.')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
            company_name: role === 'provider' ? companyName : null,
            cedula: role === 'doer' ? cedula : null,
            kyc_status: role === 'doer' ? 'verified' : 'n/a',
          },
        },
      })

      if (error) throw error

      alert('Registro completado con éxito.')
      if (onSwitchToLogin) onSwitchToLogin()

    } catch (err) {
      setErrorMsg(translateError(err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-2xl bg-[#111827] text-white shadow-2xl border border-gray-800">
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-xl mb-3 shadow-lg shadow-blue-500/30">
          S5
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight">Crear Cuenta</h2>
        <p className="text-sm text-gray-400 mt-1">Únete a la red de Survey 593</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6 p-1 bg-gray-900/60 rounded-xl border border-gray-800">
        <button
          type="button"
          onClick={() => {
            setErrorMsg('')
            setRole('doer')
          }}
          className={`py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition ${
            role === 'doer'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/50'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <span>👤</span> Encuestado (Doer)
        </button>

        <button
          type="button"
          onClick={() => {
            setErrorMsg('')
            setRole('provider')
          }}
          className={`py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition ${
            role === 'provider'
              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/50'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <span>🏢</span> Empresa (Provider)
        </button>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 text-xs text-red-400 bg-red-950/50 border border-red-800/80 rounded-lg text-center font-medium">
          {errorMsg}
        </div>
      )}

      {/* BOTÓN REGISTRARSE CON GOOGLE (Directo) */}
      <button
        type="button"
        disabled={loading || googleLoading}
        onClick={handleGoogleRegister}
        className="w-full mb-4 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium rounded-lg shadow flex items-center justify-center gap-3 transition cursor-pointer disabled:opacity-50 text-sm"
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
        {googleLoading ? 'Conectando con Google...' : 'Registrarse con Google'}
      </button>

      {/* Separador */}
      <div className="relative my-4 flex items-center justify-center">
        <div className="border-t border-gray-800 w-full"></div>
        <span className="bg-[#111827] px-3 text-xs text-gray-500 uppercase font-semibold absolute">o con correo</span>
      </div>

      <form onSubmit={handleRegister} className="space-y-4 text-left">
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">Nombre Completo</label>
          <input
            type="text"
            required
            disabled={loading || googleLoading}
            value={fullName}
            onChange={(e) => {
              if (errorMsg) setErrorMsg('')
              setFullName(e.target.value)
            }}
            className="w-full px-3 py-2.5 bg-[#1f293d] border border-gray-700/80 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition disabled:opacity-50"
            placeholder="Ej: Juan Pérez"
          />
        </div>

        {role === 'doer' && (
          <div>
            <label className="block text-xs font-medium text-emerald-400 mb-1 flex items-center justify-between">
              <span>Cédula de Identidad (KYC)</span>
              <span className="text-[10px] text-gray-400 font-normal">Requerido para cobros</span>
            </label>
            <input
              type="text"
              required
              disabled={loading || googleLoading}
              maxLength={10}
              value={cedula}
              onChange={(e) => {
                if (errorMsg) setErrorMsg('')
                setCedula(e.target.value.replace(/\D/g, ''))
              }}
              className="w-full px-3 py-2.5 bg-[#1f293d] border border-emerald-500/40 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition disabled:opacity-50"
              placeholder="Ej: 1712345678"
            />
          </div>
        )}

        {role === 'provider' && (
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Nombre de la Empresa</label>
            <input
              type="text"
              required
              disabled={loading || googleLoading}
              value={companyName}
              onChange={(e) => {
                if (errorMsg) setErrorMsg('')
                setCompanyName(e.target.value)
              }}
              className="w-full px-3 py-2.5 bg-[#1f293d] border border-gray-700/80 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition disabled:opacity-50"
              placeholder="Ej: Corporación Andina"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">Correo Electrónico</label>
          <input
            type="email"
            required
            disabled={loading || googleLoading}
            value={email}
            onChange={(e) => {
              if (errorMsg) setErrorMsg('')
              setEmail(e.target.value)
            }}
            className="w-full px-3 py-2.5 bg-[#1f293d] border border-gray-700/80 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition disabled:opacity-50"
            placeholder="tu@email.com"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">Contraseña</label>
          <input
            type="password"
            required
            disabled={loading || googleLoading}
            value={password}
            onChange={(e) => {
              if (errorMsg) setErrorMsg('')
              setPassword(e.target.value)
            }}
            className="w-full px-3 py-2.5 bg-[#1f293d] border border-gray-700/80 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition disabled:opacity-50"
            placeholder="Mín. 8 caract., 1 mayús., 1 núm., 1 símbolo"
          />
        </div>

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="w-full py-3 px-4 mt-2 bg-emerald-500 hover:bg-emerald-600 text-gray-950 font-bold text-sm rounded-lg shadow-lg shadow-emerald-500/20 focus:outline-none transition disabled:opacity-50"
        >
          {loading ? 'Validando y creando...' : 'Completar Registro'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-400">
          ¿Ya tienes una cuenta?{' '}
          <button
            onClick={onSwitchToLogin}
            disabled={loading || googleLoading}
            className="text-emerald-400 font-semibold hover:underline"
          >
            Inicia Sesión
          </button>
        </p>
      </div>
    </div>
  )
}