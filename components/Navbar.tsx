'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, X } from 'lucide-react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

export function Navbar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const monthParam = searchParams.get('month');

    const getLinkWithParams = (path: string) => {
        if (monthParam) {
            return `${path}?month=${encodeURIComponent(monthParam)}`;
        }
        return path;
    };

    return (
        <nav
            className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 left-0 z-50 w-full bg-background"
            role="navigation"
            aria-label="Main navigation"
        >
            <div className="flex items-center h-14 px-4 md:h-16 md:px-6 lg:px-8">
                {/* Logo */}
                <div className="mr-4 flex">
                    <Link
                        href="/"
                        className="flex items-center space-x-2"
                        aria-label="ClerQ Home"
                    >
                        <span className="font-bold text-xl sm:text-2xl md:text-3xl">ClerQ</span>
                    </Link>
                </div>

                {/* Desktop Navigation */}
                {session && (
                    <nav className="hidden md:flex items-center space-x-6 text-sm font-medium ml-6" aria-label="Primary navigation">
                        <Link
                            href={getLinkWithParams('/dashboard')}
                            className={`transition-colors hover:text-foreground/80 ${pathname === '/dashboard' ? 'text-foreground' : 'text-foreground/60'
                                }`}
                            aria-current={pathname === '/dashboard' ? 'page' : undefined}
                        >
                            Dashboard
                        </Link>
                        <Link
                            href={getLinkWithParams('/transactions')}
                            className={`transition-colors hover:text-foreground/80 ${pathname === '/transactions' ? 'text-foreground' : 'text-foreground/60'
                                }`}
                            aria-current={pathname === '/transactions' ? 'page' : undefined}
                        >
                            Transactions
                        </Link>
                    </nav>
                )}

                {/* Spacer */}
                <div className="flex-1" />

                {/* Desktop User Menu */}
                <div className="hidden md:flex items-center gap-2">
                    {session ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="relative h-8 w-8 rounded-full"
                                    aria-label={`User menu for ${session.user?.name || 'user'}`}
                                >
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage
                                            src={session.user?.image || ''}
                                            alt={`${session.user?.name || 'User'} avatar`}
                                        />
                                        <AvatarFallback>{session.user?.name?.charAt(0) || 'U'}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sticky top-0 z-10 bg-background p-2 sm:p-0 overflow-visible">
                                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1><p className="text-sm font-medium leading-none">{session.user?.name}</p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {session.user?.email}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => signOut()}
                                    aria-label="Sign out"
                                >
                                    <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => signIn('google')}
                            aria-label="Sign in with Google"
                        >
                            Sign In
                        </Button>
                    )}
                </div>

                {/* Mobile Navigation */}
                <div className="flex md:hidden flex-1 justify-end items-center gap-4">
                    {session ? (
                        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" aria-label="Open menu">
                                    <Menu className="h-6 w-6" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                                <SheetTitle className="text-left mb-4">Menu</SheetTitle>
                                <nav className="flex flex-col gap-4">
                                    <div className="flex items-center gap-4 mb-4 pb-4 border-b">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={session.user?.image || ''} />
                                            <AvatarFallback>{session.user?.name?.charAt(0) || 'U'}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{session.user?.name}</span>
                                            <span className="text-xs text-muted-foreground">{session.user?.email}</span>
                                        </div>
                                    </div>
                                    <Link
                                        href={getLinkWithParams('/dashboard')}
                                        className={`text-lg font-medium transition-colors hover:text-primary ${pathname === '/dashboard' ? 'text-primary' : 'text-muted-foreground'}`}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Dashboard
                                    </Link>
                                    <Link
                                        href={getLinkWithParams('/transactions')}
                                        className={`text-lg font-medium transition-colors hover:text-primary ${pathname === '/transactions' ? 'text-primary' : 'text-muted-foreground'}`}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Transactions
                                    </Link>
                                    <Button
                                        variant="ghost"
                                        className="justify-start px-0 text-lg font-medium text-muted-foreground hover:text-primary"
                                        onClick={() => signOut()}
                                    >
                                        <LogOut className="mr-2 h-5 w-5" />
                                        Sign Out
                                    </Button>
                                </nav>
                            </SheetContent>
                        </Sheet>
                    ) : (
                        <Button onClick={() => signIn('google')} size="sm">
                            Sign In
                        </Button>
                    )}
                </div>
            </div>
        </nav>
    );
}
