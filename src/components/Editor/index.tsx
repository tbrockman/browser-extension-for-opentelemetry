import { Box, useComputedColorScheme } from "@mantine/core";
import { EditorState, useCodeMirror } from "@uiw/react-codemirror";
import { useEffect, useRef, useState } from "react";
import { useLocalStorage } from "~hooks/storage";
import { getLocalStorage, setLocalStorage } from "~storage/local";
import { linter, lintKeymap, lintGutter } from "@codemirror/lint";
import {
    EditorView, hoverTooltip, keymap, ViewUpdate, gutter,
    drawSelection,
    highlightActiveLineGutter,
} from "@codemirror/view";
import { json, jsonParseLinter, jsonLanguage } from "@codemirror/lang-json";
import {
    autocompletion,
    completionKeymap,
    closeBrackets,
    closeBracketsKeymap,
} from "@codemirror/autocomplete";
import schema from "~generated/schemas/configuration.schema.json";

import {
    jsonSchemaLinter,
    jsonSchemaHover,
    jsonCompletion,
    stateExtensions,
    handleRefresh,
} from "codemirror-json-schema";
import { getHoverTexts, formatHover } from "~components/Editor/hover";
import { themeDark, themeLight } from "./theme";
import './index.css';
import { defaultKeymap, historyKeymap, historyField } from "@codemirror/commands";
import { HighlightStyle, indentOnInput, bracketMatching, foldKeymap } from "@codemirror/language";
import { de } from "~utils/serde";
import { UserFacingConfiguration } from "~storage/local/configuration";
import { consoleProxy } from "~utils/logging";
import { syncMatchPatternPermissions } from "~utils/match-pattern";
import { get } from "http";

const stateFields = { history: historyField };
const constExtensions = [
    EditorView.lineWrapping,
    // autocompletion(),
    lintGutter(),
    gutter({ class: "CodeMirror-lint-markers" }),
    bracketMatching(),
    highlightActiveLineGutter(),
    closeBrackets(), // TODO: figure out why brackets not closing when started before comma
    indentOnInput(),
    drawSelection(),
    keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...completionKeymap,
        ...lintKeymap,
    ]),
    json(),
    linter(jsonParseLinter(), {
        // default is 750ms
        delay: 300
    }),
    linter(jsonSchemaLinter(), {
        needsRefresh: handleRefresh,
    }),
    jsonLanguage.data.of({
        autocomplete: jsonCompletion(), // TODO better autocomplete
    }),
]

export type EditorProps = {
    // value: string;
    // onChange: (val: string) => void;
}

export const Editor = ({ }: EditorProps) => {
    const computedColorScheme = useComputedColorScheme('dark');
    const editor = useRef();
    const { matchPatterns } = useLocalStorage(['matchPatterns']);
    const [initialEditorState, setInitialEditorState] = useState(null);
    // some sort of state so that we can populate with proper editor state initially?
    const [renderedConfig, setRenderedConfig] = useState(null);
    const [saving, setSaving] = useState<boolean | null>(null);
    const theme = computedColorScheme == 'dark' ? themeDark : themeLight
    // second element returned by createTheme is the syntaxHighlighting extension
    const highlighter = theme[1].find(item => item.value instanceof HighlightStyle)?.value;

    const onChange = async (val: string, viewUpdate: ViewUpdate) => {
        consoleProxy.debug('editor change', val, viewUpdate);
        setRenderedConfig(val);

        const state = viewUpdate.state.toJSON(stateFields);
        consoleProxy.log('setting editorstate', state);
        await setLocalStorage({ editorState: state });
    }

    const onSave = () => {
        const save = async () => {
            try {
                await checkMatchPatterns();
                await setLocalStorage({ configText: renderedConfig })
            } catch (e) {
                consoleProxy.error(e);
            }
            setSaving(false);
        }
        setSaving(true);
        save();

        return true;
    }

    const checkMatchPatterns = async () => {
        try {
            const newConfig = de(renderedConfig, UserFacingConfiguration);

            if (newConfig.matchPatterns !== matchPatterns) {
                await syncMatchPatternPermissions({ prev: matchPatterns, next: newConfig.matchPatterns });
            }
        } catch (e) {
            consoleProxy.error(e);
        }
    }

    const codemirror = useCodeMirror({
        container: editor.current,
        initialState: initialEditorState ? {
            json: initialEditorState,
            fields: stateFields,
        } : undefined,
        extensions: [
            constExtensions,
            // @ts-ignore
            hoverTooltip(jsonSchemaHover({ getHoverTexts, formatHover: formatHover(highlighter) })),
            // @ts-ignore
            stateExtensions(schema),
            keymap.of([
                { key: "Mod-s", run: onSave },
            ]),
        ],
        theme,
        onChange,
        value: renderedConfig,
        height: '100%',
    });

    useEffect(() => {
        const init = async () => {
            if (initialEditorState == null) {
                const { editorState, configText } = await getLocalStorage(['editorState', 'configText'])
                consoleProxy.log('got editor state in init', editorState, configText, editorState?.doc || configText);
                setRenderedConfig(editorState?.doc || configText);
                setInitialEditorState(editorState);
            }
        }
        init();
    }, [initialEditorState])

    useEffect(() => {
        initialEditorState && codemirror.setState(initialEditorState);
        editor.current && codemirror.setContainer(editor.current);
    }, [editor.current, initialEditorState])

    return (
        <Box ref={editor} />
    )
};