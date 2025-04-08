// components/MainLayout.jsx
import React, { useState } from "react";
import Sidebar from "./Sidebar";

const MainLayout = ({ children }) => {
  const [selectedSection, setSelectedSection] = useState("profile");

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    window.location.href = "/";
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#baa6ba] p-6">
      <div className="w-full bg-[#f3e6f5] rounded-xl shadow-md p-6 mx-auto">
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#baa6ba] p-6">
          <div className="w-full bg-white rounded-xl shadow-md p-8 min-h-screen">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-56">
                <Sidebar
                  selectedSection={selectedSection}
                  setSelectedSection={setSelectedSection}
                  onLogout={handleLogout}
                />
              </div>
              <div className="flex-grow bg-[#f3e6f5] rounded-xl p-6">
                {typeof children === "function"
                  ? children(selectedSection, setSelectedSection)
                  : children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
