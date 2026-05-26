"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  TestTube2,
  BarChart3,
  Settings,
  BookOpen,
  Bug,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserInfo } from "@/components/user-info";
import { LogoutButton } from "@/components/logout-button";

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Test Execution",
    href: "/test-cycles",
    icon: TestTube2,
  },
  {
    title: "Defect Analytics",
    href: "/defects",
    icon: Bug,
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
  {
    title: "Documentation",
    href: "/docs",
    icon: BookOpen,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center justify-between border-b px-6">
        <div className="flex items-center">
          <TestTube2 className="mr-2 h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">QA Dashboard</h1>
        </div>
        <ThemeToggle />
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4 space-y-2">
        <UserInfo />
        <LogoutButton variant="outline" />
      </div>
    </div>
  );
}
