import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import {

    FaBriefcase,
    FaCalendarAlt,
    FaClipboardList

}

from "react-icons/fa";

function StudentDashboard() {

    return (

        <>

            <Navbar />

            <div className="d-flex">

                <Sidebar />

                <div className="container-fluid p-4">

                    <h1 className="mb-4">

                        Student Dashboard

                    </h1>


                    <div className="row">

                        {/* Applied Jobs */}

                        <div className="col-md-4">

                            <div className="card shadow border-0 bg-primary text-white">

                                <div className="card-body">

                                    <FaBriefcase

                                        size={40}

                                        className="mb-3"

                                    />

                                    <h5>

                                        Applied Jobs

                                    </h5>

                                    <h1>

                                        3

                                    </h1>

                                </div>

                            </div>

                        </div>


                        {/* Interviews */}

                        <div className="col-md-4">

                            <div className="card shadow border-0 bg-success text-white">

                                <div className="card-body">

                                    <FaCalendarAlt

                                        size={40}

                                        className="mb-3"

                                    />

                                    <h5>

                                        Interviews

                                    </h5>

                                    <h1>

                                        1

                                    </h1>

                                </div>

                            </div>

                        </div>


                        {/* Current Status */}

                        <div className="col-md-4">

                            <div className="card shadow border-0 bg-warning text-dark">

                                <div className="card-body">

                                    <FaClipboardList

                                        size={40}

                                        className="mb-3"

                                    />

                                    <h5>

                                        Current Status

                                    </h5>

                                    <h3>

                                        Shortlisted

                                    </h3>

                                </div>

                            </div>

                        </div>

                    </div>


                    <div className="card shadow mt-5">

                        <div className="card-body">

                            <h3>

                                Welcome Candidate

                            </h3>

                            <hr />

                            <p>

                                Apply for jobs and track your application status.

                            </p>

                            <p>

                                Attend interviews and monitor your progress.

                            </p>

                            <p>

                                Receive notifications for interview schedules and final selection.

                            </p>

                        </div>

                    </div>

                </div>

            </div>

        </>

    );

}

export default StudentDashboard;