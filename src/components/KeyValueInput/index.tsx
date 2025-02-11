import { Stack, Table, Text, type TableProps } from "@mantine/core"
import { useEffect, useState, type ReactNode } from "react"
import { KeyValueRow } from "~components/KeyValueInput/KeyValueRow"

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
    const newRows = [...rows];
    const lastRow = rows.length > 0 ? rows[rows.length - 1] : { key: null, value: null };

    if (rows.length == 0 || lastRow.key) {
        newRows.push({ id: generateUniqueId(), key: '', value: '' });
    }
    return newRows;
}

// TODO: consider better way to generate ids than this copilot generated one
const generateUniqueId = () => '_' + Math.random().toString(36).substring(2, 9);

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
            return;
        }
        onChange(newMap);
    }, [rows])

    const rowOnChange = (id: string) => {
        return (newKey: string, newValue: string) => {
            const existingKeyIndex = rows.findIndex(row => row.key === newKey);
            let updatedRows = rows.map(row =>
                row.id === id ? { ...row, key: newKey, value: newValue } : row
            );

            if (existingKeyIndex > -1 && rows[existingKeyIndex].id !== id) {
                updatedRows = updatedRows.filter((row, i) => i !== existingKeyIndex);
            }
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