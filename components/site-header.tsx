"use client"

import { Button } from "@/components/ui/button"
import { User as UserType } from "@/lib/db/schema"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Bell, User, Settings, LogOut } from "lucide-react"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { signOut } from "@/app/(login)/actions"
import { useRouter } from "next/navigation"

interface SiteHeaderProps {
  user?: UserType;
}

export function SiteHeader({ user }: SiteHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push('/sign-in');
  };
  return (
    <header className="sticky top-0 z-10 h-16 shrink-0 bg-background/95 backdrop-blur-sm transition-all ease-linear">
      <div className="flex h-full w-full items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-2">
        </div>

        <div className="flex flex-1 items-center justify-center px-6 max-w-2xl">
          <div className="hidden md:flex items-center w-full rounded-md bg-muted px-2.5 py-1.5 text-sm border border-border/50">
            <Search className="h-4 w-4 text-muted-foreground mr-2" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          
          <Button variant="ghost" size="icon" className="text-foreground relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              3
            </span>
          </Button>
          
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="items-center pl-2 pr-3 py-1.5 h-auto rounded-lg hover:bg-secondary/50 text-left"
                >
                  <Avatar className="h-8 w-8 rounded-md">
                    <AvatarImage 
                      src={`https://ui-avatars.com/api/?name=${user.name || user.email}&background=random`} 
                      alt={user.name || user.email}
                    />
                    <AvatarFallback className="rounded-md">
                      {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/general" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/security" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Security</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="bg-destructive/90 text-destructive-foreground font-medium hover:bg-destructive hover:text-destructive-foreground focus:bg-destructive focus:text-destructive-foreground cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}
