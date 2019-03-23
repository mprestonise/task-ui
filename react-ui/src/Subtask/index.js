import React, { Component } from 'react'
import { Pane, Checkbox, IconButton, TextInput } from 'evergreen-ui'

class Subtask extends Component {

  constructor(props){
    super(props)
    this.state = {
      editingSubtask: false,
      newSubtask: null
    }
  }

  render() {
    return (<Pane>
      {this.state.editingSubtask
        ? <Pane className="clearfix">
          <TextInput
            className="subtask-name--input"
            float="left"
            required
            autoFocus
            onChange={e => this.setState({ newSubtask: e.target.value })}
            defaultValue={this.props.label}
          />
          <IconButton float="left" icon="tick" appearance="primary" intent="success" marginLeft={16} marginRight={8} disabled={this.state.newSubtask === null} onClick={() => this.props.updateSubtask(this.props.taskIndex, this.props.index, this.state.newSubtask, this.props.taskId)} />
          <IconButton float="left" icon="cross" onClick={() => this.setState({ newSubtask: null, editingSubtask: false })} />
        </Pane>
        : <Pane display="flex" className="subtask-checkbox">
          <Checkbox className="subtask-item" disabled={this.props.disabled} checked={this.props.checked} onChange={(e) => this.props.toggle(this.props.taskIndex, e.target.checked, this.props.index, this.props.taskId)} label={this.props.label} />
          <IconButton height={24} icon="edit" appearance="minimal" intent="none" marginTop={3} marginLeft={16} onClick={() => this.setState({ editingSubtask: true, newSubtask: null })} />
        </Pane>
      }
    </Pane>);
  }
}

export default Subtask;
