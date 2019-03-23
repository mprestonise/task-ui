import React, { Component } from 'react'
import update from 'immutability-helper'
import { Pane, Avatar, Text, Button, Icon, Tooltip, Position, toaster} from 'evergreen-ui'
import Progress from './Progress'
import TaskCard from './TaskCard'
import Task from './Task'
import './App.css'

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      tasks: null,
      selectedTask: null,
      selectedTeam: null,
      fetching: true,
      canCreateNewTask: true,
      overallProgress: 0
    };
  }

  componentDidMount() {
    toaster.notify('Loading tasks..')
    fetch('/api/tasks')
      .then(response => {
        if (!response.ok) {
          throw new Error(`status ${response.status}`);
        }
        return response.json();
      })
      .then(json => {
        toaster.closeAll()
        this._calculateProgress(json)
        this.setState({
          tasks: json,
          fetching: false
        });
      }).catch(e => {
        this.setState({
          fetching: false
        });
      })
  }

  _calculateProgress = (tasks) => {
    let totalCompleted = 0,
        totalSubtasks = 0
    tasks.map((task) => {
      if(task.status === 'Started'){
        totalSubtasks = totalSubtasks + task.subtasks.length
        task.subtasks.map(subtask => {
          if(subtask.completed) totalCompleted++
          return null
        })
      }
      return null
    })
    this.setState({
      overallProgress: ((totalCompleted / totalSubtasks)*100).toFixed(0)
    })
  }

  _createNewTask = () => {
    toaster.notify('Creating new task..', { id: 'createNewTask' })
    this.setState({ canCreateNewTask: false, fetching: true })
    fetch('/api/task/new', {
      method: 'POST',
      headers: { 'Content-Type' : 'application/json' }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`status ${response.status}`);
        }
        return response.json();
      })
      .then(json => {
        toaster.success('New task created successfully', { id: 'createNewTask' })
        this._calculateProgress(json)
        this.setState({
          tasks: json,
          canCreateNewTask: true,
          selectedTask: 0,
          fetching: false
        });
      }).catch(e => {
        this.setState({
          fetching: false
        });
      })
  }

  _deleteTask = (id) => {
    toaster.danger('Deleting task..', { id: 'deleteNewTask' })
    fetch(`/api/task/${id}/archive`, {
      method: 'POST',
      headers: { 'Content-Type' : 'application/json' }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`status ${response.status}`);
        }
        return response.json();
      })
      .then(json => {
        toaster.success('Task deleted', { id: 'deleteNewTask' })
        this._calculateProgress(json)
        this.setState({
          tasks: json,
          fetching: false
        });
      }).catch(e => {
        this.setState({
          fetching: false
        });
      })
  }

  _selectTask = (index) => { this.setState({ selectedTask: index }) }

  _toggleSubtask = (taskIndex, value, index, taskId) => {
    toaster.notify('Updating task..', { id: 'updatingTask' })
    this.setState({
      tasks: update(this.state.tasks, { [taskIndex]: { subtasks: { [index]: { completed: { $set: value } } } } })
    })
    window.setTimeout(() => {
      fetch(`/api/task/${taskId}/updateSubtasks`, {
        method: 'POST',
        headers: { 'Content-Type' : 'application/json' },
        body: JSON.stringify({ subtasks: this.state.tasks[taskIndex].subtasks })
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`status ${response.status}`);
          }
          return response.json();
        })
        .then(json => {
          toaster.success('Task updated', { id: 'updatingTask' })
          this._calculateProgress(json)
          this.setState({
            tasks: json,
            fetching: false
          });
        }).catch(e => {
          this.setState({
            fetching: false
          });
        })
    }, 500)
  }

  _changeDueDate = (taskIndex, date, taskId) => {
    toaster.notify('Updating task..', { id: 'updatingTask' })
    this.setState({
      tasks: update(this.state.tasks, { [taskIndex]: { due_date: { $set: date } } })
    })
    fetch(`/api/task/${taskId}/updateDueDate`, {
      method: 'POST',
      headers: { 'Content-Type' : 'application/json' },
      body: JSON.stringify({ due_date: date })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`status ${response.status}`);
        }
        return response.json();
      })
      .then(json => {
        toaster.success('Task updated', { id: 'updatingTask' })
        this.setState({
          tasks: json,
          fetching: false
        });
      }).catch(e => {
        this.setState({
          fetching: false
        });
      })
  }

  _changeName = (taskIndex, name, taskId) => {
    toaster.notify('Updating task..', { id: 'updatingTask' })
    this.setState({
      tasks: update(this.state.tasks, { [taskIndex]: { name: { $set: name } } })
    })
    fetch(`/api/task/${taskId}/updateName`, {
      method: 'POST',
      headers: { 'Content-Type' : 'application/json' },
      body: JSON.stringify({ name: name })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`status ${response.status}`);
        }
        return response.json();
      })
      .then(json => {
        toaster.success('Task updated', { id: 'updatingTask' })
        this.setState({
          tasks: json,
          fetching: false
        });
      }).catch(e => {
        this.setState({
          fetching: false
        });
      })
  }

  _changeDesc = (taskIndex, desc, taskId) => {
    toaster.notify('Updating task..', { id: 'updatingTask' })
    this.setState({
      tasks: update(this.state.tasks, { [taskIndex]: { desc: { $set: desc } } })
    })
    fetch(`/api/task/${taskId}/updateDesc`, {
      method: 'POST',
      headers: { 'Content-Type' : 'application/json' },
      body: JSON.stringify({ desc: desc })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`status ${response.status}`);
        }
        return response.json();
      })
      .then(json => {
        toaster.success('Task updated', { id: 'updatingTask' })
        this.setState({
          tasks: json,
          fetching: false
        });
      }).catch(e => {
        this.setState({
          fetching: false
        });
      })
  }

  _newSubtask = (taskIndex) => {
    const newSubtask = {
      completed: false,
      content: "New subtask",
      added: new Date()
    }
    this.setState({
      tasks: update(this.state.tasks, { [taskIndex]: { subtasks: { $push: [newSubtask] } } })
    })
  }

  _updateSubtask = (taskIndex, subTaskIndex, newSubtask, taskId) => {
    toaster.notify('Updating task..', { id: 'updatingTask' })
    let newSubtasksArr = update(this.state.tasks[taskIndex], { subtasks: { [subTaskIndex]: { content: { $set: newSubtask } } } } )
    this.setState({
      tasks: update(this.state.tasks, { [taskIndex]: { subtasks: { $set: [newSubtasksArr.subtasks] } } })
    })
    fetch(`/api/task/${taskId}/updateSubtasks`, {
      method: 'POST',
      headers: { 'Content-Type' : 'application/json' },
      body: JSON.stringify({ subtasks: newSubtasksArr.subtasks })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`status ${response.status}`);
        }
        return response.json();
      })
      .then(json => {
        toaster.success('Task updated', { id: 'updatingTask' })
        this._calculateProgress(json)
        this.setState({
          tasks: json,
          fetching: false
        });
      }).catch(e => {
        this.setState({
          fetching: false
        });
      })
  }

  _selectTeam = (taskIndex, value, taskId) => {
    toaster.notify('Updating task..', { id: 'updatingTask' })
    this.setState({
      tasks: update(this.state.tasks, { [taskIndex]: { team: { $set: value } } })
    })
    fetch(`/api/task/${taskId}/updateTeam`, {
      method: 'POST',
      headers: { 'Content-Type' : 'application/json' },
      body: JSON.stringify({ team: value })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`status ${response.status}`);
        }
        return response.json();
      })
      .then(json => {
        toaster.success('Task updated', { id: 'updatingTask' })
        this.setState({
          tasks: json,
          fetching: false
        });
      }).catch(e => {
        this.setState({
          fetching: false
        });
      })
  }

  _cancelTask = (taskIndex, taskId) => {
    toaster.warning('Cancelling task..', { id: 'updatingTask' })
    this.setState({
      tasks: update(this.state.tasks, { [taskIndex]: { status: { $set: 'Cancelled' }, updated: { $set: new Date() }, cancelled_date: { $set: new Date() } } })
    })
    fetch(`/api/task/${taskId}/cancelled`, {
      method: 'POST',
      headers: { 'Content-Type' : 'application/json' }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`status ${response.status}`);
        }
        return response.json();
      })
      .then(json => {
        toaster.success('Task cancelled', { id: 'updatingTask' })
        this.setState({
          tasks: json,
          fetching: false
        });
      }).catch(e => {
        this.setState({
          fetching: false
        });
      })
  }

  _completeTask = (taskIndex, taskId) => {
    toaster.notify('Yay!! Saving task..', { id: 'updatingTask' })
    this.setState({
      tasks: update(this.state.tasks, { [taskIndex]: { status: { $set: 'Completed' }, updated: { $set: new Date() }, completed: { $set: true }, completed_date: { $set: new Date() } } })
    })
    fetch(`/api/task/${taskId}/completed`, {
      method: 'POST',
      headers: { 'Content-Type' : 'application/json' }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`status ${response.status}`);
        }
        return response.json();
      })
      .then(json => {
        toaster.success('Task completed! Good job!!', { id: 'updatingTask' })
        this.setState({
          tasks: json,
          fetching: false
        });
      }).catch(e => {
        this.setState({
          fetching: false
        });
      })
  }

  render() {
    return (
      <Pane
        className="wrapper"
        display="flex"
        height="100vh"
        overflow="hidden">

        <Pane
          width={64}
          height="100vh"
          background="#20252A">
          <Tooltip content="Michael Prestonise" position={Position.RIGHT}>
          <Avatar
            src="https://pbs.twimg.com/profile_images/861675088713846784/Eb9nssrg_400x400.jpg"
            name="Michael Prestonise"
            size={40}
            marginTop={16}
            marginLeft={12}
          />
          </Tooltip>
          <Tooltip content="Create a new task" position={Position.RIGHT}>
            <Button
              appearance="minimal"
              intent="none"
              className="new-task-btn"
              width={40}
              height={40}
              padding={0}
              marginTop={16}
              marginLeft={12}
              background="transparent"
              onClick={() => this._createNewTask()}
              disabled={!this.state.canCreateNewTask}>
              <Icon size={24} marginLeft={8} icon="plus" />
            </Button>
          </Tooltip>
        </Pane>

        <Pane width={195} padding={24} position="relative" height="100vh" background="white" borderLeft="1px solid #373A40" borderRight="1px solid #D0D6DA">

          <Pane>
            <Text className="caps-label">Tasks</Text>
            <Text display="block" marginTop={16} size={300} color={`${this.state.selectedTeam ? '#676f76' : '#20252A'}`}>
              {this.state.selectedTeam
                ? <span>All teams</span>
                : <strong>All teams</strong>
              }
            </Text>
            <Text display="block" marginTop={16} size={300} color="#676f76">Bear team</Text>
            <Text display="block" marginTop={16} size={300} color="#676f76">Camel team</Text>
            <Text display="block" marginTop={16} size={300} color="#676f76">Design</Text>
          </Pane>

          <Pane marginTop={48}>
            <Text className="caps-label">Timelines</Text>
            <Text display="block" marginTop={16} size={300} color="#676f76">Due today</Text>
            <Text display="block" marginTop={16} size={300} color="#676f76">Due this week</Text>
            <Text display="block" marginTop={16} size={300} color="#676f76">Newest</Text>
            <Text display="block" marginTop={16} size={300} color="#676f76">Overdue</Text>
          </Pane>

          <Pane marginTop={48}>
            <Text className="caps-label">Status</Text>
            <Pane display="flex" alignItems="center" marginTop={16}>
              <Pane width={8} height={8} marginRight={8} borderRadius={8} background="#47B881" />
              <Text size={300} color="#676f76">Completed</Text>
            </Pane>
            <Pane display="flex" alignItems="center" marginTop={16}>
              <Pane width={8} height={8} marginRight={8} borderRadius={8} background="#4099FF" />
              <Text size={300} color="#676f76">Started</Text>
            </Pane>
            <Pane display="flex" alignItems="center" marginTop={16}>
              <Pane width={8} height={8} marginRight={8} borderRadius={8} background="#EF4D4D" />
              <Text size={300} color="#676f76">Overdue</Text>
            </Pane>
            <Pane display="flex" alignItems="center" marginTop={16}>
              <Pane width={8} height={8} marginRight={8} borderRadius={8} background="#90999F" />
              <Text size={300} color="#676f76">Cancelled</Text>
            </Pane>
          </Pane>

          <Pane position="absolute" bottom={24}>
            <Progress percent={this.state.overallProgress} />
          </Pane>
        </Pane>

        {this.state.tasks && this.state.tasks.length > 0 && this.state.selectedTask !== null
          ? <Pane width={"calc(100vw - 259px)"} display="flex">

          <Pane width={320} padding={24} paddingLeft={0} paddingRight={0} height="100vh" background="white" borderRight="1px solid #D0D6DA">
            <Pane className="clearfix" marginLeft={16} marginRight={16} marginBottom={8}>
              <Text size={400}><strong>All teams</strong></Text>
              <Button
                float="right"
                marginTop={-6}
                appearance="minimal"
                intent="none"
                onClick={() => this._createNewTask()}
                disabled={!this.state.canCreateNewTask}>New task</Button>
            </Pane>

            {this.state.tasks && this.state.tasks.length > 0
              ? <Pane height={"calc(100vh - 50px)"} paddingBottom={16} overflow="scroll">
                {this.state.tasks.map((task,t) => <TaskCard key={t} task={task} taskIndex={t} selectTask={this._selectTask} selectedTask={this.state.selectedTask} selectTeam={this._selectTeam} delete={this._deleteTask} />)}
              </Pane>
              : <Text marginLeft={16} display="inline-block">No tasks found</Text>
            }
          </Pane>

          <Pane padding={40} paddingTop={32} paddingBottom={0} background="#f6f8fA" width={"calc(100vw - 578px)"} overflow="scroll">
            <Task
              task={this.state.tasks[this.state.selectedTask]}
              taskIndex={this.state.selectedTask}
              toggleSubtask={this._toggleSubtask}
              changeName={this._changeName}
              changeDesc={this._changeDesc}
              selectTeam={this._selectTeam}
              changeDueDate={this._changeDueDate}
              newSubtask={this._newSubtask}
              updateSubtask={this._updateSubtask}
              cancelTask={this._cancelTask}
              completeTask={this._completeTask}
              delete={this._deleteTask} />
          </Pane>

          </Pane>
          : <Pane padding={24} width="100%" maxWidth={900} marginLeft="auto" marginRight="auto">

            <Pane className="clearfix" marginLeft={16} marginRight={16} marginBottom={16}>
              <Text size={400} color="#20252A"><strong>All teams</strong></Text>
              <Button
                float="right"
                marginTop={-6}
                appearance="minimal"
                intent="none"
                onClick={() => this._createNewTask()}
                disabled={!this.state.canCreateNewTask}>New task</Button>
            </Pane>

            {this.state.tasks && this.state.tasks.length > 0
              ? <Pane className="fullwidth-task-list">
                {this.state.tasks.map((task,t) => <TaskCard key={t} task={task} taskIndex={t} selectTask={this._selectTask} selectedTask={this.state.selectedTask} selectTeam={this._selectTeam} delete={this._deleteTask} />)}
              </Pane>
              : <Text marginLeft={16} display="inline-block">No tasks found</Text>
            }

          </Pane>
        }

      </Pane>
    );
  }
}

export default App;
