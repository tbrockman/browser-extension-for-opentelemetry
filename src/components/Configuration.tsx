import {
    Anchor,
    Box,
    Checkbox,
    CheckboxProps,
    Fieldset,
    Grid,
    Group,
    ScrollArea,
    Stack,
    Switch,
    TagsInput,
    Text,
    TextInput,
    rem
} from "@mantine/core"

import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

import { events as EventList } from "~util"

import './Configuration.css'
import { useDebouncedValue } from "@mantine/hooks"
import { useEffect } from "react"
import { IconPower } from "@tabler/icons-react"
import ColorModeSwitch from "./ColorModeSwitch"
import { IconSettings, IconTerminal } from "@tabler/icons-react"
import { IconChartDots3 } from "@tabler/icons-react"

const storage = new Storage({ area: "local" })

const CheckboxIcon: CheckboxProps['icon'] = ({ ...others }) =>
    <IconChartDots3 {...others} />;
const LogsIcon: CheckboxProps['icon'] = ({ ...others }) =>
    <IconTerminal {...others} />;

export default function Configuration() {
    const [traceCollectorUrl, , {
        setRenderValue: setUrlRenderValue,
        setStoreValue: setUrlStoreValue
    }] = useStorage({
        key: "traceCollectorUrl",
        instance: storage
    }, (v) => v === undefined ? 'http://localhost:4318/v1/traces' : v)
    const [debouncedTraceCollectorUrl] = useDebouncedValue(traceCollectorUrl, 200);
    const [logsCollectorUrl, , {
        setRenderValue: setLogsRenderValue,
        setStoreValue: setLogsStoreValue
    }] = useStorage({
        key: "logCollectorUrl",
        instance: storage
    }, (v) => v === undefined ? 'http://localhost:4318/v1/logs' : v)

    useEffect(() => {
        setUrlStoreValue(debouncedTraceCollectorUrl)
    }, [debouncedTraceCollectorUrl])
    useEffect(() => {
        setLogsStoreValue(logsCollectorUrl)
    }, [logsCollectorUrl])

    const [enabled, setEnabled] = useStorage<boolean>({
        key: "enabled",
        instance: storage
    }, (v) => v === undefined ? true : v)
    const [tracingEnabled, setTracingEnabled] = useStorage<boolean>({
        key: "tracingEnabled",
        instance: storage
    }, (v) => v === undefined ? true : v)
    const [loggingEnabled, setLoggingEnabled] = useStorage<boolean>({
        key: "loggingEnabled",
        instance: storage
    }, (v) => v === undefined ? true : v)
    const [instrumentations, setInstrumentations] = useStorage<string[]>({
        key: "instrumentations",
        instance: storage
    }, (v) => v === undefined ? ['interaction', 'fetch', 'load'] : v)
    const [headers, setHeaders] = useStorage<string[]>({
        key: "headers",
        instance: storage
    }, (v) => v === undefined ? [] : v)
    const [events, setEvents] = useStorage<string[]>({
        key: "events",
        instance: storage
    }, (v) => v === undefined ? ['submit', 'click', 'keypress', 'scroll'] : v)
    const [propagateTo, setPropagateTo] = useStorage<string[]>({
        key: "propagateTo",
        instance: storage
    }, (v) => v === undefined ? [] : v)

    return (
        <Box>
            <Group gap='xs' style={{ padding: '1rem 1.25rem 0 1rem' }} justify="space-between">
                <Group gap='xs'>
                    <IconSettings color='white'></IconSettings>
                    <Text size='xl' c='white'>Options</Text>
                </Group>
                <Switch
                    checked={enabled}
                    disabled={false}
                    onChange={(event) => setEnabled(event.currentTarget.checked)}
                    size='md'
                    aria-label='Enable or disable the extension'
                    thumbIcon={
                        enabled ? (
                            <IconPower
                                style={{ width: rem(12), height: rem(12) }}
                                color='var(--mantine-color-blue-5)'
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
                styles={{ legend: { fontSize: 'var(--mantine-font-size-lg)', fontWeight: 'bold' } }}
            >
                <ScrollArea.Autosize mah={400}>

                    <Stack pr='lg' pb='lg' pt='lg'>
                        <Fieldset aria-label="Traces" legend={
                            <Group gap='xs'>
                                <Checkbox
                                    checked={tracingEnabled}
                                    icon={CheckboxIcon}
                                    disabled={false}
                                    onChange={(event) => setTracingEnabled(event.currentTarget.checked)}
                                    size="lg"
                                    variant='outline'
                                    style={{}}
                                    aria-label='Enable or disable exporting traces'
                                />
                                <Text>Tracing</Text>
                            </Group>
                        } disabled={!tracingEnabled}>
                            <Group>
                                <Checkbox.Group
                                    label="Instrumentation"
                                    value={instrumentations}
                                    onChange={setInstrumentations}
                                    description={
                                        <>
                                            Choose which events are automatically instrumented, see {" "}
                                            <Anchor size='xs' href='https://github.com/open-telemetry/opentelemetry-js-contrib/tree/main/metapackages/auto-instrumentations-web#readme'>this README</Anchor>{" "}for details.</>}>
                                    <Group mt="xs">
                                        <Checkbox value="interaction" label="User interactions" variant="outline" />
                                        <Checkbox value="fetch" label="Fetch/XHR" variant="outline" />
                                        <Checkbox value="load" label="Document load" variant="outline" />
                                    </Group>
                                </Checkbox.Group>
                                <TextInput
                                    label="Export URL"
                                    description={
                                        <>
                                            Choose where to send Protobuf-encoded OTLP traces over HTTP.
                                        </>
                                    }
                                    placeholder="http://localhost:4318/v1/traces"
                                    value={traceCollectorUrl}
                                    onChange={(event) => {
                                        setUrlRenderValue(event.currentTarget.value)
                                    }}
                                />
                                <TagsInput
                                    value={events}
                                    onChange={setEvents}
                                    label="Event listeners"
                                    data={EventList}
                                    maxDropdownHeight={200}
                                    comboboxProps={{ position: 'bottom', middlewares: { flip: false, shift: false }, transitionProps: { transition: 'pop', duration: 200 } }}
                                    description={
                                        <>
                                            Browser events to track, see{" "}
                                            <Anchor
                                                size="xs"
                                                href="https://microsoft.github.io/PowerBI-JavaScript/interfaces/_node_modules_typedoc_node_modules_typescript_lib_lib_dom_d_.htmlelementeventmap.html">
                                                HTMLElementEventMap
                                            </Anchor>{" "}
                                            for a list of valid events.
                                        </>
                                    }
                                    placeholder={events.length == 0 ? "keypress, click, mouseover" : ''}
                                    splitChars={[","]}
                                />
                            </Group>
                        </Fieldset>

                        <Fieldset aria-label="Logs" legend={
                            <Group gap='xs'>
                                <Checkbox
                                    checked={loggingEnabled}
                                    disabled={false}
                                    icon={LogsIcon}
                                    onChange={(event) => setLoggingEnabled(event.currentTarget.checked)}
                                    size="lg"
                                    variant='outline'
                                    style={{}}
                                    aria-label='Enable or disable exporting logs'
                                />
                                <Text>Logging</Text>
                            </Group>
                        } disabled={!loggingEnabled}>
                            <TextInput
                                label="Export URL"
                                description={
                                    <>
                                        Choose where to send Protobuf-encoded OTLP logs over HTTP.
                                    </>
                                }
                                placeholder="http://localhost:4318/v1/logs"
                                value={logsCollectorUrl}
                                onChange={(event) => {
                                    setLogsRenderValue(event.currentTarget.value)
                                }}
                            />
                        </Fieldset>

                        <Fieldset radius="md" legend={
                            <Group gap='xs'>
                                <ColorModeSwitch />

                                <Text>General</Text>
                            </Group>
                        }>
                            <Group>
                                <TagsInput
                                    value={propagateTo}
                                    onChange={setPropagateTo}
                                    disabled={instrumentations.indexOf('fetch') == -1}
                                    label="Forward HTTP trace context"
                                    maxDropdownHeight={200}
                                    comboboxProps={{ position: 'bottom', middlewares: { flip: false, shift: false }, transitionProps: { transition: 'pop', duration: 200 } }}
                                    description={
                                        <>
                                            Choose URLs (as regular expressions) which should receive W3C trace context on fetch/XHR. <Text c='orange.3' component='span' size='xs'>⚠️ May cause request CORS failures.</Text>
                                        </>
                                    }
                                    placeholder={propagateTo.length == 0 ? ".*" : ''}
                                    splitChars={[","]}
                                />
                                <TagsInput
                                    value={headers}
                                    onChange={setHeaders}
                                    label="Request headers"
                                    description="Additional headers to be sent to the collector"
                                    placeholder={headers.length == 0 ? 'key:value, key2:value2' : ''}
                                    splitChars={[","]}
                                />
                            </Group>
                        </Fieldset>
                    </Stack>
                </ScrollArea.Autosize>
            </Fieldset>
        </Box>

    )
}