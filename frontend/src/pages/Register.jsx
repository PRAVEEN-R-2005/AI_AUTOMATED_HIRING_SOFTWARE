import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Register() {

    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("Candidate");

    const handleRegister = async () => {

        try {

            const response = await axios.post(
                "http://localhost:5000/api/auth/register",
                {
                    name,
                    email,
                    password,
                    role
                }
            );

            alert(response.data.message);

            navigate("/");

        }

        catch (error) {

            if (error.response) {

                alert(error.response.data.message);

            }

            else {

                alert("Server Error");

            }

        }

    };

    return (

        <div className="container mt-5">

            <div className="card p-4 shadow">

                <h2>Register</h2>

                <input
                    className="form-control mt-3"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />

                <input
                    className="form-control mt-3"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    type="password"
                    className="form-control mt-3"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <select
                    className="form-control mt-3"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                >
                    <option value="Admin">Admin</option>
                    <option value="HR">HR</option>
                    <option value="Candidate">Candidate</option>
                </select>

                <button
                    className="btn btn-success mt-3"
                    onClick={handleRegister}
                >
                    Register
                </button>

            </div>

        </div>

    );

}

export default Register;