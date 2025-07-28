import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

//BEst configurations or middlewares usage
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
 
//routes importing
import userRouter from "./routes/user.routes.js";
app.use("/users",userRouter)// route name and route variable name

//routes declaration, since we have separated routes file, so we don't use app.get
//instead we have to use middleware here and define route methods in user.routes file

export { app };
