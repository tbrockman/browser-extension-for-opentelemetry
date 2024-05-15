import { Anchor, Fieldset, Group, Text } from "@mantine/core";
import { TagsInput } from "~components/TagsInput";
import ColorModeSwitch from "~components/ColorModeSwitch";
import { useLocalStorage } from "~hooks/storage";
import { defaultOptions, type MatchPatternError } from "~utils/options";
import { matchPatternsChanged } from "~utils";

type GeneralConfigurationProps = {
    enabled: boolean
}

const colonSeparatedStringsToMap = (strings: string[]): Map<string, string> => {
    const map = new Map<string, string>()
    strings.forEach((string) => {
        const [key, value] = string.split(':')
        map.set(key, value)
    })
    return map
}

const mapToColonSeparatedStrings = (map: Map<string, string>): string[] => {
    const strings = []
    console.log(map, typeof map)
    if (map) {
        map.forEach((value, key) => {
            strings.push(`${key}:${value}`)
        })
    }
    return strings
}

export default function GeneralConfiguration({ enabled }: GeneralConfigurationProps) {
    const [headers, setHeaders] = useLocalStorage<Map<string, string>>("headers")
    const [attributes, setAttributes] = useLocalStorage<Map<string, string>>("attributes")
    const attributesStrings = mapToColonSeparatedStrings(attributes)

    const [matchPatterns, setMatchPatterns] = useLocalStorage<string[]>("matchPatterns")
    const [patternErrors, setPatternErrors] = useLocalStorage<MatchPatternError[]>("matchPatternErrors")

    const onEnabledUrlsChange = async (values: string[]) => {
        setMatchPatterns(values)
        matchPatternsChanged({ prev: matchPatterns, next: values, setErrors: setPatternErrors })
    }

    const onHeadersChanged = (newHeaders: string[]) => {
        setHeaders(colonSeparatedStringsToMap(newHeaders))
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
                        const newAttributes = [...attributesStrings]
                        newAttributes.splice(index, 1)
                        setAttributes(colonSeparatedStringsToMap(newAttributes))
                    }}
                    onValueAdded={(value) => {
                        attributesStrings.push(value)
                        setAttributes(colonSeparatedStringsToMap(attributesStrings))
                    }}
                    label="Resource attributes"
                    disabled={!enabled}
                    description="Attach additional attributes on all exported logs/traces."
                    placeholder={Object.keys(attributes).length == 0 ? 'key:value, key2:value2' : ''}
                    delimiter={","}
                />
                <TagsInput
                    value={mapToColonSeparatedStrings(headers)}
                    label="Request headers"
                    disabled={!enabled}
                    description="Include additional HTTP headers on all export requests."
                    placeholder={Object.keys(headers).length == 0 ? 'key:value, key2:value2' : ''}
                    delimiter={","}
                />
            </Group>
        </Fieldset>
    );
}