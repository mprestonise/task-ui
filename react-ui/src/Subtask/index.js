import React, { Component } from 'react'
import { Checkbox } from 'evergreen-ui'

class Subtask extends Component {

  render() {
    return <Checkbox checked={this.props.checked} onChange={(e) => this.props.toggle(this.props.taskIndex, e.target.checked, this.props.index)} label={this.props.label} />;
  }
}

export default Subtask;
