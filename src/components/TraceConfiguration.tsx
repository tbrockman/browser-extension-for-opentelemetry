import { Anchor, Checkbox, Fieldset, Group, TagsInput, Text, TextInput, type CheckboxProps } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconChartDots3, IconAffiliate } from "@tabler/icons-react";
import React, { useEffect } from "react";
import { useLocalStorage } from "~hooks/storage";

import { events as EventList } from "~utils/constants"
import { defaultOptions } from "~utils/options";
import { setLocalStorage } from "~utils/storage";

const CheckboxIcon: CheckboxProps['icon'] = ({ ...others }) =>
    <IconAffiliate {...others} />;

type TraceConfigurationProps = {
    enabled: boolean
}

export default function TraceConfiguration({ enabled }: TraceConfigurationProps) {

    const { traceCollectorUrl, tracingEnabled, instrumentations, events, propagateTo } = useLocalStorage(["traceCollectorUrl", "tracingEnabled", "instrumentations", "events", "propagateTo"])
    const [debouncedTraceCollectorUrl] = useDebouncedValue(traceCollectorUrl, 200);
    const checkboxRef = React.useRef<HTMLInputElement>(null);
    useEffect(() => {
        setLocalStorage({ traceCollectorUrl: debouncedTraceCollectorUrl })
    }, [debouncedTraceCollectorUrl])

    // Hack for Firefox disabled fieldset checkbox event handling
    // see: https://stackoverflow.com/questions/63740106/checkbox-onchange-in-legend-inside-disabled-fieldset-not-firing-in-firefox-w
    useEffect(() => {
        const listener = (event) => {
            setLocalStorage({ tracingEnabled: event.currentTarget.checked })
        }
        checkboxRef.current.addEventListener('change', listener)

        return () => {
            checkboxRef.current.removeEventListener('change', listener)
        }
    }, [tracingEnabled])

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
                        ref={checkboxRef}
                        disabled={false}
                        onChange={(event) => {
                            if (!event.currentTarget.checked) {
                                setLocalStorage({ tracingEnabled: event.currentTarget.checked })
                            }
                        }}
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
            }
            disabled={!tracingEnabled}>
            <Group>
                <Checkbox.Group
                    label="Instrumentation"
                    value={instrumentations}
                    onChange={(value) => setLocalStorage({ instrumentations: value as ("load" | "fetch" | "interaction")[] })}
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
                        setLocalStorage({ traceCollectorUrl: event.currentTarget.value })
                    }}
                />
                <TagsInput
                    value={events}
                    onChange={(value) => setLocalStorage({ events: value as (keyof HTMLElementEventMap)[] })}
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
                    onChange={(value) => setLocalStorage({ propagateTo: value })}
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