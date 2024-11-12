
import { asyncHandler } from "../../utils/asyncHandler.js"
import { ApiError } from "../../utils/apiError.js";
import {ApiResponse} from '../../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'
const registerUser = asyncHandler(async (req, res,User) => {
 
  
    const {name,email,password,address } = req.body
  
  
    if (
        [name,email,password,address].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }
  
    const existedUser = await User.findOne({
       email
    })
  
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
   
   
  
    const user = await User.create({
    name,
    email, 
        password,
      address
    })
  
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    
  
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }
  
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )
  
  } )

  export {registerUser}