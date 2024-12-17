import express from "express";

const cleaningServiceRouter = express.Router();

cleaningServiceRouter.post("/create", createCleaningService);

cleaningServiceRouter.put("/update/:id", updateCleaningService);

cleaningServiceRouter.post("/delete/:id", deleteCleaningService);

export default cleaningServiceRouter;
