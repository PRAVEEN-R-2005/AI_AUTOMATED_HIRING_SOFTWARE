
import {

    FaBell,
    FaUserCircle,
    FaSignOutAlt

}

from "react-icons/fa";


function Navbar() {

    const role = localStorage.getItem(

        "role"

    );


    const handleLogout = () => {

        localStorage.removeItem(

            "token"

        );

        localStorage.removeItem(

            "role"

        );

        localStorage.removeItem(

            "email"

        );

        window.location.href = "/";

    };


    return (

        <nav

            className="navbar navbar-expand-lg shadow px-4 sticky-top"

            style={{

                background: "#1F2937"

            }}

        >

            <div className="container-fluid">


                {/* Left Side */}

                <div>

                    <h3 className="text-white fw-bold mb-0">

                        AI Hiring Software

                    </h3>

                    <small className="text-light">

                        Smart Recruitment System

                    </small>

                </div>


                {/* Right Side */}

                <div className="d-flex align-items-center">


                    {/* Welcome */}

                    <div className="text-white me-4">

                        Welcome,

                        <span className="fw-bold ms-1">

                            {role}

                        </span>

                    </div>


                    {/* Role Badge */}

                    <div className="me-4">

                        <span className="badge bg-primary p-2">

                            {role}

                        </span>

                    </div>


                    {/* Notification */}

                    <div className="me-4">

                        <FaBell

                            className="text-white"

                            size={22}

                            style={{

                                cursor: "pointer"

                            }}

                        />

                    </div>


                    {/* User Profile */}

                    <div className="me-4">

                        <FaUserCircle

                            className="text-white"

                            size={30}

                            style={{

                                cursor: "pointer"

                            }}

                        />

                    </div>


                    {/* Logout */}

                    <button

                        className="btn btn-danger"

                        onClick={handleLogout}

                    >

                        <FaSignOutAlt className="me-2" />

                        Logout

                    </button>

                </div>

            </div>

        </nav>

    );

}

export default Navbar;
