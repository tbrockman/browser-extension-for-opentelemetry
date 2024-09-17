import { ActionIcon, rem, Stack, Table, Text, TextInput, type TableProps } from "@mantine/core"
import { IconTrash } from "@tabler/icons-react"
import { useState } from "react"
import { consoleProxy } from "~utils/logging"

export type KeyValueFocusTarget = {
    key: string
    target: KeyValueEntryFocusTarget
}
export type KeyValueEntryFocusTarget = 'key' | 'value' | null

export type KeyValueRowProps = {
    _key: string
    value: string
    disabled?: boolean
    shouldFocus?: KeyValueEntryFocusTarget
    onChange: (oldKey: string, newKey: string, oldValue: string, newValue: string) => void
    onRemove: () => void
    keyPlaceholder?: string
    valuePlaceholder?: string
}

// TODO: backspace should remove the row if the key is empty
// TODO: backspace should focus key input if the value is empty
export const KeyValueRow = ({ _key: key, value, onChange, onRemove, disabled, shouldFocus, keyPlaceholder, valuePlaceholder }: KeyValueRowProps) => {

    const keyOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onChange(key, event.currentTarget.value, value, value)
    }

    const valueOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onChange(key, key, value, event.currentTarget.value)
    }

    return (
        <Table.Tr style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
            <Table.Td style={{ paddingLeft: 0 }}>
                <TextInput
                    value={key}
                    onChange={keyOnChange}
                    disabled={disabled}
                    data-autofocus={shouldFocus == 'key' ? true : false}
                    autoFocus={shouldFocus == 'key' ? true : false}
                    placeholder={keyPlaceholder} />

            </Table.Td>
            <Table.Td style={{ flexGrow: 1 }}>
                <TextInput
                    value={value}
                    onChange={valueOnChange}
                    disabled={disabled}
                    data-autofocus={shouldFocus == 'value' ? true : false}
                    autoFocus={shouldFocus == 'value' ? true : false}
                    placeholder={valuePlaceholder}
                />

            </Table.Td>
            <Table.Td>
                <ActionIcon style={{ visibility: key ? 'visible' : 'hidden' }} onClick={onRemove} disabled={disabled || !key}>
                    <IconTrash />
                </ActionIcon>
            </Table.Td>
        </Table.Tr>
    )
}

export type KeyValueInputProps = {
    value: Map<string, string>
    onChange: (value: Map<string, string>) => void
    label?: string
    description?: string
    disabled?: boolean
    tableProps: TableProps
    keyPlaceholder?: string
    valuePlaceholder?: string
    fullWidth?: boolean
}

/**
 * A component that allows the user to input key-value pairs.
 * (a wrapper around Table that allows for adding/removing rows, key/value columns, and editable cells)
 */
export const KeyValueInput = ({ value, onChange, label, description, disabled, tableProps, keyPlaceholder, valuePlaceholder, fullWidth }: KeyValueInputProps) => {
    const [focusTarget, setFocusTarget] = useState<KeyValueFocusTarget>(null)

    let rows = []

    const rowOnChange = (oldKey: string, newKey: string, oldValue: string, newValue: string) => {

        if (oldKey != newKey) {
            value.delete(oldKey)
        }
        value.set(newKey, newValue)
        onChange(value)
        setFocusTarget({ key: newKey, target: oldKey == newKey ? 'value' : 'key' })
    }

    const onRemove = (key: string) => {
        consoleProxy.log('deleting key', key)
        value.delete(key)
        consoleProxy.log('onchange value', value)
        onChange(value)

        if (focusTarget?.key == key) {
            setFocusTarget({ key: '', target: 'key' })
        }
    }
    let i = 0;
    value.forEach((val, key) => {
        rows.push(<KeyValueRow _key={key} key={i} value={val} onChange={rowOnChange} onRemove={() => onRemove(key)} shouldFocus={focusTarget?.key == key ? focusTarget.target : undefined} keyPlaceholder={keyPlaceholder} valuePlaceholder={valuePlaceholder} />)
        i++;
    })

    if (!value.has('')) {
        rows.push(<KeyValueRow _key='' key={i} value='' onChange={rowOnChange} onRemove={() => { }} shouldFocus={focusTarget?.key == '' ? focusTarget.target : undefined} keyPlaceholder={keyPlaceholder} valuePlaceholder={valuePlaceholder} />)
    }

    return (
        <Stack gap={0} style={fullWidth && { width: '100%' }}>
            <Stack gap={0} style={{ marginBottom: 'calc(var(--mantine-spacing-xs) / 2)' }}>
                <Text component="label" size='sm' fw='500'>{label}</Text>
                <Text size="xs" c="gray">{description}</Text>
            </Stack>
            <Table aria-disabled={disabled} {...tableProps}>
                <Table.Tbody
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                    {rows}
                </Table.Tbody>
            </Table>
        </Stack>
    )
}