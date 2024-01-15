import { Checkbox, createTheme, Fieldset, Flex, Group, MantineProvider, TagsInput, Text, TextInput } from '@mantine/core';
import { Storage } from "@plasmohq/storage";
import { useStorage } from "@plasmohq/storage/hook"

const theme = createTheme({
    /** Put your mantine theme override here */
});

import '@mantine/core/styles.css';
import 'popup.css';


function IndexPopup() {

    const storage = new Storage({ area: 'local' })
    const [headers, setHeaders] = useStorage<string[]>({
        key: "headers",
        instance: storage
    })
    const [events, setEvents] = useStorage<string[]>({
        key: "events",
        instance: storage
    })
    const [url, setUrl] = useStorage({
        key: "url",
        instance: storage
    })
    type Keys = keyof HTMLElementEventMap
    console.log(url, setUrl)

    return (
        <MantineProvider theme={theme}>
            <Flex className='popup-container'>
                <Flex>
                    <svg className='popup-logo' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
                        <path fill="#f5a800" d="M67.648 69.797c-5.246 5.25-5.246 13.758 0 19.008 5.25 5.246 13.758 5.246 19.004 0 5.25-5.25 5.25-13.758 0-19.008-5.246-5.246-13.754-5.246-19.004 0Zm14.207 14.219a6.649 6.649 0 0 1-9.41 0 6.65 6.65 0 0 1 0-9.407 6.649 6.649 0 0 1 9.41 0c2.598 2.586 2.598 6.809 0 9.407ZM86.43 3.672l-8.235 8.234a4.17 4.17 0 0 0 0 5.875l32.149 32.149a4.17 4.17 0 0 0 5.875 0l8.234-8.235c1.61-1.61 1.61-4.261 0-5.87L92.29 3.671a4.159 4.159 0 0 0-5.86 0ZM28.738 108.895a3.763 3.763 0 0 0 0-5.31l-4.183-4.187a3.768 3.768 0 0 0-5.313 0l-8.644 8.649-.016.012-2.371-2.375c-1.313-1.313-3.45-1.313-4.75 0-1.313 1.312-1.313 3.449 0 4.75l14.246 14.242a3.353 3.353 0 0 0 4.746 0c1.3-1.313 1.313-3.45 0-4.746l-2.375-2.375.016-.012Zm0 0" />
                        <path fill="#425cc7" d="M72.297 27.313 54.004 45.605c-1.625 1.625-1.625 4.301 0 5.926L65.3 62.824c7.984-5.746 19.18-5.035 26.363 2.153l9.148-9.149c1.622-1.625 1.622-4.297 0-5.922L78.22 27.313a4.185 4.185 0 0 0-5.922 0ZM60.55 67.585l-6.672-6.672c-1.563-1.562-4.125-1.562-5.684 0l-23.53 23.54a4.036 4.036 0 0 0 0 5.687l13.331 13.332a4.036 4.036 0 0 0 5.688 0l15.132-15.157c-3.199-6.609-2.625-14.593 1.735-20.73Zm0 0" />
                    </svg>
                    <Text size='xl'>OpenTelemetry Browser Extension</Text>
                </Flex>
                <Fieldset legend="Exporter configuration" radius='md' variant='filled'>
                    <Checkbox.Group
                        defaultValue={['metrics', 'traces', 'logs']}
                        label="Export"
                    >
                        <Group mt="xs">
                            <Checkbox value="metrics" label="Metrics" />
                            <Checkbox value="traces" label="Traces" />
                            <Checkbox value="logs" label="Logs" />
                        </Group>
                    </Checkbox.Group>
                    <TextInput
                        label="OTLP Collector URL"
                        value={url}
                        onChange={async (event) => await setUrl(event.currentTarget.value)}
                    />
                    <TagsInput
                        value={headers}
                        onChange={setHeaders}
                        label="Request headers"
                        placeholder='Enter request headers as "key":"value","key2":"value2"'
                        splitChars={[',']}
                    />

                    <TagsInput
                        value={events}
                        onChange={setEvents}
                        label="Event listeners"
                        placeholder='User events to instrument'
                        splitChars={[',']}
                    />
                </Fieldset>
            </Flex>
        </MantineProvider>
    )
}

export default IndexPopup
