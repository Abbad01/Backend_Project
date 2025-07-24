 import mongoose from "mongoose";
// import {DB_NAME} from './constants'
/*
import express from "express";
const app=express();


;(async()=>{          //IIFE
       try{
          await mongoose.connect('${process.env.MONGODB_URI}/${DB_NAME}')
          app.on("error", (error)=>{
            console.log("Error",error);
            throw error;
          })

           app.listen(process.env.PORT,()=>{
            console.log(`App is lstening on port ${process.env.PORT}`);
           })

       }catch(e){
        console.log(e);
         throw e
       }



})()     */ //first approach

//second approach in index file of db folder


// require ('dotenv').config({path:'./env'})  //from documentation
import dotenv from "dotenv";
import connectDB from "./db/index.js";
dotenv.config({
    path:'./env'
})



connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`server is running at :${process.env.PORT}`);
        
    })
})
.catch((er)=>{
    console.log( "MONGOdb connecTION failed", er);
    
})

