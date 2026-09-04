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

  const handleRegister = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    // Validación A: Formato de correo
    if (!validateEmail(email)) {
      setErrorMsg('Ingresa un correo electrónico con formato válido (ej: usuario@dominio.com).')
      return
    }

    // Validación B: Complejidad de la contraseña
    const passwordError = validatePasswordSecurity(password)
    if (passwordError) {
      setErrorMsg(passwordError)
      return
    }

    // Validación C: Cédula ecuatoriana (solo Doers)
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

      <form onSubmit={handleRegister} className="space-y-4 text-left">
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">Nombre Completo</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => {
              if (errorMsg) setErrorMsg('')
              setFullName(e.target.value)
            }}
            className="w-full px-3 py-2.5 bg-[#1f293d] border border-gray-700/80 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
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
              maxLength={10}
              value={cedula}
              onChange={(e) => {
                if (errorMsg) setErrorMsg('')
                setCedula(e.target.value.replace(/\D/g, ''))
              }}
              className="w-full px-3 py-2.5 bg-[#1f293d] border border-emerald-500/40 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
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
              value={companyName}
              onChange={(e) => {
                if (errorMsg) setErrorMsg('')
                setCompanyName(e.target.value)
              }}
              className="w-full px-3 py-2.5 bg-[#1f293d] border border-gray-700/80 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
              placeholder="Ej: Corporación Andina"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">Correo Electrónico</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => {
              if (errorMsg) setErrorMsg('')
              setEmail(e.target.value)
            }}
            className="w-full px-3 py-2.5 bg-[#1f293d] border border-gray-700/80 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
            placeholder="tu@email.com"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">Contraseña</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => {
              if (errorMsg) setErrorMsg('')
              setPassword(e.target.value)
            }}
            className="w-full px-3 py-2.5 bg-[#1f293d] border border-gray-700/80 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
            placeholder="Mín. 8 caract., 1 mayús., 1 núm., 1 símbolo"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
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
            className="text-emerald-400 font-semibold hover:underline"
          >
            Inicia Sesión
          </button>
        </p>
      </div>
    </div>
  )
}