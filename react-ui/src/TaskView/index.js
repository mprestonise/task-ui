import React, { Component } from 'react'
import moment from 'moment'
import { Avatar, Pane, Heading, Text, Strong, IconButton, Button, toaster } from 'evergreen-ui'
import Progress from '../Progress'
import Subtask from '../Subtask'

class TaskView extends Component {

  constructor(props){
    super(props)
    this.state = {
      task: null,
      overallProgress: 0,
      artifactOpen: false,
      selectedArtifact: null,
      error: null,
      rotation: 0,
      fetching: true
    }
  }

  componentDidMount() {
    toaster.notify('Loading task..')
    fetch(`/api/task/${this.props.match.params.id}`)
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
          task: json,
          fetching: false
        });
      }).catch(e => {
        this.setState({
          error: e,
          fetching: false
        });
      })
  }

  _calculateProgress = (task) => {
    let totalCompleted = 0,
        totalSubtasks = 0
    if(task.status === 'Started'){
      totalSubtasks = totalSubtasks + task.subtasks.length
      if(task.subtasks && task.subtasks.length > 0) {
        task.subtasks.map(subtask => {
          if(subtask.completed) totalCompleted++
          return null
        })
      } else {
        return null
      }
    }
    this.setState({
      overallProgress: ((totalCompleted / totalSubtasks)*100).toFixed(0)
    })
  }

  _openAttachment = (url) => {
    window.open(url, "_blank")
  }

  _showArtifact = (artifact) => {
    this.setState({
      artifactOpen: true,
      selectedArtifact: artifact
    })
  }

  _rotateArtifact = () => {
    if(this.state.rotation === 3) {
      this.setState({ rotation: 0 })
    } else {
      this.setState({ rotation: this.state.rotation + 1 })
    }
  }

  render() {
    let completed = 0
    let total = 0
    if(!this.state.fetching && this.state.task) {
      if(this.state.task.subtasks && this.state.task.subtasks.length > 0){
        total = this.state.task.subtasks.length
        this.state.task.subtasks.map(subtask => {
          if(subtask.completed){ completed++ }
          return null
        })
      }
    }

    return(
      <Pane padding={40} paddingBottom={0} background="#F6F8FA" overflow="scroll">
      <Pane background="white" maxWidth={960} marginLeft="auto" marginRight="auto" padding={32} paddingBottom={16} borderTopRightRadius={8} borderTopLeftRadius={8}>

      {!this.state.fetching && this.state.task
        ? <Pane>
        <Pane className="clearfix" width="100%">
          <Pane
            marginRight={16}
            marginTop={-6}
            className={`badge ${this.state.task.completed ? 'badge-completed' : ''} ${this.state.task.status === 'Cancelled' ? 'badge-cancelled' : ''} ${moment(this.state.task.due_date).isBefore(new Date()) && !this.state.task.completed && this.state.task.status !== 'Cancelled' ? 'badge-overdue' : ''} ${this.state.task.status === 'Created' && !this.state.task.was_overdue ? 'badge-created' : ''}`}>
            {moment(this.state.task.due_date).isBefore(new Date()) && !this.state.task.completed && this.state.task.status !== 'Cancelled'
              ? <Strong color="white">Overdue</Strong>
              : <Text color="white">{this.state.task.status}</Text>
            }
          </Pane>
          <Text color="#676F76">Updated {moment(this.state.task.updated).fromNow()}</Text>
          <Pane
            float="right"
            position="relative"
            width={200}>
            <Text position="absolute" right="0" color="#676F76">Due {moment(this.state.task.due_date).format('DD MMMM YYYY')}</Text>
          </Pane>
        </Pane>

        <Heading size={800} marginTop={24} marginBottom={16} color={`${this.state.task.status === 'Cancelled' ? '#676F76' : '#20252A'}`}>{this.state.task.name}</Heading>

        <Text>{this.state.task.desc}</Text>

        <Pane marginTop={40} display="flex">
          {this.state.task.started_date
            ? <Pane marginRight={32}>
              <Text display="block" marginBottom={5} className="caps-label">Started</Text>
              <Text color="#676F76">{moment(this.state.task.started_date).format('DD MMMM YYYY')}</Text>
            </Pane>
            : null
          }
          <Pane marginRight={32}>
            <Progress percent={((completed / total)*100).toFixed(0)} />
          </Pane>
        </Pane>


        <Pane display="flex" marginTop={32}>
          <Button disabled={true} iconBefore="tick" appearance="primary" intent="success">Complete</Button>
          <Button disabled={true} iconBefore="cross" appearance="default" intent="none" marginLeft={16}>Cancel task</Button>
          <Button disabled={true} iconBefore="cross" appearance="primary" intent="danger" marginLeft="auto">Delete task</Button>
        </Pane>

        <Pane marginTop={40} paddingTop={24} borderTop="1px solid #D0D6DA">
          <Pane size={400} display="block" marginBottom={16} className="clearfix">
            <Text size={400} float="left">Subtasks</Text>
          </Pane>
          {this.state.task.subtasks && this.state.task.subtasks.length === 0
            ? <Text display="block" size={300} color="#90999F">No subtasks have been added</Text>
            : null
          }
          {this.state.task.subtasks.map((subtask,t) => <Pane key={t}>
            <Subtask
              disabled={true}
              checked={subtask.completed}
              taskIndex={this.props.taskIndex}
              taskId={this.state.task._id}
              updateSubtask={null}
              index={t}
              toggle={null}
              label={subtask.content}  />
          </Pane>)}
        </Pane>

        <Pane marginTop={40} paddingTop={24} borderTop="1px solid #D0D6DA">
          <Text size={400} display="block" marginBottom={16}>Artifacts</Text>
          {this.state.task.artifacts && this.state.task.artifacts.length === 0
            ? <Text display="block" size={300} color="#90999F">No artifacts have been added</Text>
            : null
          }
          <Pane display="flex">
            {this.state.task.artifacts.map((artifact,a) => <Pane key={a} marginRight={8}>
              <img onClick={() => {this._showArtifact(artifact)}} alt={`Added ${moment(artifact.added).format('DD MMMM YYYY')}`} style={{ borderRadius: '4px', cursor: 'pointer' }} height="64" src={artifact.url} title={moment(artifact.added).format('DD MMMM YYYY')} />
            </Pane>)}
          </Pane>
        </Pane>

        <Pane marginTop={40} paddingTop={24} borderTop="1px solid #D0D6DA">
        <Pane size={400} display="block" marginBottom={16} className="clearfix">
          <Text size={400} float="left">Attachments</Text>
        </Pane>
          {this.state.task.attachments && this.state.task.attachments.length === 0
            ? <Text display="block" size={300} color="#90999F">No attachments have been added</Text>
            : null
          }
          {this.state.task.attachments.map((attachment,a) => <Pane key={a} display="flex" marginRight={8} className="attachment-pill">
            <Text style={{ cursor: 'pointer' }} onClick={() => this._openAttachment(attachment.url)}>{attachment.label}</Text>
            <IconButton icon="chevron-right" color="#4099FF" height={24} />
          </Pane>)}
        </Pane>

        <Pane marginTop={40} paddingBottom={16} paddingTop={24} borderTop="1px solid #D0D6DA">
          <Text size={400} display="block" marginBottom={16}>Notes</Text>

          <Pane>
            {this.state.task.notes && this.state.task.notes.length === 0
              ? <Text display="block" size={300} color="#90999F">No notes have been added</Text>
              : null
            }
            {this.state.task.notes.map((note,a) => <Pane marginBottom={16} key={a} display="flex">
              <Avatar
                src="https://pbs.twimg.com/profile_images/861675088713846784/Eb9nssrg_400x400.jpg"
                name="Michael Prestonise"
                size={40}
                marginRight={8}
              />
              <Pane marginTop={-8}>
                <Text size={300} color="#90999F">{moment(note.added).format('DD MMMM YYYY')}</Text>
                <Text display="block" marginBottom={16} size={400}>{note.content}</Text>
              </Pane>
            </Pane>)}
          </Pane>

        </Pane>

        </Pane>
        : <Text>Loading..</Text>
      }

      {this.state.artifactOpen
        ? <Pane width="100vw" height="100vh" left={0} top={0} position="fixed" zIndex={9999} background="rgba(0,0,0,0.8)">
          <IconButton appearance="minimal" position="absolute" right={16} top={16} icon="cross" color="#90999F" height={32} onClick={() => this.setState({ selectedArtifact: null, artifactOpen: false })} />
          <IconButton appearance="minimal" position="absolute" zIndex={9999} right={48} top={16} icon="image-rotate-left" color="#90999F" height={32} onClick={() => this._rotateArtifact()} />
          <img className={`open-artifact ${this.state.rotation === 3 ? 'full-rotation' : ''} rotate-${this.state.rotation}`} src={this.state.selectedArtifact.url} alt={this.state.task.name} style={{ position: 'absolute', left: '50%', top: '50%' }} />
        </Pane>
        : null
      }

      </Pane>
    </Pane>)
  }
}

export default TaskView;
