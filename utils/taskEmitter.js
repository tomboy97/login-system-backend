const taskEmitter = require('../utils/eventEmitter');
taskEmitter.on('taskCreated', ({ task, userId }) => {
    sendNotification(userId, `Task Created: ${task.name}`);
});
  
  taskEmitter.on('taskUpdated', ({ task, userId }) => {
    sendNotification(userId, `Task Updated: ${task.name}`);
  });
  
  taskEmitter.on('taskCompleted', ({ task, userId }) => {
    sendNotification(userId, `Task Completed: ${task.name}`);
  });
  
  function sendNotification(userId, message) {
    console.log(`[User ${userId}] ${message}`);
  }