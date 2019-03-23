require('dotenv').config()

const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;
const moment = require('moment');
const cluster = require('cluster')
const numCPUs = require('os').cpus().length

const PORT = process.env.PORT || 5000

const mongoURL = process.env.MONGODB_URI
const dbName = process.env.MONGODB_NAME

// Multi-process to utilize all CPU cores.
if (cluster.isMaster) {
  console.error(`Node cluster master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.error(`Node cluster worker ${worker.process.pid} exited: code ${code}, signal ${signal}`);
  });

} else {
  const app = express();

  // Priority serve any static files.
  app.use(express.static(path.resolve(__dirname, '../react-ui/build')));

  app.use(bodyParser.json({limit: '50mb'}));
  app.use(bodyParser.urlencoded({ extended: true, limit: '50mb'}));

  // Answer API requests.
  app.get('/api', function (req, res) {
    res.set('Content-Type', 'application/json');
    res.send('{"message":"Hello from the custom server!"}');
  });

  app.get('/api/tasks', function (req, res) {
    res.set('Content-Type', 'application/json');
    // connect to Mongo
    MongoClient.connect(mongoURL, { useNewUrlParser: true }, function(err, client) {

      // check for errors
      if (!err) {}

      // get db cursor
      const db = client.db(dbName);
      const tasks = db.collection('tasks');

      tasks.find().sort({ updated: -1 }).toArray(function(err, items) {
        if(err) { reject(err) } else {
          res.json(items);
        }
      })
    })
  });

  app.post('/api/task/new', function (req, res) {
    res.set('Content-Type', 'application/json');
    // connect to Mongo
    MongoClient.connect(mongoURL, { useNewUrlParser: true }, function(err, client) {

      // check for errors
      if (!err) {}

      // get db cursor
      const db = client.db(dbName);
      const tasks = db.collection('tasks');

      tasks.insertOne({
        name: "New task",
        desc: "This task does not have a description",
        team: "Camel team",
        status: "Started",
        completed: false,
        completed_date: null,
        cancelled_date: null,
        due_date: moment( new Date() ).add(7, 'days').toDate(),
        updated: new Date(),
        subtasks: [
            {
                "completed": false,
                "content": "Create task content",
                "added": new Date()
            }
        ],
        artifacts: [],
        attachments: [],
        notes: []
      })

      tasks.find().sort({ updated: -1 }).toArray(function(err, items) {
        if(err) { reject(err) } else {
          res.json(items);
        }
      })
    })
  });

  app.post('/api/task/:id/updateName', function (req, res) {
    res.set('Content-Type', 'application/json');
    // connect to Mongo
    MongoClient.connect(mongoURL, { useNewUrlParser: true }, function(err, client) {

      // check for errors
      if (!err) {}

      // get db cursor
      const db = client.db(dbName);
      const tasks = db.collection('tasks');

      tasks.findOneAndUpdate( { _id : ObjectId(req.params.id) },
      {
        $set: { name: req.body.name, updated: new Date() }
      })

      tasks.find().sort({ updated: -1 }).toArray(function(err, items) {
        if(err) { reject(err) } else {
          res.json(items);
        }
      })
    })
  });

  app.post('/api/task/:id/updateDesc', function (req, res) {
    res.set('Content-Type', 'application/json');
    // connect to Mongo
    MongoClient.connect(mongoURL, { useNewUrlParser: true }, function(err, client) {

      // check for errors
      if (!err) {}

      // get db cursor
      const db = client.db(dbName);
      const tasks = db.collection('tasks');

      tasks.findOneAndUpdate( { _id : ObjectId(req.params.id) },
      {
        $set: { desc: req.body.desc, updated: new Date() }
      })

      tasks.find().sort({ updated: -1 }).toArray(function(err, items) {
        if(err) { reject(err) } else {
          res.json(items);
        }
      })
    })
  });

  app.post('/api/task/:id/updateDueDate', function (req, res) {
    res.set('Content-Type', 'application/json');
    // connect to Mongo
    MongoClient.connect(mongoURL, { useNewUrlParser: true }, function(err, client) {

      // check for errors
      if (!err) {}

      // get db cursor
      const db = client.db(dbName);
      const tasks = db.collection('tasks');

      tasks.findOneAndUpdate( { _id : ObjectId(req.params.id) },
      {
        $set: { due_date: req.body.due_date, updated: new Date() }
      })

      tasks.find().sort({ updated: -1 }).toArray(function(err, items) {
        if(err) { reject(err) } else {
          res.json(items);
        }
      })
    })
  });

  app.post('/api/task/:id/updateTeam', function (req, res) {
    res.set('Content-Type', 'application/json');
    // connect to Mongo
    MongoClient.connect(mongoURL, { useNewUrlParser: true }, function(err, client) {

      // check for errors
      if (!err) {}

      // get db cursor
      const db = client.db(dbName);
      const tasks = db.collection('tasks');

      tasks.findOneAndUpdate( { _id : ObjectId(req.params.id) },
      {
        $set: { team: req.body.team, updated: new Date() }
      })

      tasks.find().sort({ updated: -1 }).toArray(function(err, items) {
        if(err) { reject(err) } else {
          res.json(items);
        }
      })
    })
  });

  app.post('/api/task/:id/completed', function (req, res) {
    res.set('Content-Type', 'application/json');
    // connect to Mongo
    MongoClient.connect(mongoURL, { useNewUrlParser: true }, function(err, client) {

      // check for errors
      if (!err) {}

      // get db cursor
      const db = client.db(dbName);
      const tasks = db.collection('tasks');

      tasks.findOneAndUpdate( { _id : ObjectId(req.params.id) },
      {
        $set: { completed: true, completed_date: new Date(), updated: new Date() }
      })

      tasks.find().sort({ updated: -1 }).toArray(function(err, items) {
        if(err) { reject(err) } else {
          res.json(items);
        }
      })
    })
  });

  app.post('/api/task/:id/cancelled', function (req, res) {
    res.set('Content-Type', 'application/json');
    // connect to Mongo
    MongoClient.connect(mongoURL, { useNewUrlParser: true }, function(err, client) {

      // check for errors
      if (!err) {}

      // get db cursor
      const db = client.db(dbName);
      const tasks = db.collection('tasks');

      tasks.findOneAndUpdate( { _id : ObjectId(req.params.id) },
      {
        $set: { status: 'Cancelled', cancelled_date: new Date(), updated: new Date() }
      })

      tasks.find().sort({ updated: -1 }).toArray(function(err, items) {
        if(err) { reject(err) } else {
          res.json(items);
        }
      })
    })
  });

  app.post('/api/task/:id/archive', function (req, res) {
    res.set('Content-Type', 'application/json');
    // connect to Mongo
    MongoClient.connect(mongoURL, { useNewUrlParser: true }, function(err, client) {

      // check for errors
      if (!err) {}

      // get db cursor
      const db = client.db(dbName);
      const tasks = db.collection('tasks');

      tasks.deleteOne( { _id : ObjectId(req.params.id) } )

      tasks.find().sort({ updated: -1 }).toArray(function(err, items) {
        if(err) { reject(err) } else {
          res.json(items);
        }
      })
    })
  });

  // All remaining requests return the React app, so it can handle routing.
  app.get('*', function(request, response) {
    response.sendFile(path.resolve(__dirname, '../react-ui/build', 'index.html'));
  });

  app.listen(PORT, function () {
    console.error(`Node cluster worker ${process.pid}: listening on port ${PORT}`);
  });
}
