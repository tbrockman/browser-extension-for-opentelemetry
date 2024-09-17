import { ActionIcon, Table, TextInput } from "@mantine/core"
import { IconTrash } from "@tabler/icons-react"

export type KeyValueRowProps = {
    _key: string
    value: string
    disabled?: boolean
    onChange: (oldKey: string, newKey: string, oldValue: string, newValue: string) => void
    onRemove: () => void
    keyPlaceholder?: string
    valuePlaceholder?: string
}

// TODO: backspace should remove the row if the key is empty
// TODO: backspace should focus key input if the value is empty
export const KeyValueRow = ({ _key: key, value, onChange, onRemove, disabled, keyPlaceholder, valuePlaceholder }: KeyValueRowProps) => {

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
                    placeholder={keyPlaceholder} />

            </Table.Td>
            <Table.Td style={{ flexGrow: 1 }}>
                <TextInput
                    value={value}
                    onChange={valueOnChange}
                    disabled={disabled}
                    placeholder={valuePlaceholder}
                />

            </Table.Td>
            <Table.Td>
                <ActionIcon onClick={onRemove} disabled={disabled || !key}>
                    <IconTrash />
                </ActionIcon>
            </Table.Td>
        </Table.Tr>
    )
}