import { Metadata } from "next"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export const metadata: Metadata = {
  title: "Admin Dashboard - MessHub",
  description: "System administration and management",
}

export default function AdminDashboardPage() {
  return <AdminDashboard />
} 