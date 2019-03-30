import React, { Component } from 'react'
import update from 'immutability-helper'
import moment from 'moment'
import { HotKeys } from 'react-hotkeys'
import { Pane, Avatar, Text, Strong, Button, Icon, Tooltip, Position, toaster} from 'evergreen-ui'
import Progress from './Progress'
import TaskCard from './TaskCard'
import Task from './Task'
import './App.css'

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      allTasks: null,
      tasks: null,
      selectedTask: null,
      filteredStatus: null,
      filteredTeam: null,
      filteredDate: null,
      dueToday: 0,
      dueThisWeek: 0,
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
        this._dueToday(json)
        this._dueThisWeek(json)
        this.setState({
          allTasks: json,
          tasks: json,
          fetching: false
        });
      }).catch(e => {
        this.setState({
          fetching: false
        });
      })
  }

  componentDidUpdate(prevProps, prevState) {
    if(prevState.filteredTeam !== this.state.filteredTeam || prevState.filteredStatus !== this.state.filteredStatus || prevState.filteredDate !== this.state.filteredDate){
      this._filterTasks()
    }
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

  _dueToday = (tasks) => {
    let totalDue = 0
    tasks.map((task) => {
      if(moment(task.due_date).isSame(new Date(), 'day') && task.status !== 'Cancelled' && !task.completed){
        return totalDue++
      }
      return null
    })
    this.setState({ dueToday: totalDue })
  }

  _dueThisWeek = (tasks) => {
    let totalDue = 0
    const sevenDaysAhead = moment(new Date()).add(7, 'days')
    tasks.map((task) => {
      if(moment(task.due_date).isBetween(new Date(), sevenDaysAhead) && task.status !== 'Cancelled' && !task.completed){
        return totalDue++
      }
      return null
    })
    this.setState({ dueThisWeek: totalDue })
  }

  _filterTeam = (team) => {
    if(this.state.filteredTeam && this.state.filteredTeam.indexOf(team) !== -1){
      this._clearFilter('team')
    } else {
      this.setState({ filteredTeam: team })
    }
  }
  _filterStatus = (status) => {
    if(this.state.filteredStatus && this.state.filteredStatus.indexOf(status) !== -1){
      this._clearFilter('status')
    } else {
      this.setState({ filteredStatus: status })
    }
  }
  _filterDate = (range) => {
    if(this.state.filteredDate && this.state.filteredDate.indexOf(range) !== -1){
      this._clearFilter('date')
    } else {
      this.setState({ filteredDate: range })
    }
  }

  _filterTasks = () => {
    let filteredTasks = this.state.allTasks
    if(filteredTasks.length > 0 && this.state.filteredTeam){ filteredTasks = filteredTasks.filter(task => task.team === this.state.filteredTeam) }
    if(filteredTasks.length > 0 && this.state.filteredStatus){ filteredTasks = filteredTasks.filter(task => task.status === this.state.filteredStatus) }
    if(filteredTasks.length > 0 && this.state.filteredDate){
      const today = new Date()
      const sevenDaysAhead = moment(new Date()).add(7, 'days')
      if(this.state.filteredDate === 'overdue') { filteredTasks = filteredTasks.filter(task => moment(task.due_date).isBefore(today) && task.status !== 'Cancelled' && !task.completed) }
      if(this.state.filteredDate === 'today') { filteredTasks = filteredTasks.filter(task => moment(task.due_date).isSame(new Date(), 'day') && task.status !== 'Cancelled' && !task.completed) }
      if(this.state.filteredDate === 'week') { filteredTasks = filteredTasks.filter(task => moment(task.due_date).isBetween(new Date(), sevenDaysAhead) && task.status !== 'Cancelled' && !task.completed) }
    }
    this.setState({
      tasks: filteredTasks
    })
  }

  _clearFilter = (filter) => {
    if(filter === 'team') { this.setState({ filteredTeam: null }) }
    if(filter === 'status') { this.setState({ filteredStatus: null }) }
    if(filter === 'date') { this.setState({ filteredDate: null }) }
  }
  _clearFilters = () => {
    this.setState({
      filteredTeam: null,
      filteredStatus: null,
      filteredDate: null
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
          allTasks: json,
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
          allTasks: json,
          tasks: json,
          selectedTask: 0,
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
            allTasks: json,
            tasks: json,
            selectedTask: 0,
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
        this._dueToday(json)
        this._dueThisWeek(json)
        this.setState({
          allTasks: json,
          tasks: json,
          selectedTask: 0,
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
          allTasks: json,
          tasks: json,
          selectedTask: 0,
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
          allTasks: json,
          tasks: json,
          selectedTask: 0,
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
          allTasks: json,
          tasks: json,
          selectedTask: 0,
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
          allTasks: json,
          tasks: json,
          selectedTask: 0,
          fetching: false
        });
      }).catch(e => {
        this.setState({
          fetching: false
        });
      })
  }

  _addArtifact = (taskIndex, artifact, taskId) => {
    let data = new FormData()
    data.append('file', artifact[0])
    toaster.notify('Uploading..', { id: 'updatingTask' })
    fetch(`/api/task/${taskId}/addArtifact/sign-s3?fileName=${artifact[0].name}&fileType=${artifact[0].type}`, {
      method: 'POST',
      body: data
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`status ${response.status}`);
        }
        return response.json();
      })
      .then(json => {
        this._uploadFile(artifact[0], json.signedUrl, json.url).then(() => {
          toaster.success('Artifact uploaded successfully', { id: 'updatingTask' })
          this.setState({
            allTasks: json.tasks,
            tasks: json.tasks,
            selectedTask: 0,
            fetching: false
          });
        })
      }).catch(e => {
        this.setState({
          fetching: false
        });
      })
  }

  _uploadFile = (file, signedRequest, url) => {
    const options = {
      method: 'PUT',
      body: file
    };
    return fetch(signedRequest, options)
      .then(response => {
        if (!response.ok) { throw new Error(`${response.status}: ${response.statusText}`); }
      });
  }

  _addAttachment = (taskIndex, attachment, taskId) => {
    toaster.notify('Attaching..', { id: 'updatingTask' })
    fetch(`/api/task/${taskId}/addAttachment`, {
      method: 'POST',
      headers: { 'Content-Type' : 'application/json' },
      body: JSON.stringify({ attachment: attachment })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`status ${response.status}`);
        }
        return response.json();
      })
      .then(json => {
        toaster.success('Attachment.. attached!', { id: 'updatingTask' })
        this.setState({
          allTasks: json,
          tasks: json,
          selectedTask: 0,
          fetching: false
        });
      }).catch(e => {
        this.setState({
          fetching: false
        });
      })
  }

  _removeAttachment = (taskIndex, attachment, taskId) => {
    toaster.danger('Detaching..', { id: 'updatingTask' })
    fetch(`/api/task/${taskId}/removeAttachment`, {
      method: 'POST',
      headers: { 'Content-Type' : 'application/json' },
      body: JSON.stringify({ attachment: attachment })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`status ${response.status}`);
        }
        return response.json();
      })
      .then(json => {
        toaster.success('Bye, attachment..', { id: 'updatingTask' })
        this.setState({
          allTasks: json,
          tasks: json,
          selectedTask: 0,
          fetching: false
        });
      }).catch(e => {
        this.setState({
          fetching: false
        });
      })
  }

  _addNote = (taskIndex, note, taskId) => {
    toaster.notify('Adding note..', { id: 'updatingTask' })
    fetch(`/api/task/${taskId}/addNote`, {
      method: 'POST',
      headers: { 'Content-Type' : 'application/json' },
      body: JSON.stringify({ note: note })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`status ${response.status}`);
        }
        return response.json();
      })
      .then(json => {
        toaster.success('Note added', { id: 'updatingTask' })
        this.setState({
          allTasks: json,
          tasks: json,
          selectedTask: 0,
          fetching: false
        });
      }).catch(e => {
        this.setState({
          fetching: false
        });
      })
  }

  _startTask = (taskIndex, taskId) => {
    toaster.notify("Let's do this!", { id: 'updatingTask' })
    this.setState({
      tasks: update(this.state.tasks, { [taskIndex]: { status: { $set: 'Started' }, updated: { $set: new Date() }, started_date: { $set: new Date() } } })
    })
    fetch(`/api/task/${taskId}/startTask`, {
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
        window.setTimeout(() => { toaster.success("Task started! Go get 'em!!", { id: 'updatingTask' }) }, 750)
        this.setState({
          allTasks: json,
          tasks: json,
          selectedTask: 0,
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
          allTasks: json,
          tasks: json,
          selectedTask: 0,
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
          allTasks: json,
          tasks: json,
          selectedTask: 0,
          fetching: false
        });
      }).catch(e => {
        this.setState({
          fetching: false
        });
      })
  }

  _markAsOverdue = (taskIndex, taskId) => {
    toaster.notify('This task is overdue..', { id: 'updatingTask' })
    this.setState({
      tasks: update(this.state.tasks, { [taskIndex]: { updated: { $set: new Date() }, was_overdue: { $set: true }, completed_date: { $set: new Date() } } })
    })
    fetch(`/api/task/${taskId}/overdue`, {
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
        toaster.success("Task updated. You'll get 'em next time'", { id: 'updatingTask' })
        this.setState({
          allTasks: json,
          tasks: json,
          selectedTask: 0,
          fetching: false
        });
      }).catch(e => {
        this.setState({
          fetching: false
        });
      })
  }

  _closeTask = () => {
    this.setState({
      selectedTask: null
    })
  }

  render() {
    const map = {
      'newTask': 'command+option+1',
      'closeTask': 'command+option+2',
      'clearFilters': 'command+option+3'
    }
    const handlers = {
      'newTask': () => this._createNewTask(),
      'closeTask': () => this._closeTask(),
      'clearFilters': () => this._clearFilters()
    }
    return (<HotKeys keyMap={map} handlers={handlers}>
      <Pane
        className="wrapper"
        display="flex"
        height="100vh"
        overflow="hidden">

        <Pane
          width={64}
          height="100vh"
          position="relative"
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
          <Tooltip content="Create a new task (Cmd+Alt+1)" position={Position.RIGHT}>
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
          <Tooltip content={
              <Pane background="white" padding={8} paddingTop={12}>
                <Text display="block" marginBottom={8} size={300} color="#90999F"><Strong display="inline-block" width={96} size={300} color="#20252A">New task</Strong> <span style={{ textAlign: 'right' }}>Cmd+Alt+1</span></Text>
                <Text display="block" marginBottom={8} size={300} color="#90999F"><Strong display="inline-block" width={96} size={300} color="#20252A">Close task</Strong> <span style={{ textAlign: 'right' }}>Cmd+Alt+2</span></Text>
                <Text display="block" size={300} color="#90999F"><Strong display="inline-block" width={96} size={300} color="#20252A">Clear filters</Strong> <span style={{ textAlign: 'right' }}>Cmd+Alt+3</span></Text>
              </Pane>
            }
            appearance="card"
            position={Position.RIGHT}>
          <Icon
            position="absolute"
            left={20}
            bottom={32}
            icon="help"
            size={24}
            color="#90999F"
          />
          </Tooltip>
        </Pane>

        <Pane width={195} padding={24} position="relative" height="100vh" overflow="scroll" background="white" borderLeft="1px solid #373A40" borderRight="1px solid #D0D6DA">

          <Pane>
            <Text className="caps-label">Tasks</Text>
            <Text display="block" cursor="pointer" onClick={() => this._clearFilter('team')} marginTop={16} size={300} color="#676f76">
            {this.state.filteredTeam === null
              ? <Strong size={300} color="#20252A">All teams</Strong>
              : <span>All teams</span>
            }
            </Text>
            <Text display="block" cursor="pointer" onClick={() => this._filterTeam('Bear team')} marginTop={16} size={300} color="#676f76">
              {this.state.filteredTeam === 'Bear team'
                ? <Strong size={300} color="#20252A">Bear team</Strong>
                : <span>Bear team</span>
              }
            </Text>
            <Text display="block" cursor="pointer" onClick={() => this._filterTeam('Camel team')} marginTop={16} size={300} color="#676f76">
            {this.state.filteredTeam === 'Camel team'
              ? <Strong size={300} color="#20252A">Camel team</Strong>
              : <span>Camel team</span>
            }
            </Text>
            <Text display="block" cursor="pointer" onClick={() => this._filterTeam('Design')} marginTop={16} size={300} color="#676f76">
            {this.state.filteredTeam === 'Design'
              ? <Strong size={300} color="#20252A">Design</Strong>
              : <span>Design</span>
            }
            </Text>
          </Pane>

          <Pane marginTop={48}>
            <Text className="caps-label">Status</Text>
            <Pane display="flex" cursor="pointer" onClick={() => this._filterStatus('Created')} alignItems="center" marginTop={16}>
              <Pane width={8} height={8} marginRight={8} borderRadius={8} background="#FFD040" />
              {this.state.filteredStatus === 'Created'
                ? <Text size={300}><Strong size={300} color="#20252A">Created</Strong></Text>
                : <Text size={300} color="#676f76">Created</Text>
              }
            </Pane>
            <Pane display="flex" cursor="pointer" onClick={() => this._filterStatus('Started')} alignItems="center" marginTop={16}>
              <Pane width={8} height={8} marginRight={8} borderRadius={8} background="#4099FF" />
              {this.state.filteredStatus === 'Started'
                ? <Text size={300}><Strong size={300} color="#20252A">Started</Strong></Text>
                : <Text size={300} color="#676f76">Started</Text>
              }
            </Pane>
            <Pane display="flex" cursor="pointer" onClick={() => this._filterStatus('Overdue')} alignItems="center" marginTop={16}>
              <Pane width={8} height={8} marginRight={8} borderRadius={8} background="#EF4D4D" />
              {this.state.filteredStatus === 'Overdue'
                ? <Text size={300}><Strong size={300} color="#20252A">Overdue</Strong></Text>
                : <Text size={300} color="#676f76">Overdue</Text>
              }
            </Pane>
            <Pane display="flex" cursor="pointer" onClick={() => this._filterStatus('Completed')} alignItems="center" marginTop={16}>
              <Pane width={8} height={8} marginRight={8} borderRadius={8} background="#47B881" />
              {this.state.filteredStatus === 'Completed'
                ? <Text size={300}><Strong size={300} color="#20252A">Completed</Strong></Text>
                : <Text size={300} color="#676f76">Completed</Text>
              }
            </Pane>
            <Pane display="flex" cursor="pointer" onClick={() => this._filterStatus('Cancelled')} alignItems="center" marginTop={16}>
              <Pane width={8} height={8} marginRight={8} borderRadius={8} background="#90999F" />
              {this.state.filteredStatus === 'Cancelled'
                ? <Text size={300}><Strong size={300} color="#20252A">Cancelled</Strong></Text>
                : <Text size={300} color="#676f76">Cancelled</Text>
              }
            </Pane>
          </Pane>

          <Pane marginTop={48}>
            <Text className="caps-label">Timelines</Text>
            <Text className="clearfix" display="block" cursor="pointer" onClick={() => this._filterDate('overdue')} marginTop={16} size={300} color="#676f76">
              {this.state.filteredDate === 'overdue'
                ? <Strong size={300} color="#20252A">Overdue</Strong>
                : <span>Overdue</span>
              }
              {this.state.overdue > 0
                ? <span className="pill">{this.state.overdue}</span>
                : null
              }
            </Text>
            <Text className="clearfix" display="block" cursor="pointer" onClick={() => this._filterDate('today')} marginTop={16} size={300} color="#676f76">
              {this.state.filteredDate === 'today'
                ? <Strong size={300} color="#20252A">Due today</Strong>
                : <span>Due today</span>
              }
              {this.state.dueToday > 0
                ? <span className="pill">{this.state.dueToday}</span>
                : null
              }
            </Text>
            <Text className="clearfix" display="block" cursor="pointer" onClick={() => this._filterDate('week')} marginTop={16} size={300} color="#676f76">
              {this.state.filteredDate === 'week'
                ? <Strong size={300} color="#20252A">Due this week</Strong>
                : <span>Due this week</span>
              }
              {this.state.dueThisWeek > 0
                ? <span className="pill">{this.state.dueThisWeek}</span>
                : null
              }
            </Text>
          </Pane>

          <Pane className="sidebar-progress">
            <Progress percent={this.state.overallProgress} />
          </Pane>
        </Pane>

        {this.state.tasks && this.state.tasks.length > 0 && this.state.selectedTask !== null
          ? <Pane width={"calc(100vw - 259px)"} display="flex">

          <Pane width={320} padding={24} paddingLeft={0} paddingRight={0} height="100vh" background="white" borderRight="1px solid #D0D6DA">
            <Pane className="clearfix" marginLeft={16} marginRight={16} marginBottom={8}>
              <Text size={400}><strong>{`${this.state.filteredTeam ? this.state.filteredTeam : 'All teams' }`}</strong></Text>
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
                {this.state.tasks.map((task,t) => {
                  return (
                    <TaskCard
                      key={t}
                      task={task}
                      taskIndex={t}
                      selectTask={this._selectTask}
                      selectedTask={this.state.selectedTask}
                      selectTeam={this._selectTeam}
                      delete={this._deleteTask} />
                  )}
                )}
              </Pane>
              : <Text marginLeft={16} display="inline-block">No tasks found</Text>
            }
          </Pane>

          <Pane padding={40} paddingTop={24} paddingBottom={0} background="#f6f8fA" width={"calc(100vw - 578px)"} overflow="scroll">

            {this.state.tasks[this.state.selectedTask].status === 'Created'
              ? <Pane marginBottom={32} display="flex">
                <Text size={500} color="#20252A">Ready to get started on this task?</Text>
                <Button marginTop={-6} marginLeft={16} appearance="primary" intent="none" onClick={() => this._startTask(this.state.selectedTask, this.state.tasks[this.state.selectedTask]._id)}>Start this task</Button>
              </Pane>
              : null
            }

            <Pane
              marginBottom={8}
              display="inline-flex"
              alignItems="center"
              style={{ cursor: 'pointer' }}
              onClick={() => this._closeTask()}>
              <Icon icon="arrow-left" marginRight={8} size={12} color="#90999F" />
              <Text size={300} color="#90999F">Close task</Text>
            </Pane>

            <Task
              task={this.state.tasks[this.state.selectedTask]}
              closeTask={this._closeTask}
              taskIndex={this.state.selectedTask}
              toggleSubtask={this._toggleSubtask}
              changeName={this._changeName}
              changeDesc={this._changeDesc}
              selectTeam={this._selectTeam}
              changeDueDate={this._changeDueDate}
              newSubtask={this._newSubtask}
              updateSubtask={this._updateSubtask}
              addArtifact={this._addArtifact}
              addAttachment={this._addAttachment}
              removeAttachment={this._removeAttachment}
              addNote={this._addNote}
              markAsOverdue={this._markAsOverdue}
              cancelTask={this._cancelTask}
              completeTask={this._completeTask}
              delete={this._deleteTask} />
          </Pane>

          </Pane>
          : <Pane padding={24} width="100%" maxWidth={900} marginLeft="auto" marginRight="auto">

            <Pane className="clearfix" marginLeft={16} marginRight={16} marginBottom={16}>
              <Text size={400} color="#20252A"><strong>{`${this.state.filteredTeam ? this.state.filteredTeam : 'All teams' }`}</strong></Text>
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
                {this.state.tasks.map((task,t) => {
                  return (
                    <TaskCard
                      key={t}
                      task={task}
                      taskIndex={t}
                      selectTask={this._selectTask}
                      selectedTask={this.state.selectedTask}
                      selectTeam={this._selectTeam}
                      delete={this._deleteTask} />
                  )}
                )}
                </Pane>
              : <Text marginLeft={16} display="inline-block">No tasks found</Text>
            }

          </Pane>
        }

      </Pane>
    </HotKeys>);
  }
}

export default App;
