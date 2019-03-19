import React, { Component } from 'react'
import { Pane, Text } from 'evergreen-ui'

class Progress extends Component {

  render() {
    return(<Pane>

      <Text className="caps-label">Progress</Text>

      <Pane marginTop={8} marginBottom={4} width={140} position="relative" height={6} background="#F2F4F6" borderRadius={4}>
        <Pane width={`${this.props.percent.toFixed(0)}%`} minWidth={4} position="absolute" height={6} background="#47B881" borderRadius={4} />
      </Pane>

      <Text size={300}>{this.props.percent}% Completed</Text>

    </Pane>);
  }
}

export default Progress;
