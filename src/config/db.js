const mongoose = require("mongoose")

const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGO_URL}shopco`)
        console.log("DB connected Sucesfully");
    } catch (error) {
        console.log("fald to connect DB", error);
    }
}

module.exports = connectDB