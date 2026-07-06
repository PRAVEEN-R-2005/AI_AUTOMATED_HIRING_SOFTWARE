import { useEffect, useState } from "react";
import api from "../services/api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

function Candidates() {

    const [candidates, setCandidates] = useState([]);

    const fetchCandidates = async () => {

        try {

            const response = await api.get(

                "/api/hr/all-candidates"

            );

            const data = response.data;
            setTimeout(() => {
                setCandidates(data);
            }, 0);

        }

        catch (error) {

            console.warn("Failed to fetch candidates, using demo data:", error);
            const demoData = [
                { id: 1, name: "Alice Johnson", email: "alice.johnson@gmail.com", match_score: 87 },
                { id: 2, name: "Bob Smith", email: "bob.smith@gmail.com", match_score: 92 },
                { id: 3, name: "Charlie Brown", email: "charlie.brown@gmail.com", match_score: 35 },
                { id: 4, name: "Diana Prince", email: "diana.prince@gmail.com", match_score: 78 }
            ];
            setTimeout(() => {
                setCandidates(demoData);
            }, 0);

        }

    };

    useEffect(() => {

        fetchCandidates();

    }, []);

    return (

        <>
            <Navbar />
            <div className="d-flex">
                <Sidebar />
                <div className="container-fluid p-4">
                    <h1 className="mb-4">All Candidates</h1>
                    <div className="card shadow p-4 border-0">
                        <table className="table table-bordered table-striped mt-2">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Match Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    candidates.map(
                                        (candidate)=>(
                                            <tr key={candidate.id}>
                                                <td>{candidate.id}</td>
                                                <td>{candidate.name}</td>
                                                <td>{candidate.email}</td>
                                                <td>
                                                    <span className={`badge ${candidate.match_score >= 80 ? "bg-success" : candidate.match_score >= 60 ? "bg-primary" : candidate.match_score >= 40 ? "bg-warning" : "bg-danger"}`}>
                                                        {candidate.match_score || 0}%
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    )
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>

    );

}

export default Candidates;