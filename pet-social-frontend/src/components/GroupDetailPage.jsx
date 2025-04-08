import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import PostForm from "./PostForm";
import PostCard from "./PostCard";
import { toast } from "react-toastify";

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

  const buttonStyle =
    "text-sm px-4 py-2 border border-purple-400 bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition-all";

  return (
    <div className="flex flex-col lg:flex-row gap-8 bg-[#f3e6f5] p-6 rounded-xl">
      {group && (
        <>
          <div className="w-full lg:w-1/4 flex flex-col items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="mb-4 px-4 py-2 bg-green-500 text-white rounded-lg"
            >
              ← Назад
            </button>

            {group.avatar ? (
              <img
                src={`http://localhost:8000${group.avatar}`}
                alt={group.name}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-purple-200 text-purple-800 font-bold flex items-center justify-center text-sm">
                {group.name[0]?.toUpperCase()}
              </div>
            )}

            <h2 className="text-xl font-bold">{group.name}</h2>

            <button
              onClick={() => navigate(`/profile/${group.creator}`)}
              className={`${buttonStyle} w-full flex items-center justify-center gap-2`}
            >
              👑 Создатель
            </button>

            <button
              onClick={() => {
                if (!showSubscribers) fetchSubscribers();
                setShowSubscribers((prev) => !prev);
              }}
              className={`${buttonStyle} w-full flex items-center justify-center gap-2`}
            >
              👥 Подписчики ({group.subscribers?.length || 0})
            </button>

            {String(group.creator) === String(currentUserId) && (
              <button
                onClick={() => navigate(`/groups/${group.id}/edit`)}
                className={`${buttonStyle} w-full`}
              >
                ✏️ Редактировать
              </button>
            )}

            {String(group.creator) !== String(currentUserId) && (
              isSubscribed ? (
                <button
                  onClick={handleUnsubscribe}
                  className={`${buttonStyle} w-full`}
                >
                  ❌ Отменить подписку
                </button>
              ) : (
                <button
                  onClick={handleSubscribe}
                  className={`${buttonStyle} w-full`}
                >
                  ✅ Подписаться
                </button>
              )
            )}

            {showSubscribers && (
              <div className="bg-white p-4 mt-4 w-full rounded shadow text-left border border-purple-300">
                <h4 className="font-bold mb-2 text-purple-800">Подписчики</h4>
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
                            src={`http://localhost:8000${user.avatar}`}
                            alt={user.username}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-purple-200 text-purple-800 font-bold flex items-center justify-center text-sm">
                            {user.username[0]?.toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm">{user.username}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 space-y-4">
            {group && group.creator && String(group.creator) === String(currentUserId) && (
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
        </>
      )}
    </div>
  );
};

export default GroupDetailPage;
