const jwt = require("jsonwebtoken")
const JWT_SECRET = process.env.JWT_SECRET

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1]
    

    if (!token) {
        return res.status(401).json({message:"invalid token provided"})
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(400).json({message:"invalid token"})
        }
        req.user = user
        next()
    })
}

module.exports=authenticateToken