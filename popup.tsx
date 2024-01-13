import { useState } from "react"
import { createTheme, MantineProvider } from '@mantine/core';

const theme = createTheme({
  /** Put your mantine theme override here */
});

import '@mantine/core/styles.css';

function IndexPopup() {
  const [data, setData] = useState("")

  return (
    <MantineProvider theme={theme}>
      <div></div>
    </MantineProvider>
  )
}

export default IndexPopup
