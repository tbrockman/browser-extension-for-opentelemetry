import {
    Anchor,
    Checkbox,
    Fieldset,
    Group,
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

const storage = new Storage({ area: "local" })

export default function Configuration() {
    //   const [telemetry, setTelemetry] = useStorage({
    //     key: "telemetry",
    //     instance: storage
    //   })
    // position: fixed;
    // right: 1.5rem;
    // top: 1.15rem;
    const [url, , {
        setRenderValue: setUrlRenderValue,
        setStoreValue: setUrlStoreValue
    }] = useStorage({
        key: "url",
        instance: storage
    }, (v) => v === undefined ? 'http://localhost:4318/v1/traces' : v)
    const [debouncedUrl] = useDebouncedValue(url, 200);

    useEffect(() => {
        setUrlStoreValue(debouncedUrl)
    }, [debouncedUrl])

    const [enabled, setEnabled] = useStorage<boolean>({
        key: "enabled",
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
        <Fieldset
            className='configuration-container'
            legend={
                <Group>
                    <Text>Configuration</Text>
                    <Switch
                        checked={enabled}
                        disabled={false}
                        onChange={(event) => setEnabled(event.currentTarget.checked)}
                        color='blue.5'
                        size="md"
                        style={{
                            position: 'fixed',
                            right: rem(36),
                        }}
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
            }
            radius="md"
            disabled={!enabled}
            styles={{ legend: { fontSize: 'var(--mantine-font-size-lg)', fontWeight: 'bold' } }}
            variant="filled">
            <Stack>
                {/* <Checkbox.Group
              label="Enabled telemetry"
              value={telemetry}
              onChange={setTelemetry}
              description="Choose what data is exported by the extension to the collector">
              <Group mt="xs">
                <Checkbox value="metrics" label="Metrics" />
                <Checkbox value="traces" label="Traces" />
                <Checkbox value="logs" label="Logs" />
              </Group>
            </Checkbox.Group> */}
                <Checkbox.Group
                    label="Instrumentation"
                    value={instrumentations}
                    onChange={setInstrumentations}
                    description={
                        <>
                            Choose which events are automatically instrumented, see {" "}
                            <Anchor size='xs' href='https://github.com/open-telemetry/opentelemetry-js-contrib/tree/main/metapackages/auto-instrumentations-web#readme'>this README</Anchor>{" "}for more details.</>}>
                    <Group mt="xs">
                        <Checkbox value="interaction" label="User interactions" />
                        <Checkbox value="fetch" label="Fetch/XHR" />
                        <Checkbox value="load" label="Document load" />
                    </Group>
                </Checkbox.Group>
                <TextInput
                    label="Collector URL"
                    description={
                        <>
                            URL of a collector receiving Protobuf-encoded OTLP traces over HTTP.{" "}
                            <Text c='orange.3' component='span' size='xs'>⚠️ Will fail to send if <Anchor href='https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP' size='xs'>blocked by a CSP</Anchor>.</Text>
                        </>
                    }
                    placeholder="http://localhost:4318/v1/traces"
                    value={url}
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
                <TagsInput
                    value={propagateTo}
                    onChange={setPropagateTo}
                    disabled={instrumentations.indexOf('fetch') == -1}
                    label="Propagate HTTP trace context"
                    maxDropdownHeight={200}
                    comboboxProps={{ position: 'bottom', middlewares: { flip: false, shift: false }, transitionProps: { transition: 'pop', duration: 200 } }}
                    description={
                        <>
                            List of regular expressions matching URLs which should receive W3C trace context on fetch/XHR. <Text c='orange.3' component='span' size='xs'>⚠️ May cause CORS errors.</Text>
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
            </Stack>
        </Fieldset>
    )
}