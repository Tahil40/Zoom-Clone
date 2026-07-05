import { UserModel } from "../models/user.model";
import httpStatus from "http-status";
import bcrypt from "bcrypt";
import crypto from crypto;

const login_user = async (req, res) => {
    const {username, password} = req.body;
    if(!username || !password){
        res.status(httpStatus.BAD_REQUEST).json({message: "All Credentials are Required"});  
    };
    try{
        const is_user_exist = await UserModel.findOne({username});
        if(!is_user_exist){
            res.status(httpStatus.NOT_FOUND).json({message: "The User Does Not Exists"});
        };
        const is_password_matched = bcrypt.compare(password, is_user_exist.password);
        if(!is_password_matched){
            res.status(httpStatus.NOT_ACCEPTABLE).json({message: "Invalid Password"});
        };
        // generate token....
        const generate_token = crypto.randomBytes(20).toString("hex");
        is_user_exist.token = generate_token;
        await is_user_exist.save();
        
        return res.status(httpStatus.OK).json({message:"Login Successfull"});
    }catch(error){
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message: "Server Error"});
    };
};

const register_user = async (req, res) => {
    const {name, username, password} = req.body;
    if(!name || !username || !password){
        res.status(httpStatus.BAD_REQUEST).json({message: "All Credentials are Required"});
    };
    try{
        const user_exists = await UserModel.findOne({username});
        if(user_exists){
            return res.status(httpStatus.FOUND).json({message:"user already exists"});
        }
        const hashed_password = await bcrypt.hash(password, 10);
        const UserDocument = new UserModel({
            name: name, 
            username: username, 
            password: password,
        });
        await UserDocument.save();
        
        return res.status(httpStatus.CREATED).json({message:"user successfully registered"}); 
    }catch (error){
        // console.log(error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message: "Server Error"});
    };
};

export {login_user, register_user};