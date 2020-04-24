let throng = require('throng'),
    Queue = require("bull"),
    db = require('./controllers/db'),
    responses = require(__dirname+'/controllers/responses'),
    unsubscribe = require(__dirname+'/controllers/unsubscribe'),
    tasks = require(__dirname+'/controllers/tasks');

// LOCAL ENV VARIABLES
let MONGO = process.env.MONGODB_URI;
let REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

// Spin up multiple processes to handle jobs to take advantage of more CPU cores
// See: https://devcenter.heroku.com/articles/node-concurrency for more info
let WORKERS = process.env.WEB_CONCURRENCY || 1;

// The maxium number of jobs each worker should process at once. This will need
// to be tuned for your application. If each job is mostly waiting on network
// responses it can be much higher. If each job is CPU-intensive, it might need
// to be much lower.
let maxJobsPerWorker = 20;

function start() {
  console.log("Worker starting...");

  // Connect to the named work queues
  let responsesQueue = new Queue('responses', REDIS_URL);
  let tasksQueue = new Queue('tasks', REDIS_URL);
  let unsubscribeQueue = new Queue('unsubscribe', REDIS_URL);

  // Connect to DB
  db.connect(MONGO, function(err) {
    if (err) {

      console.log('Worker unable to connect to Mongo!', err);
      process.exit(1);

    } else {

      // save task data
      tasksQueue.process(maxJobsPerWorker, (job) => {
        console.log('Task job received', job.id);
        return tasks.save(job.data);
      });

      tasksQueue.on('error', (error) => {
        console.log('---> task queue error!', error);
      });

      tasksQueue.on('completed', (job, result) => {
        console.log('    completed task job ', job.id);
      });

      // save survey data
      responsesQueue.process(maxJobsPerWorker, (job) => {
        console.log('Survey job received', job.id);
        return responses.save(job.data);
      });

      responsesQueue.on('error', (error) => {
        console.log('---> survey queue error!', error);
      });

      responsesQueue.on('completed', (job, result) => {
        console.log('    completed survey job ', job.id);
      });

      // unsubscribe
      unsubscribeQueue.process(maxJobsPerWorker, (job) => {
        console.log('Unsubscribe job received', job.id);
        return unsubscribe.save(job.data);
      });

    }
  });
}

// Initialize the clustered worker process
// See: https://devcenter.heroku.com/articles/node-concurrency for more info
throng({workers: WORKERS,
  lifetime: Infinity
}, start);
