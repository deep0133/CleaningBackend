import multer from 'multer'

//image storage engine
const storage =multer.diskStorage({
    // Directory to store uploaded images
    destination:"uploads", 
    // Generating a unique filename by appending timestamp to the original filename
    filename:(req,file,cb)=>{
        return cb(null, `${Date.now()}${file.originalname}`)
    }
})
// Configuring multer with the storage engine
export const multerUpload = multer({storage:storage})