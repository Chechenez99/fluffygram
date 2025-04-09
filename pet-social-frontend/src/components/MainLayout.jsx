import React, { useState } from "react";
import Sidebar from "./Sidebar";

const MainLayout = ({
  children,
  friendRequestsCount,
  setFriendRequestsCount,
  newMessagesCount,
  setNewMessagesCount,
}) => {
  const [selectedSection, setSelectedSection] = useState("profile");

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    window.location.href = "/";
  };

  return (
    <div className="flex justify-center items-start min-h-screen bg-[#baa6ba] p-6">
      <div className="w-full max-w-screen-3xl bg-[#f3e6f5] rounded-xl shadow-md p-6 min-h-screen">
        <div className="w-full bg-white rounded-xl shadow-md p-8 min-h-screen">
          <div className="flex flex-col md:flex-row gap-6 h-full">
            <div className="md:w-56">
              <Sidebar
                selectedSection={selectedSection}
                setSelectedSection={setSelectedSection}
                onLogout={handleLogout}
                friendRequestsCount={friendRequestsCount}
                setFriendRequestsCount={setFriendRequestsCount}
                newMessagesCount={newMessagesCount}
                setNewMessagesCount={setNewMessagesCount}
              />
            </div>
            <div className="flex-grow bg-[#f3e6f5] rounded-xl p-6 min-h-screen">
              {typeof children === "function"
                ? children(selectedSection, setSelectedSection)
                : children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
