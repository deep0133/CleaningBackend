import mongoose from "mongoose"

const adminWalletSchema=new mongoose.Schema({
    total:{
        type:Number,
        required:true,
    },
    payementHistory:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'BookingService'
    }
})

const adminWallet=mongoose.model('adminWallet',adminWalletSchema)
module.exports =adminWallet;