import { Anchor, Box, Fieldset, Flex, Group, TagsInput, Text, Tooltip } from "@mantine/core";
import ColorModeSwitch from "./ColorModeSwitch";
import { useLocalStorage } from "~hooks/storage";
import { defaultOptions, type MatchPatternError } from "~utils/options";
import { matchPatternsChanged } from "~utils";
import { useDebouncedValue } from "@mantine/hooks";
import { useEffect, useState } from "react";

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
    const [headerStorage, setHeaderStorage] = useLocalStorage<Record<string, string>>("headers")
    const [headerRender, setHeaderRender] = useState<string[]>(mapToColonSeparatedStrings(headerStorage))
    const [debouncedHeaderStorage] = useDebouncedValue(headerRender, 200);
    useEffect(() => {
        const map = colonSeparatedStringsToMap(debouncedHeaderStorage)
        setHeaderStorage(map)
    }, [debouncedHeaderStorage])

    const [attributeStorage, setAttributeStorage] = useLocalStorage<Record<string, string>>("attributes")
    const [attributeRender, setAttributeRender] = useState<string[]>(mapToColonSeparatedStrings(attributeStorage))
    const [debouncedAttributeStorage] = useDebouncedValue(attributeRender, 200);
    useEffect(() => {
        const map = colonSeparatedStringsToMap(debouncedAttributeStorage)
        setAttributeStorage(map)
    }, [debouncedAttributeStorage])

    const [matchPatterns, setMatchPatterns] = useLocalStorage<string[]>("matchPatterns")
    const [patternErrors, setPatternErrors] = useLocalStorage<MatchPatternError[]>("matchPatternErrors")

    const onEnabledUrlsChange = async (values: string[]) => {
        setMatchPatterns(values)
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
                            </Anchor>. <Text c='orange.3' component='span' size='xs'>⚠️&nbsp;Adding new entries will require a page refresh.</Text>
                        </>
                    }
                    placeholder={matchPatterns.length == 0 ? defaultOptions.matchPatterns.join(', ') : ''}
                    splitChars={[","]} />
                <TagsInput
                    value={attributeRender}
                    onChange={setAttributeRender}
                    label="Resource attributes"
                    disabled={!enabled}
                    description="Attach additional attributes on all exported logs/traces."
                    placeholder={attributeRender.length == 0 ? 'key:value, key2:value2' : ''}
                    splitChars={[","]}
                />
                <TagsInput
                    value={headerRender}
                    onChange={setHeaderRender}
                    label="Request headers"
                    disabled={!enabled}
                    description="Include additional HTTP headers on all export requests."
                    placeholder={headerRender.length == 0 ? 'key:value, key2:value2' : ''}
                    splitChars={[","]}
                />
            </Group>
        </Fieldset>
    );
}