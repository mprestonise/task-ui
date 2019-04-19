import React from 'react'
import ReactDOM from 'react-dom'
import { CookiesProvider } from 'react-cookie'
import { BrowserRouter as Router, Route } from "react-router-dom"
import RestrictedContainer from './RestrictedContainer'
import TaskView from './TaskView'
import Welcome from './Welcome'
import './index.css'

ReactDOM.render(
  <CookiesProvider>
    <Router>
      <Route exact path="/" component={Welcome} />
      <Route path="/task/:id" render={props => <TaskView {...props} />} />
      <Route exact path="/admin" render={(props) => <RestrictedContainer authorize={[1,10]} props={props} />} />
      <Route exact path="/logout" component={Welcome} />
      <Route path="/not-found" component={Welcome} />
    </Router>
  </CookiesProvider>,
  document.getElementById('root')
);
