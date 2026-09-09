import React, { useState } from 'react'
import { supabase } from '../../services/supabaseClient'

export default function CompleteKYCModal({ user, onComplete }) {
  const [cedula, setCedula] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Algoritmo Módulo 10 para cédula ecuatoriana
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!validarCedulaEcuador(cedula)) {
      setErrorMsg('La cédula ingresada no es válida para Ecuador.')
      return
    }

    setLoading(true)

    try {
      // 1. Consultar si la cédula ya está asociada a otra cuenta en profiles
      const { data: existingProfile, error: searchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('cedula', cedula)
        .neq('id', user.id)
        .maybeSingle()

      if (searchError) throw searchError

      if (existingProfile) {
        // CÉDULA DUPLICADA: Alerta + Cierre de sesión automático
        setErrorMsg('Esta cédula de identidad ya se encuentra registrada bajo otra cuenta. Cerrando sesión...')
        setTimeout(async () => {
          await supabase.auth.signOut()
          window.location.reload()
        }, 3000)
        return
      }

      // 2. Si es válida y única, actualizar el perfil en la base de datos
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          cedula: cedula,
          kyc_status: 'verified',
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      alert('Registro de cédula exitoso. ¡Bienvenido!')
      if (onComplete) onComplete()

    } catch (err) {
      setErrorMsg('Ocurrió un error al guardar la información: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md p-8 rounded-2xl bg-[#111827] text-white shadow-2xl border border-gray-800">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500 text-emerald-400 rounded-xl flex items-center justify-center font-bold text-xl mx-auto mb-3">
            🆔
          </div>
          <h2 className="text-2xl font-bold">Completar Verificación KYC</h2>
          <p className="text-xs text-gray-400 mt-1">
            Hola <span className="text-white font-medium">{user?.user_metadata?.full_name || user?.email}</span>. Para finalizar tu registro con Google ingresa tu cédula de identidad.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 text-xs text-red-400 bg-red-950/50 border border-red-800/80 rounded-lg text-center font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-emerald-400 mb-1 flex items-center justify-between">
              <span>Cédula de Identidad (Ecuador)</span>
              <span className="text-[10px] text-gray-400 font-normal">Obligatorio</span>
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-gray-950 font-bold text-sm rounded-lg shadow-lg shadow-emerald-500/20 focus:outline-none transition disabled:opacity-50"
          >
            {loading ? 'Verificando cédula...' : 'Finalizar Registro'}
          </button>
        </form>
      </div>
    </div>
  )
}