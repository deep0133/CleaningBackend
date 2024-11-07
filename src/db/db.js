import mongoose from "mongoose";



const connectDB = async () => {
    try {
      const db  = `${process.env.MONGODB_URI}`
      console.log("...",db)
        const connectionInstance = await mongoose.connect(`${db}`)
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONGODB connection FAILED ", error.message);
        process.exit(1)
    }
}

export default connectDB;