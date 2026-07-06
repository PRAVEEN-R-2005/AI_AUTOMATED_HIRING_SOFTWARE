
import { useEffect, useState } from "react";
import api from "../services/api";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

function ManageJD() {

    const [title, setTitle] = useState("");
    const [skills, setSkills] = useState("");
    const [experience, setExperience] = useState("");
    const [salary, setSalary] = useState("");
    const [location, setLocation] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);

    const [jobDescriptions, setJobDescriptions] = useState([]);

    const [search, setSearch] = useState("");


    const fetchJD = async () => {

        try {

            const response = await api.get(

                "/api/job-descriptions"

            );

            const data = response.data;
            setTimeout(() => {
                setJobDescriptions(data);
            }, 0);

        }

        catch (error) {

            console.log(error);

        }

    };

    useEffect(() => {

        fetchJD();

    }, []);


    // ================= CREATE JD =================

    const createJD = async () => {
        if (!title.trim() || !skills.trim() || !description.trim()) {
            alert("Title, Skills, and Description are required");
            return;
        }
        setLoading(true);
        try {
            await api.post(
                "/api/job-descriptions",
                {
                    title,
                    skills,
                    experience,
                    salary,
                    location,
                    description,
                    created_by: "Admin"
                }
            );
            alert("Job Description Created Successfully");
            setTitle("");
            setSkills("");
            setExperience("");
            setSalary("");
            setLocation("");
            setDescription("");
            fetchJD();
        }
        catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };


    // ================= DELETE JD =================

    const deleteJD = async (id) => {
        if (!window.confirm("Are you sure you want to delete this job description?")) return;
        setLoading(true);
        try {
            await api.delete(
                `/api/job-descriptions/${id}`
            );
            alert("Job Description Deleted");
            fetchJD();
        }
        catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };
    
// ================= PUBLISH JD =================

const publishJD = async (id) => {
    setLoading(true);
    try {
        await api.put(
            `/api/job-descriptions/publish/${id}`
        );
        alert("Job Published");
        fetchJD();
    }
    catch (error) {
        console.log(error);
    } finally {
        setLoading(false);
    }
};


// ================= CLOSE JD =================

const closeJD = async (id) => {
    setLoading(true);
    try {
        await api.put(
            `/api/job-descriptions/close/${id}`
        );
        alert("Job Closed");
        fetchJD();
    }
    catch (error) {
        console.log(error);
    } finally {
        setLoading(false);
    }
};



    // ================= SEARCH =================

    const filteredJD = jobDescriptions.filter(

        (jd) =>

            jd.title

                ?.toLowerCase()

                .includes(

                    search.toLowerCase()

                )

    );


    return (

        <>

            <Navbar />

            <div className="d-flex">

                <Sidebar />

                <div className="container-fluid p-4">

                    <h2>

                        Manage Job Descriptions

                    </h2>


                    {/* Create JD */}

                    <div className="card shadow border-0 p-4 mt-4">

                        <h4>

                            Create Job Description

                        </h4>

                        <input

                            className="form-control mt-3"

                            placeholder="Title"

                            value={title}

                            onChange={(e) =>

                                setTitle(

                                    e.target.value

                                )

                            }

                        />

                        <input

                            className="form-control mt-3"

                            placeholder="Skills"

                            value={skills}

                            onChange={(e) =>

                                setSkills(

                                    e.target.value

                                )

                            }

                        />

                        <input

                            className="form-control mt-3"

                            placeholder="Experience"

                            value={experience}

                            onChange={(e) =>

                                setExperience(

                                    e.target.value

                                )

                            }

                        />

                        <input

                            className="form-control mt-3"

                            placeholder="Salary"

                            value={salary}

                            onChange={(e) =>

                                setSalary(

                                    e.target.value

                                )

                            }

                        />

                        <input

                            className="form-control mt-3"

                            placeholder="Location"

                            value={location}

                            onChange={(e) =>

                                setLocation(

                                    e.target.value

                                )

                            }

                        />

                        <textarea

                            className="form-control mt-3"

                            rows="4"

                            placeholder="Description"

                            value={description}

                            onChange={(e) =>

                                setDescription(

                                    e.target.value

                                )

                            }

                        />

                        <button

                            className="btn btn-primary mt-4"

                            onClick={createJD}
                            disabled={loading}

                        >

                            {loading ? "Creating..." : "Create JD"}

                        </button>

                    </div>


                    {/* Search */}

                    <input

                        className="form-control mt-5"

                        placeholder="Search Job Description"

                        value={search}

                        onChange={(e) =>

                            setSearch(

                                e.target.value

                            )

                        }

                    />


                    {/* Cards */}

                    <div className="row mt-4">

                        {

                            filteredJD.map(

                                (jd) => (

                                    <div

                                        className="col-md-4"

                                        key={jd.jd_id}

                                    >

                                        <div className="card shadow border-0 mb-4">

                                            <div className="card-body">

                                                <h4>

                                                    {jd.title}

                                                </h4>

                                                <hr />

                                                <h6>

                                                    Skills

                                                </h6>

                                                {

                                                    jd.skills

                                                    .split(",")

                                                    .map(

                                                        (skill, index) => (

                                                            <span

                                                                key={index}

                                                                className="badge bg-info me-2 mb-2"

                                                            >

                                                                {skill}

                                                            </span>

                                                        )

                                                    )

                                                }

                                                <p>

                                                    <b>

                                                        Experience :

                                                    </b>

                                                    {jd.experience}

                                                </p>

                                                <p>

                                                    <b>

                                                        Salary :

                                                    </b>

                                                    {jd.salary}

                                                </p>

                                                <p>

                                                    <b>

                                                        Location :

                                                    </b>

                                                    {jd.location}

                                                </p>

                                                <p>

                                                    <b>

                                                        Created By :

                                                    </b>

                                                    {jd.created_by}

                                                </p>
                                                
<p>

<b>

Status :

</b>

{

jd.status === "Open"

?

<span className="badge bg-success ms-2">

Open

</span>

:

jd.status === "Closed"

?

<span className="badge bg-danger ms-2">

Closed

</span>

:

<span className="badge bg-secondary ms-2">

Draft

</span>

}

</p>


                                                <button

className="btn btn-success me-2"

onClick={()=>publishJD(jd.jd_id)}
disabled={loading}

>

Publish

</button>


<button

className="btn btn-warning me-2"

onClick={()=>closeJD(jd.jd_id)}
disabled={loading}

>

Close

</button>


<button

className="btn btn-danger"

onClick={()=>deleteJD(jd.jd_id)}
disabled={loading}

>

Delete

</button>

                                            </div>

                                        </div>

                                    </div>

                                )

                            )

                        }

                    </div>

                </div>

            </div>

        </>

    );

}

export default ManageJD;
