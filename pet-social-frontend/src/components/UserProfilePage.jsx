import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import PostCard from "./PostCard";
import PetCard from "./PetCard";
import { toast } from "react-toastify";

const API_BASE_URL = "http://localhost:8000";

const UserProfilePage = ({ onLogout }) => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [pets, setPets] = useState([]);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isFriend, setIsFriend] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

useEffect(() => {
  const fetchAll = async () => {
    try {
      const token = localStorage.getItem("access");
      if (!token) {
        toast.error("Вы не авторизованы.");
        onLogout();
        return;
      }

      const meRes = await axios.get(`${API_BASE_URL}/api/profile/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentUserId(meRes.data.id);

      const [userRes, postsRes, petsRes, friendsRes, requestsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/users/${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE_URL}/api/posts/?user=${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE_URL}/api/pets/?user_id=${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE_URL}/api/users/friends/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE_URL}/api/friend-requests/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setUser(userRes.data);
      setPets(petsRes.data);
      setIsFriend(friendsRes.data.map(f => f.id).includes(Number(id)));

      setPosts(postsRes.data);

      const hasRequest = requestsRes.data.some(req =>
        (req.sender === Number(id) || req.receiver === Number(id))
      );
      setRequestSent(hasRequest);

    } catch (err) {
      console.error(err);
      setError("Ошибка загрузки профиля");
      onLogout();
    }
  };

  fetchAll();
}, [id, onLogout]);


  const handleSendRequest = async () => {
    try {
      const token = localStorage.getItem("access");
      await axios.post(`${API_BASE_URL}/api/friend-requests/`, {
        receiver: id
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequestSent(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveFriend = async () => {
    try {
      const token = localStorage.getItem("access");
      await axios.delete(`${API_BASE_URL}/api/users/friends/remove/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsFriend(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogoutClick = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    onLogout();
    toast.success("Вы вышли из системы!");
  };

  if (error) return (
    <div className="flex items-center justify-center min-h-screen bg-[#baa6ba]">
      <p className="text-red-500">{error}</p>
    </div>
  );

  if (!user) return (
    <div className="flex items-center justify-center min-h-screen bg-[#baa6ba]">
      <p className="text-green-700">Загрузка профиля...</p>
    </div>
  );

  return (
    <div className="bg-[#f3e6f5] p-6 rounded-xl">
      <button
        onClick={() => window.history.back()}
        className="mb-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
      >
        ← Назад
      </button>

      <div className="flex justify-between items-center mb-6 flex-wrap">
        <div className="flex items-center gap-4">
          {user.avatar ? (
            <img src={user.avatar} alt="Аватар" className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 bg-green-100 rounded-full" />
          )}
          <div>
            <h2 className="text-2xl font-bold text-green-700">{user.username}</h2>
            <p className="text-green-600 text-sm">{user.email}</p>
            {user.city && <p className="text-green-500 text-sm">📍 {user.city}</p>}
          </div>
        </div>

        {currentUserId !== Number(id) && (
          <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
            {isFriend ? (
              <>
                <button
                  onClick={() => alert("Переход в ЛС пока не реализован")}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
                >
                  Сообщение
                </button>
                <button
                  onClick={handleRemoveFriend}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition"
                >
                  Удалить
                </button>
              </>
            ) : requestSent ? (
              <button className="bg-gray-400 text-white px-4 py-2 rounded-lg" disabled>
                Заявка отправлена
              </button>
            ) : (
              <button
                onClick={handleSendRequest}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg shadow hover:bg-green-600 transition"
              >
                Добавить
              </button>
            )}
          </div>
        )}
      </div>

      {user.bio && <p className="mb-6 text-green-700">{user.bio}</p>}

      <div className="mt-8">
        <h3 className="text-xl font-semibold text-green-700 mb-4">Питомцы</h3>
        {pets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pets.map((pet) => (
              <PetCard key={pet.id} pet={pet} />
            ))}
          </div>
        ) : (
          <p className="text-green-500">У пользователя пока нет питомцев</p>
        )}
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-semibold text-green-700 mb-4">Посты</h3>
        {posts.length > 0 ? (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        ) : (
          <p className="text-green-500">Пользователь ещё не создавал постов</p>
        )}
      </div>

      <div className="text-center mt-10 border-t pt-6">
      </div>
    </div>
  );
};

export default UserProfilePage;
