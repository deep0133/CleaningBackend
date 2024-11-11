import express from 'express'

import cors from 'cors'
const app = express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    Credential:true
}))

app.use(express.json({limit:"16kb"}));
app.use(express.static("public"));
app.use(express.urlencoded({
    limit:"16kb",
    extended:true
}))


import clientRouter from './routes/client.router.js'

app.use("/api/v1/client",clientRouter);



export {app}