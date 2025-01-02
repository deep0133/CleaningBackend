import { Cleaner } from "../../../models/Cleaner/cleaner.model";
import { asyncHandler } from "../../../utils/asyncHandler";

const verifyCleaner = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const cleaner = await Cleaner.findByIdAndUpdate(id, {
    verifyByAdmin: true,
  });
  res.status(200).json({ success: true, cleaner });
});

export { verifyCleaner };
