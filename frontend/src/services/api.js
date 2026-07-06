import axios from "axios";

const isBrowser = typeof window !== "undefined";

const getBaseURL = () => {
    const envUrl = import.meta.env.VITE_API_URL;
    // If running in browser and the host is not localhost, but VITE_API_URL points to localhost,
    // fall back to a relative path ("") so requests are routed to the same host/domain.
    if (isBrowser && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
        if (envUrl && envUrl.includes("localhost")) {
            return "";
        }
    }
    return envUrl || "";
};

const api = axios.create({

    baseURL: getBaseURL()

});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;