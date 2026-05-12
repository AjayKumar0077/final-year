"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  BarChart3,
  Settings,
  FileText,
  Zap,
  ChevronRight,
  Shield,
  LayoutDashboard,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

interface AdminSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: keyof typeof colorConfig;
  badge?: string | number;
}

const colorConfig = {
  blue: {
    bg: "bg-blue-50 hover:bg-blue-100",
    border: "border-blue-200",
    icon: "text-blue-600",
    badge: "bg-blue-100 text-blue-800",
  },
  green: {
    bg: "bg-green-50 hover:bg-green-100",
    border: "border-green-200",
    icon: "text-green-600",
    badge: "bg-green-100 text-green-800",
  },
  purple: {
    bg: "bg-purple-50 hover:bg-purple-100",
    border: "border-purple-200",
    icon: "text-purple-600",
    badge: "bg-purple-100 text-purple-800",
  },
  orange: {
    bg: "bg-orange-50 hover:bg-orange-100",
    border: "border-orange-200",
    icon: "text-orange-600",
    badge: "bg-orange-100 text-orange-800",
  },
  red: {
    bg: "bg-red-50 hover:bg-red-100",
    border: "border-red-200",
    icon: "text-red-600",
    badge: "bg-red-100 text-red-800",
  },
  yellow: {
    bg: "bg-yellow-50 hover:bg-yellow-100",
    border: "border-yellow-200",
    icon: "text-yellow-600",
    badge: "bg-yellow-100 text-yellow-800",
  },
  cyan: {
    bg: "bg-cyan-50 hover:bg-cyan-100",
    border: "border-cyan-200",
    icon: "text-cyan-600",
    badge: "bg-cyan-100 text-cyan-800",
  },
  slate: {
    bg: "bg-slate-50 hover:bg-slate-100",
    border: "border-slate-200",
    icon: "text-slate-600",
    badge: "bg-slate-100 text-slate-800",
  },
} as const;

export default function AdminHome() {
  const router = useRouter();

  const adminSections: AdminSection[] = [
    {
      id: "dashboard",
      title: "Dashboard",
      description: "Real-time system metrics and overview",
      icon: <LayoutDashboard className="w-6 h-6" />,
      href: "/admin/dashboard",
      color: "blue",
    },
    {
      id: "users",
      title: "Users",
      description: "Manage users, roles, and permissions",
      icon: <Users className="w-6 h-6" />,
      href: "/admin/users",
      color: "green",
      badge: "1,250",
    },
    {
      id: "analytics",
      title: "Analytics",
      description: "Operational reports and insights",
      icon: <BarChart3 className="w-6 h-6" />,
      href: "/admin/analytics",
      color: "cyan",
    },
    {
      id: "settings",
      title: "Settings",
      description: "System configuration and preferences",
      icon: <Settings className="w-6 h-6" />,
      href: "/admin/settings",
      color: "slate",
    },
    {
      id: "features",
      title: "Advanced Features",
      description: "Alerts, analytics, moderation, and bulk operations",
      icon: <Zap className="w-6 h-6" />,
      href: "/admin/features",
      color: "red",
      badge: "New",
    },
    {
      id: "reports",
      title: "Reports",
      description: "Generate and schedule reports",
      icon: <FileText className="w-6 h-6" />,
      href: "/admin/reports",
      color: "orange",
    },
  ];

  return (
    <DashboardLayout userRole="admin" userName="Admin">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Admin Control Center</h1>
          <p className="text-slate-600 mt-2 text-lg">Manage FOODBRIDGE system, users, and operations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Active Users</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">1,250</p>
              </div>
              <Users className="w-10 h-10 text-blue-600" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">System Status</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">99.8%</p>
              </div>
              <Shield className="w-10 h-10 text-green-600" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Pending KYC</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">45</p>
              </div>
              <FileText className="w-10 h-10 text-yellow-600" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Active Missions</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">342</p>
              </div>
              <Zap className="w-10 h-10 text-purple-600" />
            </div>
          </Card>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Admin Sections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminSections.map((section) => {
              const colors = colorConfig[section.color];
              return (
                <Card
                  key={section.id}
                  className={`p-6 border-2 cursor-pointer transition-all ${colors.bg} ${colors.border} hover:shadow-lg`}
                  onClick={() => router.push(section.href)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`${colors.icon} p-3 bg-white rounded-lg`}>{section.icon}</div>
                    {section.badge && (
                      <Badge className={`text-xs font-bold ${colors.badge}`}>{section.badge}</Badge>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{section.title}</h3>
                  <p className="text-sm text-slate-600 mb-4">{section.description}</p>
                  <Button
                    variant="outline"
                    className="w-full justify-between group"
                    onClick={() => router.push(section.href)}
                  >
                    Access
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
