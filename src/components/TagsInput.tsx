import { Combobox, Input, Pill, PillsInput, useCombobox } from "@mantine/core";
import { useState } from "react";

type TagsInputProps = {
    delimiter: string
    description: string | React.ReactNode
    disabled?: boolean
    error?: string
    label: string | React.ReactNode
    placeholder: string
    value: React.ReactNode[] | string[]
    onValueRemoved?: (index: number) => void
    onValueAdded?: (value: string) => void
    onTagSelected?: (index: number) => void
}

export const TagsInput = ({ delimiter, description, disabled, label, placeholder, value, onValueRemoved, onValueAdded, onTagSelected }: TagsInputProps) => {

    const [selectedIndex, setSelectedIndex] = useState<number>(-1);
    const [pillInputValue, setPillInputValue] = useState<string>('');
    const combobox = useCombobox({});

    value = value.map((value, i) => (
        <Pill
            key={i}
            onClick={() => handleTagSelected(i)}
            withRemoveButton
            onRemove={() => handleValueRemove(i)}
        >
            {value}
        </Pill>
    ));

    const handleValueSubmit = (val: string) => {
        onValueAdded(val);
    }

    const handleValueRemove = (index: number) => {
        onValueRemoved(index);
    }

    const handleTagSelected = (index: number) => {
        setSelectedIndex(index);
        onTagSelected(index);
    }

    const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
        event.preventDefault();
        const clipboardData = event.clipboardData.getData('Text');
        const values = pillInputValue + clipboardData;
        const clipboardValues = values.split(delimiter).map((value) => value.trim());
        clipboardValues.forEach((value) => handleValueSubmit(value));
    }

    return (
        <Combobox store={combobox} onOptionSubmit={handleValueSubmit} disabled={disabled}>
            <PillsInput pointer description={description} label={label}>
                <Pill.Group>
                    {value.length > 0 ? (
                        value
                    ) : (
                        <Input.Placeholder>{placeholder}</Input.Placeholder>
                    )}

                    <Combobox.EventsTarget>
                        <PillsInput.Field
                            value={pillInputValue}
                            placeholder={placeholder}
                            disabled={disabled}
                            onChange={(event) => setPillInputValue(event.currentTarget.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Backspace') {

                                    if (selectedIndex !== -1 || pillInputValue.length === 0) {
                                        event.preventDefault();
                                        handleValueRemove(selectedIndex)
                                    }
                                }
                                else if (event.key === 'Enter') {

                                    if (pillInputValue.length > 0) {
                                        setPillInputValue('');
                                        handleValueSubmit(event.currentTarget.value);
                                    }
                                }
                            }}
                            onPaste={handlePaste}
                        />
                    </Combobox.EventsTarget>
                </Pill.Group>
            </PillsInput>
        </Combobox>
    )
}
