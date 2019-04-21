import React, { Component } from 'react';
import { withRouter, Redirect } from 'react-router-dom'
import { instanceOf } from 'prop-types'
import { withCookies, Cookies } from 'react-cookie'
import Admin from '../Admin'
import Analytics from '../Analytics'

class RestrictedContainer extends Component {

  static propTypes = {
    cookies: instanceOf(Cookies).isRequired
  };

  constructor(props) {
    super(props);

    this.userRole = 0
    if(JSON.parse(this.props.cookies.cookies.user).role){
      this.userRole = JSON.parse(this.props.cookies.cookies.user).role.level
    }
  }

  render() {
    let authenticated = false
    if(this.userRole === this.props.authorize[0] || this.userRole === this.props.authorize[1]){
      authenticated = true
    }
    if(this.props.match.path === '/analytics'){
      return authenticated ? <Analytics /> : <Redirect to="/" />;
    } else {
      return authenticated ? <Admin /> : <Redirect to="/" />;
    }
  }
}

export default withCookies(withRouter(RestrictedContainer));
