require('dotenv').config()
const express = require("express")
const cors = require("cors")
const userRouter = require("./src/routes/userRouts")
const productRouter = require("./src/routes/productRouts")
const connectDB = require('./src/config/db')

const app = express()
const PORT = process.env.PORT
connectDB()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())

app.use('/api/v1/user', userRouter)
app.use('/api/v1/product', productRouter)

app.get('/', (req, res) => {
    res.json({ message: "surver is runing.." })
})

app.listen(PORT, () => {
    console.log(`surver is runing a port ${PORT}`);
})