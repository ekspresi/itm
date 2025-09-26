import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import { SHARED_STYLES } from '../../lib/helpers';

export default function IndicatorModal({ isOpen, onClose, onSave, editingIndicator, category }) {
    const [indicator, setIndicator] = useState({});

    useEffect(() => {
        if (isOpen) {
            setIndicator(editingIndicator || { name: '', icon: '', color: '#000000' });
        }
    }, [isOpen, editingIndicator]);

    const handleSave = () => {
        if (!indicator.name || indicator.name.trim() === '') {
            alert("Nazwa wskaźnika jest wymagana.");
            return;
        }
        onSave(indicator);
    };

    const modalFooter = (
        <>
            <button onClick={onClose} className={SHARED_STYLES.buttons.secondary}>Anuluj</button>
            <button onClick={handleSave} className={SHARED_STYLES.buttons.primary}>Zapisz</button>
        </>
    );

    const title = editingIndicator ? `Edytuj wskaźnik` : `Dodaj nowy wskaźnik`;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} footer={modalFooter} maxWidth="max-w-md">
            <div className="space-y-4">
                <FormField label="Nazwa wyświetlana">
                    <input 
                        type="text" 
                        value={indicator.name || ''} 
                        onChange={e => setIndicator(prev => ({...prev, name: e.target.value}))} 
                        className="w-full p-2 border border-gray-300 rounded-md" 
                    />
                </FormField>
                {category === 'purpose' && (
                    <FormField label="Ikona (np. fa-map-location-dot)">
                        <input 
                            type="text" 
                            value={indicator.icon || ''} 
                            onChange={e => setIndicator(prev => ({...prev, icon: e.target.value}))} 
                            className="w-full p-2 border border-gray-300 rounded-md" 
                        />
                    </FormField>
                )}
                {category === 'gender' && (
                    <FormField label="Kolor (format HEX)">
                        <div className="flex items-center gap-2">
                            <input 
                                type="text" 
                                placeholder="#000000"
                                value={indicator.color || ''} 
                                onChange={e => setIndicator(prev => ({...prev, color: e.target.value}))} 
                                className="w-full p-2 border border-gray-300 rounded-md" 
                            />
                            <div className="w-8 h-8 rounded-md border" style={{ backgroundColor: indicator.color || '#ffffff' }}></div>
                        </div>
                    </FormField>
                )}
            </div>
        </Modal>
    );
}