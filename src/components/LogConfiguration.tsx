import { Checkbox, Fieldset, Group, Text, TextInput, type CheckboxProps } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconTerminal } from "@tabler/icons-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalStorage } from "~hooks/storage";
import { defaultOptions } from "~utils/options";
import { setLocalStorage } from "~utils/storage";

const LogsIcon: CheckboxProps['icon'] = ({ ...others }) =>
    <IconTerminal {...others} />;

type LogConfigurationProps = {
    enabled: boolean
}

export default function LogConfiguration({ enabled }: LogConfigurationProps) {
    const { logCollectorUrl, loggingEnabled } = useLocalStorage(["logCollectorUrl", "loggingEnabled"])
    const [renderedLogCollectorUrl, setRenderedLogCollectorUrl] = useState(logCollectorUrl)
    const [debouncedRenderedUrl] = useDebouncedValue(renderedLogCollectorUrl, 500);
    const checkboxRef = useRef<HTMLInputElement>(null);
    // If the local storage value changes, update the rendered value
    useEffect(() => {
        if (logCollectorUrl !== renderedLogCollectorUrl) {
            setRenderedLogCollectorUrl(logCollectorUrl)
        }
    }, [logCollectorUrl])
    // If the rendered value changes, update the local storage value
    useEffect(() => {
        if (debouncedRenderedUrl !== logCollectorUrl) {
            setLocalStorage({ logCollectorUrl: debouncedRenderedUrl })
        }
    }, [debouncedRenderedUrl])

    const toggleDisabled = useCallback(() => {
        setLocalStorage({ loggingEnabled: !loggingEnabled })
    }, [loggingEnabled]);
    // Hack for Firefox disabled fieldset checkbox event handling
    // see: https://stackoverflow.com/questions/63740106/checkbox-onchange-in-legend-inside-disabled-fieldset-not-firing-in-firefox-w
    useEffect(() => {
        checkboxRef.current?.addEventListener('change', toggleDisabled)

        return () => {
            checkboxRef.current?.removeEventListener('change', toggleDisabled)
        }
    }, [toggleDisabled])

    return (
        <Fieldset aria-label="Logs"
            styles={{
                root: {
                    borderColor: (enabled && loggingEnabled) ? 'var(--mantine-primary-color-5)' : 'var(--mantine-color-default-border)'
                }
            }}
            legend={
                <Group gap='xs'>
                    <Checkbox
                        checked={loggingEnabled}
                        disabled={false}
                        icon={LogsIcon}
                        ref={checkboxRef}
                        onChange={() => { }}
                        size="lg"
                        variant='outline'
                        aria-label='Enable or disable exporting logs'
                        styles={{
                            labelWrapper: {
                                justifyContent: 'center'
                            }
                        }}
                        label={
                            <Text>Logging</Text>
                        }
                    />
                </Group>
            } disabled={!loggingEnabled}>
            <TextInput
                label="Export URL"
                description={
                    <>
                        Choose where to send Protobuf-encoded OTLP logs over HTTP.
                    </>
                }
                placeholder={defaultOptions.logCollectorUrl}
                value={renderedLogCollectorUrl}
                onChange={(event) => {
                    setRenderedLogCollectorUrl(event.currentTarget.value)
                }}
            />
        </Fieldset>
    );
}