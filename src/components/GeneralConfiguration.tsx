import { Anchor, Fieldset, Group, TagsInput, Text } from "@mantine/core";
import ColorModeSwitch from "./ColorModeSwitch";
import { useLocalStorage } from "~hooks/storage";
import { defaultOptions } from "~utils/options";

export default function GeneralConfiguration() {
    const [headers, setHeaders] = useLocalStorage<string[]>("headers")
    const [enabledOn, setEnabledOn] = useLocalStorage<string[]>("enabledOn")

    return (
        <Fieldset radius="md"
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
                    value={enabledOn}
                    onChange={setEnabledOn}
                    label="Allow extension on"
                    description={
                        <>
                            Choose URLs which should be instrumented by the extension, specified as a list of {" "}
                            <Anchor
                                target="_blank"
                                size="xs"
                                href="https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns">
                                match patterns
                            </Anchor>. <Text c='orange.3' component='span' size='xs'>⚠️ These should be pages you trust.</Text>
                        </>
                    }
                    placeholder={enabledOn.length == 0 ? defaultOptions.enabledOn.join(', ') : ''}
                    splitChars={[","]} />
                <TagsInput
                    value={headers}
                    onChange={setHeaders}
                    label="Request headers"
                    description="Additional HTTP headers to be sent to your collector(s)."
                    placeholder={headers.length == 0 ? 'key:value, key2:value2' : ''}
                    splitChars={[","]}
                />
            </Group>
        </Fieldset>
    );
}