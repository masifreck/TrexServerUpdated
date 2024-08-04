const express = require('express')
const colors=require('colors')
const morgan=require('morgan')
const dotenv=require('dotenv')
const mysqlPool = require('./config/db')
const VendorRouter = require('./`routes/vendor_routes')
const otplessRouter=require('./routes/otplessRoutes')
const cors=require('cors')
const errorMiddleware=require('./middleware/Error')
const logoutRoutes=require('./`routes/vendor_routes')

dotenv.config()
//rest object
const app=express() 

////middleware
app.use(cors());
app.use(express.json())
app.use(morgan("dev"))

app.use(errorMiddleware)
//routes

app.use('/api/v1/vendor',VendorRouter)
app.use('/api',logoutRoutes)
app.use('/api/v1/otpless', otplessRouter);
app.get('/',(req,res)=>{
    res.status(200).send('<h1>Trex Application Server Running successfull</h1>')
})

//port
const PORT=process.env.PORT || 8000

//conditionally listen
mysqlPool.query('SELECT 1').then(()=>{
    //my sql connection
    console.log('my sql connected'.bgGreen.white)
    app.listen(PORT,()=>{
        console.log(`server is runing ${PORT}`.bgMagenta.white)
    })
}).catch((error)=>{
    console.log(error)
})

//listen
