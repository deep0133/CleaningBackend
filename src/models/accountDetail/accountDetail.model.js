import mongoose from "mongoose";

const accountDetailSchema = mongoose.Schema(
  {
    accountNumber: {
      type: String,
    },
    accountName: {
      type: String,
    },
    bankName: {
      type: String,
    },
    accountType: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const AccountDetail = mongoose.model("AccountDetail", accountDetailSchema);

export default AccountDetail;
