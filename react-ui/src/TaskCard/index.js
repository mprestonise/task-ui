import React, { Component } from 'react'
import moment from 'moment'
import { Pane, Text, Icon, IconButton, Select, Button } from 'evergreen-ui'

class TaskCard extends Component {

  constructor(props) {
    super(props)
    this.state = {
      submenu: false
    }
  }

  render() {

    const { task } = this.props

    return(
      <Pane
        borderBottom="1px solid white"
        padding={16}
        position="relative"
        className={`task-list-item ${this.props.selectedTask === this.props.taskIndex ? 'selected' : ''}`}>

        <Pane display="flex" alignItems="center">

          <Pane
            background={`${task.was_overdue && !task.completed ? '#EF4D4D' : ''} ${task.completed ? '#47B881' : ''} ${task.status === 'Cancelled' ? '#90999F' : ''} ${!moment(task.due_date).isBefore(new Date()) && task.status && !task.was_overdue === 'Started' ? '#4099FF' : ''} ${task.status === 'Created' && !task.was_overdue ? '#FFD040' : ''}`}
            padding={8}
            height={40}
            paddingLeft={12}
            paddingRight={12}
            borderRadius={8}
            onClick={() => this.props.selectTask(this.props.taskIndex)}>
            <Icon icon="clipboard" size={20} color="white" />
          </Pane>

          <Pane
            marginLeft={16}
            width={"calc(100% - 76px)"}
            onClick={() => this.props.selectTask(this.props.taskIndex)}>
            <Text size={400} display="block">{task.name}</Text>
            {moment(task.due_date).isBefore(new Date()) && !task.completed && task.status !== 'Cancelled'
              ? <Text size={300}>{moment(task.due_date).toNow(true)} overdue</Text>
              : <Text size={300}>
              {!task.completed && task.status !== 'Cancelled' && !moment(task.due_date).isBefore(new Date())
                ? <span>Due {moment(task.due_date).format('DD MMMM YYYY')}</span>
                : <span>
                  {task.completed ? 'Completed ' : ''}
                  {task.status === 'Cancelled' ? 'Cancelled ' : ''}
                  {moment(task.updated).fromNow()}
                </span>
              }
              </Text>
            }
          </Pane>

          <IconButton
            className="task-card--submenu"
            icon="more"
            size={400}
            color="#90999F"
            disabled={this.props.task.completed || this.props.task.status === 'Cancelled'}
            onClick={() => this.setState({ submenu: !this.state.submenu })} />

          {this.state.submenu
            ? <Pane
              position="absolute"
              elevation={3}
              borderRadius={4}
              right={16}
              bottom={-56}
              zIndex={100}
              background="white"
              padding={8}>
              <Select value={this.props.task.team} onChange={(e) => this.props.selectTeam(this.props.taskIndex, e.target.value, task._id)}>
                <option value="Bear team">Bear team</option>
                <option value="Camel team">Camel team</option>
                <option value="Design">Design</option>
              </Select>
              <Button display="block" marginTop={4} width={106} appearance="minimal" intent="danger" onClick={() => this.props.delete(task._id)}>Delete task</Button>
            </Pane>
            : null
          }

        </Pane>
      </Pane>
    );
  }
}

export default TaskCard;
