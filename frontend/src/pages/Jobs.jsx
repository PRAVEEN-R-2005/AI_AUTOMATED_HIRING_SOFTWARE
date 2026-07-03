
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import {
    FaBriefcase,
    FaMapMarkerAlt,
    FaMoneyBillWave,
    FaUsers
}
from "react-icons/fa";

function Jobs() {
    const navigate = useNavigate();

    const [jobs, setJobs] = useState([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {

        try {

            const response = await api.get(

                "/api/job-descriptions/open"

            );

            setJobs(

                response.data

            );

        }

        catch (error) {

            console.warn("Failed to fetch jobs, using demo data:", error);
            setJobs([
                {
                    jd_id: 1,
                    title: "AI Engineer (Python)",
                    skills: "Python, PyTorch, LLMs, NLP",
                    experience: "3+ years",
                    salary: "$120,000 - $150,000",
                    location: "Remote",
                    description: "We are looking for an AI Engineer to join our team...",
                    status: "Open"
                },
                {
                    jd_id: 2,
                    title: "Frontend Developer",
                    skills: "React, JavaScript, TailwindCSS, HTML",
                    experience: "2+ years",
                    salary: "$80,000 - $100,000",
                    location: "San Francisco, CA",
                    description: "We are seeking a Frontend Developer proficient in React...",
                    status: "Open"
                },
                {
                    jd_id: 3,
                    title: "HR Specialist",
                    skills: "Recruiting, Onboarding, Communication",
                    experience: "1+ years",
                    salary: "$60,000 - $75,000",
                    location: "Remote",
                    description: "Seeking an HR Specialist to manage hiring pipelines...",
                    status: "Open"
                }
            ]);

        }

    };

    const filteredJobs = jobs.filter(

        (job) =>

            job.title?.toLowerCase().includes(search.toLowerCase())

            ||

            job.skills?.toLowerCase().includes(search.toLowerCase())

            ||

            job.location?.toLowerCase().includes(search.toLowerCase())

    );

    return (

        <>

            <Navbar />

            <div className="d-flex">

                <Sidebar />

                <div className="container-fluid p-4">

                    <h2 className="mb-4">

                        Published Jobs

                    </h2>

                    <input

                        className="form-control mb-4"

                        placeholder="Search Job"

                        value={search}

                        onChange={(e) =>

                            setSearch(

                                e.target.value

                            )

                        }

                    />

                    <div className="row">

                        {

                            filteredJobs.map(

                                (job) => (

                                    <div

                                        className="col-md-4 mt-4"

                                        key={job.jd_id}

                                    >

                                        <div

                                            className="card shadow border-0"

                                            style={{

                                                borderRadius: "20px"

                                            }}

                                        >

                                            <div className="card-body">

                                                <h4>

                                                    <FaBriefcase />

                                                    {" "}

                                                    {job.title}

                                                </h4>

                                                <hr />

                                                <h6>

                                                    Skills

                                                </h6>

                                                {

                                                    job.skills

                                                    ?.split(",")

                                                    .map(

                                                        (

                                                            skill,

                                                            index

                                                        ) => (

                                                            <span

                                                                key={index}

                                                                className="badge bg-info me-2 mb-2"

                                                            >

                                                                {skill}

                                                            </span>

                                                        )

                                                    )

                                                }

                                                <p>

                                                    <b>

                                                        Experience :

                                                    </b>

                                                    {" "}

                                                    {job.experience}

                                                </p>

                                                <p>

                                                    <FaMoneyBillWave />

                                                    {" "}

                                                    {job.salary}

                                                </p>

                                                <p>

                                                    <FaMapMarkerAlt />

                                                    {" "}

                                                    {job.location}

                                                </p>

                                                <p>

                                                    <b>

                                                        Description :

                                                    </b>

                                                    {" "}

                                                    {job.description}

                                                </p>

                                                <p>

                                                    <b>

                                                        Status :

                                                    </b>

                                                    <span className="badge bg-success ms-2">

                                                        Open

                                                    </span>

                                                </p>

                                                <div className="progress shadow-sm">

                                                    <div

                                                        className="progress-bar progress-bar-striped progress-bar-animated bg-success"

                                                        style={{

                                                            width: "100%"

                                                        }}

                                                    >

                                                        Active

                                                    </div>

                                                </div>

                                                <br />
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() =>
                                                        navigate("/applications", {
                                                            state: { job },
                                                        })
                                                    }
                                                >
                                                    <FaUsers /> View Candidates
                                                </button>

                                            </div>

                                        </div>

                                    </div>

                                )

                            )

                        }

                    </div>

                </div>

            </div>

        </>

    );

}

export default Jobs;
