const multer = require("multer");

const path = require("path");


// Storage Configuration

const storage = multer.diskStorage({

    destination: (

        req,

        file,

        cb

    ) => {

        cb(

            null,

            "uploads/resumes"

        );

    },


    filename: (

        req,

        file,

        cb

    ) => {

        cb(

            null,

            Date.now()

            +

            path.extname(

                file.originalname

            )

        );

    }

});


const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB max size limit
    },
    fileFilter: (req, file, cb) => {
        if (file.fieldname === "resume_file") {
            const fileext = path.extname(file.originalname).toLowerCase();
            if (fileext !== ".pdf" || file.mimetype !== "application/pdf") {
                return cb(new Error("Only PDF resume files are supported!"), false);
            }
        }
        cb(null, true);
    }
});

module.exports = upload;