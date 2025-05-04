import { WebhookIcon } from 'lucide-react';
import React from 'react';
import { Button } from './ui/button';

const Header: React.FC = () => {
    return (
        <div className="flex justify-between items-center p-4 ">
            <div className="flex items-center gap-2">
                <WebhookIcon className="w-6 h-6" />
                <h1 className="text-2xl font-bold">Webhook Care</h1>
            </div>
            <div className="flex items-center">
               <Button>Login</Button>
            </div>
        </div>
    );
};

export default Header; 