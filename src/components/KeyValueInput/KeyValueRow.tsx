import { ActionIcon, Table, TextInput } from "@mantine/core"
import { IconTrash } from "@tabler/icons-react"
import { useEffect, useRef } from "react"

export type KeyValueRowProps = {
    _key: string
    value: string
    disabled?: boolean
    onChange: (newKey: string, newValue: string) => void
    onRemove: () => void
    keyPlaceholder?: string
    valuePlaceholder?: string
}

// TODO: backspace on the first input should remove the row if all inputs are empty
// TODO: backspace should focus the previous input if the current input is empty 
export const KeyValueRow = ({ _key: key, value, onChange, onRemove, disabled, keyPlaceholder, valuePlaceholder }: KeyValueRowProps) => {

    const keyOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onChange(event.currentTarget.value, value)
    }

    const valueOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onChange(key, event.currentTarget.value)
    }

    return (
        <Table.Tr style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
            <Table.Td style={{ paddingLeft: 0 }}>
                <TextInput
                    defaultValue={key}
                    onChange={keyOnChange}
                    disabled={disabled}
                    placeholder={keyPlaceholder} />

            </Table.Td>
            <Table.Td style={{ flexGrow: 1 }}>
                <TextInput
                    defaultValue={value}
                    onChange={valueOnChange}
                    disabled={disabled}
                    placeholder={valuePlaceholder}
                />

            </Table.Td>
            <Table.Td>
                <ActionIcon onClick={onRemove} disabled={disabled || !(key || value)}>
                    <IconTrash />
                </ActionIcon>
            </Table.Td>
        </Table.Tr>
    )
}