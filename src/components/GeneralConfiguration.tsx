import { Anchor, Fieldset, Group, Text } from "@mantine/core";
import { TagsInput } from "~components/TagsInput";
import ColorModeSwitch from "~components/ColorModeSwitch";
import { useLocalStorage } from "~hooks/storage";
import { defaultOptions } from "~utils/options";
import { matchPatternsChanged } from "~utils/match-pattern";
import { setLocalStorage, type MatchPatternError } from "~utils/storage";
import { colonSeparatedStringsToMap, mapToColonSeparatedStrings } from "~utils/string";

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

export default function GeneralConfiguration({ enabled }: GeneralConfigurationProps) {
    const { headers, attributes, matchPatterns, matchPatternErrors } = useLocalStorage([
        'headers',
        'attributes',
        'matchPatterns',
        'matchPatternErrors'
    ])
    const headersStrings = mapToColonSeparatedStrings(headers)
    const attributesStrings = mapToColonSeparatedStrings(attributes)
    const pillErrors = patternErrorsToPills(matchPatterns, matchPatternErrors)

    const setPatternErrors = (errors: MatchPatternError[]) => {
        setLocalStorage({ matchPatternErrors: errors })
    }

    const onEnabledUrlsChange = async (values: string[]) => {
        setLocalStorage({ matchPatterns: values })
        matchPatternsChanged({ prev: matchPatterns, next: values, setErrors: setPatternErrors })
    }

    return (
        <Fieldset radius="md"
            styles={{
                root: {
                    borderColor: enabled ? 'var(--mantine-primary-color-5)' : 'var(--mantine-color-default-border)'
                }
            }}
            legend={
                <Group gap='xs'>
                    <ColorModeSwitch label={"General"} styles={{
                        labelWrapper: {
                            justifyContent: 'center'
                        }
                    }} />
                </Group>
            }>
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
                <TagsInput
                    value={attributesStrings}
                    onValueRemoved={(index) => {
                        attributesStrings.splice(index, 1)
                        setLocalStorage({ attributes: colonSeparatedStringsToMap(attributesStrings) })
                    }}
                    onValueAdded={(value) => {
                        attributesStrings.push(value)
                        setLocalStorage({ attributes: colonSeparatedStringsToMap(attributesStrings) })
                    }}
                    label="Resource attributes"
                    disabled={!enabled}
                    description="Attach additional attributes on all exported logs/traces."
                    placeholder={attributesStrings.length == 0 ? 'key:value, key2:value2' : ''}
                    delimiter={","}
                    keyValueMode={true}
                />
                <TagsInput
                    value={headersStrings}
                    onValueRemoved={(index) => {
                        headersStrings.splice(index, 1)
                        setLocalStorage({ headers: colonSeparatedStringsToMap(headersStrings) })
                    }}
                    onValueAdded={(value) => {
                        headersStrings.push(value)
                        setLocalStorage({ headers: colonSeparatedStringsToMap(headersStrings) })
                    }}
                    label="Request headers"
                    disabled={!enabled}
                    description="Include additional HTTP headers on all export requests."
                    placeholder={headersStrings.length == 0 ? 'key:value, key2:value2' : ''}
                    delimiter={","}
                    keyValueMode={true}
                />
            </Group>
        </Fieldset>
    );
}