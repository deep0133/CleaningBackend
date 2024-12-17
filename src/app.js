import express from 'express'

import cors from 'cors'
const app = express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    Credential:true
}))

app.use(express.json());

app.use(express.urlencoded({
    limit:"16kb",
    extended:true
}))

import userRouter from './routes/user.router.js'
import otp from './routes/otp.router.js'

app.use("/api/v1/users",userRouter);
app.use("/api/v1/otp",otp)





export {app}