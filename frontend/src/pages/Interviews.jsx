
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";


function Interviews() {

    const location = useLocation();
    const selectedCandidate = location.state?.candidate;

    const [interviews, setInterviews] = useState([]);

    const [search, setSearch] = useState("");

    const [calendarDate, setCalendarDate] = useState(

        new Date()

    );


    useEffect(() => {

        fetchInterviews();

    }, []);


    const fetchInterviews = async () => {

        try {

            const response = await axios.get(

                "http://localhost:5000/api/interviews/all"

            );

            setInterviews(

                response.data

            );

        }

        catch (error) {

            console.log(error);

        }

    };


    const updateStatus = async (

        id,

        status

    ) => {

        try {

            await axios.put(

                `http://localhost:5000/api/interviews/status/${id}`,

                {

                    status

                }

            );

            fetchInterviews();

        }

        catch (error) {

            console.log(error);

        }

    };


    const getBadge = (

        status

    ) => {

        if (

            status === "Scheduled"

        )

            return "success";

        if (

            status === "Completed"

        )

            return "primary";

        if (

            status === "Cancelled"

        )

            return "danger";

        return "secondary";

    };


    const filteredInterviews = interviews.filter(
        (interview) =>
            interview.candidate_name?.toLowerCase().includes(search.toLowerCase()) ||
            interview.email?.toLowerCase().includes(search.toLowerCase()) ||
            String(interview.phone || interview.candidate_id).includes(search)
    );


    return (

        <>

            <Navbar />

            <div className="d-flex">

                <Sidebar />

                <div className="container-fluid p-4">

                    <h2 className="mb-4">

                        Interview Management

                    </h2>


                    <div className="row">

                        {/* Calendar */}

                        <div className="col-md-4">

                            <div className="card shadow">

                                <div className="card-body">

                                    <h4>

                                        Calendar

                                    </h4>

                                    <Calendar

                                        value={calendarDate}

                                        onChange={

                                            setCalendarDate

                                        }

                                    />

                                </div>

                            </div>

                        </div>


                        {/* Table */}

                        <div className="col-md-8">

                            <div className="card shadow">

                                <div className="card-body">

                                    <h4>

                                        Interviews

                                    </h4>


                                    <input

                                        type="text"

                                        className="form-control mb-3"

                                        placeholder="Search candidate name, email or phone"

                                        value={search}

                                        onChange={(e) =>

                                            setSearch(

                                                e.target.value

                                            )

                                        }

                                    />

                                    {selectedCandidate && (
                                        <div className="card shadow-sm mb-4">
                                            <div className="card-body">
                                                <div className="d-flex justify-content-between align-items-start mb-3">
                                                    <div>
                                                        <h5 className="mb-1">{selectedCandidate.candidate_name}</h5>
                                                        <p className="mb-1 text-muted">{selectedCandidate.email}</p>
                                                        <p className="mb-0 text-muted">{selectedCandidate.phone}</p>
                                                    </div>
                                                    <div className="text-end">
                                                        <span className="badge bg-info mb-2">AI Score: {selectedCandidate.match_score || 0}%</span>
                                                        <div>
                                                            <span className="badge bg-success">Interview Scheduled</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="row g-3">
                                        {
                                            filteredInterviews.map((interview) => (
                                                <div className="col-12" key={interview.id}>
                                                    <div className="card shadow-sm">
                                                        <div className="card-body">
                                                            <div className="d-flex justify-content-between align-items-start mb-3">
                                                                <div>
                                                                    <h5 className="mb-1">{interview.candidate_name || `Candidate ${interview.candidate_id}`}</h5>
                                                                    <p className="mb-1 text-muted">{interview.email || "No email"}</p>
                                                                    <p className="mb-0 text-muted">{interview.phone || "No phone"}</p>
                                                                </div>
                                                                <span className={`badge bg-${getBadge(interview.status)}`}>{interview.status}</span>
                                                            </div>
                                                            <div className="row">
                                                                <div className="col-md-3 mb-2"><strong>AI Score :</strong> {interview.ai_score || interview.match_score || 0}%</div>
                                                                <div className="col-md-3 mb-2"><strong>Date :</strong> {interview.interview_date ? new Date(interview.interview_date).toLocaleDateString("en-GB") : "TBD"}</div>
                                                                <div className="col-md-2 mb-2"><strong>Time :</strong> {interview.interview_time || "TBD"}</div>
                                                                <div className="col-md-2 mb-2"><strong>Mode :</strong> {interview.mode || "Online"}</div>
                                                                <div className="col-md-2 mb-2"><strong>Interviewer :</strong> {interview.interviewer || "HR Manager"}</div>
                                                            </div>
                                                            <div className="mt-3 d-flex flex-wrap gap-2">
                                                                <button className="btn btn-primary btn-sm" onClick={() => updateStatus(interview.id, "Scheduled")}>Schedule Interview</button>
                                                                <button className="btn btn-success btn-sm" onClick={() => updateStatus(interview.id, "Completed")}>Complete</button>
                                                                <button className="btn btn-danger btn-sm" onClick={() => updateStatus(interview.id, "Cancelled")}>Cancel</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        }
                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </>

    );

}

export default Interviews;
