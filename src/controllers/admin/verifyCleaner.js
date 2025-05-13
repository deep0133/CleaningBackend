import { Cleaner } from "../../models/Cleaner/cleaner.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const verifyCleaner = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const cleaner = await Cleaner.findByIdAndUpdate(id, {
    verifyByAdmin: true,
  });
  res.status(200).json({ success: true, cleaner });
});

export { verifyCleaner };
