"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  LogOut, 
  Settings, 
  Shield, 
  User, 
  BarChart,
  Bell
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signOut } from "@/app/(login)/actions"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export function NavUser() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  
  useEffect(() => {
    // This is a workaround since we can't use async server components in client components directly
    // In a real app, you might want to use a context provider or state management solution
    fetch('/api/user')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user)
        }
      })
      .catch(err => {
        console.error('Error fetching user', err)
        // Set a default user for demo purposes
        setUser({
          name: "Demo User",
          email: "user@example.com"
        })
      })
  }, [])

  async function handleSignOut() {
    await signOut()
    router.refresh()
    router.push('/')
  }

  if (!user) {
    return (
      <div className="p-4 rounded-lg border-0 bg-card/50 shadow-sm">
        <div className="flex items-center">
          <Avatar className="h-9 w-9 rounded-md">
            <AvatarFallback>...</AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="text-sm font-medium text-foreground">Loading...</p>
            <p className="text-xs text-muted-foreground">Please wait</p>
          </div>
        </div>
      </div>
    )
  }

  const avatar = `https://ui-avatars.com/api/?name=${user.name || user.email}&background=random`
  const initials = user.name 
    ? user.name.charAt(0).toUpperCase() 
    : user.email.charAt(0).toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="w-full flex items-center justify-start h-auto p-4 rounded-lg hover:bg-secondary/50 shadow-sm bg-card/50 border-0"
        >
          <Avatar className="h-9 w-9 rounded-md">
            <AvatarImage src={avatar} alt={user.name || user.email} />
            <AvatarFallback className="rounded-md">{initials}</AvatarFallback>
          </Avatar>
          <div className="ml-3 text-left">
            <p className="text-sm font-medium text-foreground">{user.name || 'User'}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[150px]">{user.email}</p>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" sideOffset={8} alignOffset={-40}>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.name || 'User'}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/profile" className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/security" className="cursor-pointer">
              <Shield className="mr-2 h-4 w-4" />
              <span>Security</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/activity" className="cursor-pointer">
              <BarChart className="mr-2 h-4 w-4" />
              <span>Activity</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <form action={handleSignOut} className="w-full">
          <button type="submit" className="w-full">
            <DropdownMenuItem className="w-full cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}