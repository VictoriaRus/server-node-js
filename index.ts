import dotenv from "dotenv";
import express, { Express, Request, Response } from "express";
import cors from "cors";
import { IData, ILogForm, IRegForm, IUserDB } from "./types/users";
import { QueryError } from "mysql2";

dotenv.config();

const app: Express = express();

app.use(express.json());
app.use(cors());

const mysql = require("mysql2");
const connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    database: "users-db",
    password: "weak",
});

app.get('/', function (req: Request, res: Response) {
    res.send("server info");
});

function convertToBoolean(data: IData[], arr: string[]) {
    let result = [...data];
    arr.map((item: string) => {
        result.map((el: any) => {
            el[item] = !!el[item];
        })
    })
    return result;
}

function convertToBooleanUser(data: any, arr: string[]) {
    let object = { ...data };
    arr.map((item: string) => object[item] = !!object[item]);
    return object;
}

app.get("/main", (req: Request, res: Response) => {
    connection.query("SELECT * FROM users", function (err: QueryError | null, data: IData[]) {
        if (err || !data) {
            return res.status(404).send({message: "error get users"});
        }

        const dataBoolean = convertToBoolean(data, ["isDelete", "isBlock", "isCheck"]);
        res.status(200).json(dataBoolean);
    });
});

app.post("/registration", (req: Request, res: Response) => {
    const { name, email, password }: IRegForm = req.body;

    connection.query("SELECT * FROM users", function (err: QueryError | null, data: IUserDB[]) {
        if (err) {
            return res.status(404).send({message: "Error get users"});
        }

        const userDeleted = data.find((user: IUserDB) => {
            return user.email === email && user.isDelete === 1;
        });

        if (userDeleted) {
            return res.status(404).send({message: "You are deleted!"});
        }

        const user = data.find((user: IUserDB) => {
            return user.email === email;
        });

        if (user) {
            return res.status(400).send({message: "User already exists!"});
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

            connection.query(sql, [name, email, password, now, now, "active", 0, 0, 0], function (err: QueryError | null) {
                if (err) {
                    return res.status(400).send({ message: "Error registered!!!" });
                }
            });
            return res.status(200).send({ message: "You have successfully registered" });
        }
    });
});

app.post("/login", (req: Request, res: Response) => {
    const { email, password }: ILogForm = req.body;

    connection.query("SELECT * FROM users", function (err: QueryError | null, data: IUserDB[]) {
        if (err) {
            return res.status(404).send({ message: "error get users" });
        }

        const user = data.find((user: IUserDB) => {
            return user.email === email && user.password === password;
        });

        if (!user) {
            return res.status(404).send({ message: "User Not Found!" });
        }

        const userBlocked = data.find((user: IUserDB) => {
            return user.email === email && user.isBlock === 1;
        });

        if (userBlocked) {
            return res.status(404).send({ message: "You are blocked!" });
        }

        const userDeleted = data.find((user: IUserDB) => {
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
    connection.query(sql, data, function (err: QueryError | null) {
        if (err) {
            return res.status(404).send({ message: "error change date login" });
        }
    });
});

app.put("/main", (req: Request, res: Response) => {
    const arr = ["isDelete", "isBlock"];

    let result = [...req.body];
    arr.map((field: string) => {
        result.map((el: any) => {
            if (el.hasOwnProperty(field)) {
                el[field] ? el[field] = 1 : el[field] = 0;
            }
        })
    })

    const keys = new Set();
    result.map(obj => {
        for (const key in obj) {
            keys.add(key);
        }
    })
    keys.delete("id")
    const key = Array.from(keys)[0] as string;

    const newStatus = (value: boolean) => {
        if (key === "isDelete") return "deleted";
        if (key === "isBlock" && value) return "blocked";
        if (key === "isBlock" && !value) return "active";
    }

    result.map(user => {
        const sql = `UPDATE users SET ${key}=?, status=? WHERE id=?`;
        const data = [user[key], newStatus(user[key]), user.id];

        connection.query(sql, data, function (err: QueryError | null) {
            if (err) {
                return res.status(400).send({ message: "error change status" });
            }
        });
    })

    connection.query("SELECT * FROM users", function (err: QueryError | null, data: IUserDB[]) {
        if (err) {
            return res.status(404).send({ message: "error get users" });
        }
        const dataBool = convertToBoolean(data, ["isDelete", "isBlock", "isCheck"]);
        res.status(200).json(dataBool);
    });

});

const port = process.env.PORT || 8000;

app.listen(port, () => {
    console.log(`App listening on port ${ port }`)
});