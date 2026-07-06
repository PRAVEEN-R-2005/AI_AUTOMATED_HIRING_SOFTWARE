const express = require("express");

const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

const {

    getDashboardStats

}

=

require(

    "../controllers/dashboardController"

);


router.get(

    "/stats",

    verifyToken,
    requireRole(["HR", "Admin"]),

    getDashboardStats

);


module.exports = router;