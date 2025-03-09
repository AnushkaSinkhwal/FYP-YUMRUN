import axios from "axios";

const BASE_URL = "http://localhost:5000";

export const fetchDataFromApi = async (url) => {
    try {
        const res = await axios.get(BASE_URL + url);
        return res;  // Returning full response instead of data
    } catch (error) {
        console.error("Error fetching data:", error.response ? error.response.data : error.message);
        return null;
    }
};

export const postData = async (url, formData) => {
    try {
        const res = await axios.post(BASE_URL + url, formData);
        return res;  // Returning full response
    } catch (error) {
        console.error("Error posting data:", error.response ? error.response.data : error.message);
        return null;
    }
};

export const editData = async (url, updatedData) => {
    try {
        const res = await axios.put(BASE_URL + url, updatedData);
        return res;  // Returning full response
    } catch (error) {
        console.error("Error updating data:", error.response ? error.response.data : error.message);
        return null;
    }
};

export const deleteData = async (url) => {
    try {
        const res = await axios.delete(BASE_URL + url);
        return res;  // Returning full response
    } catch (error) {
        console.error("Error deleting data:", error.response ? error.response.data : error.message);
        return null;
    }
};
