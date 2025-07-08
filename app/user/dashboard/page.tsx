import { Metadata } from "next"
import { UserDashboard } from "@/components/user/user-dashboard"

export const metadata: Metadata = {
  title: "User Dashboard - MessHub",
  description: "Manage your mess subscriptions and meals",
}

export default function UserDashboardPage() {
  return <UserDashboard />
} 