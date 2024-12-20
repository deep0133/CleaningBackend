import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/apiResponse";
import { ApiError } from "../../utils/apiError";
import User from "../../models/user.model.js"




export const updateProfile = asyncHandler(async (req, res) => {
  const _id = req.user.id; 
  const { name, phoneNumber, email } = req.body;

 
    const user = await User.findById({_id});

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (name) user.name = name;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (email) user.email = email;

    
 await user.save();

 const updatedUser  = await user.findById({_id}).select("-password -refershToken -accessToken")


            


    res.status(200)
    .json( new ApiResponse(200,updatedUser,"user Updated successfully",true))
  
});

export const updatedAddress = asyncHandler(async (req, res) => {
  const userId = req.user.id; 
  const { address } = req.body;


   
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

 
    user.address = address;


    const updatedUser = await user.save();


    res.status(200)
    .json( new ApiResponse(200,updatedUser,"user Address updated successfully",true))
 
});

export const updateStatus = asyncHandler(async(req,res)=>{
  const _id = req.user.id; 
  const user = await User.findById({_id});

  
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  
  user.isActive = false;
  const updatedUser = await user.save();
       
     res.status(200)
     .json(new ApiResponse(200,userStatus,"user is blocked",true))

})


