import React, { Component } from 'react'
import moment from 'moment'
import { Pane, Heading, Text, Icon, Checkbox, Button } from 'evergreen-ui'
import Progress from './Progress'
import './App.css'

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tasks: null,
      selectedTask: null,
      fetching: true
    };
  }

  componentDidMount() {
    fetch('/api/tasks')
      .then(response => {
        if (!response.ok) {
          throw new Error(`status ${response.status}`);
        }
        return response.json();
      })
      .then(json => {
        this.setState({
          tasks: json,
          selectedTask: json[0]._id,
          fetching: false
        });
      }).catch(e => {
        this.setState({
          fetching: false
        });
      })
  }

  render() {
    let completed = 0
    let total = 0
    if(this.state.tasks && this.state.tasks.length > 0){
      total = this.state.tasks[0].tasks.length
      this.state.tasks[0].tasks.map(task => {
        if(task.completed){ completed++ }
        return null
      })
    }
    return (
      <Pane
        className="wrapper"
        display="flex"
        height="100vh"
        overflow="hidden">

        <Pane
          width={60}
          height="100vh"
          background="#20252A">
          <Text size={400} color="white" className="title-text">Tasks</Text>
        </Pane>

        <Pane width={195} padding={24} position="relative" height="100vh" background="white" borderLeft="1px solid #373A40" borderRight="1px solid #D0D6DA">

          <Pane>
            <Text className="caps-label">Tasks</Text>
            <Text display="block" marginTop={16} size={300} color="#676f76">All teams</Text>
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
              <Text size={300} color="#676f76">In process</Text>
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
            <Progress percent={(completed / total)*100} />
          </Pane>
        </Pane>

        <Pane width={320} padding={24} paddingLeft={0} paddingRight={0} height="100vh" background="white" borderRight="1px solid #D0D6DA">
          <Pane className="clearfix" marginLeft={16} marginRight={16} marginBottom={8}>
            <Text size={400}><strong>All teams</strong></Text>
            <Button float="right" marginTop={-6} appearance="minimal" intent="none">New task</Button>
          </Pane>

          {this.state.tasks && this.state.tasks.length > 0
            ? <Pane>
              {this.state.tasks.map((task,t) => <Pane key={t} borderBottom="1px solid white" padding={16} className={`task-list-item ${this.state.selectedTask === task._id ? 'selected' : ''}`}>
                <Pane display="flex" alignItems="center">
                  <Pane background={`${moment(task.due_date).isBefore(new Date()) && !task.completed && task.status !== 'Cancelled' ? '#EF4D4D' : ''} ${task.completed ? '#47B881' : ''} ${task.status === 'Cancelled' ? '#90999F' : ''} ${!moment(task.due_date).isBefore(new Date()) && !task.completed && task.status !== 'Cancelled' ? '#4099FF' : ''}`} padding={8} height={40} paddingLeft={12} paddingRight={12} borderRadius={8}>
                    <Icon icon="clipboard" size={20} color="white" />
                  </Pane>
                  <Pane marginLeft={16} width={"calc(100% - 76px)"}>
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
                </Pane>
              </Pane>)}
            </Pane>
            : <Text marginLeft={16} display="inline-block">No tasks found</Text>
          }

        </Pane>

        {this.state.tasks && this.state.tasks.length > 0
          ? <Pane padding={40} paddingTop={32} paddingBottom={0} background="#f6f8fA" width={"calc(100vw - 575px)"} overflow="scroll">
            <Pane background="white" padding={32} paddingBottom={40} borderTopRightRadius={8} borderTopLeftRadius={8}>

              <Pane className="clearfix" width="100%">
                <div className={`badge ${moment(this.state.tasks[0].due_date).isBefore(new Date()) && !this.state.tasks[0].completed && this.state.tasks[0].status !== 'Cancelled' ? 'badge-overdue' : ''}`} marginRight={16}>{this.state.tasks[0].status}</div>
                <Text>{moment(this.state.tasks[0].updated).fromNow()}</Text>
                <Text float="right">Due {moment(this.state.tasks[0].due_date).format('DD MMMM YYYY')}</Text>
              </Pane>

              <Heading size={800} marginTop={24} marginBottom={16} color="#20252A">
                {this.state.tasks[0].name}
              </Heading>

              <Text>{this.state.tasks[0].desc}</Text>

              <Pane marginTop={24}>
                <Progress percent={(completed / total)*100} />
              </Pane>

              <Pane display="flex" marginTop={32}>
                <Button iconBefore="tick" appearance="primary" intent="success">Complete</Button>
                <Button iconBefore="cross" appearance="default" intent="none" marginLeft={16}>Cancel task</Button>
              </Pane>

              <Pane marginTop={40} paddingTop={24} borderTop="1px solid #D0D6DA">
                <Text size={400} display="block" marginBottom={16}>Tasks</Text>
                {this.state.tasks[0].tasks.map((task,t) => <Pane key={t}>
                  <Checkbox checked={task.completed} label={task.content} />
                </Pane>)}
              </Pane>

              <Pane marginTop={40} paddingTop={24} borderTop="1px solid #D0D6DA">
                <Text size={400} display="block" marginBottom={16}>Artifacts</Text>
                {this.state.tasks[0].artifacts.map((artifact,a) => <Pane key={a}>
                  <img alt={`Added ${moment(artifact.added).format('DD MMMM YYYY')}`} style={{ borderRadius: '4px' }} height="64" src={artifact.url} title={moment(artifact.added).format('DD MMMM YYYY')} />
                </Pane>)}
              </Pane>

              <Pane marginTop={40} paddingTop={24} borderTop="1px solid #D0D6DA">
                <Text size={400} display="block" marginBottom={16}>Attachments</Text>
                {this.state.tasks[0].attachments.map((attachment,a) => <Pane key={a}>
                  <Button appearance="primary" intent="none">{attachment.name}</Button>
                </Pane>)}
              </Pane>

              <Pane marginTop={40} paddingBottom={16} paddingTop={24} borderTop="1px solid #D0D6DA">
                <Text size={400} display="block" marginBottom={16}>Notes</Text>
                {this.state.tasks[0].notes.map((note,a) => <Pane key={a}>
                  <Text size={300} color="#90999F">{moment(note.added).format('DD MMMM YYYY')}</Text>
                  <Text display="block" marginBottom={16} size={400}>{note.content}</Text>
                </Pane>)}
              </Pane>

            </Pane>
          </Pane>
          : <Text>Loading...</Text>
        }

      </Pane>
    );
  }
}

export default App;
