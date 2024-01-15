import {
  Anchor,
  Checkbox,
  createTheme,
  Fieldset,
  Flex,
  Group,
  MantineProvider,
  Stack,
  TagsInput,
  TextInput
} from "@mantine/core"

import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

import "@mantine/core/styles.css"
import "popup.css"

const theme = createTheme({
  /** Put your mantine theme override here */
})

function IndexPopup() {
  const storage = new Storage({ area: "local" })
  const [telemetry, setTelemetry] = useStorage({
    key: "telemetry",
    instance: storage
  })
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

  return (
    <MantineProvider theme={theme}>
      <Flex className="popup-container">
        <Fieldset
          legend="OpenTelemetry configuration"
          radius="md"
          variant="filled">
          <Stack>
            <Checkbox.Group
              label="Enabled telemetry"
              value={telemetry}
              onChange={setTelemetry}
              description="Choose what data is exported by the extension to the collector">
              <Group mt="xs">
                {/* <Checkbox value="metrics" label="Metrics" /> */}
                <Checkbox value="traces" label="Traces" />
                <Checkbox value="logs" label="Logs" />
              </Group>
            </Checkbox.Group>
            <TagsInput
              value={events}
              onChange={setEvents}
              label="Event listeners"
              description={
                <>
                  Events to be tracked and collected, see{" "}
                  <Anchor
                    size="xs"
                    href="https://microsoft.github.io/PowerBI-JavaScript/interfaces/_node_modules_typedoc_node_modules_typescript_lib_lib_dom_d_.htmlelementeventmap.html">
                    HTMLElementEventMap
                  </Anchor>{" "}
                  for a list of valid events.
                </>
              }
              placeholder="submit,click,keypress"
              splitChars={[","]}
            />
            <TextInput
              label="Collector URL"
              description="URL of a collector able to handle Protobuf-encoded OTLP over HTTP"
              value={url}
              onChange={async (event) =>
                await setUrl(event.currentTarget.value)
              }
            />
            <TagsInput
              value={headers}
              onChange={setHeaders}
              label="Request headers"
              description="Additional headers to be sent along with each exported request"
              placeholder='"key":"value","key2":"value2"'
              splitChars={[","]}
            />
          </Stack>
        </Fieldset>
      </Flex>
    </MantineProvider>
  )
}

export default IndexPopup
