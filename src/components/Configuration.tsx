import {
    Affix,
    Box,
    Button,
    Fieldset,
    Group,
    ScrollArea,
    Stack,
    Switch,
    Text,
    rem
} from "@mantine/core"
import './Configuration.css'
import { IconChecklist, IconCode, IconFileCheck, IconPower } from "@tabler/icons-react"
import { IconSettings } from "@tabler/icons-react"
import TraceConfiguration from "~components/TraceConfiguration"
import LogConfiguration from "~components/LogConfiguration"
import GeneralConfiguration from "~components/GeneralConfiguration"
import { useLocalStorage } from "~hooks/storage"
import { setLocalStorage } from "~storage/local"
import { useEffect, useRef, useState } from "react"
import { consoleProxy } from "~utils/logging"

export default function Configuration() {
    const { enabled, configMode } = useLocalStorage(["enabled", "configMode"])
    const portalTargetRef = useRef<HTMLDivElement>(null)
    const [refsInitialized, setRefsInitialized] = useState(false)

    consoleProxy.log('configMode', configMode)

    const handleConfigModeAffixClick = () => {
        setLocalStorage({ configMode: configMode === 'visual' ? 'code' : 'visual' })
    }

    useEffect(() => {
        if (portalTargetRef.current) {
            setRefsInitialized(true)
        }
    }, [portalTargetRef])

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
                    onChange={(event) => {
                        console.log('swtch changed', event.currentTarget.checked, 'enabled', enabled)
                        setLocalStorage({ enabled: event.currentTarget.checked })
                    }}
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
                data-editormode={configMode}
                className={`configuration-container`}
                radius="md"
                disabled={!enabled}
                styles={{
                    root: {
                        position: 'relative',
                    },
                    legend: { fontSize: 'var(--mantine-font-size-lg)', fontWeight: 'bold' },
                    // root: { borderColor: enabled ? 'var(--mantine-color-orange-4)' : 'var(--mantine-color-dark-4)' }
                }}
                // @ts-ignore
                ref={portalTargetRef}
            >
                {refsInitialized &&
                    <Affix onClick={handleConfigModeAffixClick}
                        position={{ bottom: 10, right: 10 }}
                        portalProps={{ target: portalTargetRef.current }} styles={{ root: { position: "absolute" } }}>
                        <Button leftSection={configMode === 'visual' ? <IconCode /> : <IconFileCheck />}>
                            {configMode === 'visual' ? 'Edit as JSON' : 'Edit as form'}
                        </Button>
                    </Affix>
                }
                <ScrollArea.Autosize mah={400}>

                    <Stack pr='lg' pb='lg' pt='lg'>
                        <GeneralConfiguration enabled={enabled} />
                        {configMode === 'visual' &&
                            <>
                                <TraceConfiguration enabled={enabled} />
                                <LogConfiguration enabled={enabled} />
                            </>
                        }
                    </Stack>
                </ScrollArea.Autosize>
            </Fieldset>
        </Box>

    )
}