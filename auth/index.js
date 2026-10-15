import dotenv from 'dotenv'
dotenv.config();

import express from 'express'
import authRouter from './routes/auth.routes.js';

const app = express();
app.use(express.json());

const port = process.env.PORT || 8000 ;

//************ROUTES********** */
app.use('/api/auth' , authRouter)

app.listen(port , () => {
    console.log("server started")
})


