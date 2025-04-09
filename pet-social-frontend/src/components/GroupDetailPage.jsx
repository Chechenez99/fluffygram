import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import PostForm from "./PostForm";
import PostCard from "./PostCard";
import { toast } from "react-toastify";
import Button from "./Button";

const API_BASE_URL = "http://localhost:8000";

const GroupDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [showSubscribers, setShowSubscribers] = useState(false);
  const [subscribersData, setSubscribersData] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const currentUserId = localStorage.getItem("user_id") || "";

  useEffect(() => {
    fetchGroup();
    fetchPosts();
  }, [id]);

  const fetchGroup = async () => {
    const token = localStorage.getItem("access");
    try {
      const res = await axios.get(`${API_BASE_URL}/api/groups/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroup(res.data);
      setIsSubscribed(res.data.subscribers.includes(Number(currentUserId)));
    } catch (error) {
      console.error("Ошибка при загрузке группы:", error);
    }
  };

  const fetchPosts = async () => {
    const token = localStorage.getItem("access");
    try {
      const res = await axios.get(`${API_BASE_URL}/api/posts/?group=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(res.data);
    } catch (error) {
      console.error("Ошибка при загрузке постов:", error);
    }
  };

  const fetchSubscribers = async () => {
    const token = localStorage.getItem("access");
    try {
      const res = await axios.get(`${API_BASE_URL}/api/groups/${id}/subscribers/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubscribersData(res.data);
    } catch (error) {
      console.error("Ошибка при загрузке подписчиков:", error);
    }
  };

  const handleDeletePost = async (postId) => {
    const token = localStorage.getItem("access");
    try {
      await axios.delete(`${API_BASE_URL}/api/posts/${postId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts((prev) => prev.filter((post) => post.id !== postId));
    } catch (error) {
      console.error("Ошибка при удалении поста:", error);
    }
  };

  const handlePostCreated = async (formData) => {
    const token = localStorage.getItem("access");
    try {
      await axios.post(`${API_BASE_URL}/api/posts/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      fetchPosts();
    } catch (error) {
      console.error("Ошибка при создании поста:", error);
    }
  };

  const handleUnsubscribe = async () => {
    const token = localStorage.getItem("access");
    try {
      await axios.delete(`${API_BASE_URL}/api/groups/${id}/subscribe/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Вы отписались от группы");
      fetchGroup();
    } catch (error) {
      console.error("Ошибка при отписке:", error);
    }
  };

  const handleSubscribe = async () => {
    const token = localStorage.getItem("access");
    try {
      await axios.post(`${API_BASE_URL}/api/groups/${id}/subscribe/`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Вы подписались на группу");
      fetchGroup();
    } catch (error) {
      console.error("Ошибка при подписке:", error);
    }
  };

  return (
    <div className="bg-[#baa6ba] border-4 border-white rounded-2xl shadow-inner p-6">
      {group && (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Левая панель */}
          <div className="w-full lg:w-1/4 bg-[#f3e6f5] p-4 rounded-2xl shadow-md flex flex-col items-center gap-4">
            <Button
              onClick={() => navigate(-1)}
              variant="secondary"
              className="w-full"
            >
              ← Назад
            </Button>

            {group.avatar ? (
              <img
                src={`http://localhost:8000${group.avatar}`}
                alt={group.name}
                className="w-24 h-24 rounded-full object-cover border-2 border-white shadow"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-purple-200 text-purple-800 font-bold flex items-center justify-center text-lg border shadow">
                {group.name[0]?.toUpperCase()}
              </div>
            )}

            <h2 className="text-xl font-bold text-[#4b3f4e] text-center">{group.name}</h2>

            <Button
              onClick={() => navigate(`/profile/${group.creator}`)}
              variant="primary"
              className="w-full"
            >
              Создатель
            </Button>

            <Button
              onClick={() => {
                if (!showSubscribers) fetchSubscribers();
                setShowSubscribers((prev) => !prev);
              }}
              variant="secondary"
              className="w-full"
            >
              Подписчики ({group.subscribers?.length || 0})
            </Button>

            {String(group.creator) === String(currentUserId) ? (
              <Button
                onClick={() => navigate(`/groups/${group.id}/edit`)}
                variant="lightGreen"
                className="w-full"
              >
                ✏️ Редактировать
              </Button>
            ) : isSubscribed ? (
              <Button
                onClick={handleUnsubscribe}
                variant="danger"
                className="w-full"
              >
                 Отписаться
              </Button>
            ) : (
              <Button
                onClick={handleSubscribe}
                variant="lightGreen"
                className="w-full"
              >
                Подписаться
              </Button>
            )}

            {showSubscribers && (
              <div className="bg-white p-4 mt-4 w-full rounded-2xl border border-[#baa6ba] shadow">
                <h4 className="font-bold mb-2 text-[#4b3f4e]">Подписчики</h4>
                {subscribersData.length === 0 ? (
                  <p className="text-sm text-gray-500">Нет подписчиков</p>
                ) : (
                  <ul className="space-y-2">
                    {subscribersData.map((user) => (
                      <li
                        key={user.id}
                        className="flex items-center gap-2 cursor-pointer hover:underline"
                        onClick={() => navigate(`/profile/${user.id}`)}
                      >
                        {user.avatar ? (
                          <img
                            src={user.avatar.startsWith("http") ? user.avatar : `http://localhost:8000${user.avatar}`}
                            alt={user.username}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-purple-200 text-purple-800 font-bold flex items-center justify-center text-sm">
                            {user.username[0]?.toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm text-[#4b3f4e]">{user.username}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Правая часть: посты */}
          <div className="flex-1 space-y-4">
            {group.creator && String(group.creator) === String(currentUserId) && (
              <PostForm onPostSubmit={handlePostCreated} groupId={id} />
            )}

            {posts.length > 0 ? (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  hideAuthor={true}
                  onDelete={handleDeletePost}
                />
              ))
            ) : (
              <p className="text-gray-500">Постов нет</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDetailPage;
