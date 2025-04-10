import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import PostCard from "./PostCard";
import PetCard from "./PetCard";
import { toast } from "react-toastify";
import Button from "./Button";
import { useNavigate } from "react-router-dom"

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

        const meRes = await axios.get(`${API_BASE_URL}/api/users/profile/me/`, {
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
          axios.get(`${API_BASE_URL}/api/users/friend-requests/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setUser(userRes.data);
        setPets(petsRes.data);
        setIsFriend(friendsRes.data.map(f => f.id).includes(Number(id)));
        setPosts(postsRes.data);

const myId = Number(localStorage.getItem("user_id"));
const hasRequest = requestsRes.data.some(req =>
  (req.sender.id === myId && req.receiver.id === Number(id)) ||
  (req.receiver.id === myId && req.sender.id === Number(id))
);


        setRequestSent(hasRequest);

      } catch (err) {
  console.error(err);
  setError("Ошибка загрузки профиля");

  // Проверим, не ошибка ли авторизации (401)
  if (err.response?.status === 401) {
    toast.error("Сессия истекла, войдите снова");
    onLogout();
  }
}

    };

    fetchAll();
  }, [id, onLogout]);

  const handleSendRequest = async () => {
    try {
      const token = localStorage.getItem("access");
      await axios.post(`${API_BASE_URL}/api/users/friend-requests/`, {
        receiver: id
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequestSent(true);
    } catch (err) {
      console.error(err);
    }
  };

const navigate = useNavigate(); // внутри компонента

const handleStartDialog = async () => {
  try {
    const token = localStorage.getItem("access");
    const res = await axios.post(`${API_BASE_URL}/api/direct_messages/dialogs/start/`, {
      recipient_id: id,
    }, {
      headers: { Authorization: `Bearer ${token}` },
    });

    navigate(`/chat/${res.data.id}`);
  } catch (err) {
    console.error(err);
    toast.error("Ошибка при создании диалога");
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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#baa6ba]">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#baa6ba]">
        <p className="text-green-700">Загрузка профиля...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#baa6ba] border-4 border-white rounded-2xl shadow-inner p-6">
      <div className="bg-[#f3e6f5] p-6 rounded-2xl">
        <Button
          onClick={() => window.history.back()}
          variant="secondary"
          className="mb-4"
        >
          ← Назад
        </Button>

        <div className="flex justify-between items-center mb-6 flex-wrap">
          <div className="flex items-center gap-4">
            {user.avatar ? (
              <img src={user.avatar} alt="Аватар" className="w-16 h-16 rounded-full object-cover border" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-purple-200 text-purple-800 flex items-center justify-center font-bold border text-xl">
                {user.username[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-[#4b3f4e]">{user.username}</h2>
              <p className="text-sm text-[#6e4c77]">{user.email}</p>
              {user.city && (
                <p className="text-sm text-[#6e4c77]">📍 {user.city}</p>
              )}
            </div>
          </div>

          {currentUserId !== Number(id) && (
            <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
              {isFriend ? (
                <>
                  <Button variant="purple" onClick={handleStartDialog}>
                    Сообщение
                  </Button>
                  <Button variant="danger" onClick={handleRemoveFriend}>
                    Удалить
                  </Button>
                </>
              ) : requestSent ? (
                <Button variant="secondary" disabled>
                  Заявка отправлена
                </Button>
              ) : (
                <Button variant="lightGreen" onClick={handleSendRequest}>
                  Добавить в друзья
                </Button>
              )}
            </div>
          )}
        </div>

        {user.bio && <p className="mb-6 text-[#4b3f4e]">{user.bio}</p>}

        <div className="mt-8">
          <h3 className="text-xl font-semibold text-[#4b3f4e] mb-4">Питомцы</h3>
          {pets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pets.map((pet) => (
                <PetCard key={pet.id} pet={pet} />
              ))}
            </div>
          ) : (
            <p className="text-[#6e4c77]">У пользователя пока нет питомцев</p>
          )}
        </div>

        <div className="mt-8">
          <h3 className="text-xl font-semibold text-[#4b3f4e] mb-4">Посты</h3>
          {posts.length > 0 ? (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <p className="text-[#6e4c77]">Пользователь ещё не создавал постов</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
