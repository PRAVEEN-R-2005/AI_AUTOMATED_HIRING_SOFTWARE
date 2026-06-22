
import { useNavigate } from "react-router-dom";

import {

    FaUserShield,
    FaUserTie,
    FaUserGraduate,
    FaRobot

}

from "react-icons/fa";

function Home() {

    const navigate = useNavigate();

    return (

        <div

            className="container-fluid"

            style={{

                minHeight: "100vh",

                background:

                    "linear-gradient(135deg,#111827,#1F2937,#2563EB)"

            }}

        >

            <div className="container py-5">


                {/* Title */}

                <div className="text-center text-white">

                    <FaRobot

                        size={70}

                        className="mb-3"

                    />

                    <h1 className="fw-bold">

                        AI Hiring Software

                    </h1>

                    <h5 className="text-light">

                        Smart Recruitment Platform

                    </h5>

                    <p>

                        Powered by Artificial Intelligence

                    </p>

                </div>


                {/* Cards */}

                <div className="row mt-5">


                    {/* Admin */}

                    <div className="col-md-4">

                        <div

                            className="card shadow border-0 text-center p-4"

                            style={{

                                borderRadius: "20px",

                                transition: "0.4s"

                            }}

                        >

                            <FaUserShield

                                size={60}

                                className="text-primary mb-3"

                            />

                            <h3>

                                Admin

                            </h3>

                            <hr />

                            <p>

                                Manage Users

                            </p>

                            <p>

                                Manage Candidates

                            </p>

                            <p>

                                View Reports

                            </p>

                        </div>

                    </div>


                    {/* HR */}

                    <div className="col-md-4">

                        <div

                            className="card shadow border-0 text-center p-4"

                            style={{

                                borderRadius: "20px"

                            }}

                        >

                            <FaUserTie

                                size={60}

                                className="text-success mb-3"

                            />

                            <h3>

                                HR

                            </h3>

                            <hr />

                            <p>

                                Post Jobs

                            </p>

                            <p>

                                Shortlist Candidates

                            </p>

                            <p>

                                Schedule Interviews

                            </p>

                        </div>

                    </div>


                    {/* Candidate */}

                    <div className="col-md-4">

                        <div

                            className="card shadow border-0 text-center p-4"

                            style={{

                                borderRadius: "20px"

                            }}

                        >

                            <FaUserGraduate

                                size={60}

                                className="text-warning mb-3"

                            />

                            <h3>

                                Candidate

                            </h3>

                            <hr />

                            <p>

                                Apply Jobs

                            </p>

                            <p>

                                Upload Resume

                            </p>

                            <p>

                                Track Status

                            </p>

                        </div>

                    </div>

                </div>


                {/* Button */}

                <div className="text-center mt-5">

                    <button

                        className="btn btn-lg btn-light px-5"

                        onClick={() =>

                            navigate("/login")

                        }

                    >

                        Continue →

                    </button>

                </div>

            </div>

        </div>

    );

}

export default Home;
