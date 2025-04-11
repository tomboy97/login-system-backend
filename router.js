const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('./db/db');
const verify = require('./middleware/verifyToken');

router.post('/register', async(req, res) => {
    try{
        const { firstname, lastname, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const queryText = `
            INSERT INTO users (firstname, lastname, email, password)
            VALUES ($1, $2, $3, $4) RETURNING *;
            `;
        const result = await pool.query(queryText, [firstname, lastname, email, hashedPassword]);
        const user = result.rows[0];
        delete user.password;
        res.status(200).send(user);
    } catch(e){
        res.status(500).send("Registration failed!" + e);
    }
});

router.post('/login' ,async(req, res) => {
    try{
        const {email, password} = req.body;
        const query = `select * from users where email = $1`;
        const result = await pool.query(query, [email]);
        if(result != null){
            const user = result.rows[0];
            console.log(typeof user.password);
            const passCompare = await bcrypt.compare(password, user.password.toString('utf-8'));
            if(!passCompare){
                res.send(401).send("User not authenticated!");
            }
            delete user.password;
            console.log(user);
            const token = await jwt.sign({userId: user.id}, process.env.SECRET_KEY, {expiresIn: '1h'});
            const refreshToken = await jwt.sign({userId: user.id}, process.env.REFRESH_TOKEN_KEY, {expiresIn: '30d'});
            res.status(200).send({user: user, token: token, refreshToken});
        }
    } catch(e){
        res.status(500).send("Login Failed! " + e);
    }
});

router.get('/protected-data', verify, (req, res) => {
    res.status(200).send("Data is sent");
});

router.get('/getUserDate', verify, async(req, res) => {
    const query = "select * from users;";
    const result = await pool.query(query);
    const finalRows = result.rows;
    finalRows.forEach(n => delete(n.password));
    console.log(finalRows);
    res.status(200).send(finalRows);
});

router.post('/refreshToken', async(req, res) => {
    const { refreshToken } = req.body;
    if(!refreshToken){
        return res.status(400).send("Token not present");
    }
    const decoded = await jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY);
    const accessToken = await jwt.sign({userId: decoded.userId}, process.env.SECRET_KEY, {expiresIn: '1h'});
    res.status(200).send("Access token " + accessToken);
});

module.exports = router;