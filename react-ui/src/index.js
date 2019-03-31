import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route } from "react-router-dom";
import Admin from './Admin';
import TaskView from './TaskView';
import Welcome from './Welcome';
import './index.css';

ReactDOM.render(
  <Router>
    <Route exact path="/" component={Welcome} />
    <Route path="/task/:id" render={props => <TaskView {...props} />} />
    <Route exact path="/admin" component={Admin} />
  </Router>,
  document.getElementById('root')
);
