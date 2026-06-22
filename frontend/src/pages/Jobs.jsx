
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

            console.log(error);

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
