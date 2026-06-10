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

const Header: React.FC = () => {
    const user = useUser();
    // Shared profile cache — updates from the settings page reflect here live.
    // Best-effort: the route is owner-guarded, so it simply yields nothing on
    // pages without a session (retries disabled in the hook).
    const { profile } = useProfile(user?.id);


    return (
        <div className="flex justify-between items-center p-4 ">
            <Link href={`/dashboard/${user?.id}`}>
                <div className="flex items-center gap-3">
                    <span className="flex size-9 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent2 text-accentfg shadow-[0_4px_14px_var(--accent-soft)]">
                        <Webhook className="size-5" strokeWidth={2.2} />
                    </span>
                    <h1 className="text-2xl font-bold hidden md:block">{APP_NAME}</h1>
                </div>
            </Link>
            <div className="flex items-center gap-4">
                <span className="text-sm font-medium hidden md:block">
                    Welcome{profile?.userName ? ` Back, ${profile?.userName.charAt(0).toUpperCase() + profile?.userName.slice(1)}` : ""}
                </span>
                <div className='flex items-center gap-1'>
                    <ModeToggle />
                    <a
                        href="https://www.producthunt.com/posts/webhook-catcher?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-webhook-catcher"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Image
                            src={`https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=970283&theme=dark&t=1748547517762`}
                            alt="Webhook Catcher - Create instant disposable Webhooks to inspect & respond fast | Product Hunt"
                            width={150}
                            height={24}
                        />
                    </a>
                    <Link href={`/dashboard/${user?.id}/setting/profile`}>
                        <Avatar className='size-10' >
                            <AvatarImage src={profile?.userImage ? `/avatar/${profile.userImage}` : user?.imageUrl} className='object-cover' />
                            <AvatarFallback>
                                A
                            </AvatarFallback>
                        </Avatar>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Header; 