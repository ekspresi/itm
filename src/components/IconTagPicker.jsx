import React from 'react';
import {
    TagPicker,
    TagPickerList,
    TagPickerButton,
    TagPickerControl,
    TagPickerOption,
    TagPickerGroup,
    Tag,
    Avatar, // Użyjemy Avatar jako fallback, gdyby nie było ikony
    Field,
} from "@fluentui/react-components";

export default function IconTagPicker({ label, options, placeholder, selectedIds, onSelectionChange }) {
    // Logika wyboru opcji
    const onOptionSelect = (_, data) => {
        onSelectionChange(data.selectedOptions);
    };

    // Filtruj opcje, aby w liście pokazać tylko te, które nie są jeszcze wybrane
    const availableOptions = options.filter(
        (option) => !selectedIds.includes(option.id)
    );

    return (
        <Field label={label}>
            <TagPicker
                onOptionSelect={onOptionSelect}
                selectedOptions={selectedIds}
            >
                <TagPickerControl>
                    <TagPickerGroup>
                        {selectedIds.map((id) => {
                            const option = options.find(opt => opt.id === id);
                            if (!option) return null;

                            // Używamy ikony Font Awesome jako "media" dla tagu
                            const media = option.icon 
                                ? <i className={`fa-solid ${option.icon} fa-fw`}></i>
                                : <Avatar name={option.name} color="colorful" />;

                            return (
                                <Tag key={id} shape="rounded" media={media} value={id}>
                                    {option.name}
                                </Tag>
                            );
                        })}
                    </TagPickerGroup>
                    <TagPickerButton aria-label={label} />
                </TagPickerControl>

                <TagPickerList>
                    {availableOptions.length > 0 ? (
                        availableOptions.map((option) => {
                            // Używamy ikony Font Awesome jako "media" dla opcji na liście
                            const media = option.icon 
                                ? <i className={`fa-solid ${option.icon} fa-fw`}></i>
                                : <Avatar shape="square" name={option.name} color="colorful" />;

                            return (
                                <TagPickerOption media={media} value={option.id} key={option.id}>
                                    {option.name}
                                </TagPickerOption>
                            );
                        })
                    ) : (
                        <TagPickerOption value="no-options" disabled>
                            Brak dostępnych opcji
                        </TagPickerOption>
                    )}
                </TagPickerList>
            </TagPicker>
        </Field>
    );
}