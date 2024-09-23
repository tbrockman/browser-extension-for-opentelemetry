import { Anchor, Fieldset, Group, Text } from "@mantine/core";
import { TagsInput } from "~components/TagsInput";
import ColorModeSwitch from "~components/ColorModeSwitch";
import { useLocalStorage, useStorage } from "~hooks/storage";
import { defaultOptions } from "~utils/options";
import { syncMatchPatternPermissions } from "~utils/match-pattern";
import { getLocalStorage, LocalStorage, setLocalStorage, type LocalStorageType } from "~storage/local";
import { ConfigMode, type MatchPatternError } from "~storage/local/internal";
import { Editor } from "~components/Editor";
import { KeyValueInput } from "~components/KeyValueInput";
import { ErrorBoundary } from "react-error-boundary";
import { consoleProxy } from "~utils/logging";
import { useEffect, useState } from "react";

type GeneralConfigurationProps = {
    enabled: boolean
}

const patternErrorsToPills = (patterns?: string[], errors?: MatchPatternError[]): Map<number, string> => {
    const map = new Map<number, string>()
    errors?.forEach((error) => {
        const index = patterns?.indexOf(error.pattern) || -1
        if (index !== -1) {
            map.set(index, error.error)
        }
    })
    return map
}

export default function GeneralConfiguration({ enabled }: GeneralConfigurationProps) {
    const storage = useLocalStorage([
        'matchPatterns',
        'matchPatternErrors',
        'configMode',
        'attributes',
        'headers'
    ])
    const [attributes, setAttributes] = useState<LocalStorageType['attributes']>(new Map())
    const [headers, setHeaders] = useState<LocalStorageType['headers']>(new Map())
    const pillErrors = patternErrorsToPills(storage.matchPatterns, storage.matchPatternErrors)

    const onEnabledUrlsChange = async (values: string[]) => {
        setLocalStorage({ matchPatterns: values })
        syncMatchPatternPermissions({ prev: storage.matchPatterns || [], next: values })
    }

    useEffect(() => {
        const fetchData = async () => {
            const { attributes, headers } = await getLocalStorage(['attributes', 'headers'])
            setAttributes(new Map(attributes || []))
            setHeaders(new Map(headers || []))
        }
        fetchData()
    }, [storage.configMode, storage.attributes, storage.headers])

    return (
        <Fieldset radius="md"
            styles={{
                root: {
                    borderColor: enabled ? 'var(--mantine-primary-color-5)' : 'var(--mantine-color-default-border)'
                },
                legend: {
                    paddingRight: '2px'
                }
            }}
            legend={
                <Group>
                    <ColorModeSwitch styles={{
                        labelWrapper: {
                            justifyContent: 'center'
                        }
                    }} />
                </Group>
            }>
            {storage.configMode === ConfigMode.Visual &&
                <Group>
                    <TagsInput
                        value={storage.matchPatterns || []}
                        errors={pillErrors}
                        onValueRemoved={(index) => {
                            const newPatterns = [...(storage.matchPatterns || [])]
                            newPatterns.splice(index, 1)
                            onEnabledUrlsChange(newPatterns)
                        }}
                        onValueAdded={(value) => {

                            if (storage.matchPatterns) {
                                storage.matchPatterns.push(value)
                                onEnabledUrlsChange(storage.matchPatterns)
                            }
                        }}
                        label={
                            <>
                                Allow extension on {" "}
                            </>
                        }
                        disabled={!enabled}
                        description={
                            <>
                                Choose webpages which should be instrumented, specified as a list of {" "}
                                <Anchor
                                    target="_blank"
                                    size="xs"
                                    href="https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns">
                                    match patterns
                                </Anchor>. <Text c='orange.3' component='span' size='xs'>⚠️&nbsp;Adding new entries will require reloading targeted pages.</Text>
                            </>
                        }
                        placeholder={storage.matchPatterns?.length == 0 ? defaultOptions.matchPatterns.join(', ') : ''}
                        delimiter={","}
                    />
                    {attributes && <KeyValueInput
                        defaultValue={attributes}
                        onChange={async (attributes) => await setLocalStorage({ attributes })}
                        label="Resource attributes"
                        disabled={!enabled}
                        description={<>Attach additional <Anchor target="_blank" size="xs" href="https://opentelemetry.io/docs/specs/semconv/general/attributes/">attributes</Anchor> on all exported logs/traces.</>}
                        tableProps={{
                            withRowBorders: false,
                            withColumnBorders: true,
                        }}
                        keyPlaceholder="key"
                        valuePlaceholder="value"
                        fullWidth
                    />}
                    {headers && <KeyValueInput
                        defaultValue={headers}
                        onChange={async (headers) => await setLocalStorage({ headers })}
                        label="Request headers"
                        disabled={!enabled}
                        description="Include additional HTTP headers on all export requests."
                        tableProps={{
                            withRowBorders: false,
                            withColumnBorders: true,
                        }}
                        keyPlaceholder="key"
                        valuePlaceholder="value"
                        fullWidth
                    />}
                </Group>
            }
            {storage.configMode === ConfigMode.Code &&
                <ErrorBoundary fallback={<>poop, we had an issue</>}>
                    <Editor />
                </ErrorBoundary>
            }
        </Fieldset>
    );
}