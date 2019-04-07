import React, { Component } from 'react'
import { instanceOf } from 'prop-types'
import { withRouter } from 'react-router-dom'
import { withCookies, Cookies } from 'react-cookie'
import { Pane, Text, TextInputField, Button, toaster } from 'evergreen-ui'

class Welcome extends Component {

  static propTypes = {
    cookies: instanceOf(Cookies).isRequired
  };

  constructor(props){
    super(props);
    this.state = {
      registering: false,
      newPassword: '',
      newEmail: '',
      checkingPassword: false,
      logged_in: false
    }
  }

  componentDidMount() {
    const { cookies } = this.props;
    cookies.set('user', {}, { path: '/' });
  }

  _signUp = () => {
    toaster.notify('Encrypting password..', { id: 'createNewPassword' })
    this.setState({ checkingPassword: true })
    fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type' : 'application/json' },
      body: JSON.stringify({ email: this.state.newEmail, password: this.state.newPassword })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`status ${response.status}`);
        }
        return response.json();
      })
      .then(json => {
        if(json.status !== 200){
          toaster.danger('Registration rejected!', { id: 'createNewPassword' })
          this.setState({
            newPassword: '',
            newEmail: '',
            checkingPassword: false
          });
        }
        else {
          toaster.success('Registered', { id: 'createNewPassword' })
          this.props.cookies.set('user', JSON.stringify(json.user), { path: '/' });
          this.props.history.push('/admin')
        }
      }).catch(e => {
        this.setState({
          fetching: false,
          checkingPassword: false
        });
      })
  }

  _login = () => {
    toaster.notify('Logging in..', { id: 'createNewPassword' })
    this.setState({ checkingPassword: true })
    fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type' : 'application/json' },
      body: JSON.stringify({ email: this.state.newEmail, password: this.state.newPassword })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`status ${response.status}`);
        }
        return response.json();
      })
      .then(json => {
        if(json.status !== 200){
          toaster.danger('Log in denied', { id: 'createNewPassword' })
          this.setState({
            newPassword: '',
            newEmail: '',
            checkingPassword: false
          });
        } else {
          toaster.success('Logged in!', { id: 'createNewPassword' })
          this.props.cookies.set('user', JSON.stringify(json.user), { path: '/' });
          this.props.history.push('/admin')
        }
      }).catch(e => {
        this.setState({
          fetching: false,
          checkingPassword: false
        });
      })
  }

  render() {
    return(
      <Pane background="#20252A" width="100vw" height="100vh" overflow="hidden">
        <Text size={500} color="white" position="fixed" left="50%" top="50%" transform="translate(-50%,-75%)">
          <span role="img" aria-label="emoji">👋</span> Hello there
          <span style={{ display: 'block', color: "#676F76", fontSize: '12px' }}>Roll your sleeves up, let's get to work!</span>
          {this.state.registering && !this.state.logged_in
            ? <Pane width={320} className="login-form-field">
              <TextInputField
                marginTop={24}
                label="What is your email address?"
                hint="You'll need this to login, reset your password, etc."
                placeholder="Email address"
                value={this.state.newEmail}
                onChange={e => this.setState({ newEmail: e.target.value })}
              />
              <TextInputField
                marginTop={24}
                label="Create a password"
                type="password"
                placeholder="Password"
                value={this.state.newPassword}
                onChange={e => this.setState({ newPassword: e.target.value })}
              />
              <Pane display="flex">
                <Button disabled={this.state.checkingPassword} appearance="primary" onClick={() => this._signUp() }>Sign up</Button>
                <Button disabled={this.state.checkingPassword} marginLeft={8} appearance="minimal" onClick={() => this.setState({ registering: false })}>Log in</Button>
              </Pane>
            </Pane>
            : <Pane width={320} className="login-form-field">
              <TextInputField
                marginTop={24}
                label="Email address"
                placeholder="example@domain.com"
                value={this.state.newEmail}
                onChange={e => this.setState({ newEmail: e.target.value })}
              />
              <TextInputField
                marginTop={24}
                label="Password"
                type="password"
                placeholder="Password"
                value={this.state.newPassword}
                onChange={e => this.setState({ newPassword: e.target.value })}
              />
              <Pane display="flex">
                <Button disabled={this.state.checkingPassword} appearance="primary" onClick={() => this._login() }>Login</Button>
                <Button disabled={this.state.checkingPassword} marginLeft={8} appearance="minimal" onClick={() => this.setState({ registering: true })}>Sign up</Button>
              </Pane>
            </Pane>
          }

        </Text>
      </Pane>
    );
  }
}

export default withCookies(withRouter(Welcome));
