import type { Metadata } from "next"
import { OfflineContent } from "@/components/offline-content"

export const metadata: Metadata = {
  title: "Offline - MessHub",
  description: "You are currently offline. Please check your internet connection.",
}

export default function OfflinePage() {
  return <OfflineContent />
} 