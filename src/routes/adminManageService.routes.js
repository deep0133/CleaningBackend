import express from "express";
import  multerUpload  from "../utils/multer.js";

import { createCleaningService,deleteCleaningService,updateCleaningService,getCleaningServices,} from "../controllers/cleaner/cleaning.controllers.js";

const manageServiceRouter = express.Router();

manageServiceRouter.post("/create",multerUpload.single('image'),createCleaningService);
manageServiceRouter.get("/list-srvices",getCleaningServices);

manageServiceRouter.put("/update/:id",multerUpload.single('image'), updateCleaningService);

manageServiceRouter.post("/delete/:id", deleteCleaningService); 

export default manageServiceRouter;
