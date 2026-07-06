
import { useEffect, useState } from "react";
import api from "../services/api";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

function MyApplications() {

    const [applications, setApplications] = useState([]);

    const fetchApplications = async () => {

        try {

            const email = localStorage.getItem("email");
            const response = await api.get(

                `/api/applications/email/${email}`

            );

            const data = response.data;
            setTimeout(() => {
                setApplications(data);
            }, 0);

        }

        catch (error) {

            console.warn("Failed to fetch applications, using demo data:", error);
            const demoData = [
                {
                    id: 1,
                    candidate_name: "Candidate User",
                    job_id: 1,
                    resume_file: "1781694668117.pdf",
                    status: "Shortlisted"
                },
                {
                    id: 2,
                    candidate_name: "Candidate User",
                    job_id: 2,
                    resume_file: "1781776652145.pdf",
                    status: "Pending"
                }
            ];
            setTimeout(() => {
                setApplications(demoData);
            }, 0);

        }

    };

    useEffect(() => {

        fetchApplications();

    }, []);


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
    href={`/uploads/resumes/${app.resume_file}`}
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