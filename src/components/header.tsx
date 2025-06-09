"use client"
import { GithubIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import Link from 'next/link';
import { getProfile } from '@/profile/api';
import { ModeToggle } from './theme-toggle';
import { APP_NAME } from '@/constant/app-constant';
import { Button } from './ui/button';
import Image from 'next/image';

const Header: React.FC = () => {
    const user = useUser();

    const [profile, setProfile] = useState<any>(null)
    useEffect(() => {
        const updateProfile = async () => {
            if (!user?.id) return
            const response = await getProfile(user?.id)
            setProfile(response)
        }
        updateProfile()
    }, [user?.id])


    return (
        <div className="flex justify-between items-center p-4 ">
            <Link href={`/dashboard/${user?.id}`}>
                <div className="flex items-center ">
                    <Image src="/android-chrome-512x512.png" alt="logo" width={80} height={80} />
                    <h1 className="text-2xl font-bold hidden md:block"> {APP_NAME} </h1>
                </div>
            </Link>
            <div className="flex items-center gap-4">
                <span className="text-sm font-medium hidden md:block">
                    Welcome{profile?.userName ? ` Back, ${profile?.userName.charAt(0).toUpperCase() + profile?.userName.slice(1)}` : ""}
                </span>
                <div className='flex items-center gap-1'>
                    <ModeToggle />
                    <a href="https://github.com/anjumann/webhook-care" target="_blank" >
                        <Button variant="ghost" size="icon" className="p-2" aria-label="GitHub">
                            <GithubIcon className="w-5 h-5" />
                        </Button>
                    </a>
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
                            <AvatarImage src={`/avatar/${profile?.userImage}` || user?.imageUrl} className='object-cover' />
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