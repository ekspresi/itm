import React from 'react';

export default function LoadingSpinner() {
    return (
        <div className="flex justify-center items-center py-16">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
    );
}