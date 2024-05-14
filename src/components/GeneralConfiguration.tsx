import { Anchor, Fieldset, Group, Text } from "@mantine/core";
import { TagsInput } from "./TagsInput";
import ColorModeSwitch from "./ColorModeSwitch";
import { useLocalStorage } from "~hooks/storage";
import { defaultOptions, type MatchPatternError } from "~utils/options";
import { matchPatternsChanged } from "~utils";

type GeneralConfigurationProps = {
    enabled: boolean
}

const colonSeparatedStringsToMap = (strings: string[]): Record<string, string> => {
    return strings.reduce((acc, curr) => {
        const [key, value] = curr.split(":")
        return { ...acc, [key]: value }
    }, {})
}

const mapToColonSeparatedStrings = (map: Record<string, string>): string[] => {
    return Object.entries(map).map(([key, value]) => `${key}:${value}`)
}

export default function GeneralConfiguration({ enabled }: GeneralConfigurationProps) {
    const [headers, setHeaders] = useLocalStorage<Record<string, string>>("headers")
    const [attributes, setAttributes] = useLocalStorage<Record<string, string>>("attributes")

    const [matchPatterns, setMatchPatterns] = useLocalStorage<string[]>("matchPatterns")
    const [patternErrors, setPatternErrors] = useLocalStorage<MatchPatternError[]>("matchPatternErrors")

    const onEnabledUrlsChange = async (values: string[]) => {
        setMatchPatterns(values)
        matchPatternsChanged({ prev: matchPatterns, next: values, setErrors: setPatternErrors })
    }

    const onHeadersChanged = (newHeaders: string[]) => {
        setHeaders(colonSeparatedStringsToMap(newHeaders))
    }

    const onAttributesChanged = (newAttributes: string[]) => {
        setAttributes(colonSeparatedStringsToMap(newAttributes))
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
                    onChange={onEnabledUrlsChange}
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
                    splitChars={[","]}
                />
                <TagsInput
                    value={mapToColonSeparatedStrings(attributes)}
                    onChange={onAttributesChanged}
                    label="Resource attributes"
                    disabled={!enabled}
                    description="Attach additional attributes on all exported logs/traces."
                    placeholder={Object.keys(attributes).length == 0 ? 'key:value, key2:value2' : ''}
                    splitChars={[","]}
                />
                <TagsInput
                    value={mapToColonSeparatedStrings(headers)}
                    onChange={onHeadersChanged}
                    label="Request headers"
                    disabled={!enabled}
                    description="Include additional HTTP headers on all export requests."
                    placeholder={Object.keys(headers).length == 0 ? 'key:value, key2:value2' : ''}
                    splitChars={[","]}
                />
            </Group>
        </Fieldset>
    );
}