import { Stack, Table, Text, type TableProps } from "@mantine/core"
import { useState, type ReactNode } from "react"
import { KeyValueRow } from "~components/KeyValueInput/KeyValueRow"
import { consoleProxy } from "~utils/logging"

export type KeyValueInputProps = {
    value: Map<string, string>
    onChange: (value: Map<string, string>) => void
    label?: string | ReactNode
    description?: string | ReactNode
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
    const [generation, setGeneration] = useState(0)
    const copied = new Map(value)

    if (!copied.has('')) {
        copied.set('', '')
    }
    const [rows, setRows] = useState(copied)

    const rowOnChange = (oldKey: string, newKey: string, oldValue: string, newValue: string) => {
        const newMap = new Map<string, string>()
        // renaming a key or updating a value
        value.forEach((val, key) => {
            if (key == oldKey) {
                newKey && newMap.set(newKey, newValue)
            } else {
                newMap.set(key, val)
            }
        })
        // adding a new key to an empty map
        if (!newMap.has(newKey)) {
            newMap.set(newKey, newValue)
        }

        if (newMap.size < value.size) {
            consoleProxy.debug(`incrementing generation to: ${generation + 1}`)
            setGeneration(generation + 1)
        }
        onChange(newMap)
    }

    const onRemove = (index: number, key: string) => {
        const newMap = new Map(value) // Create a new Map instance
        newMap.delete(key)
        consoleProxy.debug(`incrementing generation to: ${generation + 1}`)
        setGeneration(generation + 1)
        onChange(newMap)
    }

    let i = 0;

    const getRowKey = (i: number, key: string) => {
        const rowKey = `${generation}.${i}`
        // consoleProxy.debug(`getRowKey(${i}, ${key}) => ${rowKey}`)
        // return rowKey
        return key
    }

    value.forEach((val, key) => {
        rows.push(<KeyValueRow _key={key} key={getRowKey(i, key)} value={val} onChange={rowOnChange} onRemove={() => onRemove(i, key)} keyPlaceholder={keyPlaceholder} valuePlaceholder={valuePlaceholder} />)
        i++;
    })

    if (!value.has('')) {
        rows.push(<KeyValueRow _key='' key={getRowKey(i, '')} value='' onChange={rowOnChange} onRemove={() => { }} keyPlaceholder={keyPlaceholder} valuePlaceholder={valuePlaceholder} />)
    }

    rows.forEach((row, i) => consoleProxy.debug(`row ${i}: ${row.props._key} => ${row.key}`))

    return (
        <Stack gap={0} style={fullWidth && { width: '100%' }}>
            <Stack gap={0} style={{ marginBottom: 'calc(var(--mantine-spacing-xs) / 2)' }}>
                <Text component="label" size='sm' fw='500'>{label}</Text>
                <Text size="xs" c="var(--mantine-color-dimmed)">{description}</Text>
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