import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { getBackendUrl } from "../config/apiConfig";

export default function ProtectedRoute() {
  const [isAuthenticated, setIsAuthenticated] = useState(null); 
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAuthenticated = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        };

        const response = await fetch(`${getBackendUrl()}/auth/check`, {
          method: "GET",
          headers,
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Authentication status:", data);
          setIsAuthenticated(data); 
        } else {
          console.error("Failed to fetch authentication status");
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error fetching authentication status:", error);
        setIsAuthenticated(false); 
      }
    };

    fetchAuthenticated();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="loading loading-spinner text-primary"></span>
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  return <Outlet />;
}