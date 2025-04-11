const express = require('express');
const app = express();
const router = require('./router')
const verify = require('./middleware/verifyToken');
require('dotenv').config();
app.use(express.json());
app.use('/user', router);
app.use('/verify', verify);

process.on("uncaughtException", (err) => {
    console.error("🔥 Uncaught Exception:", err);
});
  
const PORT = process.env.PORT || 8929;
 app.listen(PORT, () => {
 console.log(`Server is running on port ${PORT}`);
 });