"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle, ArrowRight, Home, User, ChefHat } from "lucide-react"
import type { AuthScreen, AuthState } from "@/app/page"

interface SuccessScreenProps {
  onNavigate: (screen: AuthScreen) => void
  authState: AuthState
}

export function SuccessScreen({ onNavigate, authState }: SuccessScreenProps) {
  const { message, role } = authState

  const getSuccessMessage = () => {
    if (message) return message
    
    if (role === "mess_owner") {
      return "Your mess owner account has been created successfully! You can now manage your kitchen and start serving customers."
    }
    
    return "Your account has been created successfully! Welcome to MessHub."
  }

  const getNextAction = () => {
    if (role === "mess_owner") {
      return {
        title: "Go to Kitchen Dashboard",
        icon: ChefHat,
        action: () => onNavigate("welcome") // This should navigate to mess owner dashboard
      }
    }
    
    return {
      title: "Start Exploring",
      icon: Home,
      action: () => onNavigate("welcome") // This should navigate to user dashboard
    }
  }

  const nextAction = getNextAction()

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-neutral-gray/20 to-background">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-blue/10 rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-green-500/5 to-transparent rounded-full blur-3xl animate-pulse animation-delay-500"></div>
      </div>

      <Card className="w-full max-w-md bg-card/95 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border-0 relative z-10 animate-fade-in">
        <div className="text-center space-y-6">
          {/* Success Icon */}
          <div className="relative mx-auto w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-2xl animate-bounce">
            <CheckCircle size={48} className="text-white" />
            <div className="absolute inset-0 border-4 border-green-400/30 rounded-full animate-ping"></div>
          </div>

          {/* Success Message */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
              Success!
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {getSuccessMessage()}
            </p>
          </div>

          {/* Role-specific information */}
          {role && (
            <div className="bg-gradient-to-br from-primary-blue/10 to-primary-blue/5 rounded-2xl p-4 border border-primary-blue/20">
              <div className="flex items-center justify-center gap-3">
                {role === "mess_owner" ? (
                  <ChefHat size={20} className="text-primary-blue" />
                ) : (
                  <User size={20} className="text-primary-blue" />
                )}
                <span className="font-semibold text-primary-blue capitalize">
                  {role.replace('_', ' ')} Account
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button
              onClick={nextAction.action}
              className="w-full gradient-primary hover:shadow-lg text-white rounded-2xl py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0"
            >
              <nextAction.icon size={20} className="mr-2" />
              {nextAction.title}
            </Button>
            
            <Button
              onClick={() => onNavigate("login")}
              variant="outline"
              className="w-full border-2 border-primary-blue text-primary-blue hover:bg-primary-blue hover:text-white rounded-2xl py-4 text-lg font-semibold transition-all duration-300 transform hover:scale-105"
            >
              <ArrowRight size={20} className="mr-2" />
              Sign In Instead
            </Button>
          </div>

          {/* Footer */}
          <div className="pt-4">
            <p className="text-xs text-muted-foreground">
              Need help? Contact our support team
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
} 