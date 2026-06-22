const multer = require("multer");
const fs = require("fs");

// Create folder automatically if it doesn't exist
if (!fs.existsSync("uploads/resumes")) {
    fs.mkdirSync("uploads/resumes", { recursive: true });
}

const storage = multer.diskStorage({

    destination: function (req, file, cb) {

        cb(null, "uploads/resumes");

    },

    filename: function (req, file, cb) {

        cb(null, Date.now() + "-" + file.originalname);

    }

});

const upload = multer({
    storage: storage
});

module.exports = upload;