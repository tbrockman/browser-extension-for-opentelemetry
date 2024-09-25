import { Anchor, Checkbox, Fieldset, Group, TagsInput, Text, TextInput, type CheckboxProps } from "@mantine/core";
import { IconChartDots3, IconAffiliate } from "@tabler/icons-react";
import React, { useCallback, useEffect, useRef } from "react";
import { useLocalStorage } from "~hooks/storage";

import { events as EventList } from "~utils/constants"
import { defaultOptions } from "~utils/options";
import { setLocalStorage } from "~storage/local";

const CheckboxIcon: CheckboxProps['icon'] = ({ ...others }) =>
    <IconAffiliate {...others} />;

type TraceConfigurationProps = {
    enabled: boolean
}

export default function TraceConfiguration({ enabled }: TraceConfigurationProps) {

    const storage = useLocalStorage(["traceCollectorUrl", "tracingEnabled", "instrumentations", "events", "propagateTo"])
    const checkboxRef = useRef<HTMLInputElement>(null);

    const toggleDisabled = useCallback(() => {
        setLocalStorage({ tracingEnabled: !storage.tracingEnabled })
    }, [storage.tracingEnabled]);

    // Hack for Firefox disabled fieldset checkbox event handling
    // see: https://stackoverflow.com/questions/63740106/checkbox-onchange-in-legend-inside-disabled-fieldset-not-firing-in-firefox-w
    useEffect(() => {
        checkboxRef.current?.addEventListener('change', toggleDisabled)

        return () => {
            checkboxRef.current?.removeEventListener('change', toggleDisabled)
        }
    }, [toggleDisabled])

    return (
        <Fieldset aria-label="Traces"
            styles={{
                root: {
                    borderColor: (storage.tracingEnabled && enabled) ? 'var(--mantine-primary-color-5)' : 'var(--mantine-color-default-border)'
                }
            }}
            legend={
                <Group gap='xs'>
                    {storage.tracingEnabled !== undefined && <Checkbox
                        checked={storage.tracingEnabled}
                        icon={CheckboxIcon}
                        label={<Text>Tracing</Text>}
                        ref={checkboxRef}
                        disabled={false}
                        onChange={() => { }}
                        size="lg"
                        variant='outline'
                        styles={{
                            labelWrapper: {
                                justifyContent: 'center'
                            }
                        }}
                        aria-label='Enable or disable exporting traces'
                    />}
                </Group>
            }
            disabled={!storage.tracingEnabled}>
            <Group>
                {storage.instrumentations !== undefined && <Checkbox.Group
                    label="Instrumentation"
                    value={storage.instrumentations}
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
                </Checkbox.Group>}
                {storage.traceCollectorUrl !== undefined && <TextInput
                    label="Export URL"
                    description={
                        <>
                            Choose where to send Protobuf-encoded OTLP traces over HTTP.
                        </>
                    }
                    placeholder={defaultOptions.traceCollectorUrl}
                    value={storage.traceCollectorUrl}
                    onChange={(event) => setLocalStorage({ traceCollectorUrl: event.currentTarget.value })}
                />}
                {storage.events !== undefined && <TagsInput
                    value={storage.events}
                    onChange={(value) => setLocalStorage({ events: value as (keyof HTMLElementEventMap)[] })}
                    disabled={storage.instrumentations?.indexOf('interaction') == -1 || !enabled}
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
                                href="https://azuresdkdocs.blob.core.windows.net/$web/javascript/azure-app-configuration/1.1.0/interfaces/htmlelementeventmap.html">
                                HTMLElementEventMap
                            </Anchor>{" "}
                            for a list of valid events.
                        </>
                    }
                    placeholder={storage.events?.length == 0 ? defaultOptions.events.join(', ') : ''}
                    splitChars={[","]}
                />}
                {storage.propagateTo !== undefined && <TagsInput
                    value={storage.propagateTo}
                    onChange={(value) => setLocalStorage({ propagateTo: value })}
                    disabled={storage.instrumentations?.indexOf('fetch') == -1 || !enabled}
                    label="Forward trace context to"
                    maxDropdownHeight={200}
                    comboboxProps={{ position: 'bottom', middlewares: { flip: false, shift: false }, transitionProps: { transition: 'pop', duration: 200 } }}
                    description={
                        <>
                            Choose URLs (as regular expressions) which should receive W3C trace context on fetch/XHR. <Text c='orange.3' component='span' size='xs'>⚠️ May cause request CORS failures.</Text>
                        </>
                    }
                    placeholder={storage.propagateTo?.length == 0 ? ".*" : ''}
                    splitChars={[","]}
                />}
            </Group>
        </Fieldset>
    );
}