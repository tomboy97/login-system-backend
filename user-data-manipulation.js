const express = require('express');
const userRouter = express.Router();
const pool = require('./db/db');
const verify = require('./middleware/verifyToken');
const axios = require('axios');
const cron = require('node-cron');
require('dotenv').config();
const buildingSlackMessage = require('./middleware/utilityFunctions');
const webHookUrl = process.env.WEBHOOK_URL;
const taskEmitter = require('./utils/taskEmitter');
const winston = require('winston');

// Logger setup
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'app.log' })
    ]
});

userRouter.post('/addTask', verify, async (req, res) => {
    try {
        const { name, desc } = req.body;
        const userId = req.user.id;
        const query = `insert into public.taskData(name, "desc", createdAt, createdBy, lastUpdatedBy, lastUpdatedDate) 
        values($1, $2, $3, $4, $5, $6)`;
        const result = await pool.query(query, [name, desc, new Date(), Number(userId), Number(userId), new Date()]);
        const data = result.rows[0];
        taskEmitter.emit('taskCreated', {
            task: { name, desc },
            userId: userId
        });
        logger.info('Task added successfully', { userId, task: { name, desc } });
        res.status(201).send("Task added successfully " + data);
    } catch (error) {
        logger.error('Error adding task', { error: error.message });
        res.status(500).send('Error adding task');
    }
});

userRouter.put('/updateTask/:id', verify, async (req, res) => {
    try {
        const taskId = req.params.id;
        const { name, desc, status } = req.body;
        const userId = req.user.id;
        const query = `update public.taskData set name=$1, "desc"=$2, lastUpdatedBy=$3, lastUpdatedDate=$4, status=$5 where id=$6`;
        const result = await pool.query(query, [name, desc, Number(userId), new Date(), status, Number(taskId)]);
        const updatedTask = result.rows[0];
        taskEmitter.emit('taskUpdated', {
            task: updatedTask,
            userId: userId
        });

        if (status && status.toLowerCase() === 'completed') {
            taskEmitter.emit('taskCompleted', {
                task: updatedTask,
                userId: userId
            });
        }
        logger.info('Task updated successfully', { userId, taskId, updatedTask });
        res.status(200).send("Task updated successfully " + updatedTask);
    } catch (error) {
        logger.error('Error updating task', { error: error.message });
        res.status(500).send('Error updating task');
    }
});

userRouter.delete('/deleteTask/:id', verify, async (req, res) => {
    try {
        const taskId = req.params.id;
        const query = `delete from public.taskData where id=$1`;
        const result = await pool.query(query, [Number(taskId)]);
        logger.info('Task deleted successfully', { taskId });
        res.status(200).send("Task deleted successfully " + result.rows[0]);
    } catch (error) {
        logger.error('Error deleting task', { error: error.message });
        res.status(500).send('Error deleting task');
    }
});

userRouter.get('/getTask/:id', verify, async (req, res) => {
    try {
        const taskId = req.params.id;
        const query = `select * from public.taskData where id=$1`;
        const result = await pool.query(query, [Number(taskId)]);
        const data = result.rows[0];
        logger.info('Task fetched successfully', { taskId, data });
        res.status(200).send("Task fetched successfully " + data);
    } catch (error) {
        logger.error('Error fetching task', { error: error.message });
        res.status(500).send('Error fetching task');
    }
});

const sendTaskDetails = async () => {
    try {
        const query = "select * from public.taskData where status not in ('closed')";
        const resultSet = await pool.query(query);
        const data = resultSet.rows;
        const slackMessagePattern = await buildingSlackMessage(data, "Task Details");
        console.log(" slack message pattern is " + JSON.stringify(slackMessagePattern, null, 2));
        await axios.post(webHookUrl, slackMessagePattern);
        logger.info('Task details sent to Slack', { data });
    } catch (error) {
        logger.error('Error sending task details to Slack', { error: error.message });
    }
};

userRouter.post('/sendTaskDetails', verify, async (req, res) => {
    try {
        await sendTaskDetails();
        res.status(200).json({ message: "Task details sent" });
    } catch (error) {
        logger.error('Error in /sendTaskDetails endpoint', { error: error.message });
        res.status(500).send('Error sending task details');
    }
});

cron.schedule("0 9 * * *", () => {
    console.log("Running cron job at every morning 9 am");
    sendTaskDetails();
});

module.exports = userRouter;