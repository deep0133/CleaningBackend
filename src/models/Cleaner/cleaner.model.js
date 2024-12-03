import mongoose from "mongoose";
import { Schema } from "mongoose";

const cleaner = new Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true
        },
        category: [
            {
                type: String,
                required: true
            }
        ],
        otp:{
            type:String,
        }

    },
    {
        timestamps: true
    }
);



export const Cleaner = mongoose.model('cleaner', cleaner);
