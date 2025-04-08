import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

const API_BASE_URL = "http://localhost:8000";

const FriendsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    fetchFriendRequests();
    fetchFriends();
  }, []);

  const fetchFriendRequests = async () => {
    try {
      const token = localStorage.getItem("access");
      const res = await axios.get(`${API_BASE_URL}/api/friend-requests/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFriendRequests(res.data);
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
      const res = await axios.get(
        `${API_BASE_URL}/api/search/?search=${searchQuery}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updated = res.data.map((user) => {
        const alreadyRequested = friendRequests.some(
          (fr) => fr.sender === user.id || fr.receiver === user.id
        );
        const isFriend = friends.some(f => f.id === user.id);
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
    try {
      const token = localStorage.getItem("access");
      await axios.post(
        `${API_BASE_URL}/api/friend-requests/`,
        { receiver: receiverId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Заявка отправлена!");
      
      // 👇 обновим локально статус
      setUsers(prev =>
        prev.map(user =>
          user.id === receiverId ? { ...user, requestSent: true } : user
        )
      );

      fetchFriendRequests(); // на всякий случай тоже обновим
    } catch (error) {
      console.error("Ошибка отправки заявки:", error);
      toast.error("Ошибка отправки заявки");
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
      handleSearch(); // тоже обновим
    } catch (error) {
      console.error("Ошибка удаления друга:", error);
      toast.error("Ошибка удаления друга");
    }
  };

  return (
    <div className="bg-[#f3e6f5] p-6 rounded-xl">
      <h2 className="text-2xl font-bold mb-4">Друзья</h2>

      {/* Поиск */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Поиск по имени"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-2 border rounded mr-2"
        />
        <button onClick={handleSearch} className="bg-green-500 text-white p-2 rounded">
          Искать
        </button>
      </div>

      {/* Найденные пользователи */}
      <div className="mb-6">
        {users.length > 0 ? (
          users.map((user) => (
            <div key={user.id} className="flex items-center justify-between border p-2 rounded mb-2">
              <div className="flex items-center gap-3">
                {user.avatar ? (
                  <img
                    src={user.avatar.startsWith("http") ? user.avatar : `${API_BASE_URL}${user.avatar}`}
                    alt={user.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center font-bold text-sm">
                    {user.username[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <Link to={`/profile/${user.id}`}>
                    <p className="font-semibold hover:underline">{user.username}</p>
                  </Link>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>

              {user.isFriend ? (
                <button
                  onClick={() => removeFriend(user.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  Удалить из друзей
                </button>
              ) : user.requestSent ? (
                <button disabled className="bg-gray-400 text-white px-3 py-1 rounded">
                  Заявка отправлена
                </button>
              ) : (
                <button
                  onClick={() => sendFriendRequest(user.id)}
                  className="bg-green-500 text-white px-3 py-1 rounded"
                >
                  Добавить в друзья
                </button>
              )}
            </div>
          ))
        ) : (
          <p>Ничего не найдено</p>
        )}
      </div>

      {/* Список друзей */}
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2">Ваши друзья ({friends.length})</h3>
        {friends.length > 0 ? (
          friends.map((friend) => (
            <div key={friend.id} className="flex items-center justify-between border p-2 rounded mb-2">
              <div className="flex items-center gap-3">
                {friend.avatar ? (
                  <img
                    src={friend.avatar.startsWith("http") ? friend.avatar : `${API_BASE_URL}${friend.avatar}`}
                    alt={friend.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center font-bold text-sm">
                    {friend.username[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <Link to={`/profile/${friend.id}`}>
                    <p className="font-semibold hover:underline">{friend.username}</p>
                  </Link>
                  <p className="text-sm text-gray-600">{friend.email}</p>
                </div>
              </div>
              <button
                onClick={() => removeFriend(friend.id)}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                Удалить из друзей
              </button>
            </div>
          ))
        ) : (
          <p>У вас пока нет друзей</p>
        )}
      </div>

      {/* Входящие заявки */}
      <div>
        <h3 className="text-xl font-bold mb-2">Заявки в друзья ({friendRequests.length})</h3>
        {friendRequests.length > 0 ? (
          friendRequests.map((req) => (
            <div key={req.id} className="flex items-center justify-between border p-2 rounded mb-2">
              <div className="flex items-center gap-3">
                {req.sender_avatar ? (
                  <img
                    src={req.sender_avatar.startsWith("http") ? req.sender_avatar : `${API_BASE_URL}${req.sender_avatar}`}
                    alt={req.sender_username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center font-bold text-sm">
                    {req.sender_username[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <Link to={`/profile/${req.sender}`}>
                    <p className="font-semibold hover:underline">{req.sender_username}</p>
                  </Link>
                  <p className="text-sm text-gray-600">{req.created_at}</p>
                </div>
              </div>
              <div>
                <button
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem("access");
                      await axios.put(
                        `${API_BASE_URL}/api/friend-requests/${req.id}/`,
                        { accepted: true },
                        { headers: { Authorization: `Bearer ${token}` } }
                      );
                      toast.success("Заявка принята");
                      fetchFriendRequests();
                      fetchFriends();
                    } catch (error) {
                      toast.error("Ошибка принятия заявки");
                    }
                  }}
                  className="bg-green-500 text-white px-3 py-1 rounded mr-2"
                >
                  Принять
                </button>
                <button
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem("access");
                      await axios.delete(
                        `${API_BASE_URL}/api/friend-requests/${req.id}/`,
                        { headers: { Authorization: `Bearer ${token}` } }
                      );
                      toast.success("Заявка отклонена");
                      fetchFriendRequests();
                    } catch (error) {
                      toast.error("Ошибка отклонения заявки");
                    }
                  }}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  Отклонить
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>Нет входящих заявок</p>
        )}
      </div>
    </div>
  );
};

export default FriendsPage;
