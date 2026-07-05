import mongoose, {Schema, model} from "mongoose";

const MeetingSchema = new Schema({
    user_id: {
        type: String, 
    }, 
    meeting_code: {
        type: String, 
        required: true, 
    },
    date: {
        type: Date,
        default: Date.now,
        required: true,
    },
});

const MeetingModel = new model("Meetings", MeetingSchema);

export default MeetingModel;