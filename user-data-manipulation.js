const express = require('express');
const userRouter = express.Router();
const pool = require('./db/db');
const verify = require('./middleware/verifyToken');
const axios = require('axios');
const cron = require('node-cron');
require('dotenv').config();
const buildingSlackMessage = require('./middleware/utilityFunctions');
const webHookUrl = process.env.WEBHOOK_URL;

userRouter.post('/addTask', verify, async(req, res) => {
    const { name, desc } = req.body;
    const userId = req.user.id;
    const query = `insert into public.taskData(name, "desc", createdAt, createdBy, lastUpdatedBy, lastUpdatedDate) 
    values($1, $2, $3, $4, $5, $6)`;
    const result = await pool.query(query, [name, desc, new Date(), Number(userId), Number(userId), new Date()]);
    const data = result.rows[0];
    console.log("hfbu");
    res.status(201).send("Task added successfully " + data);
});

const sendTaskDetails = async() => {
    const query = "select * from public.taskData where status not in ('closed')";
    const resultSet = await pool.query(query);
    const data = resultSet.rows;
    const slackMessagePattern = await buildingSlackMessage(data, "Task Details");
    console.log(" slack message pattern is " + JSON.stringify(slackMessagePattern, null, 2));
    const response = axios.post(webHookUrl, slackMessagePattern).then(() => console.log("------------------------------Message Posted")).catch((err) => console.log(err));
    console.log("response of sending message to slack " + JSON.stringify(response));
};

userRouter.post('/sendTaskDetails', verify, async(req, res) => {
    await sendTaskDetails();
    res.status(200).json({ message: "Task details sent" });
});

cron.schedule("0 9 * * *", () => {
    console.log("Running cron job at every morning 9 am");
    sendTaskDetails();
})

module.exports = userRouter;