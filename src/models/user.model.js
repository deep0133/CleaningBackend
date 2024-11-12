import mongoose from "mongoose"

export const userSchema = new Schema(
    {
        Name: {
            type: String,
            required: true,

            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowecase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        role: {
            type: String,
            required: true
        },


        address: [
            {
                type: String,
                required: true,
                lowercase: true,
                trim: true
            }
        ],
        

        refreshToken: {
            type: String
        }

    },
    {
        timestamps: true
    }
)


export const User = mongoose.model("User",userSchema);



