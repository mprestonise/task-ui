import React, { Component } from 'react'
import { Pane, Text } from 'evergreen-ui'

class Welcome extends Component {
  render() {
    return(
      <Pane background="#20252A" width="100vw" height="100vh" overflow="hidden">
        <Text size={500} color="white" position="fixed" left="50%" top="50%" transform="translate(-50%,-75%)">
          <span role="img" aria-label="emoji">👋</span> Hello there
          <span style={{ display: 'block', color: "#676F76", fontSize: '12px' }}>What are you doing here?</span>
        </Text>
      </Pane>
    );
  }
}

export default Welcome;
