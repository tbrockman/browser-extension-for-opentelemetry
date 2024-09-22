import { Stack, Table, Text, type TableProps } from "@mantine/core"
import { useEffect, useState, type ReactNode } from "react"
import { KeyValueRow } from "~components/KeyValueInput/KeyValueRow"
import { consoleProxy } from "~utils/logging"

export type KeyValueInputProps = {
    value: Map<string, string>
    onChange: (value: Map<string, string>, revision: number) => void
    label?: string | ReactNode
    description?: string | ReactNode
    disabled?: boolean
    tableProps: TableProps
    keyPlaceholder?: string
    valuePlaceholder?: string
    fullWidth?: boolean
    revision?: number
}

const withEmptyRow = (map: Map<string, string>) => {
    if (!map.has('')) {
        map.set('', '')
    }
    return Array.from(map.entries())
}

const generateUniqueId = () => '_' + Math.random().toString(36).substr(2, 9);

/**
 * A component that allows the user to input key-value pairs.
 * (a wrapper around Table that allows for adding/removing rows, key/value columns, and editable cells)
 */
export const KeyValueInput = ({ value, onChange, label, description, disabled, tableProps, keyPlaceholder, valuePlaceholder, fullWidth, revision }: KeyValueInputProps) => {
    const [rows, setRows] = useState<{ id: string, key: string, value: string }[]>(
        withEmptyRow(value).map(([key, val]) => ({ id: generateUniqueId(), key, value: val }))
    );
    const [internalRevision, setInternalRevision] = useState(0);

    useEffect(() => {
        if (revision && internalRevision > revision) return

        const newRows = withEmptyRow(value).map(([key, val]) => {
            // TODO: should require iterating through all rows since this is a map
            const row = rows.find(row => row.key === key && row.value === val);
            if (row) {
                return row;
            } else {
                return { id: generateUniqueId(), key, value: val }
            }
        });

        consoleProxy.debug('rows for comp', rows, 'newRows', newRows)
        // TODO: preserve focus on changing empty row
        if (!rows.every(({ id }, i) => id === newRows[i]?.id) || rows.length !== newRows.length) {
            consoleProxy.log('actually setting??', newRows, 'internal rev', internalRevision, 'parent rev', revision)
            setRows(newRows);
        }
    }, [value]);

    useEffect(() => {
        // Create a new Map and call onChange with the updated rows
        const newMap = new Map(rows.filter(({ key, value }) => (key || value)).map(({ key, value }) => [key, value]));
        consoleProxy.log('calling onChange', newMap, 'internal rev', internalRevision, 'parent rev', revision)
        onChange(newMap, internalRevision);
    }, [internalRevision])

    useEffect(() => {
        setInternalRevision(internalRevision + 1);
    }, [rows])

    const rowOnChange = (id: string) => {
        return (newKey: string, newValue: string) => {
            const updatedRows = rows.map(row =>
                row.id === id ? { ...row, key: newKey, value: newValue } : row
            );
            consoleProxy.log('rowOnChange', { id, newKey, newValue, updatedRows })
            setRows(updatedRows);
        }
    };

    const onRemove = (id: string) => {
        const updatedRows = rows.filter(row => row.id !== id);
        setRows(updatedRows);
    };

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
                    {rows.map(({ id, key, value: val }, i) => <KeyValueRow _key={key} key={id} value={val} onChange={rowOnChange(id)} onRemove={() => onRemove(id)} keyPlaceholder={keyPlaceholder} valuePlaceholder={valuePlaceholder} />)}
                </Table.Tbody>
            </Table>
        </Stack>
    )
}