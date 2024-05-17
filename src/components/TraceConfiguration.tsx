import { Anchor, Checkbox, Fieldset, Group, TagsInput, Text, TextInput, type CheckboxProps } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconChartDots3, IconAffiliate } from "@tabler/icons-react";
import { useEffect } from "react";
import { useLocalStorage } from "~hooks/storage";

import { events as EventList } from "~util"
import { defaultOptions } from "~utils/options";

const CheckboxIcon: CheckboxProps['icon'] = ({ ...others }) =>
    <IconAffiliate {...others} />;

type TraceConfigurationProps = {
    enabled: boolean
}

export default function TraceConfiguration({ enabled }: TraceConfigurationProps) {

    const [traceCollectorUrl, , {
        setRenderValue: setUrlRenderValue,
        setStoreValue: setUrlStoreValue
    }] = useLocalStorage<string>("traceCollectorUrl")
    const [debouncedTraceCollectorUrl] = useDebouncedValue(traceCollectorUrl, 200);
    useEffect(() => {
        setUrlStoreValue(debouncedTraceCollectorUrl)
    }, [debouncedTraceCollectorUrl])

    const [tracingEnabled, setTracingEnabled] = useLocalStorage<boolean>("tracingEnabled")
    const [instrumentations, setInstrumentations] = useLocalStorage<string[]>("instrumentations")
    const [events, setEvents] = useLocalStorage<string[]>("events")
    const [propagateTo, setPropagateTo] = useLocalStorage<string[]>("propagateTo")

    return (
        <Fieldset aria-label="Traces"
            styles={{
                root: {
                    borderColor: (tracingEnabled && enabled) ? 'var(--mantine-primary-color-5)' : 'var(--mantine-color-default-border)'
                }
            }}
            legend={
                <Group gap='xs'>
                    <Checkbox
                        checked={tracingEnabled}
                        icon={CheckboxIcon}
                        label={<Text>Tracing</Text>}
                        disabled={false}
                        onChange={(event) => setTracingEnabled(event.currentTarget.checked)}
                        size="lg"
                        variant='outline'
                        styles={{
                            labelWrapper: {
                                justifyContent: 'center'
                            }
                        }}
                        aria-label='Enable or disable exporting traces'
                    />
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
                            <Anchor target="_blank" size='xs' href='https://github.com/open-telemetry/opentelemetry-js-contrib/tree/main/metapackages/auto-instrumentations-web#readme'>this README</Anchor>{" "}for details.</>}>
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
                    placeholder={defaultOptions.traceCollectorUrl}
                    value={traceCollectorUrl}
                    onChange={(event) => {
                        setUrlRenderValue(event.currentTarget.value)
                    }}
                />
                <TagsInput
                    value={events}
                    onChange={setEvents}
                    disabled={instrumentations.indexOf('interaction') == -1 || !enabled}
                    label="Event listeners"
                    data={EventList}
                    maxDropdownHeight={200}
                    comboboxProps={{ position: 'bottom', middlewares: { flip: false, shift: false }, transitionProps: { transition: 'pop', duration: 200 } }}
                    description={
                        <>
                            Browser events to track, see{" "}
                            <Anchor
                                target="_blank"
                                size="xs"
                                href="https://microsoft.github.io/PowerBI-JavaScript/interfaces/_node_modules_typedoc_node_modules_typescript_lib_lib_dom_d_.htmlelementeventmap.html">
                                HTMLElementEventMap
                            </Anchor>{" "}
                            for a list of valid events.
                        </>
                    }
                    placeholder={events.length == 0 ? defaultOptions.events.join(', ') : ''}
                    splitChars={[","]}
                />
                <TagsInput
                    value={propagateTo}
                    onChange={setPropagateTo}
                    disabled={instrumentations.indexOf('fetch') == -1 || !enabled}
                    label="Forward trace context to"
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
            </Group>
        </Fieldset>
    );
}