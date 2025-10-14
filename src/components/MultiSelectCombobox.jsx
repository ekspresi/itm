import React, { useState, useMemo } from 'react';
import { Combobox, Option, Tag, TagGroup } from "@fluentui/react-components";

export default function MultiSelectCombobox({ options, selectedOptions, setSelectedOptions, placeholder }) {
    const [value, setValue] = useState('');

    const handleSelect = (event, data) => {
        if (data.optionValue) {
            const selected = options.find(opt => opt.id === data.optionValue);
            if (selected && !selectedOptions.some(opt => opt.id === selected.id)) {
                setSelectedOptions([...selectedOptions, selected]);
            }
        }
        setValue(''); // Wyczyść pole tekstowe po wyborze
    };

    const handleTagDismiss = (dismissedId) => {
        setSelectedOptions(selectedOptions.filter(opt => opt.id !== dismissedId));
    };
    
    // POPRAWIONA LOGIKA: Filtrujemy opcje na podstawie wprowadzonego tekstu
    const filteredOptions = useMemo(() => {
        if (!value) {
            // Jeśli nic nie wpisano, pokaż wszystkie opcje, które nie są jeszcze wybrane
            return options.filter(opt => !selectedOptions.some(sel => sel.id === opt.id));
        }
        // Jeśli coś wpisano, filtruj po etykiecie
        const lowercasedValue = value.toLowerCase();
        return options.filter(opt => 
            !selectedOptions.some(sel => sel.id === opt.id) &&
            opt.label.toLowerCase().includes(lowercasedValue)
        );
    }, [value, options, selectedOptions]);


    return (
        <div className="flex flex-col gap-2">
            <Combobox
                placeholder={placeholder}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onOptionSelect={handleSelect}
            >
                {filteredOptions.map(option => (
                    <Option key={option.id} value={option.id}>
                        {option.label}
                    </Option>
                ))}
            </Combobox>
            {selectedOptions.length > 0 && (
                <TagGroup onDismiss={(_, data) => handleTagDismiss(data.value)}>
                    {selectedOptions.map(option => (
                        <Tag key={option.id} value={option.id}>
                            {option.label}
                        </Tag>
                    ))}
                </TagGroup>
            )}
        </div>
    );
}