"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Home,
  Users,
  Ticket,
  Settings, 
  Shield, 
  BarChart,
  Building,
  CreditCard,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Inbox,
  Clock
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { NavUser } from "./nav-user"
import { useState } from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Card, CardContent, CardAction } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const mainNavItems = [
  { title: "Dashboard", href: "/dashboard", icon: Home },
  { title: "Clients", href: "/dashboard/clients", icon: Building },
  { title: "Tickets", href: "/dashboard/tickets", icon: Ticket },
];

const managementItems = [
  { 
    title: "Team", 
    icon: Users,
    items: [
      { title: "Members", href: "/dashboard/team" },
      { title: "Roles", href: "/dashboard/team/roles" },
      { title: "Invites", href: "/dashboard/team/invites" },
    ]
  },
  { 
    title: "Billing", 
    icon: CreditCard,
    items: [
      { title: "Invoices", href: "/dashboard/billing/invoices" },
      { title: "Plans", href: "/dashboard/billing/plans" },
      { title: "Payment Methods", href: "/dashboard/billing/methods" }
    ]
  },
  { 
    title: "Settings", 
    icon: Settings,
    items: [
      { title: "General", href: "/dashboard/general" },
      { title: "Security", href: "/dashboard/security" },
      { title: "Activity", href: "/dashboard/activity" },
    ]
  },
];

const workspaceItems = [
  { title: "IT Support", color: "bg-blue-500 dark:bg-blue-600" },
  { title: "Development", color: "bg-purple-500 dark:bg-purple-600" },
  { title: "Marketing", color: "bg-orange-500 dark:bg-orange-600" },
];

export function ModernSidebar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(true);

  return (
    <>
      {/* Mobile trigger */}
      <div className="lg:hidden fixed bottom-4 right-4 z-40">
        <Button
          variant="default"
          size="icon"
          className="rounded-full shadow-lg"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile backdrop */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 border-r border-border bg-background transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:w-64 lg:mr-1 lg:mt-1 lg:h-[calc(100vh-0.5rem)] lg:rounded-l-lg shadow-lg shadow-black/5 dark:shadow-black/10",
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full flex flex-col overflow-hidden p-4">
          {/* Header */}
          <div className="flex items-center h-14 px-2">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">E</span>
              </div>
              <span className="text-xl font-semibold text-foreground">ESIT</span>
            </Link>
          </div>

          {/* Main content */}
          <ScrollArea className="flex-1 px-2 py-4">
            <div className="space-y-4">
              {/* Main Nav */}
              <div className="space-y-1">
                {mainNavItems.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                ))}
              </div>

              {/* Management Section */}
              <div className="mt-6">
                <h3 className="text-xs font-medium text-muted-foreground px-3 mb-2">
                  Management
                </h3>
                <div className="space-y-1">
                  {managementItems.map((group) => (
                    <Collapsible key={group.title} className="w-full">
                      <CollapsibleTrigger asChild>
                        <button
                          className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
                        >
                          <div className="flex items-center">
                            <group.icon className="mr-2 h-4 w-4" />
                            <span>{group.title}</span>
                          </div>
                          <ChevronDown className="h-4 w-4 transition-transform duration-200 ui-open:rotate-180" />
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ml-6 mt-1 space-y-1">
                          {group.items.map((item) => (
                            <Link
                              key={item.title}
                              href={item.href}
                              className={cn(
                                "flex items-center rounded-md px-3 py-1.5 text-sm transition-colors",
                                pathname === item.href
                                  ? "text-foreground font-medium"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                              onClick={() => setIsMenuOpen(false)}
                            >
                              <span>{item.title}</span>
                            </Link>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </div>

              {/* Inbox Link */}
              <Link
                href="/dashboard/inbox"
                className="flex items-center mt-4 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
              >
                <Inbox className="mr-2 h-4 w-4" />
                <span>Inbox</span>
              </Link>

              {/* Workspaces Section */}
              <div className="mt-6">
                <h3 className="text-xs font-medium text-muted-foreground px-3 mb-2">
                  Workspaces
                </h3>
                <div className="space-y-1 mt-2">
                  {workspaceItems.map((workspace, index) => (
                    <Link
                      key={index}
                      href="#"
                      className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
                    >
                      <div className={cn("h-4 w-4 rounded-sm mr-2", workspace.color)} />
                      <span>{workspace.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="mt-auto space-y-4">
            {isBannerVisible && (
              <Card className="relative dark:bg-gray-900/20 border-border">
                <CardAction>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setIsBannerVisible(false)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </CardAction>
                <CardContent className="p-4">
                  <h4 className="text-sm font-medium">Storage almost full</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upgrade your plan to get more storage
                  </p>
                  <div className="mt-3">
                    <Progress value={80} className="h-1.5" />
                  </div>
                  <Button
                    variant="card"
                    size="sm"
                    className="mt-3 text-xs w-full"
                  >
                    Upgrade plan
                  </Button>
                </CardContent>
              </Card>
            )}
            <NavUser />
          </div>
        </div>
      </div>
    </>
  )
}