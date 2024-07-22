import {
    Box,
    Fieldset,
    Group,
    ScrollArea,
    Stack,
    Switch,
    Text,
    rem
} from "@mantine/core"
import './Configuration.css'
import { IconPower } from "@tabler/icons-react"
import { IconSettings } from "@tabler/icons-react"
import TraceConfiguration from "./TraceConfiguration"
import LogConfiguration from "./LogConfiguration"
import GeneralConfiguration from "./GeneralConfiguration"
import { useLocalStorage } from "~hooks/storage"
import { setLocalStorage } from "~utils/storage"

export default function Configuration() {
    const { enabled } = useLocalStorage(["enabled"])

    return (
        <Box>
            <Group gap='xs' style={{ padding: '1rem 1rem 0' }} justify="space-between">
                <Group gap='xs'>
                    <IconSettings color='white'></IconSettings>
                    <Text size='xl' c='white'>Configuration</Text>
                </Group>
                <Switch
                    checked={enabled}
                    disabled={false}
                    onChange={(event) => setLocalStorage({ enabled: event.currentTarget.checked })}
                    size='md'
                    aria-label='Enable or disable the extension'
                    thumbIcon={
                        enabled ? (
                            <IconPower
                                style={{ width: rem(12), height: rem(12) }}
                                color='var(--mantine-primary-color-5)'
                                stroke={3}
                            />
                        ) : (
                            <IconPower
                                style={{ width: rem(12), height: rem(12) }}
                                stroke={3}
                            />
                        )
                    }
                />
            </Group>
            <Fieldset
                className='configuration-container'
                radius="md"
                disabled={!enabled}
                styles={{
                    legend: { fontSize: 'var(--mantine-font-size-lg)', fontWeight: 'bold' },
                    // root: { borderColor: enabled ? 'var(--mantine-color-orange-4)' : 'var(--mantine-color-dark-4)' }
                }}
            >
                <ScrollArea.Autosize mah={400}>
                    <Stack pr='lg' pb='lg' pt='lg'>
                        <GeneralConfiguration enabled={enabled} />
                        <TraceConfiguration enabled={enabled} />
                        <LogConfiguration enabled={enabled} />
                    </Stack>
                </ScrollArea.Autosize>
            </Fieldset>
        </Box>

    )
}