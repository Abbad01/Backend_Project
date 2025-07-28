import { v2 as cloudinary } from 'cloudinary';
import { log } from 'console';
import fs from "fs"


const uploadOnCloudinary=async(localFilePath)=>{
   try {
     if(!localFilePath) return null;

     //else upload file 
     const response= await cloudinary.uploader.upload(localFilePath,{resource_type:'auto'});
     console.log("file successfully uploaded",response.url);
     return response;

     

   } catch (error) {
    //remove the temporary saved file from server as uploading failed.
     fs.unlinkSync(localFilePath)
     return null
   }



}


export {uploadOnCloudinary}