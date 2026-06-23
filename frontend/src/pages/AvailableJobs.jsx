import { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

function AvailableJobs() {

    const [jobs, setJobs] = useState([]);

    const navigate = useNavigate();

    useEffect(() => {

        fetchJobs();

    }, []);


    const fetchJobs = async () => {

        try {


            const response = await api.get(

                "/api/job-descriptions/open"

            );

            setJobs(response.data);

        }

        catch (error) {

            console.log(error);

        }

    };


    return (

        <>

            <Navbar />

            <div className="d-flex">

                <Sidebar />

                <div className="container-fluid p-4">

                    <h2>

                        Available Jobs

                    </h2>


                    <div className="row mt-4">
                        {jobs.map((job) => (
                            <div className="col-md-4 mt-4" key={job.jd_id}>
                                <div className="card shadow border-0" style={{ borderRadius: "20px" }}>
                                    <div className="card-body">
                                        <h3 className="text-primary">{job.title}</h3>
                                        <hr />
                                        <h6>Skills</h6>
                                        {job.skills?.split(",").map((skill, index) => (
                                            <span key={index} className="badge bg-info me-2 mb-2">{skill}</span>
                                        ))}
                                        <p><b>Experience :</b> {job.experience}</p>
                                        <p><b>Salary :</b> {job.salary}</p>
                                        <p><b>Location :</b> {job.location}</p>
                                        <button className="btn btn-primary mt-3" onClick={() => { localStorage.setItem("selectedJob", JSON.stringify(job)); navigate("/apply-job", { state: { job } }); }}>Apply Now</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>

            </div>

        </>

    );

}

export default AvailableJobs;