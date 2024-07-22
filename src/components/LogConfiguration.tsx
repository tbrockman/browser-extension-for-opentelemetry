import { Checkbox, Fieldset, Group, Text, TextInput, type CheckboxProps } from "@mantine/core";
import { IconTerminal } from "@tabler/icons-react";
import { useEffect, useRef } from "react";
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
    const checkboxRef = useRef<HTMLInputElement>(null);
    // Hack for Firefox disabled fieldset checkbox event handling
    // see: https://stackoverflow.com/questions/63740106/checkbox-onchange-in-legend-inside-disabled-fieldset-not-firing-in-firefox-w
    useEffect(() => {
        const listener = (event) => {
            setLocalStorage({ loggingEnabled: event.currentTarget.checked })
        }
        checkboxRef.current?.addEventListener('change', listener)

        return () => {
            checkboxRef.current?.removeEventListener('change', listener)
        }
    }, [loggingEnabled])

    return (
        <Fieldset aria-label="Logs"
            styles={{
                legend: {
                    paddingRight: '1rem'
                },
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
                        onChange={(event) => {
                            if (!event.currentTarget.checked) {
                                setLocalStorage({ loggingEnabled: event.currentTarget.checked })
                            }
                        }}
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
                value={logCollectorUrl}
                onChange={(event) => {
                    setLocalStorage({ logCollectorUrl: event.currentTarget.value })
                }}
            />
        </Fieldset>
    );
}