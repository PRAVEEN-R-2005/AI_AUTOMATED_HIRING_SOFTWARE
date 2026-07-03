
import { useEffect, useState } from "react";
import api from "../services/api";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import {

    FaTrophy

}

from "react-icons/fa";


function TopCandidates() {

    const [topCandidates, setTopCandidates] = useState([]);

    useEffect(() => {
        fetchTopCandidates();
    }, []);

    const fetchTopCandidates = async () => {
        try {
            const response = await api.get("/api/top-candidates");
            setTopCandidates(response.data);
        } catch (error) {
            console.warn("Failed to fetch top candidates, using demo data:", error);
            setTopCandidates([
                { id: 2, candidate_name: "Bob Smith", email: "bob.smith@gmail.com", match_score: 92 },
                { id: 1, candidate_name: "Alice Johnson", email: "alice.johnson@gmail.com", match_score: 87 },
                { id: 4, candidate_name: "Diana Prince", email: "diana.prince@gmail.com", match_score: 78 }
            ]);
        }
    };

    const getStatus = (score) => {
        if (score >= 80) return "Excellent Match";
        if (score >= 60) return "Good Match";
        if (score >= 40) return "Average Match";
        return "Poor Match";
    };

    const getColor = (score) => {
        if (score >= 80) return "bg-success";
        if (score >= 60) return "bg-primary";
        if (score >= 40) return "bg-warning";
        return "bg-danger";
    };


    return (

        <>

            <Navbar />

            <div className="d-flex">

                <Sidebar />

                <div className="container-fluid p-4">

                    <h2 className="mb-4">

                        <FaTrophy className="text-warning me-2" />

                        Top Candidates

                    </h2>


                    <div className="card shadow">
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-bordered table-hover">
                            <thead className="table-dark">
                                <tr>
                                    <th>Rank</th>
                                    <th>Candidate Name</th>
                                    <th>Email</th>
                                    <th>Match Score</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topCandidates.map((candidate, index) => {
                                    const score = candidate.match_score || 0;
                                    const scoreColor = score >= 80 ? "bg-success" : score >= 60 ? "bg-primary" : score >= 40 ? "bg-warning" : "bg-danger";
                                    const statusLabel = score >= 80 ? "Excellent Match" : score >= 60 ? "Good Match" : score >= 40 ? "Average Match" : "Poor Match";
                                    return (
                                        <tr key={candidate.id}>
                                            <td>{index + 1}</td>
                                            <td>{candidate.candidate_name}</td>
                                            <td>{candidate.email}</td>
                                            <td>
                                                <div className="progress">
                                                    <div className={`progress-bar ${scoreColor}`} style={{ width: `${score}%` }}>
                                                        {score}%
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge ${scoreColor}`}>{statusLabel}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

                </div>

            </div>

        </>

    );

}

export default TopCandidates;
