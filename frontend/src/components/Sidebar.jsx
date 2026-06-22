
import { Link } from "react-router-dom";
import { FaTachometerAlt, FaClipboardList, FaBriefcase, FaFileAlt, FaRobot, FaCalendarAlt, FaTrophy, FaUserGraduate } from "react-icons/fa";

function Sidebar() {

    const role = localStorage.getItem(

        "role"

    );

    return (

        <div

            style={{

                width: "250px",
                minHeight: "100vh",
                background: "#111827"

            }}

            className="text-white p-4"

        >

            <h4 className="mb-5">

                Menu

            </h4>


            {/* Dashboard */}

            <Link

                to="/dashboard"

                className="text-white text-decoration-none d-block mb-4"

            >

                <FaTachometerAlt className="me-2" />

                Dashboard

            </Link>


            {/* ADMIN */}

            {

                role === "Admin" &&

                <>

                    <Link

                        to="/manage-jd"

                        className="text-white text-decoration-none d-block mb-4"

                    >

                        <FaClipboardList className="me-2" />

                        Manage JD

                    </Link>

                </>

            }


            {/* HR */}

            {

                role === "HR" &&

                <>

                    <Link

                        to="/jobs"

                        className="text-white text-decoration-none d-block mb-4"

                    >

                        <FaBriefcase className="me-2" />

                        Jobs

                    </Link>


                    <Link

                        to="/applications"

                        className="text-white text-decoration-none d-block mb-4"

                    >

                        <FaFileAlt className="me-2" />

                        Applications

                    </Link>


                    <Link

                        to="/ai-candidates"

                        className="text-white text-decoration-none d-block mb-4"

                    >

                        <FaRobot className="me-2" />

                        AI Candidates

                    </Link>


                    <Link

                        to="/interviews"

                        className="text-white text-decoration-none d-block mb-4"

                    >

                        <FaCalendarAlt className="me-2" />

                        Interviews

                    </Link>


                    <Link

                        to="/top-candidates"

                        className="text-white text-decoration-none d-block mb-4"

                    >

                        <FaTrophy className="me-2" />

                        Top Candidates

                    </Link>

                </>

            }


            {/* Candidate */}

            {

                role === "Candidate" &&

                <>

                    <Link

                        to="/available-jobs"

                        className="text-white text-decoration-none d-block mb-4"

                    >

                        <FaBriefcase className="me-2" />

                        Available Jobs

                    </Link>


                    <Link

                        to="/apply-job"

                        className="text-white text-decoration-none d-block mb-4"

                    >

                        <FaUserGraduate className="me-2" />

                        Apply Job

                    </Link>


                    <Link

                        to="/my-applications"

                        className="text-white text-decoration-none d-block mb-4"

                    >

                        <FaFileAlt className="me-2" />

                        My Applications

                    </Link>


                    <Link

                        to="/interview-status"

                        className="text-white text-decoration-none d-block mb-4"

                    >

                        <FaCalendarAlt className="me-2" />

                        Interview Status

                    </Link>

                </>

            }

        </div>

    );

}

export default Sidebar;
