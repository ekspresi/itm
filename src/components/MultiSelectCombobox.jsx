import React, { useState, useEffect } from 'react';
import {
    Combobox,
    Option,
    makeStyles,
    useId,
    Label,
} from "@fluentui/react-components";

const useStyles = makeStyles({
    root: {
        display: "grid",
        gridTemplateRows: "repeat(1fr)",
        justifyItems: "start",
        gap: "2px",
        maxWidth: "400px",
    },
});

export default function MultiSelectCombobox({ label, options, placeholder, selectedIds, onSelectionChange }) {
    const styles = useStyles();
    const comboId = useId(label);

    // Znajdź nazwy wybranych opcji na podstawie przekazanych ID
    const selectedNames = selectedIds
        .map(id => options.find(opt => opt.id === id)?.name)
        .filter(Boolean);

    const [value, setValue] = useState(selectedNames.join(", "));

    // Aktualizuj wartość w polu, gdy zmienią się zewnętrzne propsy
    useEffect(() => {
        setValue(selectedNames.join(", "));
    }, [selectedIds, options]);

    const onSelect = (_, data) => {
        onSelectionChange(data.selectedOptions);
        setValue(""); // Czyścimy pole po wyborze
    };

    const onFocus = () => {
        setValue(""); // Czyścimy pole, gdy użytkownik chce zacząć pisać
    };

    const onBlur = () => {
        // Po utracie fokusu, pokaż wybrane opcje
        setValue(selectedNames.join(", "));
    };

    const onChange = (event) => {
        setValue(event.target.value); // Aktualizuj tekst podczas pisania
    };

    return (
        <div className={styles.root}>
            <Label id={comboId}>{label}</Label>
            <Combobox
                aria-labelledby={comboId}
                multiselect={true}
                placeholder={placeholder}
                value={value}
                onFocus={onFocus}
                onBlur={onBlur}
                onChange={onChange}
                onOptionSelect={onSelect}
                selectedOptions={selectedIds} // Synchronizujemy wybrane opcje
            >
                {options.map((option) => (
                    <Option key={option.id} value={option.id}>
                        {option.name}
                    </Option>
                ))}
            </Combobox>
        </div>
    );
}