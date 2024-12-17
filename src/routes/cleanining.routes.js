import express from "express";
import { multerUpload } from "../utils/multer";

const cleaningServiceRouter = express.Router();

cleaningServiceRouter.post("/create",multerUpload.single('image'),createCleaningService);

cleaningServiceRouter.put("/update/:id",multerUpload.single('image'), updateCleaningService);

cleaningServiceRouter.post("/delete/:id", deleteCleaningService);

export default cleaningServiceRouter;
