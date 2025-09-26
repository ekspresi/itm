import React from 'react';
import FormField from './FormField';

export default function NumberInput({ label, value, onChange }) {
    return (
        <FormField label={label}>
            <div className="relative">
                <input 
                    type="number" 
                    value={value} 
                    onChange={e => onChange(e.target.value)} 
                    placeholder="0,00" 
                    step="0.01" 
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm pl-4 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">zł</span>
            </div>
        </FormField>
    );
}