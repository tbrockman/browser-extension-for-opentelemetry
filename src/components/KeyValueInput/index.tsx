import { Stack, Table, Text, type TableProps } from "@mantine/core"
import { useEffect, useState, type ReactNode } from "react"
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

    const [rows, setRows] = useState<[string, string][]>(Array.from(value.entries()))

    consoleProxy.log('rows', rows, 'value', value)

    useEffect(() => {
        const newMap = new Map(value)
        if (!newMap.has('')) {
            newMap.set('', '')
        }
        const newRows = Array.from(newMap.entries())
        consoleProxy.log('on change for value with newRows', newRows)
        setRows(newRows)
    }, [value])

    useEffect(() => {
        consoleProxy.log('in rows dep with', rows, 'and value', value)
        // remove last row if it's empty
        const hasUnmatchedLastEmptyRow = rows.length > 0 && rows[rows.length - 1][0] == '' && rows[rows.length - 1][1] == '' && value.get('') != ''
        const fromRows = hasUnmatchedLastEmptyRow ? rows.slice(0, -1) : rows

        consoleProxy.log('in rows dep with fromRows', fromRows, 'has unmatched last empty row', hasUnmatchedLastEmptyRow)

        if (!(fromRows.every(([key, val]) => (value.has(key) && value.get(key) == val)) && fromRows.length == value.size)) {
            const newMap = new Map(fromRows)
            consoleProxy.log('on change for rows with newMap', newMap)
            onChange(newMap)
        }
    }, [rows])

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
        setRows(Array.from(newMap.entries()))
    }

    const onRemove = (index: number, key: string) => {
        const newRows = rows.filter(([k, v], i) => i != index)
        setRows([...newRows])
    }

    let i = 0;

    const getRowKey = (i: number, key: string, val: string) => {
        return `kv-row-${i}`
        // return !(key && val) ? `kv-row-null` : `kv-row-${i}`
    }

    return (
        <Stack gap={0} style={fullWidth ? { width: '100%' } : {}}>
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
                    {rows.map(([key, val], i) => <KeyValueRow _key={key} key={getRowKey(i, key, val)} value={val} onChange={rowOnChange} onRemove={() => onRemove(i, key)} keyPlaceholder={keyPlaceholder} valuePlaceholder={valuePlaceholder} />)}
                </Table.Tbody>
            </Table>
        </Stack>
    )
}