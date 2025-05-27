import express from 'express'
import mongoose from 'mongoose'
import 'dotenv/config'
import cors from 'cors'
const { PORT, URI_MG, VITE_URL } = process.env
import cookieParser from 'cookie-parser';
import { router } from './src/routes/index.js'

const app = express()

app.use(express.json())

app.use(cors({
    origin: [VITE_URL],
    credentials: true
}));
app.use(cookieParser());

mongoose.connect(URI_MG).then(() => {
    console.log("Connect MongoDB is successfully!")
})

router(app)

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`)
})
