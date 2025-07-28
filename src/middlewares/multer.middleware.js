import multer from 'multer'; 

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/temp')
  },
  filename: function (req, file, cb) {
    
    cb(null, file.originalname)// jis naam se ayegi file usi naam se save 
  }
})

export const upload = multer({ storage: storage })