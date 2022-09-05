// @ts-nocheck
import express from "express";
import { fileURLToPath } from "url";
import { dirname } from "path";
import bodyParser from "body-parser";
import lodash from "lodash";
import mongoose from "mongoose";
import session from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import findOrCreate from "mongoose-find-or-create";
import dotenv from "dotenv";
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const database = process.env.DATABASE;
const databaseURL = `${process.env.MONGO}${database}`;
await mongoose
    .connect(databaseURL)
    .then(() => console.log("Connected to database"))
    .catch((err) => console.log(err));
const app = express();
const port = process.env.PORT;
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.listen(port);
app.locals.lodash = lodash;
app.use(session({
    secret: "SecretTest",
    resave: false,
    saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());
/* ----------------------------------------- User schema ---------------------------------------- */
const userSchema = new mongoose.Schema({
    username: { type: String },
    password: { type: String },
    googleId: { type: String },
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser((user, cb) => {
    process.nextTick(() => {
        return cb(null, {
            id: user.id,
            username: user.username,
            picture: user.picture
        });
    });
});
passport.deserializeUser((user, cb) => {
    process.nextTick(() => {
        return cb(null, user);
    });
});
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:8080/auth/google/secrets",
}, (accessToken, refreshToken, profile, cb) => {
    User.findOrCreate({ googleId: profile.id }, (err, user) => {
        return cb(err, user);
    });
}));
/* ---------------------------------------------------------------------------------------------- */
/*                                            Homepage                                            */
/* ---------------------------------------------------------------------------------------------- */
app
    .route("/")
    .get((req, res) => {
    if (req.isAuthenticated())
        return res.redirect("/secrets");
    res.render("home");
});
app
    .route("/auth/google")
    .get(passport.authenticate("google", { scope: ["profile"] }));
app.route("/auth/google/secrets")
    .get(passport.authenticate("google", { failureRedirect: "/login" }), (req, res) => {
    res.redirect("/");
});
/* ---------------------------------------------------------------------------------------------- */
/*                                              Login                                             */
/* ---------------------------------------------------------------------------------------------- */
app
    .route("/login")
    .get((req, res) => {
    if (req.isAuthenticated())
        return res.redirect("/secrets");
    res.render("login");
})
    .post((req, res) => {
    const userData = req.body.username;
    const passData = req.body.password;
    if (userData.length === 0 || passData.length === 0) {
        return res.render("login", { error: "Please fill in all fields" });
    }
    const user = new User({
        username: userData,
        password: passData,
    });
    req.login(user, (err) => {
        if (err) {
            console.log(err);
        }
        else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/secrets");
            });
        }
    });
});
/* ---------------------------------------------------------------------------------------------- */
/*                                            Register                                            */
/* ---------------------------------------------------------------------------------------------- */
app
    .route("/register")
    .get((req, res) => {
    res.render("register");
})
    .post((req, res) => {
    User.register(new User({ username: req.body.username }), req.body.password, (err, user) => {
        if (err) {
            console.log(err);
            res.redirect("/register");
        }
        else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/secrets");
            });
        }
    });
});
/* ---------------------------------------------------------------------------------------------- */
/*                                             Secrets                                            */
/* ---------------------------------------------------------------------------------------------- */
app.route("/secrets").get((req, res) => {
    if (req.isAuthenticated()) {
        res.render("secrets");
    }
    else {
        res.redirect("/login");
    }
});
/* ---------------------------------------------------------------------------------------------- */
/*                                             Logout                                             */
/* ---------------------------------------------------------------------------------------------- */
app.route("/logout").get((req, res) => {
    req.logout((err) => {
        if (err) {
            console.log(err);
        }
        else {
            res.redirect("/");
        }
    });
});
