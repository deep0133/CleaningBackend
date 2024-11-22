import { User } from "../../models/user.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from '../../utils/apiError.js'
import {ApiResponse} from '../../utils/apiResponse.js'



const registerUser = asyncHandler(async (req, res) => {
    // take name email password , address , role ,phone number from the user
    //check validations
    // check user already exists or not
    // before saving hash the password
    // generate access and refresh token also 
    //create user object to save data in db
    // check user created or not
    // send response 
    const { name, email, password, address, role,phoneNumber } = req.body;
    console.log(req.body);


    if (
        [name, email, password, role, phoneNumber].some(
            (field) => typeof field !== 'string' || field.trim() === ""
        ) ||
        !Array.isArray(address) || address.length === 0
    ) {
        throw new ApiError(400, "All fields are required");
    }``

    const existedUser = await User.findOne({
        $or: [{phoneNumber},{ email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with this  email  already exists")
    }


    



    const user = await User.create({
        name,
        email,
        password,
        role,
        address,
        phoneNumber,
    })
    
       const accessToken =  user.generateAccessToken();
       const refreshToken = user.generateRefreshToken();

       user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });


    const options ={
        secure:true,
        httpOnly: true
    }



    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
     

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    // return res.status(201).json(
    //     new ApiResponse(200, createdUser, "User registered Successfully")
    // )

    res.
status(200)
.cookie("accessToken",accessToken,options)
.cookie("refreshToken",refreshToken,options)
.json(new ApiResponse(200,
    {
     createdUser,accessToken,refreshToken

},
"user registered successfully"
)
)

})

export {registerUser}