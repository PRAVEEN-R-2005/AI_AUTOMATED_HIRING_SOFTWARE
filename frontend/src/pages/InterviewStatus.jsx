import { useEffect, useState } from "react";
import api from "../services/api";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

function InterviewStatus() {

    const [interviews, setInterviews] = useState([]);

    useEffect(() => {

        fetchInterviews();

    }, []);


    const fetchInterviews = async () => {

        try {

            const response = await api.get(

                "/api/interviews/all"

            );

            setInterviews(

                response.data

            );

        }

        catch (error) {

            console.log(error);

        }

    };


    const getBadge = (status) => {

        if (status === "Scheduled")

            return "success";

        if (status === "Completed")

            return "primary";

        if (status === "Cancelled")

            return "danger";

        return "secondary";

    };


    return (

        <>

            <Navbar />

            <div className="d-flex">

                <Sidebar />

                <div className="container-fluid p-4">

                    <h2 className="mb-4">

                        Interview Status

                    </h2>


                    <div className="card shadow border-0">

                        <div className="card-body">

                            <table className="table table-hover">

                                <thead className="table-dark">

                                    <tr>

                                        <th>

                                            Interview ID

                                        </th>

                                        <th>

                                            Date

                                        </th>

                                        <th>

                                            Time

                                        </th>

                                        <th>

                                            Mode

                                        </th>

                                        <th>

                                            Status

                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {

                                        interviews.map(

                                            (

                                                interview

                                            ) => (

                                                <tr

                                                    key={interview.id}

                                                >

                                                    <td>

                                                        {

                                                            interview.id

                                                        }

                                                    </td>

                                                    <td>

                                                        {

                                                            interview.interview_date

                                                        }

                                                    </td>

                                                    <td>

                                                        {

                                                            interview.interview_time

                                                        }

                                                    </td>

                                                    <td>

                                                        {

                                                            interview.interview_mode

                                                        }

                                                    </td>

                                                    <td>

                                                        <span

                                                            className={`badge bg-${getBadge(

                                                                interview.status

                                                            )}`}

                                                        >

                                                            {

                                                                interview.status

                                                            }

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

            </div>

        </>

    );

}

export default InterviewStatus;