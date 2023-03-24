"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
const mysql = require("mysql2");
const connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    database: "users-db",
    password: "weak",
});
app.get('/', function (req, res) {
    res.send("server info");
});
function convertToBoolean(data, arr) {
    let result = [...data];
    arr.map((item) => {
        result.map((el) => {
            el[item] = !!el[item];
        });
    });
    return result;
}
function convertToBooleanUser(data, arr) {
    let object = Object.assign({}, data);
    arr.map((item) => object[item] = !!object[item]);
    return object;
}
app.get("/main", (req, res) => {
    connection.query("SELECT * FROM users", function (err, data) {
        if (err || !data) {
            return res.status(404).send({ message: "error get users" });
        }
        const dataBoolean = convertToBoolean(data, ["isDelete", "isBlock", "isCheck"]);
        res.status(200).json(dataBoolean);
    });
});
app.post("/registration", (req, res) => {
    const { name, email, password } = req.body;
    connection.query("SELECT * FROM users", function (err, data) {
        if (err) {
            return res.status(404).send({ message: "Error get users" });
        }
        const userDeleted = data.find((user) => {
            return user.email === email && user.isDelete === 1;
        });
        if (userDeleted) {
            return res.status(404).send({ message: "You are deleted!" });
        }
        const user = data.find((user) => {
            return user.email === email;
        });
        if (user) {
            return res.status(400).send({ message: "User already exists!" });
        }
        if (!user) {
            const today = new Date();
            const now = today.toLocaleString();
            const sql = `INSERT INTO users
             (
                name, email,password, dateRegistration, lastLoginDate, status, isDelete, isBlock, isCheck
             ) VALUES 
             (
                ?,?,?,?,?,?,?,?,?
             ) `;
            connection.query(sql, [name, email, password, now, now, "active", 0, 0, 0], function (err) {
                if (err) {
                    return res.status(400).send({ message: "Error registered!!!" });
                }
            });
            return res.status(200).send({ message: "You have successfully registered" });
        }
    });
});
app.post("/login", (req, res) => {
    const { email, password } = req.body;
    connection.query("SELECT * FROM users", function (err, data) {
        if (err) {
            return res.status(404).send({ message: "error get users" });
        }
        const user = data.find((user) => {
            return user.email === email && user.password === password;
        });
        if (!user) {
            return res.status(404).send({ message: "User Not Found!" });
        }
        const userBlocked = data.find((user) => {
            return user.email === email && user.isBlock === 1;
        });
        if (userBlocked) {
            return res.status(404).send({ message: "You are blocked!" });
        }
        const userDeleted = data.find((user) => {
            return user.email === email && user.isDelete === 1;
        });
        if (userDeleted) {
            return res.status(404).send({ message: "You are deleted!" });
        }
        const userBool = convertToBooleanUser(user, ["isDelete", "isBlock", "isCheck"]);
        return res.status(200).json(userBool);
    });
    const today = new Date();
    const now = today.toLocaleString();
    const sql = `UPDATE users SET lastLoginDate=? WHERE email=?`;
    const data = [now, email];
    connection.query(sql, data, function (err) {
        if (err) {
            return res.status(404).send({ message: "error change date login" });
        }
    });
});
app.put("/main", (req, res) => {
    const arr = ["isDelete", "isBlock"];
    let result = [...req.body];
    arr.map((field) => {
        result.map((el) => {
            if (el.hasOwnProperty(field)) {
                el[field] ? el[field] = 1 : el[field] = 0;
            }
        });
    });
    const keys = new Set();
    result.map(obj => {
        for (const key in obj) {
            keys.add(key);
        }
    });
    keys.delete("id");
    const key = Array.from(keys)[0];
    const newStatus = (value) => {
        if (key === "isDelete")
            return "deleted";
        if (key === "isBlock" && value)
            return "blocked";
        if (key === "isBlock" && !value)
            return "active";
    };
    result.map(user => {
        const sql = `UPDATE users SET ${key}=?, status=? WHERE id=?`;
        const data = [user[key], newStatus(user[key]), user.id];
        connection.query(sql, data, function (err) {
            if (err) {
                return res.status(400).send({ message: "error change status" });
            }
        });
    });
    connection.query("SELECT * FROM users", function (err, data) {
        if (err) {
            return res.status(404).send({ message: "error get users" });
        }
        const dataBool = convertToBoolean(data, ["isDelete", "isBlock", "isCheck"]);
        res.status(200).json(dataBool);
    });
});
const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});
