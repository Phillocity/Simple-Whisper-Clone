import mongoose from "mongoose";
import dotenv from "dotenv";
import { faker } from '@faker-js/faker';
dotenv.config();
const database = process.env.DATABASE;
const databaseURL = `${process.env.MONGO}${database}`;
await mongoose
    .connect(databaseURL)
    .then(() => console.log("Connected to database"))
    .catch((err) => console.log(err));
const userSchema = new mongoose.Schema({
    username: { type: String },
    password: { type: String },
    googleId: { type: String },
    facebookId: { type: String },
    secret: { type: String },
});
const User = mongoose.model("User", userSchema);
const userStorage = [];
for (let index = 0; index < 5; index++) {
    User.create({ username: faker.internet.userName(), password: faker.internet.password(), secret: faker.hacker.phrase() });
}
