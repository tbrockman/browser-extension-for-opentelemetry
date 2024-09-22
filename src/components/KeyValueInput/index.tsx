import { Stack, Table, Text, type TableProps } from "@mantine/core"
import { useEffect, useState, type ReactNode } from "react"
import { KeyValueRow } from "~components/KeyValueInput/KeyValueRow"
import { consoleProxy } from "~utils/logging"

export type KeyValueInputProps = {
    defaultValue: Map<string, string>
    onChange: (value: Map<string, string>) => void
    label?: string | ReactNode
    description?: string | ReactNode
    disabled?: boolean
    tableProps: TableProps
    keyPlaceholder?: string
    valuePlaceholder?: string
    fullWidth?: boolean
}

export type Row = {
    id: string
    key: string
    value: string
}

const withEmptyRow = (rows: Row[]): Row[] => {
    if (rows.length > 0) {
        const lastRow = rows[rows.length - 1];
        if (lastRow.key || lastRow.value) {
            return [...rows, { id: generateUniqueId(), key: '', value: '' }];
        }
    }
    return rows;
}

const generateUniqueId = () => '_' + Math.random().toString(36).substr(2, 9);

/**
 * A component that allows the user to input key-value pairs.
 * (a wrapper around Table that allows for adding/removing rows, key/value columns, and editable cells)
 */
export const KeyValueInput = ({ defaultValue, onChange, label, description, disabled, tableProps, keyPlaceholder, valuePlaceholder, fullWidth }: KeyValueInputProps) => {
    const [rows, setRows] = useState<Row[]>(
        withEmptyRow(Array.from(defaultValue).map(([key, val]) => ({ id: generateUniqueId(), key, value: val } as Row)))
    );

    useEffect(() => {
        const newMap = new Map(rows.filter(({ key, value }) => (key || value)).map(({ key, value }) => [key, value]));

        if (newMap.size === defaultValue.size && Array.from(newMap).every(([key, value]) => defaultValue.has(key) && defaultValue.get(key) === value)) {
            consoleProxy.log('no change')
            return;
        }
        onChange(newMap);
    }, [rows])

    // TODO: handle key collisions
    const rowOnChange = (id: string) => {
        return (newKey: string, newValue: string) => {
            const updatedRows = rows.map(row =>
                row.id === id ? { ...row, key: newKey, value: newValue } : row
            );
            consoleProxy.log('rowOnChange', { id, newKey, newValue, updatedRows })
            setRows(withEmptyRow(updatedRows));
        }
    };

    const onRemove = (id: string) => {
        const updatedRows = rows.filter(row => row.id !== id);
        setRows(withEmptyRow(updatedRows));
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