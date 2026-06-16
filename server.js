const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
}); 

db.connect((err) => {
    if (err) {
        console.log("Database Error:");
        console.log(err);
        return;
    }

    console.log("MySQL Connected");
});


app.post("/register", async (req, res) => {

    const { fullname, email, password } = req.body;

    try {

        const [rows] = await db
            .promise()
            .query(
                "SELECT * FROM users WHERE email=?",
                [email]
            );

        if (rows.length > 0) {
            return res.status(400).json({
                message: "Email already registered"
            });
        }

        const hashedPassword =
            await bcrypt.hash(password, 10);

        await db
            .promise()
            .query(
                "INSERT INTO users(fullname,email,password) VALUES (?,?,?)",
                [fullname, email, hashedPassword]
            );

        res.json({
            message: "Registration Successful"
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Server Error"
        });
    }
});

app.post("/login", async (req, res) => {

    const { email, password } = req.body;

    try {

        const [rows] = await db
            .promise()
            .query(
                "SELECT * FROM users WHERE email=?",
                [email]
            );

        if (rows.length === 0) {
            return res.status(400).json({
                message: "Invalid Email"
            });
        }

        const user = rows[0];

        const valid =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!valid) {
            return res.status(400).json({
                message: "Invalid Password"
            });
        }

        res.json({
            message: "Login Successful",
            user: {
                id: user.id,
                fullname: user.fullname,
                email: user.email
            }
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Server Error"
        });
    }
});



app.get("/users", async (req, res) => {

    try {

        const [rows] =
            await db.promise().query(
                "SELECT id, fullname, email FROM users"
            );

        res.json(rows);

    } catch (error) {

        res.status(500).json({
            message: "Server Error"
        });
    }
});


app.listen(process.env.PORT, () => {
    console.log(
        `Server Running on Port ${process.env.PORT}`
    );
});



//http://localhost:5000/users  - for database view 
