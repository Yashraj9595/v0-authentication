"use client"

import { useState } from "react"
import { ForgotPasswordScreen } from "@/components/auth/forgot-password-screen"
import { LoginScreen } from "@/components/auth/login-screen"
import { OTPVerificationScreen } from "@/components/auth/otp-verification-screen"
import { RegisterScreen } from "@/components/auth/register-screen"
import { ResetPasswordScreen } from "@/components/auth/reset-password-screen"
import { SuccessScreen } from "@/components/auth/success-screen"
import { WelcomeScreen } from "@/components/auth/welcome-screen"

export type AuthScreen = "welcome" | "login" | "register" | "forgot-password" | "otp-verification" | "reset-password" | "success"

export type UserRole = "user" | "mess_owner"

export interface AuthState {
  email?: string
  resetFlow?: boolean
  otp?: string
  role?: UserRole
  message?: string
}

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>("welcome")
  const [authState, setAuthState] = useState<AuthState>({})

  const handleNavigate = (screen: AuthScreen, state?: any) => {
    setCurrentScreen(screen)
    if (state) {
      setAuthState(state)
    }
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case "welcome":
        return <WelcomeScreen onNavigate={handleNavigate} />
      case "login":
        return <LoginScreen onNavigate={handleNavigate} />
      case "register":
        return <RegisterScreen onNavigate={handleNavigate} />
      case "forgot-password":
        return <ForgotPasswordScreen onNavigate={handleNavigate} />
      case "otp-verification":
        return <OTPVerificationScreen onNavigate={handleNavigate} state={authState} />
      case "reset-password":
        return <ResetPasswordScreen onNavigate={handleNavigate} authState={authState} />
      case "success":
        return <SuccessScreen onNavigate={handleNavigate} authState={authState} />
      default:
        return <WelcomeScreen onNavigate={handleNavigate} />
    }
  }

  return <main className="min-h-screen">{renderScreen()}</main>
}