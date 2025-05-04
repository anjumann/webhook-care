"use client"
import { WebhookIcon } from 'lucide-react';
import React, { useEffect, useState  } from 'react';
import { useUser } from '@/hooks/useUser';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import Link from 'next/link';
import { getProfile } from '@/profile/api';

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
                    <h1 className="text-2xl font-bold">Webhook Care</h1>
                </div>
            </Link>
            <div className="flex items-center gap-4">
                <span className="text-sm font-medium">
                    Welcome{profile?.userName ? ` Back, ${profile?.userName.charAt(0).toUpperCase() + profile?.userName.slice(1)}` : ""}
                </span>
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
    );
};

export default Header; 