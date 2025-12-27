'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, X, Crown } from 'lucide-react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
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
    const [isPremium, setIsPremium] = useState(false);
    const [isTrial, setIsTrial] = useState(false);
    const [isExpiringSoon, setIsExpiringSoon] = useState(false);

    // Check if user has premium subscription
    useEffect(() => {
        const checkPremiumStatus = async () => {
            if (session?.user?.email) {
                try {
                    const userId = (session.user as any).id || '';
                    const res = await fetch(`/api/payment/status?userId=${userId}&email=${session.user.email}`);
                    const data = await res.json();
                    setIsPremium(data.hasPaid || false);
                    setIsTrial(data.isTrial || false);

                    // Check for expiry
                    if (data.hasPaid && !data.isTrial) {
                        // We need payment details to know expiry, but status API might not return created_at
                        // Let's fetch details if we are premium
                        const detailsRes = await fetch(`/api/payment/details?email=${session.user.email}`);
                        if (detailsRes.ok) {
                            const details = await detailsRes.json();
                            const subscriptionDaysRemaining = Math.ceil((new Date(new Date(details.created_at).getTime() + 30 * 24 * 60 * 60 * 1000).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                            if (subscriptionDaysRemaining <= 3 && subscriptionDaysRemaining >= 0) {
                                setIsExpiringSoon(true);
                            } else {
                                setIsExpiringSoon(false);
                            }
                        }
                    }
                } catch (error) {
                    console.error('Failed to check premium status:', error);
                }
            }
        };
        checkPremiumStatus();
    }, [session]);

    const monthParam = searchParams.get('month');
    const bankParam = searchParams.get('bank');

    const getLinkWithParams = (path: string) => {
        const params = new URLSearchParams();
        if (monthParam) params.set('month', monthParam);
        if (bankParam) params.set('bank', bankParam);

        const queryString = params.toString();
        return queryString ? `${path}?${queryString}` : path;
    };

    return (
        <nav
            className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 left-0 z-50 w-full bg-background"
            role="navigation"
            aria-label="Main navigation"
        >
            <div className="flex items-center h-14 px-4 md:h-16 md:px-6 lg:px-8 max-w-7xl mx-auto">
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
                {session && isPremium && (
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
                        <Link
                            href={getLinkWithParams('/insights')}
                            className={`transition-colors hover:text-foreground/80 ${pathname === '/insights' ? 'text-foreground' : 'text-foreground/60'
                                }`}
                            aria-current={pathname === '/insights' ? 'page' : undefined}
                        >
                            Insights
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
                                    <div className="flex flex-col space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium leading-none">{session.user?.name}</p>
                                            {isPremium && (
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold text-white ${isTrial
                                                    ? 'bg-blue-500'
                                                    : (isExpiringSoon ? 'bg-red-500 animate-pulse' : 'bg-gradient-to-r from-amber-500 to-orange-500')
                                                    }`}>
                                                    {isTrial ? (
                                                        <>
                                                            <span>⏳</span>
                                                            Free Trial
                                                        </>
                                                    ) : (
                                                        isExpiringSoon ? (
                                                            <>
                                                                <span>⚠️</span>
                                                                Expiring
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Crown className="h-3 w-3" />
                                                                Premium
                                                            </>
                                                        )
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {session.user?.email}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {isPremium && (
                                    <DropdownMenuItem asChild>
                                        <Link href="/settings" className="cursor-pointer">
                                            Settings
                                        </Link>
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                    onClick={() => signOut({ callbackUrl: '/' })}
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
                                        <div className="flex flex-col flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{session.user?.name}</span>
                                                {isPremium && (
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold text-white ${isTrial
                                                        ? 'bg-blue-500'
                                                        : (isExpiringSoon ? 'bg-red-500 animate-pulse' : 'bg-gradient-to-r from-amber-500 to-orange-500')
                                                        }`}>
                                                        {isTrial ? (
                                                            <>
                                                                <span>⏳</span>
                                                                Free Trial
                                                            </>
                                                        ) : (
                                                            isExpiringSoon ? (
                                                                <>
                                                                    <span>⚠️</span>
                                                                    Expiring
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Crown className="h-3 w-3" />
                                                                    Premium
                                                                </>
                                                            )
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-muted-foreground">{session.user?.email}</span>
                                        </div>
                                    </div>
                                    {isPremium && (
                                        <>
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
                                            <Link
                                                href={getLinkWithParams('/insights')}
                                                className={`text-lg font-medium transition-colors hover:text-primary ${pathname === '/insights' ? 'text-primary' : 'text-muted-foreground'}`}
                                                onClick={() => setMobileMenuOpen(false)}
                                            >
                                                Insights
                                            </Link>


                                        </>
                                    )}
                                    <Button
                                        variant="ghost"
                                        className="justify-start px-0 text-lg font-medium text-muted-foreground hover:text-primary"
                                        onClick={() => signOut({ callbackUrl: '/' })}
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
