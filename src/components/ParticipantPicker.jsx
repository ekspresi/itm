import React from "react";
import {
  TagPicker,
  TagPickerList,
  TagPickerInput,
  TagPickerControl,
  TagPickerOption,
  TagPickerGroup,
  Tag,
  Avatar,
} from "@fluentui/react-components";

export default function ParticipantPicker({ allParticipants, selectedParticipants, onSelectionChange, placeholder }) {
  
  // Przekształcamy listę obiektów uczestników na listę stringów (imion i nazwisk)
  const options = allParticipants.map(p => `${p.firstName} ${p.lastName}`);
  const selectedOptions = selectedParticipants.map(p => `${p.firstName} ${p.lastName}`);

  const onOptionSelect = (e, data) => {
    // Znajdujemy pełne obiekty uczestników na podstawie wybranych stringów
    const newSelectedParticipants = data.selectedOptions.map(name => 
        allParticipants.find(p => `${p.firstName} ${p.lastName}` === name)
    ).filter(Boolean); // .filter(Boolean) usuwa ewentualne puste wyniki

    onSelectionChange(newSelectedParticipants);
  };

  return (
    <TagPicker
      onOptionSelect={onOptionSelect}
      selectedOptions={selectedOptions}
    >
      <TagPickerControl>
        <TagPickerGroup>
          {selectedOptions.map((option) => (
            <Tag
              key={option}
              shape="rounded"
              media={<Avatar aria-hidden name={option} color="colorful" />}
              value={option}
            >
              {option}
            </Tag>
          ))}
        </TagPickerGroup>
        <TagPickerInput placeholder={placeholder} />
      </TagPickerControl>
      <TagPickerList>
        {options
          .filter((option) => !selectedOptions.includes(option))
          .map((option) => (
            <TagPickerOption
              key={option}
              value={option}
              media={<Avatar aria-hidden name={option} color="colorful" />}
            >
              {option}
            </TagPickerOption>
          ))}
      </TagPickerList>
    </TagPicker>
  );
};