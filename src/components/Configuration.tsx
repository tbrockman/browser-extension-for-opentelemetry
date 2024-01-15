import {
    Anchor,
    Fieldset,
    Stack,
    TagsInput,
    TextInput
} from "@mantine/core"

import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

import { events as EventList } from "~util"

import './Configuration.css'
import { useDebouncedValue } from "@mantine/hooks"
import { useEffect } from "react"

const storage = new Storage({ area: "local" })

export default function Configuration() {
    //   const [telemetry, setTelemetry] = useStorage({
    //     key: "telemetry",
    //     instance: storage
    //   })
    const [url, _, {
        setRenderValue: setUrlRenderValue,
        setStoreValue: setUrlStoreValue
    }] = useStorage({
        key: "url",
        instance: storage
    }, (v) => v === undefined ? 'http://localhost:4318/v1/traces' : v)
    const [debouncedUrl] = useDebouncedValue(url, 200);
    useEffect(() => {
        console.debug('setting url store value', debouncedUrl)
        setUrlStoreValue(debouncedUrl)
    }, [debouncedUrl])

    const [headers, setHeaders, {
        setRenderValue: setHeaderRenderValue,
        setStoreValue: setHeaderStoreValue
    }] = useStorage<string[]>({
        key: "headers",
        instance: storage
    }, (v) => v === undefined ? [] : v)
    const [events, setEvents] = useStorage<string[]>({
        key: "events",
        instance: storage
    }, (v) => v === undefined ? ['submit', 'click', 'keypress', 'scroll'] : v)


    return (
        <Fieldset
            className='configuration-container'
            legend="Configuration"
            radius="md"
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
                <TextInput
                    label="Collector URL"
                    description="URL of a collector receiving Protobuf-encoded OTLP traces over HTTP"
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
                    value={headers}
                    onChange={setHeaders}
                    label="Request headers"
                    description="Additional headers added on each request to the collector"
                    placeholder={headers.length == 0 ? '"key":"value", "key2":"value2"' : ''}
                    splitChars={[","]}
                />
            </Stack>
        </Fieldset>
    )
}