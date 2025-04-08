import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import AuthPage from "./components/AuthPage";
import ProfilePage from "./components/ProfilePage";
import UserProfilePage from "./components/UserProfilePage";
import FriendsPage from "./components/FriendsPage";
import GroupsPage from "./components/GroupsPage";
import GroupDetailPage from "./components/GroupDetailPage";
import MainLayout from "./components/MainLayout";
import { ToastContainer } from "react-toastify";
import NewsFeedPage from "./components/NewsFeed";
import GroupCreatePage from "./components/GroupCreatePage";
import GroupEditPage from "./components/GroupEditPage";
import "react-toastify/dist/ReactToastify.css";

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem("access");
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

const AppWrapper = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("access"));

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("access"));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setIsLoggedIn(false);
    navigate("/");
  };

  return (
    <>
      <Routes>
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <MainLayout>
                {(selectedSection, setSelectedSection) => {
                  if (selectedSection !== "profile") {
                    setSelectedSection("profile");
                  }
                  return (
                    <ProfilePage
                      onLogout={handleLogout}
                      selectedSection={selectedSection}
                      setSelectedSection={setSelectedSection}
                    />
                  );
                }}
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:id"
          element={
            <ProtectedRoute>
              <MainLayout>
                {(selectedSection, setSelectedSection) => (
                  <UserProfilePage
                    onLogout={handleLogout}
                    selectedSection={selectedSection}
                    setSelectedSection={setSelectedSection}
                  />
                )}
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/news"
          element={
            <ProtectedRoute>
              <MainLayout>
                <NewsFeedPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/friends"
          element={
            <ProtectedRoute>
              <MainLayout>
                {(selectedSection, setSelectedSection) => (
                  <FriendsPage
                    selectedSection={selectedSection}
                    setSelectedSection={setSelectedSection}
                  />
                )}
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/groups"
          element={
            <ProtectedRoute>
              <MainLayout>
                {(selectedSection, setSelectedSection) => (
                  <GroupsPage
                    selectedSection={selectedSection}
                    setSelectedSection={setSelectedSection}
                  />
                )}
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/groups/:id"
          element={
            <ProtectedRoute>
              <MainLayout>
                {(selectedSection, setSelectedSection) => (
                  <GroupDetailPage
                    selectedSection={selectedSection}
                    setSelectedSection={setSelectedSection}
                  />
                )}
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/groups/create"
          element={
            <ProtectedRoute>
              <MainLayout>
                <GroupCreatePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/groups/:id/edit"
          element={
            <ProtectedRoute>
              <MainLayout>
                <GroupEditPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={
            isLoggedIn ? (
              <Navigate to="/profile" replace />
            ) : (
              <AuthPage onLogin={() => setIsLoggedIn(true)} />
            )
          }
        />
      </Routes>
      <ToastContainer />
    </>
  );
};

const App = () => (
  <BrowserRouter>
    <AppWrapper />
  </BrowserRouter>
);

export default App;
