import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

function Register() {

    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("Candidate");
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        if (e) e.preventDefault();

        if (!name.trim() || !email.trim() || !password || !role) {
            alert("All fields are required");
            return;
        }

        if (password.length < 6) {
            alert("Password must be at least 6 characters long");
            return;
        }

        setLoading(true);

        try {

            const response = await api.post(
                "/api/auth/register",
                {
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    password,
                    role
                }
            );

            alert(response.data.message || "Registration Successful!");

            navigate("/");

        }

        catch (error) {

            if (error.response) {

                alert(error.response.data.message);

            }

            else {

                alert("Server Error");

            }

        } finally {
            setLoading(false);
        }

    };

    return (

        <div className="container mt-5" style={{ maxWidth: "500px" }}>

            <form className="card p-4 shadow" onSubmit={handleRegister}>

                <h2>Register</h2>

                <input
                    className="form-control mt-3"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    required
                />

                <input
                    type="email"
                    className="form-control mt-3"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                />

                <input
                    type="password"
                    className="form-control mt-3"
                    placeholder="Password (min 6 chars)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                />

                <select
                    className="form-control mt-3"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    disabled={loading}
                    required
                >
                    <option value="Admin">Admin</option>
                    <option value="HR">HR</option>
                    <option value="Candidate">Candidate</option>
                </select>

                <button
                    type="submit"
                    className="btn btn-success mt-4 w-100"
                    disabled={loading}
                >
                    {loading ? "Registering..." : "Register"}
                </button>

                <button
                    type="button"
                    className="btn btn-outline-secondary mt-2 w-100"
                    onClick={() => navigate("/")}
                    disabled={loading}
                >
                    Back to Login
                </button>

            </form>

        </div>

    );

}

export default Register;