const jwt = require('jsonwebtoken');

const tokenVerification = async(req, res, next) => {
    const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];
    console.log(token);
    if(!token){
        res.status(404).send("Token not provided");
    }
    try{
        const decoded = await jwt.verify(token, process.env.SECRET_KEY);
        console.log(decoded);
        req.user = { id: decoded.userId };
        next();
    }catch(e){
        res.status(401).send("user not authenticated " + e);
    }
};

module.exports = tokenVerification;