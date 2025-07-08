"use client"

import * as React from "react"

const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024

export type DeviceType = "mobile" | "tablet" | "desktop"

export function useDevice() {
  const [deviceType, setDeviceType] = React.useState<DeviceType>("desktop")
  const [isPortrait, setIsPortrait] = React.useState(false)

  React.useEffect(() => {
    const updateDeviceType = () => {
      const width = window.innerWidth
      if (width < MOBILE_BREAKPOINT) {
        setDeviceType("mobile")
      } else if (width < TABLET_BREAKPOINT) {
        setDeviceType("tablet")
      } else {
        setDeviceType("desktop")
      }
      setIsPortrait(window.matchMedia("(orientation: portrait)").matches)
    }

    // Initial check
    updateDeviceType()

    // Add event listeners
    window.addEventListener("resize", updateDeviceType)
    window.addEventListener("orientationchange", updateDeviceType)

    return () => {
      window.removeEventListener("resize", updateDeviceType)
      window.removeEventListener("orientationchange", updateDeviceType)
    }
  }, [])

  return {
    deviceType,
    isMobile: deviceType === "mobile",
    isTablet: deviceType === "tablet",
    isDesktop: deviceType === "desktop",
    isPortrait,
    isLandscape: !isPortrait,
  }
}

export function useIsMobile() {
  const { isMobile } = useDevice()
  return isMobile
}
