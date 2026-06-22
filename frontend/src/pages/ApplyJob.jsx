
import { useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

function ApplyJob() {

    const [name, setName] = useState("");

    const [email, setEmail] = useState("");

    const [phone, setPhone] = useState("");

    const [file, setFile] = useState(null);

    const [loading, setLoading] = useState(false);
    


    // =====================
    // GET SELECTED JOB
    // =====================

    const location = useLocation();

    const selectedJob = location.state?.job || JSON.parse(localStorage.getItem("selectedJob"));


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

            formData.append("candidate_name", name);
            formData.append("email", email);
            formData.append("phone", phone);

            const jobId = selectedJob?.id || selectedJob?.jd_id;
            console.log({ selectedJob, jobId });

            if (!jobId) {
                alert("No job selected for application.");
                setLoading(false);
                return;
            }

            formData.append("job_id", jobId);
            formData.append("resume_file", file);

            const response = await axios.post(
                "http://localhost:5000/api/applications",
                formData
            );

            const applicationId = response.data?.applicationId;
            if (applicationId) {
                try {
                    await axios.put(
                        `http://localhost:5000/api/ai/run/${applicationId}`
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

        }

        catch (error) {

            console.log(error);

            setLoading(false);

            alert(

                "Application Submission Failed"

            );

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
