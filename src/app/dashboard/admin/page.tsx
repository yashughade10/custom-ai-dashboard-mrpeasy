"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Shield, History, Settings, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const modules = [
    { 
      title: "User Management", 
      desc: "Manage users, assign roles, and handle statuses", 
      icon: Users, 
      href: "/dashboard/admin/users", 
      color: "text-blue-500", 
      bg: "bg-blue-500/10" 
    },
    { 
      title: "Roles & Permissions", 
      desc: "Define roles and configure access control", 
      icon: Shield, 
      href: "/dashboard/admin/roles", 
      color: "text-emerald-500", 
      bg: "bg-emerald-500/10" 
    },
    { 
      title: "Audit Log", 
      desc: "Review system events and user actions", 
      icon: History, 
      href: "/dashboard/admin/audit-log", 
      color: "text-amber-500", 
      bg: "bg-amber-500/10" 
    },
    { 
      title: "Settings", 
      desc: "Configure global application settings", 
      icon: Settings, 
      href: "/dashboard/admin/settings", 
      color: "text-purple-500", 
      bg: "bg-purple-500/10" 
    },
  ];

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
        <p className="text-muted-foreground">Manage users, security, and global system settings.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {modules.map((mod, i) => {
          const Icon = mod.icon;
          return (
            <Link key={i} href={mod.href} className="block group h-full">
              <Card className="h-full border-border/50 hover:border-primary/50 transition-all shadow-sm group-hover:shadow-md cursor-pointer flex flex-col">
                <CardHeader>
                  <div className={`p-3 w-fit rounded-xl ${mod.bg} mb-4`}>
                    <Icon className={`w-6 h-6 ${mod.color}`} />
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">{mod.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <p className="text-sm text-muted-foreground mb-4">{mod.desc}</p>
                  <div className="flex items-center text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                    Manage <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
