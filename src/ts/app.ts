// @ts-nocheck
import express, { Request, Response } from "express";
import { fileURLToPath } from "url";
import { dirname, join as pathJoin } from "path";
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

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = dirname(__filename);
const database: any = process.env.DATABASE;
const databaseURL: any = `${process.env.MONGO}${database}`;

await mongoose
  .connect(databaseURL)
  .then(() => console.log("Connected to database"))
  .catch((err) => console.log(err));

const app: express.Application = express();
const port: any = process.env.PORT;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.listen(port);
app.locals.lodash = lodash;

app.use(
  session({
    secret: "SecretTest",
    resave: false,
    saveUninitialized: false,
  })
);
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

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:8080/auth/google/secrets",
    },
    (accessToken: any, refreshToken: any, profile: any, cb: any) => {
      User.findOrCreate({ googleId: profile.id }, (err: any, user: any) => {
        return cb(err, user);
      });
    }
  )
);

/* ---------------------------------------------------------------------------------------------- */
/*                                            Homepage                                            */
/* ---------------------------------------------------------------------------------------------- */
app
  .route("/")
  .get((req: Request, res: Response) => {
    if (req.isAuthenticated()) return res.redirect("/secrets");
    res.render("home");
  });

app
  .route("/auth/google")
  .get(passport.authenticate("google", { scope: ["profile"] }));

app.route("/auth/google/secrets")
  .get(passport.authenticate("google", { failureRedirect: "/login" }),
  (req: Request, res: Response) => {
    res.redirect("/");
  });


/* ---------------------------------------------------------------------------------------------- */
/*                                              Login                                             */
/* ---------------------------------------------------------------------------------------------- */
app
  .route("/login")
  .get((req: Request, res: Response) => {
    if (req.isAuthenticated()) return res.redirect("/secrets");
    res.render("login");
  })
  .post((req: Request, res: Response) => {
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
      } else {
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
  .get((req: Request, res: Response) => {
    res.render("register");
  })
  .post((req: Request, res: Response) => {
    User.register(
      new User({ username: req.body.username }),
      req.body.password,
      (err, user) => {
        if (err) {
          console.log(err);
          res.redirect("/register");
        } else {
          passport.authenticate("local")(req, res, () => {
            res.redirect("/secrets");
          });
        }
      }
    );
  });

/* ---------------------------------------------------------------------------------------------- */
/*                                             Secrets                                            */
/* ---------------------------------------------------------------------------------------------- */
app.route("/secrets").get((req: Request, res: Response) => {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

/* ---------------------------------------------------------------------------------------------- */
/*                                             Logout                                             */
/* ---------------------------------------------------------------------------------------------- */
app.route("/logout").get((req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/");
    }
  });
});
