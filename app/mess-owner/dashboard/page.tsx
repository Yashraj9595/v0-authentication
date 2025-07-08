import { Metadata } from "next"
import { MessOwnerDashboard } from "@/components/mess-owner/mess-owner-dashboard"

export const metadata: Metadata = {
  title: "Mess Owner Dashboard - MessHub",
  description: "Manage your mess operations and customers",
}

export default function MessOwnerDashboardPage() {
  return <MessOwnerDashboard />
} 