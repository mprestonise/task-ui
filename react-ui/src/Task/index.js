import React, { Component } from 'react'
import moment from 'moment'
import { Avatar, Pane, Heading, Text, TextInput, Textarea, FilePicker, Strong, IconButton, Button, Tooltip, Position } from 'evergreen-ui'
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Progress from '../Progress'
import Subtask from '../Subtask'

class Task extends Component {

  constructor(props){
    super(props)
    this.state = {
      editingName: false,
      newName: null,
      editingDesc: false,
      newDesc: null,
      editingSubtask: false,
      addingNewSubtask: false,
      newSubtask: null,
      addingArtifact: false,
      addingAttachment: false,
      newAttachmentURL: null,
      newAttachmentLabel: null,
      artifactOpen: false,
      selectedArtifact: null,
      rotation: 0,
      newNote: ''
    }
  }

  _changeName = () => {
    if(this.state.newName !== null){
      this.props.changeName(this.props.taskIndex, this.state.newName, this.props.task._id)
    }
    this.setState({
      newName: null,
      editingName: false
    })
  }

  _changeDesc = () => {
    if(this.state.newDesc !== null){
      this.props.changeDesc(this.props.taskIndex, this.state.newDesc, this.props.task._id)
    }
    this.setState({
      newDesc: null,
      editingDesc: false
    })
  }

  _saveNote = () => {
    if(this.state.newNote !== null){
      this.props.addNote(this.props.taskIndex, this.state.newNote, this.props.task._id)
    }
    this.setState({
      newNote: '',
    })
  }

  _saveAttachment = () => {
    const newAttachment = {
      label: this.state.newAttachmentLabel,
      url: this.state.newAttachmentURL,
      added: new Date()
    }
    this.props.addAttachment(this.props.taskIndex, newAttachment, this.props.task._id)
    this.setState({
      addingAttachment: false,
      newAttachmentURL: null,
      newAttachmentLabel: null
    })
  }

  _addArtifact = (files) => {
    this.props.addArtifact(this.props.taskIndex, files, this.props.task._id)
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
    if(this.props.task.subtasks && this.props.task.subtasks.length > 0){
      total = this.props.task.subtasks.length
      this.props.task.subtasks.map(subtask => {
        if(subtask.completed){ completed++ }
        return null
      })
    }

    if(!this.props.task.completed && !this.props.task.status !== 'Created' && this.props.task.status !== 'Cancelled' && !this.props.task.was_overdue && moment(this.props.task.due_date).isBefore(new Date())){
      this.props.markAsOverdue(this.props.taskIndex, this.props.task._id)
    }

    return(
      <Pane background="white" padding={32} paddingBottom={16} borderTopRightRadius={8} borderTopLeftRadius={8}>

        <Pane className="clearfix" width="100%">
          <Pane
            marginRight={16}
            marginTop={-6}
            className={`badge ${this.props.task.completed ? 'badge-completed' : ''} ${this.props.task.status === 'Cancelled' ? 'badge-cancelled' : ''} ${moment(this.props.task.due_date).isBefore(new Date()) && !this.props.task.completed && this.props.task.status !== 'Cancelled' ? 'badge-overdue' : ''} ${this.props.task.status === 'Created' && !this.props.task.was_overdue ? 'badge-created' : ''}`}>
            {moment(this.props.task.due_date).isBefore(new Date()) && !this.props.task.completed && this.props.task.status !== 'Cancelled'
              ? <Strong color="white">Overdue</Strong>
              : <Text color="white">{this.props.task.status}</Text>
            }
          </Pane>
          <Text color="#676F76">Updated {moment(this.props.task.updated).fromNow()}</Text>
          <Pane
            float="right"
            position="relative"
            width={200}>
            <Text position="absolute" right="0" color="#676F76">Due {moment(this.props.task.due_date).format('DD MMMM YYYY')}</Text>
            <DatePicker
              disabled={this.props.task.completed || this.props.task.status === 'Cancelled'}
              calendarClassName="due-date-calendar"
              selected={moment( this.props.task.due_date ).toDate()}
              onChange={date => this.props.changeDueDate(this.props.taskIndex, date, this.props.task._id)}/>
          </Pane>
        </Pane>

        {this.state.editingName
          ? <Pane marginTop={22} marginBottom={14} className="clearfix">
            <TextInput
              className="task-name--input"
              float="left"
              required
              autoFocus
              onChange={e => this.setState({ newName: e.target.value })}
              defaultValue={this.props.task.name}
            />
            <IconButton float="left" icon="tick" appearance="primary" intent="success" marginLeft={16} marginRight={8} onClick={() => this._changeName()} />
            <IconButton float="left" icon="cross" onClick={() => this.setState({ newName: null, editingName: false })} />
          </Pane>
          : <Heading size={800} marginTop={24} marginBottom={16} color={`${this.props.task.status === 'Cancelled' ? '#676F76' : '#20252A'}`} onClick={() => this.setState({ editingName: true })}>{this.props.task.name}</Heading>
        }

        {this.state.editingDesc
          ? <Pane className="clearfix">
            <Textarea
              className="task-desc--textarea"
              autoFocus
              onChange={e => this.setState({ newDesc: e.target.value })}
              defaultValue={this.props.task.desc}
            />
            <IconButton float="left" icon="tick" appearance="primary" intent="success" marginRight={8} onClick={() => this._changeDesc()} />
            <IconButton float="left" icon="cross" onClick={() => this.setState({ newDesc: null, editingDesc: false })} />
          </Pane>
          : <Text onClick={() => this.setState({ editingDesc: true })}>{this.props.task.desc}</Text>
        }

        <Pane marginTop={40} display="flex">
          {this.props.task.started_date
            ? <Pane marginRight={32}>
              <Text display="block" marginBottom={5} className="caps-label">Started</Text>
              <Text color="#676F76">{moment(this.props.task.started_date).format('DD MMMM YYYY')}</Text>
            </Pane>
            : null
          }
          <Pane marginRight={32}>
            <Progress percent={((completed / total)*100).toFixed(0)} />
          </Pane>
          <Pane marginRight={32}>
          <Text display="block" marginBottom={5} className="caps-label">Estimate</Text>
          <Text color="#676F76">5</Text>
          </Pane>
        </Pane>


        <Pane display="flex" marginTop={32}>
          <Button disabled={this.props.task.status === 'Created' || this.props.task.completed || this.props.task.status === 'Cancelled'} iconBefore="tick" appearance="primary" intent="success" onClick={() => this.props.completeTask(this.props.taskIndex, this.props.task._id)}>Complete</Button>
          <Button disabled={this.props.task.completed || this.props.task.status === 'Cancelled'} iconBefore="cross" appearance="default" intent="none" marginLeft={16} onClick={() => this.props.cancelTask(this.props.taskIndex, this.props.task._id)}>Cancel task</Button>
          <Button iconBefore="cross" appearance="primary" intent="danger" marginLeft="auto" onClick={() => this.props.delete(this.props.task._id)}>Delete task</Button>
        </Pane>

        <Pane marginTop={40} paddingTop={24} borderTop="1px solid #D0D6DA">
          <Pane size={400} display="block" marginBottom={16} className="clearfix">
            <Text size={400} float="left">Subtasks</Text>
            {!this.props.task.completed && this.props.task.status !== 'Cancelled'
              ? <Tooltip content="Add a subtask" position={Position.RIGHT}>
                <IconButton
                  float="left"
                  height={24}
                  marginTop={-2}
                  marginLeft={8}
                  icon="plus"
                  onClick={() => this.props.newSubtask(this.props.taskIndex)} />
              </Tooltip>
              : null
            }
          </Pane>
          {this.props.task.subtasks && this.props.task.subtasks.length === 0
            ? <Text display="block" size={300} color="#90999F">You haven't added any subtasks yet</Text>
            : null
          }
          {this.props.task.subtasks.map((subtask,t) => <Pane key={t}>
            <Subtask
              disabled={this.props.task.completed || this.props.task.status === 'Cancelled'}
              checked={subtask.completed}
              taskIndex={this.props.taskIndex}
              taskId={this.props.task._id}
              updateSubtask={this.props.updateSubtask}
              index={t}
              toggle={this.props.toggleSubtask}
              label={subtask.content}  />
          </Pane>)}
        </Pane>

        <Pane marginTop={40} paddingTop={24} borderTop="1px solid #D0D6DA">
          <Text size={400} display="block" marginBottom={16}>Artifacts</Text>
          <FilePicker
            width={320}
            marginBottom={32}
            onChange={files => this._addArtifact(files)} />
          {this.props.task.artifacts && this.props.task.artifacts.length === 0
            ? <Text display="block" size={300} color="#90999F">You haven't added any artifacts yet</Text>
            : null
          }
          <Pane display="flex">
            {this.props.task.artifacts.map((artifact,a) => <Pane key={a} marginRight={16}>
              <img onClick={() => {this._showArtifact(artifact)}} alt={`Added ${moment(artifact.added).format('DD MMMM YYYY')}`} style={{ borderRadius: '4px', cursor: 'pointer' }} height="64" src={artifact.url} title={moment(artifact.added).format('DD MMMM YYYY')} />
            </Pane>)}
          </Pane>
        </Pane>

        <Pane marginTop={40} paddingTop={24} borderTop="1px solid #D0D6DA">
        <Pane size={400} display="block" marginBottom={16} className="clearfix">
          <Text size={400} float="left">Attachments</Text>
          {!this.props.task.completed && this.props.task.status !== 'Cancelled'
            ? <Tooltip content="Add an attachment" position={Position.RIGHT}>
              <IconButton
                float="left"
                height={24}
                marginTop={-2}
                marginLeft={8}
                icon="plus"
                onClick={() => this.setState({ addingAttachment: true })} />
            </Tooltip>
            : null
          }
        </Pane>
          {this.props.task.attachments && !this.state.addingAttachment && this.props.task.attachments.length === 0
            ? <Text display="block" size={300} color="#90999F">You haven't added any attachments yet</Text>
            : null
          }
          {this.props.task.attachments.map((attachment,a) => <Pane key={a} display="flex" marginRight={8} className="attachment-pill">
            <Text style={{ cursor: 'pointer' }} onClick={() => this._openAttachment(attachment.url)}>{attachment.label}</Text>
            <IconButton icon="cross" color="#4099FF" height={24} onClick={() => this.props.removeAttachment(this.props.taskIndex, attachment, this.props.task._id)} />
          </Pane>)}
          {this.state.addingAttachment
            ? <Pane>
              <Text display="block" color="#676F76" marginBottom={8}>Add a new attachment</Text>
              <TextInput
                maxWidth={300}
                marginBottom={8}
                display="block"
                className="task-attachment--url"
                required
                autoFocus
                placeholder="What is the URL of this attachment?"
                onChange={e => this.setState({ newAttachmentURL: e.target.value })}
              />
              <TextInput
                maxWidth={300}
                marginBottom={8}
                display="block"
                className="task-attachment--label"
                required
                placeholder="Give this attachment a label"
                onChange={e => this.setState({ newAttachmentLabel: e.target.value })}
              />
              <Pane marginBottom={24} className="clearfix">
                <IconButton disabled={!this.state.newAttachmentURL || !this.state.newAttachmentLabel} float="left" icon="tick" appearance="primary" intent="success" marginRight={8} onClick={() => this._saveAttachment()} />
                <IconButton float="left" icon="cross" onClick={() => this.setState({ addingAttachment: false, newAttachmentURL: null, newAttachmentLabel: null })} />
              </Pane>
            </Pane>
            : null
          }
        </Pane>

        <Pane marginTop={40} paddingBottom={16} paddingTop={24} borderTop="1px solid #D0D6DA">
          <Text size={400} display="block" marginBottom={16}>Notes</Text>

          <Pane className="clearfix">
            <Textarea
              marginBottom={4}
              className="task-note--textarea"
              onChange={e => this.setState({ newNote: e.target.value })}
              placeholder="Add a note.."
              value={this.state.newNote}
            />
            <Button float="left" iconBefore="tick" appearance="primary" intent="success" marginRight={8} disabled={!this.state.newNote} onClick={() => this._saveNote()}>Add</Button>
            <Button float="left" appearance="minimal" intent="none" disabled={!this.state.newNote} onClick={() => this.setState({ newNote: null })}>Cancel</Button>
          </Pane>

          <Pane marginTop={40}>
            {this.props.task.notes.map((note,a) => <Pane marginBottom={16} key={a} display="flex">
              <Avatar
                src="https://pbs.twimg.com/profile_images/861675088713846784/Eb9nssrg_400x400.jpg"
                name="Michael Prestonise"
                size={40}
                marginRight={8}
              />
              <Pane marginTop={-8}>
                <Text size={300} color="#90999F">{moment(note.added).format('DD MMMM YYYY')}</Text>
                <Text display="block" style={{ wordBreak: 'break-word' }} marginBottom={16} size={400}>{note.content}</Text>
              </Pane>
            </Pane>)}
          </Pane>

        </Pane>

        {this.state.artifactOpen
          ? <Pane width="100vw" height="100vh" left={0} top={0} position="fixed" zIndex={9999} background="rgba(0,0,0,0.8)">
            <IconButton appearance="minimal" position="absolute" zIndex={9999} right={16} top={16} icon="cross" color="#90999F" height={32} onClick={() => this.setState({ selectedArtifact: null, artifactOpen: false })} />
            <IconButton appearance="minimal" position="absolute" zIndex={9999} right={48} top={16} icon="image-rotate-left" color="#90999F" height={32} onClick={() => this._rotateArtifact()} />
            <img className={`open-artifact ${this.state.rotation === 3 ? 'full-rotation' : ''} rotate-${this.state.rotation}`} src={this.state.selectedArtifact.url} alt={this.props.task.name} style={{ position: 'absolute', left: '50%', top: '50%' }} />
          </Pane>
          : null
        }

      </Pane>
    );
  }
}

export default Task;
