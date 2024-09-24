import {
    ActionIcon,
    Affix,
    Box,
    Button,
    Fieldset,
    Group,
    ScrollArea,
    Stack,
    Switch,
    Text,
    Tooltip,
    rem
} from "@mantine/core"
import './Configuration.css'
import { IconBraces, IconDeviceFloppy, IconFileCheck, IconPower } from "@tabler/icons-react"
import { IconSettings } from "@tabler/icons-react"
import TraceConfiguration from "~components/TraceConfiguration"
import LogConfiguration from "~components/LogConfiguration"
import GeneralConfiguration from "~components/GeneralConfiguration"
import { useLocalStorage } from "~hooks/storage"
import { setLocalStorage } from "~storage/local"
import { useEffect, useRef, useState } from "react"
import { ConfigMode } from "~storage/local/internal"
import { de } from "~utils/serde"
import { UserFacingConfiguration } from "~storage/local/configuration"
import { syncMatchPatternPermissions } from "~utils/match-pattern"
import { consoleProxy } from "~utils/logging"
import { usePlatformInfo } from "~hooks/platform"
import { toPlatformSpecificKeys } from "~utils/platform"

// TODO: Consider replacing "Configuration" header with a menu
export default function Configuration() {
    const { enabled, configMode, matchPatterns, configText, editorState } = useLocalStorage(["enabled", "configMode", "matchPatterns", "configText", "editorState"])
    const [editorText, setEditorText] = useState(editorState?.doc as string | undefined)
    const editorDirty = editorText && editorState && editorText !== configText
    const portalTargetRef = useRef<HTMLElement>()
    const [refsInitialized, setRefsInitialized] = useState(false)
    const platformInfo = usePlatformInfo()
    const saveKeys = toPlatformSpecificKeys(['Ctrl', 'S'], platformInfo)

    const configModeToggle = () => {
        // toggle config mode
        setLocalStorage({ configMode: configMode === ConfigMode.Visual ? ConfigMode.Code : ConfigMode.Visual })
    }

    useEffect(() => {
        if (portalTargetRef.current) {
            setRefsInitialized(true)
        }
    }, [portalTargetRef])

    useEffect(() => {
        if (editorText == null && editorState && editorState.doc) {
            setEditorText(editorState.doc as string)
        }
    }, [editorState])

    const checkMatchPatterns = async (text: string) => {
        try {
            const newConfig = de(text, UserFacingConfiguration);

            if (newConfig.matchPatterns !== matchPatterns) {
                await syncMatchPatternPermissions({ prev: matchPatterns || [], next: newConfig.matchPatterns });
            }
        } catch (e) {
            consoleProxy.error(e);
        }
    }

    const onEditorChange = (text: string) => {
        setEditorText(text);
    }

    const onEditorSave = async (text: string) => {
        try {
            await checkMatchPatterns(text);
            await setLocalStorage({ configText: text })
        } catch (e) {
            consoleProxy.error(e);
        }
    }

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
                data-editormode={configMode}
                className={`configuration-container`}
                radius="md"
                disabled={!enabled}
                styles={{
                    root: {
                        position: 'relative',
                    },
                    legend: { fontSize: 'var(--mantine-font-size-lg)', fontWeight: 'bold' },
                }}
                // @ts-ignore
                ref={portalTargetRef}
            >
                {refsInitialized &&
                    <Affix
                        position={{ bottom: 10, right: 10 }}
                        portalProps={{ target: portalTargetRef.current }} styles={{ root: { position: "absolute" } }}>
                        <Group>
                            <Button onClick={configModeToggle} leftSection={configMode === ConfigMode.Visual ? <IconBraces /> : <IconFileCheck />}>
                                {configMode === ConfigMode.Visual ? 'Edit as JSON' : 'Edit as form'}
                            </Button>
                        </Group>
                    </Affix>
                }
                {
                    refsInitialized && configMode == ConfigMode.Code && editorDirty &&
                    <Affix
                        position={{ bottom: 10, left: 10 }}
                        portalProps={{ target: portalTargetRef.current }} styles={{ root: { position: "absolute" } }}
                    >
                        <Tooltip
                            label={`Save changes (${saveKeys?.join('+')})`}
                            withArrow
                            position="top-start"
                        >
                            <ActionIcon size='lg' onClick={() => { onEditorSave(editorText) }}>
                                <IconDeviceFloppy />
                            </ActionIcon>
                        </Tooltip>
                    </Affix>
                }
                <ScrollArea.Autosize mah={400}>

                    <Stack pr='lg' pb='lg' pt='lg'>
                        <GeneralConfiguration enabled={!!enabled} onEditorSave={onEditorSave} onEditorChange={onEditorChange} />
                        {configMode === ConfigMode.Visual &&
                            <>
                                <TraceConfiguration enabled={!!enabled} />
                                <LogConfiguration enabled={!!enabled} />
                            </>
                        }
                    </Stack>
                </ScrollArea.Autosize>
            </Fieldset>
        </Box>

    )
}