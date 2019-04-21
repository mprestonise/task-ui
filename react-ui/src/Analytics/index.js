import React, { Component } from 'react'
import { defaults, Scatter } from 'react-chartjs-2'
import { withRouter } from 'react-router-dom'
import moment from 'moment'
import { instanceOf } from 'prop-types'
import { withCookies, Cookies } from 'react-cookie'
import { HotKeys } from 'react-hotkeys'
import { Pane, Avatar, Text, Strong, Button, Icon, IconButton, Tooltip, Position, toaster} from 'evergreen-ui'
import '../App.css'

class Analytics extends Component {

  static propTypes = {
    cookies: instanceOf(Cookies).isRequired
  };

  constructor(props) {
    super(props)
    this.state = {
      allTasks: null,
      tasks: null,
      activity: null
    };
  }

  componentDidMount() {
    toaster.notify('Loading data..', { id: 'loadingData' })
    fetch(`/api/tasks/${JSON.parse(this.props.cookies.cookies.user)._id}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`status ${response.status}`);
        }
        return response.json();
      })
      .then(json => {
        toaster.success('Data loaded successfully!', { id: 'loadingData' })
        this.setState({
          allTasks: json.tasks,
          tasks: json.tasks,
          activity: json.activity,
          fetching: false,
          canCreateNewTask: true
        });
      }).catch(e => {
        this.setState({
          fetching: false
        });
      })
  }

  _logout = () => {
    this.props.cookies.set('user', 'null', { path: '/' });
    this.props.history.push('/logout')
  }

  _tasks = () => {
    this.props.history.push('/admin')
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
    defaults.global.legend.labels.usePointStyle = true;
    let createdDataset = [],
        startedDataset = [],
        completedDataset = [],
        cancelledDataset = []
        // overdueDataset = []
    if(this.state.tasks && this.state.tasks.length > 0){
      this.state.tasks.map(task => {
        let now = new Date()
        let started = now
        if(task.status !== 'Created'){ started = task.started_date }
        if(task.status === 'Completed'){ now = task.completed_date }
        let calculatedY = moment(now).diff(started, 'days')
        let coords = {x: parseInt(task.estimation, 10), y: calculatedY, task: task.name, wip: task.status === 'Started' ? true : false}
        let pushed = false
        if(task.status === 'Created'){ createdDataset.push(coords); pushed = true }
        if(task.status === 'Started' && !pushed){ startedDataset.push(coords); pushed = true }
        if(task.status === 'Completed' && !pushed){ completedDataset.push(coords); pushed = true }
        if(task.status === 'Cancelled' && !pushed){ cancelledDataset.push(coords); pushed = true }
        // if(task.was_overdue && !pushed){ overdueDataset.push(coords); pushed = true }
        return null
      })
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
          {JSON.parse(this.props.cookies.cookies.user)._id === '5ca9c23e4efa72790722e6f0' || JSON.parse(this.props.cookies.cookies.user)._id === '5cb5e41eae99c600278dff51'
            ? <Tooltip content="Michael Prestonise" position={Position.RIGHT}>
            <Avatar
              src="https://pbs.twimg.com/profile_images/861675088713846784/Eb9nssrg_400x400.jpg"
              name="Michael Prestonise"
              size={40}
              marginTop={16}
              marginLeft={12}
              onClick={() => this._tasks()}
            />
            </Tooltip>
            : <Tooltip content={JSON.parse(this.props.cookies.cookies.user).email} position={Position.RIGHT}>
            <Avatar
              isSolid
              color="blue"
              name={JSON.parse(this.props.cookies.cookies.user).email}
              size={40}
              marginTop={16}
              marginLeft={12}
              onClick={() => this._tasks()}
            />
            </Tooltip>
          }
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
              onClick={() => alert('Go to /admin to create a new task')}
              disabled={true}>
              <Icon size={24} marginLeft={8} icon="plus" />
            </Button>
          </Tooltip>
          <Tooltip content={
            <Pane background="white" padding={8}>
              <Text display="block" className="caps-label" marginBottom={8}>Recent activity</Text>
              {this.state.activity && this.state.activity.length > 0
                ? <Pane>
                  {this.state.activity.map((activity,a) => <Text key={a} onClick={() => this._selectActivity(activity.task_id)} style={{ cursor: 'pointer' }} display="block" marginBottom={8} borderLeft="2px solid #90999F" paddingLeft={8} size={300} color="#90999F"><Strong display="block" size={300} color="#20252A">{activity.name}</Strong><small>{activity.content}</small></Text>)}
                </Pane>
                : <Text display="block" marginBottom={8} size={300} color="#90999F"><Strong display="inline-block" size={300} color="#20252A">No recent activity</Strong></Text>
              }
            </Pane>
          }
          appearance="card"
          position={Position.RIGHT}>
            <Icon size={20} marginLeft={23} marginTop={16} color="rgba(16,112,202,1)" icon="history" />
          </Tooltip>

          <Tooltip content="Analytics" position={Position.RIGHT}>
            <Pane
              width={40}
              height={40}
              padding={1}
              marginTop={16}
              marginLeft={12}
              background="transparent"
              color="white">
              <Icon size={24} marginLeft={8} icon="timeline-bar-chart" />
            </Pane>
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
            bottom={72}
            icon="help"
            size={24}
            color="#90999F"
          />
          </Tooltip>

          <Tooltip content="Logout" position={Position.RIGHT}>
            <IconButton
              position="absolute"
              left={18}
              bottom={24}
              color="#90999F"
              appearance="minimal"
              onClick={() => this._logout()}
              icon="log-out"
            />
          </Tooltip>
        </Pane>

        <Pane paddingLeft={64} paddingTop={24} width={"calc(100vw - 64px)"} overflow="scroll">

          <Pane style={{ maxWidth: '960px', margin: '0 auto' }}>

            <Text size={400}><strong>Analytics</strong></Text>

            <Pane id="chart-wrapper" paddingBottom={16}>
            {this.state.tasks && this.state.tasks.length > 0
              ? <Scatter width={984} height={360} options={{
                    responsive: false,
                    layout: {
                      padding: {
                        left: 0,
                        right: 32,
                        top: 8,
                        bottom: 16
                      }
                    },
                    tooltips: {
                      callbacks: {
                        label: function(tooltipItem, data) {
                          const task = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].task;
                          const is_wip = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].wip;
                          if(is_wip) { return task + '\n(In progress)'}
                          else { return task }
                        }
                      }
                    },
                    legend: {
                      labels: {
                        boxWidth: 9,
                        padding: 24,
                        fontColor: '#90999F',
                        fontSize: 10
                      }
                    },
                    scales: {
                      xAxes: [{
                        type: 'category',
                        labels: [1,2,3,5,8,13],
                        scaleLabel: {
                          display: true,
                          labelString: 'E S T I M A T I O N',
                          fontColor: '#90999F',
                          fontSize: 10
                        },
                        position: 'bottom',
                        gridLines: {
                          display: false,
                          color: '#eaeff4',
                          zeroLineColor: '#eaeff4'
                        },
                        ticks: {
                          fontColor: '#d0d6da',
                          fontSize: 10,
                          padding: 8
                        }
                      }],
                      yAxes: [{
                        type: 'linear',
                        offset: true,
                        scaleLabel: {
                          display: true,
                          labelString: 'D A Y S',
                          fontColor: '#90999F',
                          fontSize: 10
                        },
                        gridLines: {
                          display: false,
                          color: '#eaeff4',
                          zeroLineColor: '#eaeff4'
                        },
                        ticks: {
                          suggestedMax: 40,
                          fontColor: '#d0d6da',
                          fontSize: 10,
                          padding: 8
                        }
                      }]
                    }
                  }}
                  data={{datasets: [
                  // {
                  //   label: 'O V E R D U E',
                  //   backgroundColor: 'rgba(239,77,77,1)',
                  //   borderWidth: 0,
                  //   pointBackgroundColor: 'rgba(239,77,77,1)',
                  //   pointRadius: 8,
                  //   pointHoverRadius: 8,
                  //   pointBorderWidth: 0,
                  //   data: overdueDataset
                  // },
                  {
                    label: 'C R E A T E D',
                    backgroundColor: '#FFD040',
                    borderWidth: 0,
                    pointBackgroundColor: '#FFD040',
                    pointRadius: 8,
                    pointHoverRadius: 8,
                    pointBorderWidth: 0,
                    data: createdDataset
                  },{
                    label: 'S T A R T E D',
                    backgroundColor: '#4099FF',
                    borderWidth: 0,
                    pointBackgroundColor: '#4099FF',
                    pointRadius: 8,
                    pointHoverRadius: 8,
                    pointBorderWidth: 0,
                    data: startedDataset
                  },{
                    label: 'C O M P L E T E D',
                    backgroundColor: 'rgba(71,184,129,1)',
                    borderWidth: 0,
                    pointBackgroundColor: 'rgba(71,184,129,1)',
                    pointRadius: 8,
                    pointHoverRadius: 8,
                    pointBorderWidth: 0,
                    data: completedDataset
                  },{
                    label: 'C A N C E L L E D',
                    backgroundColor: 'rgba(144,153,159,1)',
                    borderWidth: 0,
                    pointBackgroundColor: 'rgba(144,153,159,1)',
                    pointRadius: 8,
                    pointHoverRadius: 8,
                    pointBorderWidth: 0,
                    data: cancelledDataset
                  }]
                }} />
              : null
            }
            </Pane>

            <Pane className="clearfix" marginBottom={16}>
              {this.state.tasks
                ? <Pane display="flex" marginTop={40} paddingBottom={32} marginBottom={16} alignItems="center" style={{ flexWrap: 'wrap' }}>
                  <Pane width={'33.3%'} textAlign="center" marginBottom={16}>
                    <Text display="block" marginBottom={8} style={{ fontSize: '88px', lineHeight: '88px' }}><strong>{this.state.tasks.length}</strong></Text>
                    <small className="caps-label analytics-label"><span className="dot"></span>Tasks</small>
                  </Pane>
                  <Pane width={'33.3%'} textAlign="center" marginBottom={16}>
                    <Text display="block" marginBottom={8} style={{ fontSize: '88px', lineHeight: '88px' }}><strong>{this.state.tasks.filter(task => task.completed).length}</strong></Text>
                    <small className="caps-label analytics-label"><span className="dot completed"></span>Completed</small>
                  </Pane>
                  <Pane width={'33.3%'} textAlign="center" marginBottom={16}>
                    <Text display="block" marginBottom={8} style={{ fontSize: '88px', lineHeight: '88px' }}><strong>{this.state.tasks.filter(task => task.was_overdue).length}</strong></Text>
                    <small className="caps-label analytics-label"><span className="dot overdue"></span>Overdue</small>
                  </Pane>
                  <Pane width={'33.3%'} textAlign="center" marginTop={48} marginBottom={16}>
                    <Text display="block" marginBottom={8} style={{ fontSize: '88px', lineHeight: '88px' }}><strong>{this.state.tasks.filter(task => task.status === 'Created').length}</strong></Text>
                    <small className="caps-label analytics-label"><span className="dot created"></span>Created</small>
                  </Pane>
                  <Pane width={'33.3%'} textAlign="center" marginTop={48} marginBottom={16}>
                    <Text display="block" marginBottom={8} style={{ fontSize: '88px', lineHeight: '88px' }}><strong>{this.state.tasks.filter(task => task.status === 'Started').length}</strong></Text>
                    <small className="caps-label analytics-label"><span className="dot started"></span>In progress</small>
                  </Pane>
                  <Pane width={'33.3%'} textAlign="center" marginTop={48} marginBottom={16}>
                    <Text display="block" marginBottom={8} style={{ fontSize: '88px', lineHeight: '88px' }}><strong>{this.state.tasks.filter(task => task.status === 'Cancelled').length}</strong></Text>
                    <small className="caps-label analytics-label"><span className="dot cancelled"></span>Cancelled</small>
                  </Pane>
                </Pane>
                : null
              }
            </Pane>
          </Pane>

        </Pane>

      </Pane>
    </HotKeys>);
  }
}

export default withCookies(withRouter(Analytics));
