import mongoose, {model, Schema} from "mongoose";

const UserSchema = new Schema({
    name: {
        type: String, 
        required: true,
    }, 
    username: {
        type: String, 
        required: true, 
        unique: true,
    }, 
    password: {
        type: String,
        required: true,
    }, 
    token: {
        type: String, 
    },
});

const UserModel = new model("User", UserSchema);

export {UserModel};