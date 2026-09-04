import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import RegisterKYC from '../components/Auth/RegisterKYC'
import Login from '../components/Auth/Login'

export const LoginPage = ({ expectedRole = 'provider' }) => {
  const [isRegistering, setIsRegistering] = useState(true)
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0b0f17] flex items-center justify-center p-4">
      {isRegistering ? (
        <RegisterKYC onSwitchToLogin={() => setIsRegistering(false)} />
      ) : (
        <Login 
          expectedRole={expectedRole}
          onSwitchToRegister={() => setIsRegistering(true)} 
          onForgotPassword={() => navigate('/forgot-password')}
        />
      )}
    </div>
  )
}