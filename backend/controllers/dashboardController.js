const Dashboard = require("../models/dashboardModel");

const getDashboardStats = (
    req,
    res
) => {
    Dashboard.getDashboardStats(
        req.user.organization_id,
        (err, results) => {

            if (err) {

                return res.status(500).json({

                    message: "Database Error"

                });

            }

            res.status(200).json(

                results[0]

            );

        }

    );

};

module.exports = {

    getDashboardStats

};