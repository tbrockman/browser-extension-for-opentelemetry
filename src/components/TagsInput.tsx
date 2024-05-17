import { Combobox, Pill, PillsInput, Tooltip, useCombobox } from "@mantine/core";
import { useClickOutside } from "@mantine/hooks";
import { IconExclamationCircle } from "@tabler/icons-react";
import { useEffect, useState } from "react";

type PillErrorMap = Map<number, string>

type TagsInputProps = {
    delimiter: string
    description: string | React.ReactNode
    disabled?: boolean
    error?: string
    errors?: PillErrorMap
    label: string | React.ReactNode
    placeholder: string
    value: React.ReactNode[] | string[]
    onValueRemoved?: (index: number) => void
    onValueAdded?: (value: string) => void
    onTagSelected?: (index: number) => void
}

export const TagsInput = ({ delimiter, description, disabled, errors, label, placeholder, value, onValueRemoved, onValueAdded, onTagSelected }: TagsInputProps) => {
    const [selectedIndex, setSelectedIndex] = useState<number>(-1);
    const [pillInputValue, setPillInputValue] = useState<string>('');
    const handleClickOutside = () => setSelectedIndex(-1);
    const ref = useClickOutside(handleClickOutside, ['mousedown', 'touchstart', 'focusin']);
    const combobox = useCombobox({});

    value = value.map((value, i) => {
        const hasError = errors?.has(i);
        const error = errors?.get(i);
        const styles = {
            root: {
                ...(hasError && {
                    backgroundColor: 'var(--mantine-color-error)',
                    color: 'var(--mantine-color-white)',
                }),
                ...(i == selectedIndex && {
                    outline: '2px solid var(--mantine-primary-color-filled)',
                    outlineOffset: 'calc(.125rem* var(--mantine-scale))'
                }),
            },
            label: {
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
            }
        }
        const inner =
            <Pill
                component={'div'}
                tabIndex={0}
                key={i}
                className="mantine-focus-always"
                styles={styles}
                onClick={(event) => {
                    event.preventDefault();
                    event.currentTarget.focus();
                }}
                onKeyDown={(event) => {
                    if (event.key === 'Backspace' || event.key === 'Delete') {
                        handleValueRemoved(i);
                    }
                }}
                onFocus={(e) => {
                    event.preventDefault();
                    handleTagSelected(i)
                }}
                withRemoveButton
                onRemove={() => handleValueRemoved(i)}
            >
                {hasError && <IconExclamationCircle width={12} height={12} />}
                {value}
            </Pill>
        return hasError
            ? <Tooltip
                label={error}
                withArrow
                color='red'
                events={{ hover: true, focus: true, touch: true }}>
                {inner}</Tooltip >
            : inner
    });

    const handleValueSubmit = (val: string) => {
        onValueAdded && onValueAdded(val);
    }

    const handleValueRemoved = (index: number) => {
        onValueRemoved && onValueRemoved(index);
    }

    const handleTagSelected = (index: number) => {
        setSelectedIndex(index);
        onTagSelected && onTagSelected(index);
    }

    useEffect(() => {
        const split = pillInputValue.split(delimiter);

        if (split.length > 1) {
            const last = split.pop();
            split.forEach((value) => handleValueSubmit(value.trim()));
            setPillInputValue(last);
        }

    }, [pillInputValue])

    return (
        <Combobox store={combobox} onOptionSubmit={handleValueSubmit} disabled={disabled}>
            <PillsInput ref={ref} pointer description={description} label={label}>
                <Pill.Group>
                    {value}

                    <Combobox.EventsTarget>
                        <PillsInput.Field
                            value={pillInputValue}
                            placeholder={placeholder}
                            disabled={disabled}
                            onFocus={() => {
                                setSelectedIndex(-1);
                            }}
                            onChange={(event) => {
                                setPillInputValue(event.currentTarget.value)
                                setSelectedIndex(-1);
                            }}
                            onKeyDown={(event) => {
                                if (event.key === 'Backspace') {

                                    if (selectedIndex !== -1 || pillInputValue.length === 0) {
                                        event.preventDefault();
                                        handleValueRemoved(selectedIndex)
                                    }
                                }
                                else if (event.key === 'Enter') {

                                    if (pillInputValue.length > 0) {
                                        setPillInputValue('');
                                        handleValueSubmit(event.currentTarget.value);
                                    }
                                }
                            }}
                        />
                    </Combobox.EventsTarget>
                </Pill.Group>
            </PillsInput>
        </Combobox>
    )
}
