"use client"
import React from 'react';
import { useUser } from '@/hooks/useUser';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import Link from 'next/link';
import { useProfile } from '@/profile/api';
import { APP_NAME } from '@/constant/app-constant';
import Image from 'next/image';
import { Webhook } from 'lucide-react';
import GetStartedBtn from '@/home/get-started-btn';
import { Button } from './ui/button';

const NAV_LINKS = [
    { label: 'Features', href: '/#features' },
    { label: 'Try it', href: '/#playground' },
];

/**
 * Public marketing header — a floating glass bar (marketing pages are
 * forced-dark, so there is no theme toggle here; the dashboard keeps its own).
 * Logo links home; center nav anchors into the landing sections; right side
 * carries the Product Hunt badge, primary CTA, and (for known users) a
 * profile avatar.
 */
const Header: React.FC = () => {
    const user = useUser();
    // Shared profile cache — updates from the settings page reflect here live.
    // Best-effort: the route is owner-guarded, so it simply yields nothing on
    // pages without a session (retries disabled in the hook).
    const { profile } = useProfile(user?.id);

    return (
        <header className="sticky top-3 z-50 px-3">
            <div className="glass container mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-4 py-2.5">
                <Link href="/" aria-label={APP_NAME}>
                    <div className="flex items-center gap-3">
                        <span className="flex size-9 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent2 text-accentfg shadow-[0_4px_14px_var(--accent-soft)]">
                            <Webhook className="size-5" strokeWidth={2.2} />
                        </span>
                        <h1 className="hidden text-lg font-bold tracking-tight md:block">{APP_NAME}</h1>
                    </div>
                </Link>

                <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="rounded-lg px-3 py-1.5 text-sm font-medium text-mid transition-colors hover:bg-accent-soft/50 hover:text-foreground"
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-2 md:gap-3">
                    <a
                        href="https://www.producthunt.com/posts/webhook-catcher?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-webhook-catcher"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden sm:block"
                    >
                        <Image
                            src={`https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=970283&theme=dark&t=1748547517762`}
                            alt="Webhook Catcher - Create instant disposable Webhooks to inspect & respond fast | Product Hunt"
                            width={150}
                            height={24}
                        />
                    </a>

                    <GetStartedBtn cta="header">
                        <Button size="sm">Open Dashboard</Button>
                    </GetStartedBtn>

                    {profile?.userName && (
                        <Link href={`/dashboard/${user?.id}/setting/profile`} className="hidden md:block">
                            <Avatar className="size-9">
                                <AvatarImage
                                    src={profile?.userImage ? `/avatar/${profile.userImage}` : user?.imageUrl}
                                    className="object-cover"
                                />
                                <AvatarFallback>
                                    {profile.userName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
