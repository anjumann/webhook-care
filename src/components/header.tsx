"use client"
import React from 'react';
import { useUser } from '@/hooks/useUser';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import Link from 'next/link';
import { useProfile } from '@/profile/api';
import { ModeToggle } from './theme-toggle';
import { APP_NAME } from '@/constant/app-constant';
import Image from 'next/image';
import { Webhook } from 'lucide-react';
import GetStartedBtn from '@/home/get-started-btn';
import { Button } from './ui/button';

/**
 * Public marketing header — sticky, self-contained (owns its container).
 * Logo links home; right side carries theme toggle, the Product Hunt badge,
 * a primary CTA, and (for known users) a profile avatar.
 */
const Header: React.FC = () => {
    const user = useUser();
    // Shared profile cache — updates from the settings page reflect here live.
    // Best-effort: the route is owner-guarded, so it simply yields nothing on
    // pages without a session (retries disabled in the hook).
    const { profile } = useProfile(user?.id);

    return (
        <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
            <div className="container mx-auto flex items-center justify-between px-4 py-3">
                <Link href="/" aria-label={APP_NAME}>
                    <div className="flex items-center gap-3">
                        <span className="flex size-9 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent2 text-accentfg shadow-[0_4px_14px_var(--accent-soft)]">
                            <Webhook className="size-5" strokeWidth={2.2} />
                        </span>
                        <h1 className="hidden text-xl font-bold tracking-tight md:block">{APP_NAME}</h1>
                    </div>
                </Link>

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

                    <ModeToggle />

                    <GetStartedBtn>
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
