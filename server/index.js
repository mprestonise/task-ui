require('dotenv').config()

const express = require('express')
const path = require('path')
const bcrypt = require('bcryptjs')
const bodyParser = require('body-parser')
const formData = require('express-form-data')
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;
const aws = require('aws-sdk');
const moment = require('moment');
const cluster = require('cluster')
const numCPUs = require('os').cpus().length

const PORT = process.env.PORT || 5000

const mongoURL = process.env.MONGODB_URI
const dbName = process.env.MONGODB_NAME

const s3 = new aws.S3();
aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'eu-west-2',
});
const S3_BUCKET = process.env.S3_BUCKET;

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

  app.use(formData.parse())

  // Answer API requests.
  app.get('/api', function (req, res) {
    res.set('Content-Type', 'application/json');
    res.send('{"message":"Hello from the custom server!"}');
  });

  app.post('/api/register', function (req, res) {
    res.set('Content-Type', 'application/json');
    MongoClient.connect(mongoURL, { useNewUrlParser: true }, function(err, client) {

      // check for errors
      if (!err) {}

      // get db cursor
      const db = client.db(dbName)
      const users = db.collection('users')
      const tasks = db.collection('tasks')
      const activity = db.collection('activity')

      // Hash the password & add salt
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(req.body.password, salt);

      // I should check to make sure the email address hasn't been used already

      users.find({ email: req.body.email }).toArray(function(err,items) {
        if(err) { console.log(err) }
        else {
          if(items.length > 0){
            res.json({ status: 401, message: 'User already exists' })
          } else {
            users.insertOne({
              email: req.body.email,
              password: hash,
              role: {
                label: 'User',
                level: 1
              }
            }, (err,insertedUser) => {
              tasks.insertOne({
                owner: insertedUser.insertedId,
                name: "Your first task",
                desc: "This is a description of the task. Click here to edit it",
                team: "Design",
                status: "Created",
                created_date: new Date(),
                started_date: null,
                completed: false,
                completed_date: null,
                cancelled_date: null,
                was_overdue: false,
                due_date: moment( new Date() ).add(8, 'days').toDate(),
                updated: new Date(),
                subtasks: [],
                artifacts: [],
                attachments: [],
                notes: []
              }, (err,insertedTask) => {
                activity.insertOne({
                  name: 'Created an account',
                  owner: insertedUser.insertedId.toString(),
                  content: "Welcome to TaskUI",
                  task_id: insertedTask.insertedId,
                  created_at: new Date()
                })
                res.json({ status: 200, message: 'User created', user: { _id: insertedUser.insertedId, email: req.body.email, password: hash, role: { label: 'User', level: 1 } } })
              })
            })
          }
        }
      })


    })
  });

  app.post('/api/login', function (req, res) {
    res.set('Content-Type', 'application/json');
    MongoClient.connect(mongoURL, { useNewUrlParser: true }, function(err, client) {

      // check for errors
      if (!err) {}

      // get db cursor
      const db = client.db(dbName)
      const users = db.collection('users')

      users.find({ email: req.body.email }).toArray(function(err,items) {
        if(err) { console.log(err) }
        else {
          if(items.length === 0) { res.json({ status: 404, message: 'Email & password do not match' }) }
          else {
            // Check the password against the hash
            const comparison = bcrypt.compareSync(req.body.password, items[0].password)
            if(comparison){
              res.json({ status: 200, message: 'Email & password match', user: items[0] })
            } else {
              res.json({ status: 404, message: 'Email & password do not match' })
            }
          }
        }
      })
    })
  });


  app.get('/api/tasks/:user', function (req, res) {
    res.set('Content-Type', 'application/json');
    // connect to Mongo
    MongoClient.connect(mongoURL, { useNewUrlParser: true }, function(err, client) {

      // check for errors
      if (!err) {}

      // get db cursor
      const db = client.db(dbName)
      const tasks = db.collection('tasks')
      const activity = db.collection('activity')

      tasks.find({ owner: ObjectId(req.params.user) }).sort({ updated: -1 }).toArray(function(err, tasks) {
        if(err) { reject(err) } else {
          activity.find({ owner: req.params.user }).sort({ created_at: -1 }).limit(5).toArray((err,items) => {
            res.json({
              tasks: tasks,
              activity: items
            })
          })
        }
      })
    })
  });

  app.get('/api/task/:id', function (req, res) {
    res.set('Content-Type', 'application/json');
    // connect to Mongo
    MongoClient.connect(mongoURL, { useNewUrlParser: true }, function(err, client) {

      // check for errors
      if (!err) {}

      // get db cursor
      const db = client.db(dbName);
      const tasks = db.collection('tasks');

      tasks.find({ _id: ObjectId(req.params.id) }).toArray(function(err, items) {
        if(err) { reject(err) } else {
          res.json(items[0]);
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
      const db = client.db(dbName)
      const tasks = db.collection('tasks')
      const activity = db.collection('activity')

      tasks.insertOne({
        name: req.body.name,
        owner: req.body.user,
        desc: "This task does not have a description",
        team: "Camel team",
        status: "Created",
        created_date: new Date(),
        started_date: null,
        completed: false,
        completed_date: null,
        cancelled_date: null,
        was_overdue: false,
        due_date: moment( new Date() ).add(8, 'days').toDate(),
        updated: new Date(),
        subtasks: [],
        artifacts: [],
        attachments: [],
        notes: []
      }, (err,inserted) => {
        activity.insertOne({
          name: 'Created new task',
          owner: req.body.user,
          content: req.body.name,
          task_id: inserted.insertedId,
          created_at: new Date()
        })
      })


      tasks.find({ owner: ObjectId(req.body.user) }).sort({ updated: -1 }).toArray(function(err, tasks) {
        if(err) { reject(err) } else {
          activity.find({ owner: req.body.user }).sort({ created_at: -1 }).limit(5).toArray((err,items) => {
            res.json({
              tasks: tasks,
              activity: items
            })
          })
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
      const db = client.db(dbName)
      const tasks = db.collection('tasks')
      const activity = db.collection('activity')

      tasks.findOneAndUpdate( { _id : ObjectId(req.params.id) },
      {
        $set: { name: req.body.name, updated: new Date() }
      })

      activity.insertOne({
        name: 'Updated task name',
        owner: req.body.user,
        content: req.body.name,
        task_id: ObjectId(req.params.id),
        created_at: new Date()
      })

      activity.updateMany(
        { task_id: ObjectId(req.params.id) },
        { $set: { content: req.body.name } }
      );

      tasks.find({ owner: ObjectId(req.body.user) }).sort({ updated: -1 }).toArray(function(err, tasks) {
        if(err) { reject(err) } else {
          activity.find({ owner: req.body.user }).sort({ created_at: -1 }).limit(5).toArray((err,items) => {
            res.json({
              tasks: tasks,
              activity: items
            })
          })
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
      const db = client.db(dbName)
      const tasks = db.collection('tasks')
      const activity = db.collection('activity')

      tasks.findOneAndUpdate( { _id : ObjectId(req.params.id) },
      {
        $set: { desc: req.body.desc, updated: new Date() }
      })

      activity.insertOne({
        name: 'Updated task description',
        owner: req.body.user,
        content: req.body.name,
        task_id: ObjectId(req.params.id),
        created_at: new Date()
      })

      tasks.find({ owner: ObjectId(req.body.user) }).sort({ updated: -1 }).toArray(function(err, tasks) {
        if(err) { reject(err) } else {
          activity.find({ owner: req.body.user }).sort({ created_at: -1 }).limit(5).toArray((err,items) => {
            res.json({
              tasks: tasks,
              activity: items
            })
          })
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
      const db = client.db(dbName)
      const tasks = db.collection('tasks')
      const activity = db.collection('activity')

      tasks.findOneAndUpdate( { _id : ObjectId(req.params.id) },
      {
        $set: { due_date: req.body.due_date, updated: new Date() }
      })
      activity.insertOne({
        name: 'Updated task due date',
        owner: req.body.user,
        content: req.body.due_date,
        task_id: ObjectId(req.params.id),
        created_at: new Date()
      })

      tasks.find({ owner: ObjectId(req.body.user) }).sort({ updated: -1 }).toArray(function(err, tasks) {
        if(err) { reject(err) } else {
          activity.find({ owner: req.body.user }).sort({ created_at: -1 }).limit(5).toArray((err,items) => {
            res.json({
              tasks: tasks,
              activity: items
            })
          })
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
      const db = client.db(dbName)
      const tasks = db.collection('tasks')
      const activity = db.collection('activity')

      tasks.findOneAndUpdate( { _id : ObjectId(req.params.id) },
      {
        $set: { team: req.body.team, updated: new Date() }
      })
      activity.insertOne({
        name: 'Updated task team',
        owner: req.body.user,
        content: req.body.name,
        task_id: ObjectId(req.params.id),
        created_at: new Date()
      })

      tasks.find({ owner: ObjectId(req.body.user) }).sort({ updated: -1 }).toArray(function(err, tasks) {
        if(err) { reject(err) } else {
          activity.find({ owner: req.body.user }).sort({ created_at: -1 }).limit(5).toArray((err,items) => {
            res.json({
              tasks: tasks,
              activity: items
            })
          })
        }
      })
    })
  });

  app.post('/api/task/:id/updateSubtasks', function (req, res) {
    res.set('Content-Type', 'application/json');
    // connect to Mongo
    MongoClient.connect(mongoURL, { useNewUrlParser: true }, function(err, client) {

      // check for errors
      if (!err) {}

      // get db cursor
      const db = client.db(dbName)
      const tasks = db.collection('tasks')
      const activity = db.collection('activity')

      tasks.findOneAndUpdate( { _id : ObjectId(req.params.id) },
      {
        $set: { subtasks: req.body.subtasks, updated: new Date() }
      })
      activity.insertOne({
        name: 'Updated task > subtasks',
        owner: req.body.user,
        content: req.body.name,
        task_id: ObjectId(req.params.id),
        created_at: new Date()
      })

      tasks.find({ owner: ObjectId(req.body.user) }).sort({ updated: -1 }).toArray(function(err, tasks) {
        if(err) { reject(err) } else {
          activity.find({ owner: req.body.user }).sort({ created_at: -1 }).limit(5).toArray((err,items) => {
            res.json({
              tasks: tasks,
              activity: items
            })
          })
        }
      })
    })
  });

  app.post('/api/task/:id/addArtifact/:user/sign-s3', (req, res) => {
    res.set('Content-Type', 'application/json');
    const { fileName, fileType } = req.query;
    const s3 = new aws.S3({signatureVersion: 'v4'});

    let s3Params = {
      Bucket: S3_BUCKET,
      Key: fileName,
      Expires: 60,
      ContentType: fileType,
      ACL: 'public-read'
    }

    s3.getSignedUrl('putObject', s3Params, (err, data) => {
      if(err){ console.log(err); return res.end(); }
      let returnData = {
        signedRequest: data,
        url: `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`
      }
      // connect to Mongo
      MongoClient.connect(mongoURL, { useNewUrlParser: true }, function(err, client) {

        // check for errors
        if (!err) {}

        // get db cursor
        const db = client.db(dbName)
        const tasks = db.collection('tasks')
        const activity = db.collection('activity')

        const newArtifact = {
          added: new Date(),
          url: returnData.url
        }

        tasks.findOneAndUpdate( { _id : ObjectId(req.params.id) },
        {
          $push: { artifacts: { $each: [newArtifact], $position: 0 } },
          $set: { updated: new Date() }
        })
        activity.insertOne({
          name: 'Added an artifact to task',
          owner: req.params.user,
          content: newArtifact.url,
          task_id: ObjectId(req.params.id),
          created_at: new Date()
        })

        tasks.find({ owner: ObjectId(req.params.user) }).sort({ updated: -1 }).toArray(function(err, tasks) {
          if(err) { reject(err) } else {
            activity.find({ owner: req.params.user }).sort({ created_at: -1 }).limit(5).toArray((err,items) => {
              res.json({
                tasks: tasks,
                signedUrl: returnData.signedRequest,
                url: returnData.url,
                activity: items
              })
            })
          }
        })
      })
    })

  });

  app.post('/api/task/:id/addAttachment', function (req, res) {
    res.set('Content-Type', 'application/json');
    // connect to Mongo
    MongoClient.connect(mongoURL, { useNewUrlParser: true }, function(err, client) {

      // check for errors
      if (!err) {}

      // get db cursor
      const db = client.db(dbName)
      const tasks = db.collection('tasks')
      const activity = db.collection('activity')

      tasks.findOneAndUpdate( { _id : ObjectId(req.params.id) },
      {
        $push: { attachments: { $each: [req.body.attachment], $position: 0 } },
        $set: { updated: new Date() }
      })
      activity.insertOne({
        name: 'Added an attachment to task',
        owner: req.body.user,
        content: req.body.name,
        task_id: ObjectId(req.params.id),
        created_at: new Date()
      })

      tasks.find({ owner: ObjectId(req.body.user) }).sort({ updated: -1 }).toArray(function(err, tasks) {
        if(err) { reject(err) } else {
          activity.find({ owner: req.body.user }).sort({ created_at: -1 }).limit(5).toArray((err,items) => {
            res.json({
              tasks: tasks,
              activity: items
            })
          })
        }
      })
    })
  });

  app.post('/api/task/:id/removeAttachment/:user', function (req, res) {
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
        $pull: { attachments: { url: req.body.attachment.url } },
        $set: { updated: new Date() }
      })

      tasks.find({ owner: ObjectId(req.params.user) }).sort({ updated: -1 }).toArray(function(err, items) {
        if(err) { reject(err) } else {
          res.json(items);
        }
      })
    })
  });

  app.post('/api/task/:id/addNote', function (req, res) {
    res.set('Content-Type', 'application/json');
    // connect to Mongo
    MongoClient.connect(mongoURL, { useNewUrlParser: true }, function(err, client) {

      // check for errors
      if (!err) {}

      // get db cursor
      const db = client.db(dbName)
      const tasks = db.collection('tasks')
      const activity = db.collection('activity')

      const newNote = {
        added: new Date(),
        content: req.body.note
      }

      tasks.findOneAndUpdate( { _id : ObjectId(req.params.id) },
      {
        $push: { notes: { $each: [newNote], $position: 0 } },
        $set: { updated: new Date() }
      })
      activity.insertOne({
        name: 'Added a note to task',
        owner: req.body.user,
        content: req.body.name,
        task_id: ObjectId(req.params.id),
        created_at: new Date()
      })

      tasks.find({ owner: ObjectId(req.body.user) }).sort({ updated: -1 }).toArray(function(err, tasks) {
        if(err) { reject(err) } else {
          activity.find({ owner: req.body.user }).sort({ created_at: -1 }).limit(5).toArray((err,items) => {
            res.json({
              tasks: tasks,
              activity: items
            })
          })
        }
      })
    })
  });

  app.post('/api/task/:id/startTask', function (req, res) {
    res.set('Content-Type', 'application/json');
    // connect to Mongo
    MongoClient.connect(mongoURL, { useNewUrlParser: true }, function(err, client) {

      // check for errors
      if (!err) {}

      // get db cursor
      const db = client.db(dbName)
      const tasks = db.collection('tasks')
      const activity = db.collection('activity')

      tasks.findOneAndUpdate( { _id : ObjectId(req.params.id) },
      {
        $set: { status: 'Started', started_date: new Date(), updated: new Date() }
      })
      activity.insertOne({
        name: 'Task: Started',
        owner: req.body.user,
        content: req.body.name,
        task_id: ObjectId(req.params.id),
        created_at: new Date()
      })

      tasks.find({ owner: ObjectId(req.body.user) }).sort({ updated: -1 }).toArray(function(err, tasks) {
        if(err) { reject(err) } else {
          activity.find({ owner: req.body.user }).sort({ created_at: -1 }).limit(5).toArray((err,items) => {
            res.json({
              tasks: tasks,
              activity: items
            })
          })
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
      const db = client.db(dbName)
      const tasks = db.collection('tasks')
      const activity = db.collection('activity')

      tasks.findOneAndUpdate( { _id : ObjectId(req.params.id) },
      {
        $set: { status: 'Completed', completed: true, completed_date: new Date(), updated: new Date() }
      })
      activity.insertOne({
        name: 'Task: Completed',
        owner: req.body.user,
        content: req.body.name,
        task_id: ObjectId(req.params.id),
        created_at: new Date()
      })

      tasks.find({ owner: ObjectId(req.body.user) }).sort({ updated: -1 }).toArray(function(err, tasks) {
        if(err) { reject(err) } else {
          activity.find({ owner: req.body.user }).sort({ created_at: -1 }).limit(5).toArray((err,items) => {
            res.json({
              tasks: tasks,
              activity: items
            })
          })
        }
      })
    })
  });

  app.post('/api/task/:id/overdue', function (req, res) {
    res.set('Content-Type', 'application/json');
    // connect to Mongo
    MongoClient.connect(mongoURL, { useNewUrlParser: true }, function(err, client) {

      // check for errors
      if (!err) {}

      // get db cursor
      const db = client.db(dbName)
      const tasks = db.collection('tasks')
      const activity = db.collection('activity')

      tasks.findOneAndUpdate( { _id : ObjectId(req.params.id) },
      {
        $set: { was_overdue: true, updated: new Date() }
      })
      activity.insertOne({
        name: 'Task: Overdue',
        owner: req.body.user,
        content: req.body.name,
        task_id: ObjectId(req.params.id),
        created_at: new Date()
      })

      tasks.find({ owner: ObjectId(req.body.user) }).sort({ updated: -1 }).toArray(function(err, tasks) {
        if(err) { reject(err) } else {
          activity.find({ owner: req.body.user }).sort({ created_at: -1 }).limit(5).toArray((err,items) => {
            res.json({
              tasks: tasks,
              activity: items
            })
          })
        }
      })
    })
  });

  app.post('/api/task/:id/cancelled/:user', function (req, res) {
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

      tasks.find({ owner: ObjectId(req.params.user) }).sort({ updated: -1 }).toArray(function(err, items) {
        if(err) { reject(err) } else {
          res.json(items);
        }
      })
    })
  });

  app.post('/api/task/:id/archive/:user', function (req, res) {
    res.set('Content-Type', 'application/json');
    // connect to Mongo
    MongoClient.connect(mongoURL, { useNewUrlParser: true }, function(err, client) {

      // check for errors
      if (!err) {}

      // get db cursor
      const db = client.db(dbName);
      const tasks = db.collection('tasks');

      tasks.deleteOne( { _id : ObjectId(req.params.id) } )

      tasks.find({ owner: ObjectId(req.params.user) }).sort({ updated: -1 }).toArray(function(err, items) {
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
