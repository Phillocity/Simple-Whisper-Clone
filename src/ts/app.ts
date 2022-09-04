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
const database: string = "userDB";
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
const port: any = process.env.PORT;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.listen(port);
app.locals.lodash = lodash;

const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

/* ---------------------------------------------------------------------------------------------- */
/*                                            Homepage                                            */
/* ---------------------------------------------------------------------------------------------- */
app.get("/", (req: Request, res: Response) => {
  res.render("home");
});

/* ---------------------------------------------------------------------------------------------- */
/*                                              Login                                             */
/* ---------------------------------------------------------------------------------------------- */
app
  .route("/login")
  .get((req: Request, res: Response) => {
    res.render("login");
  })
  .post((req: Request, res: Response) => {
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({ email: username }, (err: any, foundUser: any) => {
      if (err) {
        res.send("User not found, please try again");
      } else {
        if (foundUser) {
          if (foundUser.password === password) {
            res.render("secrets");
          }
        }
      }
    });
  });

/* ---------------------------------------------------------------------------------------------- */
/*                                            Register                                            */
/* ---------------------------------------------------------------------------------------------- */
app
  .route("/register")
  .get((req: Request, res: Response) => {
    res.render("register");
  })
  .post((req: Request, res: Response) => {
    const username = req.body.username;
    const password = req.body.password;
    const newUser = new User({ email: username, password: password });

    newUser.save((err: any) => {
      if (err) {
        console.log(err);
      } else {
        res.render("secrets");
      }
    });
  });
