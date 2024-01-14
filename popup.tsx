import { useState } from "react"
import { Button, createTheme, MantineProvider } from '@mantine/core';
import { sendToContentScript } from "@plasmohq/messaging";

const theme = createTheme({
  /** Put your mantine theme override here */
});

import '@mantine/core/styles.css';


function IndexPopup() {

  const testClick = () => {
    sendToContentScript({
      name: "test",
      body: "test"
    })
  }

  return (
    <MantineProvider theme={theme}>
      <div>
        <Button onClick={testClick}>Test</Button>
      </div>
    </MantineProvider>
  )
}

export default IndexPopup
