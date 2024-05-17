import { Checkbox, Fieldset, Group, Text, TextInput, type CheckboxProps } from "@mantine/core";
import { IconTerminal } from "@tabler/icons-react";
import { useEffect } from "react";
import { useLocalStorage } from "~hooks/storage";
import { defaultOptions } from "~utils/options";

const LogsIcon: CheckboxProps['icon'] = ({ ...others }) =>
    <IconTerminal {...others} />;

type LogConfigurationProps = {
    enabled: boolean
}

export default function LogConfiguration({ enabled }: LogConfigurationProps) {

    const [logsCollectorUrl, , {
        setRenderValue: setLogsRenderValue,
        setStoreValue: setLogsStoreValue
    }] = useLocalStorage<string>("logCollectorUrl")
    const [loggingEnabled, setLoggingEnabled] = useLocalStorage<boolean>("loggingEnabled")
    useEffect(() => {
        setLogsStoreValue(logsCollectorUrl)
    }, [logsCollectorUrl])

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
                        onChange={(event) => setLoggingEnabled(event.currentTarget.checked)}
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
                value={logsCollectorUrl}
                onChange={(event) => {
                    setLogsRenderValue(event.currentTarget.value)
                }}
            />
        </Fieldset>
    );
}