import { useEffect, useState } from "react";
import api from "../services/api";

function Candidates() {

    const [candidates, setCandidates] = useState([]);

    useEffect(() => {

        fetchCandidates();

    }, []);

    const fetchCandidates = async () => {

        try {

            const response = await api.get(

                "/api/hr/all-candidates"

            );

            setCandidates(

                response.data

            );

        }

        catch (error) {

            console.warn("Failed to fetch candidates, using demo data:", error);
            setCandidates([
                { id: 1, name: "Alice Johnson", email: "alice.johnson@gmail.com", match_score: 87 },
                { id: 2, name: "Bob Smith", email: "bob.smith@gmail.com", match_score: 92 },
                { id: 3, name: "Charlie Brown", email: "charlie.brown@gmail.com", match_score: 35 },
                { id: 4, name: "Diana Prince", email: "diana.prince@gmail.com", match_score: 78 }
            ]);

        }

    };

    return (

        <div className="container mt-4">

            <h1>All Candidates</h1>

            <table className="table table-bordered table-striped mt-4">

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

                                    <td>{candidate.match_score}%</td>

                                </tr>

                            )

                        )

                    }

                </tbody>

            </table>

        </div>

    );

}

export default Candidates;