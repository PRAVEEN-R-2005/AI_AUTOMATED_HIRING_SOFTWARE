const Candidate = require("../models/candidateModel");

const addCandidate = (

    req,
    res

)=>{

    const {

        name,
        email

    } = req.body;

    const resume = req.file.filename;

    Candidate.addCandidate(

        name,
        email,
        resume,

        (err,result)=>{

            if(err){

                return res.status(500).json({

                    message:"Upload Failed"

                });

            }

            res.status(201).json({

                message:"Candidate Added Successfully"

            });

        }

    );

};
const getAllCandidates = (

    req,

    res

)=>{

    Candidate.getAllCandidates(

        (err,results)=>{

            if(err){

                return res.status(500).json({

                    message:"Error Fetching Candidates"

                });

            }

            res.status(200).json(results);

        }

    );

};
const getCandidateById = (

    req,

    res

)=>{

    const id = req.params.id;

    Candidate.getCandidateById(

        id,

        (err,results)=>{

            if(err){

                return res.status(500).json({

                    message:"Error"

                });

            }

            res.status(200).json(results);

        }

    );

};
const updateCandidate = (

    req,

    res

)=>{

    const id = req.params.id;

    const {

        name,

        email

    } = req.body;

    Candidate.updateCandidate(

        id,

        name,

        email,

        (err,result)=>{

            if(err){

                return res.status(500).json({

                    message:"Update Failed"

                });

            }

            res.status(200).json({

                message:"Candidate Updated Successfully"

            });

        }

    );

};
const deleteCandidate = (

    req,

    res

)=>{

    const id = req.params.id;

    Candidate.deleteCandidate(

        id,

        (err,result)=>{

            if(err){

                return res.status(500).json({

                    message:"Delete Failed"

                });

            }

            res.status(200).json({

                message:"Candidate Deleted Successfully"

            });

        }

    );

};
module.exports = {

    addCandidate,

    getAllCandidates,

    getCandidateById,

    updateCandidate,

    deleteCandidate

};