import { Anchor, Fieldset, Group, Text } from "@mantine/core";
import { TagsInput } from "~components/TagsInput";
import ColorModeSwitch from "~components/ColorModeSwitch";
import { useLocalStorage } from "~hooks/storage";
import { defaultOptions } from "~utils/options";
import { syncMatchPatternPermissions } from "~utils/match-pattern";
import { getLocalStorage, setLocalStorage } from "~storage/local";
import { ConfigMode, type MatchPatternError } from "~storage/local/internal";
import { Editor } from "~components/Editor";
import { KeyValueInput } from "~components/KeyValueInput";
import { ErrorBoundary } from "react-error-boundary";
import type { EditorView } from "@codemirror/view";
import type { EditorState } from "@codemirror/state";
import { useEffect, useState } from "react";
import { consoleProxy } from "~utils/logging";

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

type GeneralConfigurationProps = {
    enabled: boolean
    onEditorSave: (text: string) => void
    onEditorChange: (text: string) => void
    onEditorReady: (view: EditorView, state: EditorState) => void
}

export default function GeneralConfiguration({ enabled, onEditorSave, onEditorChange, onEditorReady }: GeneralConfigurationProps) {
    const storage = useLocalStorage([
        'configText',
        'matchPatterns',
        'matchPatternErrors',
        'configMode',
        'attributes',
        'headers'
    ])
    const pillErrors = patternErrorsToPills(storage.matchPatterns, storage.matchPatternErrors)

    const onEnabledUrlsChange = async (values: string[]) => {
        console.log('syncing permissions', values, storage.matchPatterns)
        await syncMatchPatternPermissions({ prev: storage.matchPatterns || [], next: values })
        await setLocalStorage({ matchPatterns: values })
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
                    {storage.attributes && <KeyValueInput
                        defaultValue={storage.attributes}
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
                    {storage.headers && <KeyValueInput
                        defaultValue={storage.headers}
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
            <ErrorBoundary fallback={<>shucks, looks like the editor is having an issue</>}>
                <Editor 
                    defaultValue={storage.configText || '{}'}
                    visible={storage.configMode === ConfigMode.Code} 
                    onSave={onEditorSave} 
                    onChange={onEditorChange} 
                    onEditorReady={onEditorReady} />
            </ErrorBoundary>
        </Fieldset>
    );
}