import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from '@/components/ui/select';
import { CircleX, Plus, Sparkles, Trash2Icon } from 'lucide-react';
import React, { useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';


const HTTP_METHODS = ['POST', 'GET', 'PUT', 'DELETE', 'PATCH'];

const WebhookTestSection = (
    { initialPayload, url, isTesting = false }: {
        url: string,
        initialPayload: string,
        isTesting: boolean
    }
) => {
    const [method, setMethod] = useState('POST');
    const [headers, setHeaders] = useState([{ key: '', value: '' }]);
    const [payload, setPayload] = useState(JSON.stringify(JSON.parse(initialPayload), null, 2));
    const [response, setResponse] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleHeaderChange = (idx: number, field: 'key' | 'value', value: string) => {
        setHeaders((prev) => {
            const newHeaders = [...prev];
            newHeaders[idx][field] = value;
            return newHeaders;
        });
    };

    const addHeader = () => setHeaders([...headers, { key: '', value: '' }]);
    const removeHeader = (idx: number) => setHeaders(headers.filter((_, i) => i !== idx));

    const handleSend = async () => {
        setLoading(true);
        setError(null);
        setResponse(null);
        let body: any = undefined;
        let contentTypeSet = false;
        const headerObj: Record<string, string> = {};
        headers.forEach(({ key, value }) => {
            if (key) {
                headerObj[key] = value;
                if (key.toLowerCase() === 'content-type') contentTypeSet = true;
            }
        });
        if (method !== 'GET' && payload) {
            try {
                body = JSON.stringify(JSON.parse(payload));
                if (!contentTypeSet) headerObj['Content-Type'] = 'application/json';
            } catch (e) {
                setError('Invalid JSON payload' + e);
                setLoading(false);
                return;
            }
        }
        try {
            const res = await fetch(url, {
                method,
                headers: headerObj,
                body: method !== 'GET' ? body : undefined,
            });
            const text = await res.text();
            let parsed;
            try {
                parsed = JSON.parse(text);
            } catch {
                parsed = text;
            }
            setResponse({
                status: res.status,
                statusText: res.statusText,
                body: parsed,
            });
        } catch (err: any) {
            setError(err.message || 'Request failed');
        } finally {
            setLoading(false);
        }
    };

    const handleBeautify = () => {
        try {
            setPayload(JSON.stringify(JSON.parse(payload), null, 2));
        } catch (e) {
            setError('Invalid JSON: ' + (e as Error).message);
        }
    };

    return (
        <AnimatePresence>
            {isTesting && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <Card className="">
                        <CardHeader>
                            <CardTitle>Webhook Playground</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="flex gap-2 items-center">

                                <label className="font-medium">Method:</label>
                                <Select value={method} onValueChange={setMethod}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {HTTP_METHODS.map(m => (
                                            <SelectItem key={m} value={m}>{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <label className="font-medium ml-4">URL:</label>
                                <Input
                                    className="flex-1 bg-gray-100"
                                    value={url}
                                    readOnly
                                />
                            </div>
                            <div>
                                <label className="font-medium">Headers:</label>
                                <div className="flex flex-col gap-2 mt-2">
                                    {headers.map((header, idx) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <Input
                                                className="w-40"
                                                placeholder="Key"
                                                value={header.key}
                                                onChange={e => handleHeaderChange(idx, 'key', e.target.value)}
                                            />
                                            <span>:</span>
                                            <Input
                                                className="w-60"
                                                placeholder="Value"
                                                value={header.value}
                                                onChange={e => handleHeaderChange(idx, 'value', e.target.value)}
                                            />
                                            {headers.length > 1 && (
                                                <Button
                                                    className="px-2"
                                                    onClick={() => removeHeader(idx)}
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    <Trash2Icon className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    <Button
                                        className="mt-1 text-sm self-start"
                                        onClick={addHeader}
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                    >
                                        <Plus className="w-4 h-4 mr-2" /> Add Header
                                    </Button>
                                </div>
                            </div>
                            {method !== 'GET' && (
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="font-medium text-base block">JSON Payload:</label>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        className="cursor-pointer"
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={handleBeautify}
                                                    >
                                                        <Sparkles />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    Beautify JSON
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <div className="rounded border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 shadow-sm">
                                        <Textarea
                                            className="font-mono bg-transparent border-none focus:ring-0 focus:outline-none resize-none"
                                            value={payload}
                                            onChange={e => setPayload(e.target.value)}
                                            placeholder={'{\n  "key": "value"\n}'}
                                        />
                                    </div>

                                </div>
                            )}
                            <div className="flex justify-end">
                                <Button
                                    className="w-fit"
                                    onClick={handleSend}
                                    disabled={loading}
                                    type="button"
                                    size="sm"
                                >
                                    {loading ? 'Sending...' : 'Send Request'}
                                </Button>
                            </div>
                            {error && (
                                <Alert variant="destructive" className="font-mono w-full ">
                                    <CircleX className="w-4 h-4" />
                                    <AlertTitle>Heads up!</AlertTitle>
                                    <AlertDescription>
                                        {error}
                                    </AlertDescription>
                                </Alert>
                            )}
                            {response && (
                                <Card className="mt-4">
                                    <CardHeader>
                                        <CardTitle>Response</CardTitle>
                                    </CardHeader>
                                    <CardContent className="">
                                        <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">Status: {response.status} {response.statusText}</div>
                                        <pre className="p-2 rounded text-xs overflow-x-auto border dark:border-zinc-400/65">{typeof response.body === 'string' ? response.body : JSON.stringify(response.body, null, 2)}</pre>
                                    </CardContent>
                                </Card>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default WebhookTestSection;