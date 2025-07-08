"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Copy, Mail, Eye, EyeOff } from "lucide-react"

interface OTPTesterProps {
  email: string
  onOTPReceived: (otp: string) => void
}

export function OTPTester({ email, onOTPReceived }: OTPTesterProps) {
  const [testOTP, setTestOTP] = useState("123456")
  const [showOTP, setShowOTP] = useState(false)

  const handleCopyOTP = () => {
    navigator.clipboard.writeText(testOTP)
  }

  const handleApplyOTP = () => {
    onOTPReceived(testOTP)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">DEV</Badge>
            OTP Tester
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-xs text-muted-foreground">
            Testing OTP for: <span className="font-mono">{email}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                type={showOTP ? "text" : "password"}
                value={testOTP}
                onChange={(e) => setTestOTP(e.target.value)}
                placeholder="Enter test OTP"
                className="text-sm"
                maxLength={6}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setShowOTP(!showOTP)}
              >
                {showOTP ? <EyeOff size={12} /> : <Eye size={12} />}
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyOTP}
              className="h-8 px-2"
            >
              <Copy size={12} />
            </Button>
          </div>
          
          <Button
            type="button"
            onClick={handleApplyOTP}
            className="w-full text-xs"
            size="sm"
          >
            Apply Test OTP
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 