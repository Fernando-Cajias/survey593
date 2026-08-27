import React, { useState } from 'react'
import RegisterKYC from '../components/Auth/RegisterKYC'
import Login from '../components/Auth/Login'

export const LoginPage = () => {
  const [isRegistering, setIsRegistering] = useState(true)

  return (
    <div className="min-h-screen bg-[#0b0f17] flex items-center justify-center p-4">
      {isRegistering ? (
        <RegisterKYC onSwitchToLogin={() => setIsRegistering(false)} />
      ) : (
        <Login onSwitchToRegister={() => setIsRegistering(true)} />
      )}
    </div>
  )
}