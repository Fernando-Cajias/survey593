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

    // Validación de KYC solo para usuarios encuestados (Doer)
    if (role === 'doer' && !validarCedulaEcuador(cedula)) {
      setErrorMsg('La cédula ingresada no es válida para Ecuador.')
      return
    }

    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
          company_name: role === 'provider' ? companyName : null,
          cedula_kyc: role === 'doer' ? cedula : null,
          kyc_status: role === 'doer' ? 'verified' : 'n/a',
        },
      },
    })

    if (error) {
      setErrorMsg(error.message)
    } else {
      alert('Registro completado con éxito.')
    }
    setLoading(false)
  }

  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-2xl bg-[#111827] text-white shadow-2xl border border-gray-800">
      {/* Icono y Título */}
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-xl mb-3 shadow-lg shadow-blue-500/30">
          S5
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight">Crear Cuenta</h2>
        <p className="text-sm text-gray-400 mt-1">Únete a la red de Survey 593</p>
      </div>

      {/* Selector de Rol */}
      <div className="grid grid-cols-2 gap-3 mb-6 p-1 bg-gray-900/60 rounded-xl border border-gray-800">
        <button
          type="button"
          onClick={() => setRole('doer')}
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
          onClick={() => setRole('provider')}
          className={`py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition ${
            role === 'provider'
              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/50'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <span>🏢</span> Empresa (Provider)
        </button>
      </div>

      {/* Mensaje de Error */}
      {errorMsg && (
        <div className="mb-4 p-3 text-xs text-red-400 bg-red-950/50 border border-red-800/80 rounded-lg text-center">
          {errorMsg}
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleRegister} className="space-y-4 text-left">
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">Nombre Completo</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#1f293d] border border-gray-700/80 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
            placeholder="Ej: Juan Pérez"
          />
        </div>

        {/* Campo Cédula KYC exclusivo para Encuestados */}
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
              onChange={(e) => setCedula(e.target.value.replace(/\D/g, ''))}
              className="w-full px-3 py-2.5 bg-[#1f293d] border border-emerald-500/40 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
              placeholder="Ej: 1712345678"
            />
          </div>
        )}

        {/* Campo Nombre de Empresa solo para Proveedores */}
        {role === 'provider' && (
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Nombre de la Empresa</label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
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
            onChange={(e) => setEmail(e.target.value)}
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
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#1f293d] border border-gray-700/80 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 mt-2 bg-emerald-500 hover:bg-emerald-600 text-gray-950 font-bold text-sm rounded-lg shadow-lg shadow-emerald-500/20 focus:outline-none transition disabled:opacity-50"
        >
          {loading ? 'Validando KYC...' : 'Completar Registro'}
        </button>
      </form>

      {/* Pie con enlace a Login */}
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