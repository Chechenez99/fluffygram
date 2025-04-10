import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import Button from "./Button";
import { fetchFriendRequests as updateSidebarFriendRequests } from "./Sidebar";

const API_BASE_URL = "http://localhost:8000";

const FriendsPage = ({ setFriendRequestsCount }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [friends, setFriends] = useState([]);

  const currentUserId = Number(localStorage.getItem("user_id"));

  useEffect(() => {
    fetchFriendRequests();
    fetchFriends();
  }, []);

  const fetchFriendRequests = async () => {
    try {
      const token = localStorage.getItem("access");
      const [inRes, outRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/users/friend-requests/incoming/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE_URL}/api/users/friend-requests/outgoing/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setIncomingRequests(inRes.data);
      setOutgoingRequests(outRes.data);
      updateSidebarFriendRequests(setFriendRequestsCount);
    } catch (error) {
      console.error("Ошибка загрузки заявок в друзья:", error);
    }
  };

  const fetchFriends = async () => {
    try {
      const token = localStorage.getItem("access");
      const res = await axios.get(`${API_BASE_URL}/api/users/friends/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFriends(res.data);
    } catch (error) {
      console.error("Ошибка загрузки списка друзей:", error);
    }
  };

const handleSearch = async () => {
  const token = localStorage.getItem("access");
  if (!token) {
    toast.error("Вы не авторизованы");
    return;
  }

  try {
    // Загружаем друзей и исходящие заявки отдельно
    const [friendsRes, outgoingRes, searchRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/api/users/friends/`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get(`${API_BASE_URL}/api/users/friend-requests/outgoing/`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get(`${API_BASE_URL}/api/users/search/?search=${searchQuery}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const latestFriends = friendsRes.data;
    const latestOutgoing = outgoingRes.data;

    setFriends(latestFriends);
    setOutgoingRequests(latestOutgoing); // обновляем их тоже, чтобы всё синхронно

    const updated = searchRes.data
      .filter((user) => user.id !== currentUserId)
      .map((user) => {
        const alreadyRequested = latestOutgoing.some(
          (fr) => fr.receiver.id === user.id
        );
        const isFriend = latestFriends.some((f) => f.id === user.id);
        return { ...user, requestSent: alreadyRequested, isFriend };
      });

    setUsers(updated);
  } catch (error) {
    console.error("Ошибка поиска пользователей:", error);
    toast.error("Ошибка поиска пользователей");
  }
};


  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim() !== "") {
        handleSearch();
      } else {
        setUsers([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

const sendFriendRequest = async (receiverId) => {
  console.log("📦 отправка заявки на ID:", receiverId);

  if (!receiverId) return;

  try {
    const token = localStorage.getItem("access");
    await axios.post(
      `${API_BASE_URL}/api/users/friend-requests/`,
      { receiver: receiverId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    toast.success("Заявка отправлена!");

    // 1. Обновим список заявок для сайдбара
    fetchFriendRequests();

    // 2. Обновим UI локально — найдем пользователя и поставим requestSent = true
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === receiverId ? { ...user, requestSent: true } : user
      )
    );

  } catch (error) {
    toast.error("Ошибка при отправке заявки");
  }
};


const removeFriend = async (friendId) => {
  try {
    const token = localStorage.getItem("access");
    await axios.delete(`${API_BASE_URL}/api/users/friends/remove/${friendId}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    toast.success("Друг удалён");

    fetchFriends();
    fetchFriendRequests();

    // ❗ Только если есть активный поиск, обновим результаты
    if (searchQuery.trim() !== "") {
      handleSearch();
    } else {
      setUsers([]); // иначе очистим список найденных
    }

  } catch (error) {
    toast.error("Ошибка удаления друга");
  }
};


  const acceptRequest = async (reqId) => {
    try {
      const token = localStorage.getItem("access");
      await axios.put(
        `${API_BASE_URL}/api/users/friend-requests/${reqId}/`,
        { accepted: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Заявка принята");
      fetchFriendRequests();
      fetchFriends();
    } catch {
      toast.error("Ошибка при принятии заявки");
    }
  };

  const rejectRequest = async (reqId) => {
    try {
      const token = localStorage.getItem("access");
      await axios.delete(`${API_BASE_URL}/api/users/friend-requests/${reqId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Заявка отклонена");
      fetchFriendRequests();
    } catch {
      toast.error("Ошибка при отклонении заявки");
    }
  };

  return (
    <div className="bg-[#f3e6f5] p-6 rounded-xl">
      <h2 className="text-2xl font-bold mb-4">Друзья</h2>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Поиск по имени"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-2 border rounded-2xl mr-2"
        />
        <Button onClick={handleSearch} variant="lightGreen">Искать</Button>
      </div>

      {/* Поиск */}
      <div className="mb-6">
        {users.map((user) => (
          <div key={user.id} className="flex justify-between items-center border rounded p-2 mb-2">
            <div className="flex items-center gap-3">
              <img
                src={user.avatar || "/default-avatar.png"}
                alt={user.username}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <Link to={`/profile/${user.id}`} className="font-semibold hover:underline">
                  {user.username}
                </Link>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>
            {user.isFriend ? (
              <Button onClick={() => removeFriend(user.id)} variant="danger">Удалить из друзей</Button>
            ) : user.requestSent ? (
              <Button disabled variant="disabled">Заявка отправлена</Button>
            ) : (
              <Button onClick={() => sendFriendRequest(user.id)} variant="lightGreen">Добавить в друзья</Button>
            )}
          </div>
        ))}
      </div>

      {/* Друзья */}
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2">Ваши друзья ({friends.length})</h3>
        {friends.map((f) => (
          <div key={f.id} className="flex justify-between items-center border rounded p-2 mb-2">
            <div className="flex items-center gap-3">
              <img
                src={f.avatar || "/default-avatar.png"}
                alt={f.username}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <Link to={`/profile/${f.id}`} className="font-semibold hover:underline">
                  {f.username}
                </Link>
                <p className="text-sm text-gray-600">{f.email}</p>
              </div>
            </div>
            <Button onClick={() => removeFriend(f.id)} variant="danger">Удалить</Button>
          </div>
        ))}
      </div>

      {/* Входящие заявки */}
      <div>
        <h3 className="text-xl font-bold mb-2">Входящие заявки ({incomingRequests.length})</h3>
        {incomingRequests.map((req) => (
          <div key={req.id} className="flex justify-between items-center border rounded p-2 mb-2">
            <div className="flex items-center gap-3">
              <img
                src={req.sender.avatar || "/default-avatar.png"}
                alt={req.sender.username}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <Link to={`/profile/${req.sender.id}`} className="font-semibold hover:underline">
                  {req.sender.username}
                </Link>
                <p className="text-sm text-gray-600">{req.created_at.slice(0, 10)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => acceptRequest(req.id)} variant="lightGreen">Принять</Button>
              <Button onClick={() => rejectRequest(req.id)} variant="danger">Отклонить</Button>
            </div>
          </div>
        ))}
        {incomingRequests.length === 0 && <p>Нет входящих заявок</p>}
      </div>
    </div>
  );
};

export default FriendsPage;
