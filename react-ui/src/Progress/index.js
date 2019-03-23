import React, { Component } from 'react'
import { Pane, Text } from 'evergreen-ui'

class Progress extends Component {

  render() {
    return(<Pane>

      <Text className="caps-label">Progress</Text>

      <Pane marginTop={8} marginBottom={4} width={140} position="relative" height={6} background="#F2F4F6" borderRadius={4}>
        <Pane className="progress-bar--progress" width={`${this.props.percent}%`} minWidth={4} position="absolute" height={6} background="#47B881" borderRadius={4} />
      </Pane>

      {this.props.percent > -1
        ? <Text size={300}>{this.props.percent}% Completed</Text>
        : <Text size={300}>0% Completed</Text>
      }

    </Pane>);
  }
}

export default Progress;
