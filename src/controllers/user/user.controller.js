import { User } from "../../models/user.model.js";
import {Cleaner} from '../../models/Cleaner/cleaner.model.js'
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from '../../utils/apiError.js'
import {ApiResponse} from '../../utils/apiResponse.js'
import { sendOtp } from "../../utils/sendOtp.js";
import Api from "twilio/lib/rest/Api.js";


const register = asyncHandler(async (req, res) => {
    // take name email password , address , role ,phone number from the user
    //check validations
    // check user already exists or not
    // before saving hash the password
    // generate access and refresh token also 
    //create user object to save data in db
    // check user created or not
    // send response 
    const { name, email, password, address, role,phoneNumber,category } = req.body;
    console.log(req.body);


    if (
        [name, email, password, role, phoneNumber].some(
            (field) => typeof field !== 'string' || field.trim() === ""
        ) ||
        !Array.isArray(address) || address.length === 0
    ) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{phoneNumber},{ email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with this  email  already exists")
    }
    if (role === 'cleaner' && (!Array.isArray(category) || category.length === 0)) {
        throw new ApiError(400, "Category field is required for cleaners");
    }


    
    

    const user = await User.create({
        name,
        email,
        password,
        role,
        address,
        phoneNumber,
    })

    if (role === 'cleaner') {
        await Cleaner.create({
            user: user._id, // Reference to the User
            category,
        });
    }


    
       const accessToken =  user.generateAccessToken();
       const refreshToken = user.generateRefreshToken();

       user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    

    if (!Array.isArray(category) || category.length === 0) {
        throw new ApiError(400, "Category is required for serviceMan");
    }
    

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

const login =  asyncHandler( async (req,res)=>{
// take number and password from the user
// send otp to the user at his number and save the otp to the database 
// take otp from the user  and validate it from the database

    const {phoneNumber,password} = req.body;
  
if(!phoneNumber ){
    throw new ApiError(400,"email or username is required")
};
// check if the user exists or not

const user = await User.findOne({
    $or:[{phoneNumber:phoneNumber}]
});

if(!user){
    throw new ApiError(401,"user does not exist");
};

if(!password){
    throw new ApiError(401,"password is required")
};

const isPasswordValid =await user.isPasswordCorrect(password);

if(!isPasswordValid){
    throw new ApiError(401,"Invalid user credentials");
};


// const {accessToken,refreshToken} = await generateAccessandRefreshTokens(user._id);
// console.log("accessToken",accessToken);
// console.log("refreshToken",refreshToken);


const loggingInfo = await User.findById(user._id).select("-password ");



res.
status(200)
.json(new ApiResponse(200,
    {
        user:loggingInfo

},
"user info is correct do further verification"
)
)
})

const otpVerification = asyncHandler(async(req,res)=>{
const opt = req.body;

if(!otp){
    ApiError(400,'otp is required');
}

})

export {register}