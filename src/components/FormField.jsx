import React from 'react';

export default function FormField({ label, htmlFor, children }) {
    return (
        <div>
            <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">
                {label}
            </label>
            {children}
        </div>
    );
}