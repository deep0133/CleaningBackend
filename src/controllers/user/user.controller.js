import { User } from "../../models/user.model.js";
import {Cleaner} from '../../models/Cleaner/cleaner.model.js'
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from '../../utils/apiError.js'
import {ApiResponse} from '../../utils/apiResponse.js'
import { sendOtp } from "../../utils/sendOtp.js";


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
    // take data entered by user --done
    //  operate username or email  --done
    // find the user  done
    // password check done
    // generate access and refresh token --done
    // send cookie (token) pass token

    const {phoneNumber,password} = req.body;
  
if(!phoneNumber ){
    throw new ApiError(400,"email or username is required")
}
// check if the user exists or not
const user = await User.findOne({
    $or:[{phoneNumber:phoneNumber}]
});



if(!user){
    throw new ApiError(401,"Invalid user Credentials");
}

if(!password){
    throw new ApiError(401,"password is required")
}

const isPasswordValid =await user.isPasswordCorrect(password);

if(!isPasswordValid){
    throw new ApiError(401,"Invalid user credentials");
}


const {accessToken,refreshToken} = await generateAccessandRefreshTokens(user._id);
console.log("accessToken",accessToken);
console.log("refreshToken",refreshToken);


const loggedInUser = await User.findById(user._id).select("-password -refreshToken")


const options ={
    secure:true,
    httpOnly: true
}


res.
status(200)
.cookie("accessToken",accessToken,options)
.cookie("refreshToken",refreshToken,options)
.json(new ApiResponse(200,
    {
        user:loggedInUser,accessToken,refreshToken

},
"user logged in successfully"
)
)



})

export {register}