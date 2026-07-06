
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

import {

    FaRobot,
    FaCheckCircle,
    FaUsers,
    FaChartLine,
    FaBriefcase

}

from "react-icons/fa";


function Login() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);


    const handleLogin = async (e) => {

        e.preventDefault();
        setLoading(true);

        try {

            const response = await api.post(

                "/api/auth/login",

                {

                    email,

                    password

                }

            );


            localStorage.setItem(

                "token",

                response.data.token

            );


            localStorage.setItem(

                "role",

                response.data.role

            );

            localStorage.setItem(

                "email",

                response.data.email

            );


            if (

                response.data.role === "Candidate"

            ) {

                navigate(

                    "/student-dashboard"

                );

            }

            else {

                navigate(

                    "/dashboard"

                );

            }

        }

        catch {

            // Fallback for Vercel Demo / Offline Mode!
            // If the backend API fails (e.g. because we are running on Vercel and backend is on localhost, or DB is down),
            // we can authenticate locally for the demo credentials.
            const normalizedEmail = email?.trim().toLowerCase();
            const normalizedPassword = password?.trim();
            if (
                (normalizedEmail === "admin@gmail.com" && normalizedPassword === "admin123") ||
                (normalizedEmail === "hr@gmail.com" && normalizedPassword === "123456") ||
                (normalizedEmail === "candidate@gmail.com" && normalizedPassword === "123456")
            ) {
                let role = "Candidate";
                if (normalizedEmail === "admin@gmail.com") role = "Admin";
                else if (normalizedEmail === "hr@gmail.com") role = "HR";

                localStorage.setItem("token", "mock-demo-token");
                localStorage.setItem("role", role);
                localStorage.setItem("email", normalizedEmail);

                if (role === "Candidate") {
                    navigate("/student-dashboard");
                } else {
                    navigate("/dashboard");
                }
                return;
            }

            alert(

                "Invalid Credentials"

            );

        } finally {
            setLoading(false);
        }

    };

    const demoLogin = async (emailValue, passwordValue) => {

    try {

        const response = await api.post(

            "/api/auth/login",

            {

                email: emailValue,

                password: passwordValue

            }

        );

        localStorage.setItem(

            "token",

            response.data.token

        );

        localStorage.setItem(

            "role",

            response.data.role

        );

        localStorage.setItem(

            "email",

            response.data.email

        );

        if (

            response.data.role === "Candidate"

        ) {

            navigate(

                "/student-dashboard"

            );

        }

        else {

            navigate(

                "/dashboard"

            );

        }

    }

    catch {

        // Fallback for Vercel Demo / Offline Mode!
        // If the backend API fails (e.g. because we are running on Vercel and backend is on localhost, or DB is down),
        // we can authenticate locally for the demo credentials.
        const normalizedEmail = emailValue?.trim().toLowerCase();
        const normalizedPassword = passwordValue?.trim();
        if (
            (normalizedEmail === "admin@gmail.com" && normalizedPassword === "admin123") ||
            (normalizedEmail === "hr@gmail.com" && normalizedPassword === "123456") ||
            (normalizedEmail === "candidate@gmail.com" && normalizedPassword === "123456")
        ) {
            let role = "Candidate";
            if (normalizedEmail === "admin@gmail.com") role = "Admin";
            else if (normalizedEmail === "hr@gmail.com") role = "HR";

            localStorage.setItem("token", "mock-demo-token");
            localStorage.setItem("role", role);
            localStorage.setItem("email", normalizedEmail);

            if (role === "Candidate") {
                navigate("/student-dashboard");
            } else {
                navigate("/dashboard");
            }
            return;
        }

        alert(

            "Demo Login Failed"

        );

    }

};

    return (

        <div

            className="container-fluid"

            style={{

                minHeight: "100vh",

                background:

                "linear-gradient(135deg,#111827,#1F2937,#2563EB)"

            }}

        >

            <div className="row min-vh-100">


                {/* LEFT SIDE */}

                <div className="col-md-7 d-flex flex-column justify-content-center text-white p-5">

                    <FaRobot

                        size={80}

                        className="mb-4"

                    />


                    <h1 className="fw-bold">

                        AI Hiring Software

                    </h1>


                    <h4 className="mb-4">

                        Smart Recruitment Platform

                    </h4>


                    <div className="mt-3">

                        <h5>

                            <FaCheckCircle className="text-success me-2" />

                            AI Resume Parsing

                        </h5>

                        <h5>

                            <FaChartLine className="text-success me-2" />

                            Match Score Generation

                        </h5>

                        <h5>

                            <FaUsers className="text-success me-2" />

                            Candidate Ranking

                        </h5>

                        <h5>

                            <FaBriefcase className="text-success me-2" />

                            Interview Scheduling

                        </h5>

                    </div>

                </div>


                {/* RIGHT SIDE */}

                <div className="col-md-5 d-flex justify-content-center align-items-center">

                    <div

                        className="card border-0 shadow p-5"

                        style={{

                            width: "450px",

                            borderRadius: "25px",

                            background:

                            "rgba(255,255,255,.15)",

                            backdropFilter:

                            "blur(15px)"

                        }}

                    >

                        <h2 className="text-center text-white mb-4">

                            Login

                        </h2>


                        <form onSubmit={handleLogin}>

                            <div className="mb-3">

                                <input

                                    type="email"

                                    className="form-control"

                                    placeholder="Enter Email"

                                    value={email}

                                    onChange={(e)=>

                                        setEmail(

                                            e.target.value

                                        )

                                    }

                                />

                            </div>


                            <div className="mb-4">

                                <input

                                    type="password"

                                    className="form-control"

                                    placeholder="Enter Password"

                                    value={password}

                                    onChange={(e)=>

                                        setPassword(

                                            e.target.value

                                        )

                                    }

                                />

                            </div>


                            <button

                                className="btn btn-primary w-100"
                                disabled={loading}

                            >

                                {loading ? "Signing in..." : "Login"}

                            </button>

                            <hr className="my-4" />

                            <h5 className="text-center text-white mb-3">
                                Demo Login
                            </h5>
                            <button

    type="button"

    className="btn btn-info w-100 mt-2"

    onClick={() =>

        demoLogin(

            "admin@gmail.com",

            "admin123"

        )

    }

>

    Admin Demo

</button>

                            <button

    type="button"

    className="btn btn-success w-100 mt-2"

    onClick={() =>

        demoLogin(

            "hr@gmail.com",

            "123456"

        )

    }

>

    HR Demo

</button>

<button

    type="button"

    className="btn btn-danger w-100 mt-2"

    onClick={() =>

        demoLogin(

            "candidate@gmail.com",

            "123456"

        )

    }

>

    Candidate Demo

</button>

                            <hr className="my-4" />


                            <button

                                type="button"

                                className="btn btn-outline-light w-100 mt-3"

                                onClick={()=>

                                    navigate(

                                        "/register"

                                    )

                                }

                            >

                                Register

                            </button>

                        </form>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default Login;
