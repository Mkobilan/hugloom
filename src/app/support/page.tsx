"use client";

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { HelpCircle, Mail } from 'lucide-react';

export default function SupportPage() {
    return (
        <AppLayout>
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-slate-blue/10 rounded-full">
                        <HelpCircle className="w-6 h-6 text-slate-blue" />
                    </div>
                    <h1 className="text-2xl font-heading font-bold text-slate-blue">Help & Support</h1>
                </div>

                <div className="bg-[#3C3434] rounded-2xl border border-white/10 p-8 shadow-sm">
                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className="w-16 h-16 bg-slate-blue/20 rounded-full flex items-center justify-center">
                            <Mail className="w-8 h-8 text-slate-blue" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-white">Contact Us</h2>
                            <p className="text-white/80 leading-relaxed max-w-md mx-auto">
                                Have any questions, feedback, report a bug, request a feature, or submit a ticket:
                            </p>
                        </div>

                        <div className="bg-[#4A4042] px-6 py-4 rounded-xl border border-white/5 w-full max-w-md">
                            <p className="text-sm text-white/60 mb-1">Please email</p>
                            <a
                                href="mailto:matthew.kobilan@gmail.com"
                                className="text-lg font-medium text-slate-blue hover:underline break-all"
                            >
                                matthew.kobilan@gmail.com
                            </a>
                        </div>

                        <div className="pt-4 border-t border-white/10 w-full">
                            <p className="text-white/60 font-medium">
                                Thank you for using HugLoom!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
