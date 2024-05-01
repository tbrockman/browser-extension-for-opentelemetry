import { Anchor, Fieldset, Group, TagsInput, Text } from "@mantine/core";
import ColorModeSwitch from "./ColorModeSwitch";
import { useLocalStorage } from "~hooks/storage";
import { defaultOptions, type MatchPatternError } from "~utils/options";
import { matchPatternsChanged } from "~utils";

type GeneralConfigurationProps = {
    enabled: boolean
}

export default function GeneralConfiguration({ enabled }: GeneralConfigurationProps) {
    const [headers, setHeaders] = useLocalStorage<string[]>("headers")
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
                    label="Allow extension on"
                    disabled={!enabled}
                    description={
                        <>
                            Choose URLs which should be instrumented by the extension, specified as a list of {" "}
                            <Anchor
                                target="_blank"
                                size="xs"
                                href="https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns">
                                match patterns
                            </Anchor>. <Text c='orange.3' component='span' size='xs'>⚠️ These should be pages you trust.</Text>
                        </>
                    }
                    placeholder={matchPatterns.length == 0 ? defaultOptions.matchPatterns.join(', ') : ''}
                    splitChars={[","]} />
                <TagsInput
                    value={headers}
                    onChange={setHeaders}
                    label="Request headers"
                    disabled={!enabled}
                    description="Additional HTTP headers to be sent to your collector(s)."
                    placeholder={headers.length == 0 ? 'key:value, key2:value2' : ''}
                    splitChars={[","]}
                />
            </Group>
        </Fieldset>
    );
}