
import { useEffect, useState } from "react";
import api from "../services/api";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import {

    FaBriefcase,
    FaUsers,
    FaCalendarAlt,
    FaTrophy

}

from "react-icons/fa";


import {

    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend

}

from "chart.js";


import {

    Doughnut

}

from "react-chartjs-2";


ChartJS.register(

    ArcElement,
    Tooltip,
    Legend

);


function Dashboard() {

    const [stats, setStats] = useState({

        jobs: 0,

        candidates: 0,

        interviews: 0,

        topCandidates: 0

    });


    useEffect(() => {

        fetchStats();

    }, []);


    const fetchStats = async () => {

        try {

            const response = await api.get(

                "/api/dashboard/stats"

            );

            setStats(

                response.data

            );

        }

        catch (error) {

            console.log(error);

        }

    };


    const chartData = {

        labels: [

            "Jobs",

            "Candidates",

            "Interviews",

            "Top Candidates"

        ],

        datasets: [

            {

                label: "Statistics",

                data: [

                    stats.jobs,

                    stats.candidates,

                    stats.interviews,

                    stats.topCandidates

                ],

                backgroundColor: [

                    "#0d6efd",

                    "#198754",

                    "#ffc107",

                    "#dc3545"

                ],

                borderWidth: 2

            }

        ]

    };


    return (

        <>

            <Navbar />

            <div className="d-flex">

                <Sidebar />

                <div

                    className="container-fluid p-4"

                    style={{

                        backgroundColor: "#f5f7fa",

                        minHeight: "100vh"

                    }}

                >

                    <h2 className="fw-bold mb-4">

                        Dashboard

                    </h2>


                    <div className="row">

                        {/* Total Jobs */}

                        <div className="col-md-3">

                            <div className="card shadow border-0 bg-primary text-white">

                                <div className="card-body">

                                    <div className="d-flex justify-content-between">

                                        <div>

                                            <h5>

                                                Total Jobs

                                            </h5>

                                            <h1>

                                                {stats.jobs}

                                            </h1>

                                        </div>

                                        <FaBriefcase

                                            size={40}

                                        />

                                    </div>

                                </div>

                            </div>

                        </div>


                        {/* Candidates */}

                        <div className="col-md-3">

                            <div className="card shadow border-0 bg-success text-white">

                                <div className="card-body">

                                    <div className="d-flex justify-content-between">

                                        <div>

                                            <h5>

                                                Candidates

                                            </h5>

                                            <h1>

                                                {stats.candidates}

                                            </h1>

                                        </div>

                                        <FaUsers

                                            size={40}

                                        />

                                    </div>

                                </div>

                            </div>

                        </div>


                        {/* Interviews */}

                        <div className="col-md-3">

                            <div className="card shadow border-0 bg-warning text-white">

                                <div className="card-body">

                                    <div className="d-flex justify-content-between">

                                        <div>

                                            <h5>

                                                Interviews

                                            </h5>

                                            <h1>

                                                {stats.interviews}

                                            </h1>

                                        </div>

                                        <FaCalendarAlt

                                            size={40}

                                        />

                                    </div>

                                </div>

                            </div>

                        </div>


                        {/* Top Candidates */}

                        <div className="col-md-3">

                            <div className="card shadow border-0 bg-danger text-white">

                                <div className="card-body">

                                    <div className="d-flex justify-content-between">

                                        <div>

                                            <h5>

                                                Top Candidates

                                            </h5>

                                            <h1>

                                                {stats.topCandidates}

                                            </h1>

                                        </div>

                                        <FaTrophy

                                            size={40}

                                        />

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* Doughnut Chart */}

                    <div className="row mt-5">

                        <div className="col-md-6">

                            <div className="card shadow border-0">

                                <div className="card-body">

                                    <h4 className="mb-4">

                                        Recruitment Statistics

                                    </h4>

                                    <Doughnut

                                        data={chartData}

                                    />

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </>

    );

}

export default Dashboard;
