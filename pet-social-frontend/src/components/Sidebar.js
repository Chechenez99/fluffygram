import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Button from "./Button";

const Sidebar = ({ selectedSection, setSelectedSection, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [friendRequestsCount, setFriendRequestsCount] = useState(0);

  useEffect(() => {
    const fetchFriendRequests = async () => {
      try {
        const token = localStorage.getItem("access");
        const res = await axios.get("http://localhost:8000/api/friend-requests/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const incoming = res.data.filter((req) => !req.accepted);
        setFriendRequestsCount(incoming.length);
      } catch (error) {
        console.error("Ошибка загрузки заявок в друзья:", error);
      }
    };
    fetchFriendRequests();
  }, []);

  const menuItems = [
    { label: "Профиль", section: "profile", path: "/profile" },
    { label: "Лента новостей", section: "news", path: "/news" },
    { label: "Друзья", section: "friends", path: "/friends" },
    { label: "Личные сообщения", section: "messages", path: "/messages" },
    { label: "Группы", section: "groups", path: "/groups" },
    { label: "Карта ветсервисов", section: "vets", path: "/map" },
  ];

  const handleClick = (item) => {
    if (item.path === "/profile") {
      setSelectedSection(item.section);
      navigate("/profile");
    } else {
      navigate(item.path);
    }
  };

  return (
    <div className="bg-white shadow-md p-4 rounded-2xl w-56 flex flex-col justify-between min-h-full">
      <ul className="space-y-3">
        {menuItems.map((item) => {
          const isActive =
            (location.pathname === "/profile" && selectedSection === item.section) ||
            (location.pathname !== "/profile" && location.pathname === item.path);

          return (
            <li key={item.section} className="relative">
              <Button
                onClick={() => handleClick(item)}
                variant={isActive ? 'primary' : 'secondary'} // Передаем правильный вариант
                className="w-full text-left px-4 py-2 rounded-xl transition-colors"
              >
                {item.label}
                {item.section === "friends" && friendRequestsCount > 0 && (
                <span className="absolute top-2.5 right-2 bg-white text-[#b46db6] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md border border-[#b46db6]">
                  {friendRequestsCount}
                </span>

                )}
              </Button>
            </li>
          );
        })}
      </ul>

      {/* Кнопка выхода */}
      <Button
        onClick={onLogout}
        variant="danger"
        className="mt-6 px-4 py-2 rounded-xl hover:bg-red-600 transition"
      >
        Выйти
      </Button>
    </div>
  );
};

export default Sidebar;
