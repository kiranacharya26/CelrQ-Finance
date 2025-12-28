'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, ListOrdered, LineChart, Settings, LogOut, Crown, ShieldCheck } from 'lucide-react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Image from 'next/image';
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
import { NavbarFilters } from './NavbarFilters';
import { NavbarImport } from './NavbarImport';
import { ModeToggle } from './mode-toggle';
import { MobileFilterBar } from './MobileFilterBar';
import { NavbarActions } from './NavbarActions';
import { useTransactionsContext } from '@/context/TransactionsContext';

export function Navbar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const searchParams = useSearchParams();
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
            <div className="flex items-center h-16 px-4 md:h-20 md:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Logo */}
                <div className="mr-4 flex">
                    <Link
                        href={session ? "/dashboard" : "/"}
                        className="flex items-center"
                        aria-label="ClerQ Home"
                    >
                        <span className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 tracking-tight drop-shadow-sm">
                            ClerQ
                        </span>
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

                {/* Mobile Spacer */}
                <div className="flex-1 md:hidden" />

                {/* Spacer / Desktop Filters */}
                <div className="hidden md:flex flex-1 justify-center px-4 gap-2">
                    {session && isPremium && (
                        <>
                            <NavbarFilters />
                            <NavbarActions />
                        </>
                    )}
                </div>

                {/* Desktop User Menu */}
                <div className="hidden md:flex items-center gap-4">
                    {session && isPremium && <NavbarImport />}
                    {session ? (
                        <>
                            <ModeToggle />
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
                                    <div className="px-2 py-2">
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-md mb-1.5">
                                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Private & Secure</span>
                                        </div>
                                        <p className="px-2 text-[10px] leading-tight text-muted-foreground">
                                            Your data is never sold or shared with third parties.
                                        </p>
                                    </div>
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
                        </>
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
                <div className="flex md:hidden flex-1 justify-end items-center gap-2">
                    <ModeToggle />
                    {session ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" aria-label="User menu">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={session.user?.image || ''} />
                                        <AvatarFallback>{session.user?.name?.charAt(0) || 'U'}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[300px] p-0">
                                {/* User Info Section */}
                                <div className="p-4 pb-3">
                                    <div className="flex items-start gap-3">
                                        <Avatar className="h-12 w-12 border-2 border-border">
                                            <AvatarImage src={session.user?.image || ''} />
                                            <AvatarFallback className="text-base font-semibold">{session.user?.name?.charAt(0) || 'U'}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col flex-1 min-w-0 gap-1">
                                            <p className="text-sm font-semibold leading-none truncate">{session.user?.name}</p>
                                            <p className="text-xs text-muted-foreground truncate leading-none">
                                                {session.user?.email}
                                            </p>
                                            {(isPremium || isTrial) && (
                                                <div className="mt-1.5">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold text-white ${isTrial
                                                        ? 'bg-blue-500'
                                                        : (isExpiringSoon ? 'bg-red-500' : 'bg-gradient-to-r from-amber-500 to-orange-500')
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
                                                                    Expiring Soon
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Crown className="h-3 w-3" />
                                                                    Premium
                                                                </>
                                                            )
                                                        )}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <DropdownMenuSeparator className="my-0" />

                                {/* Security Badge Section */}
                                <div className="p-4 py-3 bg-muted/30">
                                    <div className="flex items-start gap-2">
                                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex-shrink-0">
                                            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 leading-tight mb-0.5">
                                                Private & Secure
                                            </p>
                                            <p className="text-[10px] leading-snug text-muted-foreground">
                                                Your data is never sold or shared with third parties.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <DropdownMenuSeparator className="my-0" />

                                {/* Sign Out */}
                                <div className="p-1">
                                    <DropdownMenuItem
                                        onClick={() => signOut({ callbackUrl: '/' })}
                                        className="cursor-pointer py-2.5 px-3"
                                        aria-label="Sign out"
                                    >
                                        <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                                        <span className="font-medium">Log out</span>
                                    </DropdownMenuItem>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button onClick={() => signIn('google')} size="sm">
                            Sign In
                        </Button>
                    )}
                </div>
            </div>
            {session && isPremium && <MobileFilterBar />}
        </nav>
    );
}
