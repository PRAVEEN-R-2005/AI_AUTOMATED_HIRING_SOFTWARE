
import { useEffect, useState } from "react";
import axios from "axios";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

function MyApplications() {

    const [applications, setApplications] = useState([]);

    useEffect(() => {

        fetchApplications();

    }, []);


    const fetchApplications = async () => {

        try {

            const response = await axios.get(

                "http://localhost:5000/api/applications/all"

            );

            setApplications(response.data);

        }

        catch (error) {

            console.log(error);

        }

    };


    const getBadge = (status) => {

        if (status === "Pending") {

            return "warning";

        }

        if (status === "Shortlisted") {

            return "primary";

        }

        if (status === "Interview Scheduled") {

            return "success";

        }

        if (status === "Rejected") {

            return "danger";

        }

        if (status === "Selected") {

            return "success";

        }

        return "secondary";

    };


    return (

        <>

            <Navbar />

            <div className="d-flex">

                <Sidebar />

                <div className="container-fluid p-4">

                    <h2 className="mb-4">

                        My Applications

                    </h2>


                    <div className="card shadow p-4">

                        <table className="table table-bordered table-hover">

                            <thead className="table-dark">

                                <tr>

                                    <th>

                                        Application ID

                                    </th>

                                    <th>

                                        Candidate Name

                                    </th>

                                    <th>

                                        Job ID

                                    </th>

                                    <th>

                                        Resume

                                    </th>

                                    <th>

                                        Status

                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {

                                    applications.length > 0 ?

                                    applications.map(

                                        (app) => (

                                            <tr key={app.id}>

                                                <td>

                                                    {app.id}

                                                </td>

                                                <td>

                                                    {app.candidate_name}

                                                </td>

                                                <td>

                                                    {app.job_id}

                                                </td>

                                                <td>

                                                    <a

                                                        href={`http://localhost:5000/uploads/resumes/${app.resume_file}`}

                                                        target="_blank"

                                                        rel="noreferrer"

                                                        className="btn btn-danger"

                                                    >

                                                        View Resume

                                                    </a>

                                                </td>

                                                <td>

                                                    <span

                                                        className={`badge bg-${getBadge(

                                                            app.status

                                                        )}`}

                                                    >

                                                        {app.status}

                                                    </span>

                                                </td>

                                            </tr>

                                        )

                                    )

                                    :

                                    <tr>

                                        <td

                                            colSpan="5"

                                            className="text-center"

                                        >

                                            No Applications Found

                                        </td>

                                    </tr>

                                }

                            </tbody>

                        </table>

                    </div>

                </div>

            </div>

        </>

    );

}

export default MyApplications;