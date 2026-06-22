const HR = require("../models/hrModel");


// Top Candidates

const getTopCandidates = (

    req,

    res

)=>{

    HR.getTopCandidates(

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


// Candidate By ID

const getCandidateById = (

    req,

    res

)=>{

    const id = req.params.id;

    HR.getCandidateById(

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


// All Candidates

const getAllCandidates = (

    req,

    res

)=>{

    HR.getAllCandidates(

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


module.exports = {

    getTopCandidates,

    getCandidateById,

    getAllCandidates

};