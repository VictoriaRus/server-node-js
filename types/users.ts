export interface IUser {
    id: number;
    name: string;
    email: string;
    dateRegistration: string
    lastLoginDate: string;
    status: string;
    isDelete: boolean;
    isBlock: boolean;
    isCheck: boolean;
}

export interface IUserDB {
    id: number;
    name: string;
    email: string;
    password: string;
    dateRegistration: string
    lastLoginDate: string;
    status: string;
    isDelete: number;
    isBlock: number;
    isCheck: number;
}

export interface IData {
    id: number;
    name: string;
    email: string;
    dateRegistration: string
    lastLoginDate: string;
    status: string;
    isDelete: number;
    isBlock: number;
    isCheck: number;
}

export interface IRegForm {
    name: string;
    email: string;
    password: string;
}

export interface ILogForm {
    email: string;
    password: string;
}

