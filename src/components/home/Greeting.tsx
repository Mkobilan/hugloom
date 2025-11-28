"use client";

import { useEffect, useState } from 'react';

interface GreetingProps {
    username: string;
}

export const Greeting = ({ username }: GreetingProps) => {
    const [greeting, setGreeting] = useState('Hello');

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) {
            setGreeting('Good morning');
        } else if (hour < 18) {
            setGreeting('Good afternoon');
        } else {
            setGreeting('Good evening');
        }
    }, []);

    return (
        <section className="mb-8 text-center animate-in fade-in slide-in-from-top-4 duration-700">
            <h2 className="text-2xl font-heading font-bold text-terracotta mb-2">
                {`${greeting}, ${username} ☕`}
            </h2>
        </section>
    );
};
