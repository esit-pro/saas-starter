'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User } from '@/lib/db/schema';
import { Bell, LogOut, Search, Settings, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { signOut } from '@/app/(login)/actions';
import { useRouter } from 'next/navigation';

interface DashboardHeaderProps {
  user: User;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.refresh();
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-20 w-full bg-white border-b border-gray-200">
      <div className="h-16 px-4 flex items-center justify-between">
        <div className="flex-1 flex items-center lg:hidden">
          <Link href="/dashboard" className="flex items-center">
            <div className="h-8 w-8 rounded-md bg-orange-500 flex items-center justify-center">
              <span className="text-white font-bold">E</span>
            </div>
            <span className="ml-2 text-xl font-semibold text-gray-900">ESIT</span>
          </Link>
        </div>

        <div className="hidden md:flex-1 md:flex md:items-center md:px-4">
          <div className="flex items-center w-full max-w-md rounded-md bg-gray-100 px-2.5 py-1.5 text-sm">
            <Search className="h-4 w-4 text-gray-500 mr-2" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="flex-1 bg-transparent outline-none"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
            <Bell className="h-5 w-5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={`https://ui-avatars.com/api/?name=${user.name || user.email}&background=random`} 
                    alt={user.name || user.email}
                  />
                  <AvatarFallback>
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
                <Link href="/dashboard/profile">
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <form action={handleSignOut} className="w-full">
                <button type="submit" className="w-full">
                  <DropdownMenuItem className="w-full cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </button>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}