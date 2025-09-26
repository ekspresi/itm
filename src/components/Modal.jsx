import React from 'react';

export default function Modal({ isOpen, onClose, title, children, footer, maxWidth = 'max-w-2xl' }) {
    if (!isOpen) {
        return null;
    }

    const handleOverlayClick = () => {
        if (window.innerWidth < 768) {
            onClose();
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
            onClick={handleOverlayClick}
        >
            <div 
                className={`bg-white rounded-lg shadow-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col`}
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 border-b flex justify-between items-center shrink-0">
                    <h2 className="text-xl font-bold">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <i className="fa-solid fa-xmark fa-lg"></i>
                    </button>
                </header>
                <main className="p-6 flex-grow overflow-y-auto">
                    {children}
                </main>
                {footer && (
                    <footer className="p-4 bg-gray-50 border-t flex justify-between items-center shrink-0">
                        {footer}
                    </footer>
                )}
            </div>
        </div>
    );
};