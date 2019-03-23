import React, { Component } from 'react'
import moment from 'moment'
import { Pane, Heading, Text, Strong, Select, Button } from 'evergreen-ui'
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Progress from '../Progress'
import Subtask from '../Subtask'

class Task extends Component {

  _handleChange = (taskindex, e) => {
    console.log('handle change', e)
  }
  _close = (e) => {
    console.log('close', e)
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
    return(
      <Pane background="white" padding={32} paddingBottom={40} borderTopRightRadius={8} borderTopLeftRadius={8}>

        <Pane className="clearfix" width="100%">
          <Pane
            marginRight={16}
            marginTop={-6}
            className={`badge ${this.props.task.completed ? 'badge-completed' : ''} ${this.props.task.status === 'Cancelled' ? 'badge-cancelled' : ''} ${moment(this.props.task.due_date).isBefore(new Date()) && !this.props.task.completed && this.props.task.status !== 'Cancelled' ? 'badge-overdue' : ''}`}>
            {moment(this.props.task.due_date).isBefore(new Date()) && !this.props.task.completed && this.props.task.status !== 'Cancelled'
              ? <Strong color="white">Overdue</Strong>
              : <Text color="white">{this.props.task.status}</Text>
            }
          </Pane>
          <Text>{moment(this.props.task.updated).fromNow()}</Text>
          <Pane
            float="right"
            position="relative"
            width={200}>
            <Text position="absolute" right="0" color="#676F76">Due {moment(this.props.task.due_date).format('DD MMMM YYYY')}</Text>
            <DatePicker
              calendarClassName="due-date-calendar"
              selected={moment( this.props.task.due_date ).toDate()}
              onChange={date => this.props.changeDueDate(this.props.taskIndex, date)}/>
          </Pane>
        </Pane>

        <Heading size={800} marginTop={24} marginBottom={16} color="#20252A">
          {this.props.task.name}
        </Heading>

        <Text>{this.props.task.desc}</Text>

        <Pane marginTop={24}>
          <Text display="block" marginBottom={8} className="caps-label">Team</Text>
          <Select value={this.props.task.team} onChange={(e) => this.props.selectTeam(this.props.taskIndex, e.target.value)}>
            <option value="Bear team">Bear team</option>
            <option value="Camel team">Camel team</option>
            <option value="Design">Design</option>
          </Select>
        </Pane>

        <Pane marginTop={24}>
          <Progress percent={(completed / total)*100} />
        </Pane>

        <Pane display="flex" marginTop={32}>
          <Button iconBefore="tick" appearance="primary" intent="success">Complete</Button>
          <Button iconBefore="cross" appearance="default" intent="none" marginLeft={16}>Cancel task</Button>
          <Button iconBefore="cross" appearance="primary" intent="danger" marginLeft="auto" onClick={() => this.props.delete(this.props.task._id)}>Delete task</Button>
        </Pane>

        <Pane marginTop={40} paddingTop={24} borderTop="1px solid #D0D6DA">
          <Text size={400} display="block" marginBottom={16}>Subtasks</Text>
          {this.props.task.subtasks.map((subtask,t) => <Pane key={t}>
            <Subtask checked={subtask.completed} taskIndex={this.props.taskIndex} index={t} toggle={this.props.toggleSubtask} label={subtask.content}  />
          </Pane>)}
        </Pane>

        <Pane marginTop={40} paddingTop={24} borderTop="1px solid #D0D6DA">
          <Text size={400} display="block" marginBottom={16}>Artifacts</Text>
          {this.props.task.artifacts.map((artifact,a) => <Pane key={a}>
            <img alt={`Added ${moment(artifact.added).format('DD MMMM YYYY')}`} style={{ borderRadius: '4px' }} height="64" src={artifact.url} title={moment(artifact.added).format('DD MMMM YYYY')} />
          </Pane>)}
        </Pane>

        <Pane marginTop={40} paddingTop={24} borderTop="1px solid #D0D6DA">
          <Text size={400} display="block" marginBottom={16}>Attachments</Text>
          {this.props.task.attachments.map((attachment,a) => <Pane key={a}>
            <Button appearance="primary" intent="none">{attachment.name}</Button>
          </Pane>)}
        </Pane>

        <Pane marginTop={40} paddingBottom={16} paddingTop={24} borderTop="1px solid #D0D6DA">
          <Text size={400} display="block" marginBottom={16}>Notes</Text>
          {this.props.task.notes.map((note,a) => <Pane key={a}>
            <Text size={300} color="#90999F">{moment(note.added).format('DD MMMM YYYY')}</Text>
            <Text display="block" marginBottom={16} size={400}>{note.content}</Text>
          </Pane>)}
        </Pane>

      </Pane>
    );
  }
}

export default Task;
