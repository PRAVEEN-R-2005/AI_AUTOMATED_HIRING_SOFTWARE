import { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

function AvailableJobs() {

    const [jobs, setJobs] = useState([]);
    const navigate = useNavigate();

    const fetchJobs = async () => {

        try {

            const response = await api.get(

                "/api/job-descriptions/open"

            );

            const data = response.data;
            setTimeout(() => {
                setJobs(data);
            }, 0);

        }

        catch (error) {

            console.warn("Failed to fetch available jobs, using demo data:", error);
            const demoData = [
                {
                    jd_id: 1,
                    title: "AI Engineer (Python)",
                    skills: "Python, PyTorch, LLMs, NLP",
                    experience: "3+ years",
                    salary: "$120,000 - $150,000",
                    location: "Remote",
                    employment_type: "Full-time"
                },
                {
                    jd_id: 2,
                    title: "Frontend Developer",
                    skills: "React, JavaScript, TailwindCSS, HTML",
                    experience: "2+ years",
                    salary: "$80,000 - $100,000",
                    location: "San Francisco, CA",
                    employment_type: "Full-time"
                },
                {
                    jd_id: 3,
                    title: "HR Specialist",
                    skills: "Recruiting, Onboarding, Communication",
                    experience: "1+ years",
                    salary: "$60,000 - $75,000",
                    location: "Remote",
                    employment_type: "Part-time"
                }
            ];
            setTimeout(() => {
                setJobs(demoData);
            }, 0);

        }

    };

    useEffect(() => {

        fetchJobs();

    }, []);




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