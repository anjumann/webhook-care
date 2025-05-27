"use client"
import { GithubIcon, WebhookIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import Link from 'next/link';
import { getProfile } from '@/profile/api';
import { ModeToggle } from './theme-toggle';
import { APP_NAME } from '@/constant/app-constant';
import { Button } from './ui/button';

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
                <div className="flex items-center gap-2">
                    <WebhookIcon className="w-6 h-6" />
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
                    <a href="https://www.producthunt.com/posts/webhook-catcher" target="_blank" >
                        <Button variant="ghost" size="icon" className="p-2" aria-label="Product Hunt">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <title>Product Hunt icon</title>
                                <path d="M13.604 8.4h-3.405V12h3.405c.995 0 1.801-.806 1.801-1.801 0-.993-.805-1.799-1.801-1.799zM12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm1.604 14.4h-3.405V18H7.801V6h5.804c2.319 0 4.2 1.88 4.2 4.199 0 2.321-1.881 4.201-4.201 4.201z"/>
                            </svg>
                        </Button>
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