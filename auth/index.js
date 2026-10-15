import dotenv from 'dotenv'
dotenv.config();

import express from 'express'
import authRouter from './routes/auth.routes.js';

const app = express();
app.use(express.json());

const port = process.env.PORT || 8000 ;

//************ROUTES********** */
app.use('/api/auth' , authRouter)


//error handler 
app.use((err, req, res, next) => {
    console.error("EXPRESS ERROR:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
});

process.on("unhandledRejection", (r) => console.error("UNHANDLED:", r));
process.on("uncaughtException", (e) => console.error("UNCAUGHT:", e));

app.listen(port , () => {
    console.log("server started")
})


