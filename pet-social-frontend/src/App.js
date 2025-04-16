import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import AuthPage from "./components/AuthPage";
import ProfilePage from "./components/ProfilePage";
import UserProfilePage from "./components/UserProfilePage";
import FriendsPage from "./components/FriendsPage";
import GroupsPage from "./components/GroupsPage";
import MainLayout from "./components/MainLayout";
import { ToastContainer } from "react-toastify";
import NewsFeedPage from "./components/NewsFeed";
import GroupCreatePage from "./components/GroupCreatePage";
import GroupEditPage from "./components/GroupEditPage";
import GroupDetailPage from "./components/GroupDetailPage";
import ChatPage from "./components/ChatPage";
import DialogsPage from "./components/DialogsPage";
import MapPage from "./components/MapPage";
import "react-toastify/dist/ReactToastify.css";

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem("access");
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

const AppWrapper = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("access"));

  const [friendRequestsCount, setFriendRequestsCount] = useState(0);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const token = localStorage.getItem("access");
  const notificationsSocketRef = useRef(null);

  useEffect(() => {
    setIsLoggedIn(!!token);
  }, [token]);

  useEffect(() => {
    if (token) {
      notificationsSocketRef.current = new WebSocket(`ws://localhost:8000/ws/notifications/?token=${token}`);

      notificationsSocketRef.current.onopen = () => {
        console.log("Notifications WebSocket подключён");
      };

      notificationsSocketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "new_group_chat") {
          window.dispatchEvent(new Event("newGroupChat"));
        }
      };

      notificationsSocketRef.current.onerror = (e) => {
        console.error("Notifications WebSocket ошибка:", e);
      };

      notificationsSocketRef.current.onclose = () => {
        console.log("Notifications WebSocket закрыт");
      };
    }

    return () => notificationsSocketRef.current?.close();
  }, [token]);

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
          path="/"
          element={
            isLoggedIn ? (
              <Navigate to="/profile" replace />
            ) : (
              <AuthPage onLogin={() => setIsLoggedIn(true)} />
            )
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <MainLayout
                friendRequestsCount={friendRequestsCount}
                setFriendRequestsCount={setFriendRequestsCount}
                newMessagesCount={newMessagesCount}
                setNewMessagesCount={setNewMessagesCount}
              >
                {(selectedSection, setSelectedSection) => (
                  <ProfilePage
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
          path="/profile/:id"
          element={
            <ProtectedRoute>
              <MainLayout
                friendRequestsCount={friendRequestsCount}
                setFriendRequestsCount={setFriendRequestsCount}
                newMessagesCount={newMessagesCount}
                setNewMessagesCount={setNewMessagesCount}
              >
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
              <MainLayout
                friendRequestsCount={friendRequestsCount}
                setFriendRequestsCount={setFriendRequestsCount}
                newMessagesCount={newMessagesCount}
                setNewMessagesCount={setNewMessagesCount}
              >
                <NewsFeedPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/friends"
          element={
            <ProtectedRoute>
              <MainLayout
                friendRequestsCount={friendRequestsCount}
                setFriendRequestsCount={setFriendRequestsCount}
                newMessagesCount={newMessagesCount}
                setNewMessagesCount={setNewMessagesCount}
              >
                {(selectedSection, setSelectedSection) => (
                  <FriendsPage
                    selectedSection={selectedSection}
                    setSelectedSection={setSelectedSection}
                    setFriendRequestsCount={setFriendRequestsCount}
                  />
                )}
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dialogs"
          element={
            <ProtectedRoute>
              <MainLayout
                friendRequestsCount={friendRequestsCount}
                setFriendRequestsCount={setFriendRequestsCount}
                newMessagesCount={newMessagesCount}
                setNewMessagesCount={setNewMessagesCount}
              >
                {(selectedSection, setSelectedSection) => (
                  <DialogsPage
                    selectedSection={selectedSection}
                    setSelectedSection={setSelectedSection}
                    setNewMessagesCount={setNewMessagesCount}
                  />
                )}
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat/:dialogId"
          element={
            <ProtectedRoute>
              <MainLayout
                friendRequestsCount={friendRequestsCount}
                setFriendRequestsCount={setFriendRequestsCount}
                newMessagesCount={newMessagesCount}
                setNewMessagesCount={setNewMessagesCount}
              >
                {(selectedSection, setSelectedSection) => (
                  <ChatPage
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
              <MainLayout
                friendRequestsCount={friendRequestsCount}
                setFriendRequestsCount={setFriendRequestsCount}
                newMessagesCount={newMessagesCount}
                setNewMessagesCount={setNewMessagesCount}
              >
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
          path="/groups/create"
          element={
            <ProtectedRoute>
              <MainLayout
                friendRequestsCount={friendRequestsCount}
                setFriendRequestsCount={setFriendRequestsCount}
                newMessagesCount={newMessagesCount}
                setNewMessagesCount={setNewMessagesCount}
              >
                <GroupCreatePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/groups/:id"
          element={
            <ProtectedRoute>
              <MainLayout
                friendRequestsCount={friendRequestsCount}
                setFriendRequestsCount={setFriendRequestsCount}
                newMessagesCount={newMessagesCount}
                setNewMessagesCount={setNewMessagesCount}
              >
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
          path="/groups/:id/edit"
          element={
            <ProtectedRoute>
              <MainLayout
                friendRequestsCount={friendRequestsCount}
                setFriendRequestsCount={setFriendRequestsCount}
                newMessagesCount={newMessagesCount}
                setNewMessagesCount={setNewMessagesCount}
              >
                <GroupEditPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/map"
          element={
            <ProtectedRoute>
              <MainLayout
                friendRequestsCount={friendRequestsCount}
                setFriendRequestsCount={setFriendRequestsCount}
                newMessagesCount={newMessagesCount}
                setNewMessagesCount={setNewMessagesCount}
              >
                <MapPage />
              </MainLayout>
            </ProtectedRoute>
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
