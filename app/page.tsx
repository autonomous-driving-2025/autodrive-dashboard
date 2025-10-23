'use client';

import React from 'react';
import Link from 'next/link';
import { Gamepad2, Map, Sliders, BookOpen, Eye } from 'lucide-react';
import { useRos } from '../contexts/RosContext';
import ConnectionStatusBar from '../components/ConnectionStatusBar';

export default function Dashboard() {
    const {
        isConnected,
        connectionUri,
        robotNamespace,
        connectionStatus,
        isConnecting,
    } = useRos();

    const dashboardCards = [
        {
            title: 'Dashboard',
            description: 'Dashboard',
            icon: <Sliders className="w-8 h-8" />,
            href: '/map',
            color: 'bg-blue-500',
            hoverColor: 'hover:bg-blue-600'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Autodrive Dashboard
                    </h1>
                    <p className="text-lg text-gray-600">
                        The Dasboard Used for Autonomous Driving Car 
                    </p>
                </div>

                {/* Connection Status Card */}
                <ConnectionStatusBar showFullControls={true} />

                {/* Dashboard Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {dashboardCards.map((card, index) => (
                        card.external ? (
                            <a key={index} href={card.href} target="_blank" rel="noopener noreferrer">
                                <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
                                    <div className="p-6">
                                        <div className={`${card.color} text-white p-3 rounded-lg inline-block mb-4`}>
                                            {card.icon}
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                            {card.title}
                                        </h3>
                                        <p className="text-gray-600 mb-4">
                                            {card.description}
                                        </p>
                                        <div className={`${card.color} ${card.hoverColor} text-white px-4 py-2 rounded-md inline-flex items-center transition duration-200`}>
                                            Open Documentation
                                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        ) : (
                            <Link key={index} href={card.href}>
                                <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
                                    <div className="p-6">
                                        <div className={`${card.color} text-white p-3 rounded-lg inline-block mb-4`}>
                                            {card.icon}
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                            {card.title}
                                        </h3>
                                        <p className="text-gray-600 mb-4">
                                            {card.description}
                                        </p>
                                        <div className={`${card.color} ${card.hoverColor} text-white px-4 py-2 rounded-md inline-flex items-center transition duration-200`}>
                                            Open Module
                                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        )
                    ))}
                </div>
            </div>
        </div>
    );

}