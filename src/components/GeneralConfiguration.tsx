import { Anchor, Fieldset, Group, Text } from "@mantine/core";
import { TagsInput } from "~components/TagsInput";
import ColorModeSwitch from "~components/ColorModeSwitch";
import { useLocalStorage } from "~hooks/storage";
import { defaultOptions } from "~utils/options";
import { syncMatchPatternPermissions } from "~utils/match-pattern";
import { setLocalStorage } from "~storage/local";
import { ConfigMode, type MatchPatternError } from "~storage/local/internal";
import { Editor } from "~components/Editor";
import { KeyValueInput } from "~components/KeyValueInput";
import { ErrorBoundary } from "react-error-boundary";

type GeneralConfigurationProps = {
    enabled: boolean
}

const patternErrorsToPills = (patterns: string[], errors: MatchPatternError[]): Map<number, string> => {
    const map = new Map<number, string>()
    errors.forEach((error) => {
        const index = patterns.indexOf(error.pattern)
        if (index !== -1) {
            map.set(index, error.error)
        }
    })
    return map
}

// TODO: some sort of editor feature that allows saving not-yet-committed changes to configText
// which are only overwritten once any relevant config variable is changed
export default function GeneralConfiguration({ enabled }: GeneralConfigurationProps) {
    const { headers, attributes, matchPatterns, matchPatternErrors, configMode } = useLocalStorage([
        'headers',
        'attributes',
        'matchPatterns',
        'matchPatternErrors',
        'configMode'
    ])
    const pillErrors = patternErrorsToPills(matchPatterns, matchPatternErrors)

    const onEnabledUrlsChange = async (values: string[]) => {
        setLocalStorage({ matchPatterns: values })
        syncMatchPatternPermissions({ prev: matchPatterns, next: values })
    }

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
            {configMode === ConfigMode.Visual &&
                <Group>
                    <TagsInput
                        value={matchPatterns}
                        errors={pillErrors}
                        onValueRemoved={(index) => {
                            const newPatterns = [...matchPatterns]
                            newPatterns.splice(index, 1)
                            onEnabledUrlsChange(newPatterns)
                        }}
                        onValueAdded={(value) => {
                            matchPatterns.push(value)
                            onEnabledUrlsChange(matchPatterns)
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
                        placeholder={matchPatterns.length == 0 ? defaultOptions.matchPatterns.join(', ') : ''}
                        delimiter={","}
                    />
                    <KeyValueInput
                        value={attributes}
                        onChange={(attributes) => setLocalStorage({ attributes })}
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
                    />
                    <KeyValueInput
                        value={headers}
                        onChange={(headers) => setLocalStorage({ headers })}
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
                    />
                </Group>
            }
            {configMode === ConfigMode.Code &&
                <ErrorBoundary fallback={<>poop, we had an issue</>}>
                    <Editor />
                </ErrorBoundary>
            }
        </Fieldset>
    );
}