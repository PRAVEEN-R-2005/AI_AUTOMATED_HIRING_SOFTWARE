
import { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

function ApplyJob() {

    const [name, setName] = useState("");
    const userRole = localStorage.getItem("role");
    const userEmail = localStorage.getItem("email") || "";

    const [email, setEmail] = useState(userRole === "Candidate" ? userEmail : "");
    const [phone, setPhone] = useState("");

    const [file, setFile] = useState(null);

    const [loading, setLoading] = useState(false);
    


    // =====================
    // GET SELECTED JOB
    // =====================

    const location = useLocation();
    const { id } = useParams();
    const navigate = useNavigate();

    const [selectedJob, setSelectedJob] = useState(location.state?.job || null);

    useEffect(() => {
        const fetchJob = async () => {
            if (!selectedJob) {
                if (!id) {
                    navigate("/available-jobs");
                    return;
                }
                try {
                    const response = await api.get("/api/job-descriptions/open");
                    const jobs = response.data || [];
                    const job = jobs.find(j => String(j.jdId || j.id) === String(id));
                    if (job) {
                        setSelectedJob(job);
                    } else {
                        alert("Job not found");
                        navigate("/available-jobs");
                    }
                } catch (error) {
                    console.error("Failed to fetch jobs", error);
                    navigate("/available-jobs");
                }
            }
        };
        fetchJob();
    }, [id, selectedJob, navigate]);


    // =====================
    // SUBMIT APPLICATION
    // =====================

    const handleSubmit = async () => {

        if (

            !name ||

            !email ||

            !phone ||

            !file

        ) {

            alert(

                "Please fill all fields"

            );

            return;

        }


        try {

            setLoading(true);

            const formData = new FormData();

            formData.append("candidate_name", name.trim());
            formData.append("email", email.trim());
            formData.append("phone", phone.trim());

            const jobId = selectedJob?.jdId || selectedJob?.id || id;
            console.log({ selectedJob, jobId });

            if (!jobId) {
                alert("No job selected for application.");
                setLoading(false);
                return;
            }

            formData.append("job_id", jobId);
            formData.append("resume_file", file);

            console.log("Submitting application payload:");
            for (let [key, value] of formData.entries()) {
                console.log(`${key}:`, value);
            }

            const response = await api.post(
                "/api/applications",
                formData
            );

            const applicationId = response.data?.applicationId;
            if (applicationId) {
                try {
                    await api.put(
                        `/api/ai/run/${applicationId}`
                    );
                } catch (aiError) {
                    console.log("AI scoring failed", aiError);
                }
            }


            alert(
                "Application Submitted Successfully"
            );

            setName("");
            setEmail("");
            setPhone("");
            setFile(null);
            setLoading(false);
            
            navigate("/my-applications");


        }

        catch (error) {
            console.log("Submission error:", error.response?.status, error.response?.data);
            setLoading(false);
            
            if (error.response?.status === 403) {
                alert("Session expired or unauthorized. Please log in again.");
            } else if (error.response?.status === 401) {
                alert("Authentication required. Please log in.");
            } else {
                alert("Application Submission Failed. Please try again later.");
            }
        }

    };


    return (

        <>

            <Navbar />

            <div className="d-flex">

                <Sidebar />

                <div className="container-fluid p-4">

                    <h2 className="mb-4">

                        Apply Job

                    </h2>


                    <div className="row">


                        {/* ================= SELECTED JOB DETAILS ================= */}

                        {

                            selectedJob && (

                                <div className="col-md-12 mb-4">

                                    <div

                                        className="card shadow border-0"

                                        style={{

                                            borderRadius: "20px"

                                        }}

                                    >

                                        <div className="card-body">

                                            <h3 className="text-primary fw-bold">

                                                {

                                                    selectedJob.title

                                                }

                                            </h3>

                                            <hr />

                                            <p>

                                                <b>

                                                    Skills :

                                                </b>

                                                {

                                                    selectedJob.skills

                                                }

                                            </p>

                                            <p>

                                                <b>

                                                    Experience :

                                                </b>

                                                {

                                                    selectedJob.experience

                                                }

                                            </p>

                                            <p>

                                                <b>

                                                    Salary :

                                                </b>

                                                {

                                                    selectedJob.salary

                                                }

                                            </p>

                                            <p>

                                                <b>

                                                    Location :

                                                </b>

                                                {

                                                    selectedJob.location

                                                }

                                            </p>

                                        </div>

                                    </div>

                                </div>

                            )

                        }


                        {/* ================= APPLICATION FORM ================= */}

                        <div className="col-md-8">

                            <div className="card shadow border-0">

                                <div className="card-body">

                                    <h4 className="mb-4">

                                        Candidate Details

                                    </h4>


                                    <input

                                        type="text"

                                        className="form-control mb-3"

                                        placeholder="Candidate Name"

                                        value={name}

                                        onChange={(e) =>

                                            setName(

                                                e.target.value

                                            )

                                        }

                                    />


                                    <input

                                        type="email"

                                        className="form-control mb-3"

                                        placeholder="Email"

                                        value={email}

                                        onChange={(e) =>

                                            setEmail(

                                                e.target.value

                                            )

                                        }
                                        readOnly={userRole === "Candidate"}
                                        style={userRole === "Candidate" ? { backgroundColor: "#e9ecef", cursor: "not-allowed" } : {}}
                                    />


                                    <input

                                        type="text"

                                        className="form-control mb-3"

                                        placeholder="Phone"

                                        value={phone}

                                        onChange={(e) =>

                                            setPhone(

                                                e.target.value

                                            )

                                        }

                                    />


                                    <label className="mb-2">

                                        Upload Resume

                                    </label>


                                    <input

                                        type="file"

                                        className="form-control mb-4"

                                        onChange={(e) =>

                                            setFile(

                                                e.target.files[0]

                                            )

                                        }

                                    />


                                    <button

                                        className="btn btn-success w-100"

                                        onClick={handleSubmit}

                                        disabled={loading}

                                    >

                                        {

                                            loading

                                            ?

                                            "Submitting..."

                                            :

                                            "Submit Application"

                                        }

                                    </button>

                                </div>

                            </div>

                        </div>


                        {/* ================= APPLICATION PROCESS ================= */}

                        <div className="col-md-4">

                            <div className="card shadow border-0">

                                <div className="card-body">

                                    <h5>

                                        Application Process

                                    </h5>

                                    <hr />

                                    <p>

                                        1. Upload Resume

                                    </p>

                                    <p>

                                        2. AI Screening

                                    </p>

                                    <p>

                                        3. Shortlisting

                                    </p>

                                    <p>

                                        4. Interview

                                    </p>

                                    <p>

                                        5. Final Selection

                                    </p>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </>

    );

}

export default ApplyJob;
