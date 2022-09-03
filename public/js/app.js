import express from "express";
import { fileURLToPath } from "url";
import { dirname } from "path";
import bodyParser from "body-parser";
import lodash from "lodash";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const database = "userDB";
const password = process.env.MONGO;
await mongoose
    .connect(`mongodb+srv://shushyy:${password}@cluster0.szrpyuj.mongodb.net/${database}`)
    .then(() => {
    console.log("Connected to database");
})
    .catch((err) => {
    console.log(err);
});
const app = express();
const port = process.env.PORT;
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
app.get("/", (req, res) => {
    res.render("home");
});
app.route("/login")
    .get((req, res) => {
    res.render("login");
})
    .post((req, res) => {
    const username = req.body.username;
    const password = req.body.password;
});
app.get("/register", (req, res) => {
    res.render("register");
});
app.post("/register", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const newUser = new User({ email: username, password: password });
    newUser.save((err) => {
        if (err) {
            console.log(err);
        }
        else {
            res.render("secrets");
        }
    });
});
