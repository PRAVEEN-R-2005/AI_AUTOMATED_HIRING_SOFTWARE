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

            console.log(error);

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