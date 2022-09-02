import express, { Request, Response } from "express";
import { fileURLToPath } from "url";
import { dirname, join as pathJoin } from "path";
import bodyParser from "body-parser";
import lodash from "lodash";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = dirname(__filename);
const database: string = "";
const password: any = process.env.MONGO;


await mongoose
  .connect(
    `mongodb+srv://shushyy:${password}@cluster0.szrpyuj.mongodb.net/${database}`
  )
  .then(() => {
    console.log("Connected to database");
  })
  .catch((err) => {
    console.log(err);
  });

const app: express.Application = express();
const port: any = process.env.PORT || 8080

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.listen(port);
app.locals.lodash = lodash;

const placeholderleSchema = new mongoose.Schema({
  title: {
    require: true,
    type: String,
  },
  body: String,
});

const Model = mongoose.model("Model", placeholderleSchema);

app.get("/", (req: Request, res: Response) => {
  res.render("home");
});
