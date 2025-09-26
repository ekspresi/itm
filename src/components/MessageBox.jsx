import React, { useState, useEffect } from 'react';

export default function MessageBox({ message, type, onDismiss }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (message) {
            setIsVisible(true);
            const timer = setTimeout(() => handleDismiss(), 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const handleDismiss = () => {
        setIsVisible(false);
        setTimeout(() => {
            if(onDismiss) onDismiss();
        }, 300);
    };

    if (!message) return null;

    const baseClasses = 'fixed bottom-5 right-5 max-w-sm w-full p-4 rounded-lg shadow-2xl flex items-start gap-3 z-50 transition-all duration-300';
    const visibilityClasses = isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10';
    const typeClasses = { success: 'bg-green-100 text-green-800', error: 'bg-red-100 text-red-800', info: 'bg-blue-100 text-blue-800' };
    const iconClasses = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle' };

    return (
        <div className={`${baseClasses} ${typeClasses[type] || typeClasses.info} ${visibilityClasses}`}>
            <i className={`fa-solid ${iconClasses[type] || iconClasses.info} mt-1`}></i>
            <span className="flex-grow text-sm font-semibold">{message}</span>
            <button onClick={handleDismiss} className="text-gray-500 hover:text-black">
                <i className="fa-solid fa-xmark"></i>
            </button>
        </div>
    );
};