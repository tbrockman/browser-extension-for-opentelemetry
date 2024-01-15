import {
  createTheme,
  Flex,
  MantineProvider,
} from "@mantine/core"


import "@mantine/core/styles.css"
import "popup.css"
import LinkSection from "~src/components/LinkSection"
import Configuration from "~src/components/Configuration"

const theme = createTheme({
  /** Put your mantine theme override here */
})

function IndexPopup() {

  return (
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <Flex className="popup-container" gap='md'>
        <Configuration />
        <LinkSection />
      </Flex>
    </MantineProvider>
  )
}

export default IndexPopup
