
const JobDescription = require(

    "../models/jobDescriptionModel"

);


// ======================================
// CREATE JD
// ======================================

const createJD = (

    req,

    res

) => {

    const {

        title,
        skills,
        experience,
        salary,
        location,
        description,
        created_by

    }

    = req.body;


    JobDescription.createJD(

        title,
        skills,
        experience,
        salary,
        location,
        description,
        created_by,

        (err, result) => {

            if (err) {

                return res.status(500).json({

                    message:

                    "Database Error"

                });

            }

            res.status(201).json({

                message:

                "Job Description Created Successfully"

            });

        }

    );

};


// ======================================
// GET ALL JD
// ======================================

const getAllJD = (

    req,

    res

) => {

    JobDescription.getAllJD(

        (err, results) => {

            if (err) {

                return res.status(500).json({

                    message:

                    "Database Error"

                });

            }

            res.status(200).json(

                results

            );

        }

    );

};


// ======================================
// UPDATE JD
// ======================================

const updateJD = (

    req,

    res

) => {

    const id = req.params.id;

    const {

        title,
        skills,
        experience,
        salary,
        location,
        description

    }

    = req.body;


    JobDescription.updateJD(

        id,

        title,
        skills,
        experience,
        salary,
        location,
        description,

        (err, result) => {

            if (err) {

                return res.status(500).json({

                    message:

                    "Update Failed"

                });

            }

            res.status(200).json({

                message:

                "Job Description Updated"

            });

        }

    );

};


// ======================================
// DELETE JD
// ======================================

const deleteJD = (

    req,

    res

) => {

    const id = req.params.id;


    JobDescription.deleteJD(

        id,

        (err, result) => {

            if (err) {

                return res.status(500).json({

                    message:

                    "Delete Failed"

                });

            }

            res.status(200).json({

                message:

                "Job Description Deleted"

            });

        }

    );

};
const publishJD=(req,res)=>{

    const id=req.params.id;

    JobDescription.publishJD(

        id,

        (err,result)=>{

            if(err){

                return res.status(500).json({

                    message:"Publish Failed"

                });

            }

            res.status(200).json({

                message:"Published"

            });

        }

    );

};



const closeJD=(req,res)=>{

    const id=req.params.id;

    JobDescription.closeJD(

        id,

        (err,result)=>{

            if(err){

                return res.status(500).json({

                    message:"Close Failed"

                });

            }

            res.status(200).json({

                message:"Closed"

            });

        }

    );

};
const getOpenJD = (

    req,

    res

)=>{

    JobDescription.getOpenJD(

        (err,results)=>{

            if(err){

                return res.status(500).json({

                    message:"Database Error"

                });

            }

            res.status(200).json(

                results

            );

        }

    );

};
module.exports = {

    createJD,

    getAllJD,

    updateJD,

    deleteJD,

    publishJD,

    closeJD,
    getOpenJD

};
