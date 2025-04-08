import React, { useState, useEffect } from "react";
import axios from "axios";
import PetCard from "./PetCard";
import PetForm from "./PetForm";
import { toast } from "react-toastify";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "./dialog.js";
import PostForm from "./PostForm";
import PostCard from "./PostCard";
import FriendsPage from "./FriendsPage";
import GroupsPage from "./GroupsPage";

const API_BASE_URL = "http://localhost:8000";

const ProfilePage = ({ onLogout, selectedSection, setSelectedSection }) => {
  const [user, setUser] = useState(null);
  const [pets, setPets] = useState([]);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAddPetDialogOpen, setIsAddPetDialogOpen] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [newsPosts, setNewsPosts] = useState([]);
  const [hashtagQuery, setHashtagQuery] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("access");
        if (!token) {
          toast.error("Вы не авторизованы.");
          onLogout();
          return;
        }

        const [userRes, petsRes, postsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/profile/me/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE_URL}/api/pets/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE_URL}/api/posts/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setUser(userRes.data);
        setPets(petsRes.data);

        const allPosts = postsRes.data;
        const username = userRes.data.username;
        setUserPosts(allPosts.filter(post => post.username === username));
        setNewsPosts(allPosts.filter(post => post.username !== username));
      } catch (error) {
        console.error("Ошибка:", error);
        setError(error.message);
        toast.error("Ошибка загрузки данных");
        onLogout();
      }
    };

    fetchUserData();
  }, [onLogout]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Файл не является изображением");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Размер файла превышает 5MB");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const token = localStorage.getItem("access");
      const res = await axios.patch(`${API_BASE_URL}/api/profile/me/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setUser(res.data);
      toast.success("Аватар обновлен");
    } catch {
      toast.error("Ошибка обновления аватара");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUserPostSubmit = async (newPostData) => {
    try {
      const token = localStorage.getItem("access");
      const res = await axios.post(`${API_BASE_URL}/api/posts/`, newPostData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      const newPost = { ...res.data, username: user?.username };
      setUserPosts(prev => [newPost, ...prev]);
      toast.success("Пост создан");
    } catch (error) {
      console.error("Ошибка создания поста:", error);
      toast.error("Не удалось создать пост");
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      const token = localStorage.getItem("access");
      await axios.delete(`${API_BASE_URL}/api/posts/${postId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserPosts(prev => prev.filter(post => post.id !== postId));
      toast.success("Пост удален");
    } catch {
      toast.error("Ошибка удаления поста");
    }
  };

  const handleHashtagSearch = async () => {
    try {
      const token = localStorage.getItem("access");
      const res = await axios.get(`${API_BASE_URL}/api/posts/?hashtag=${hashtagQuery}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNewsPosts(res.data);
    } catch {
      toast.error("Ошибка поиска по хэштегам");
    }
  };

  const renderSection = () => {
    switch (selectedSection) {
      case "profile":
        return (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3">
              <div className="text-center mb-8">
                <div className="relative inline-block mb-4">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-green-100 mx-auto">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="Аватар" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-green-400">👤</div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-green-500 text-white p-2 rounded-full cursor-pointer">
                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" disabled={isUploading} />
                    📷
                  </label>
                </div>
                <h2 className="text-3xl font-semibold text-green-700">{user?.username}</h2>
                <p className="text-green-600">{user?.email}</p>
                {user?.city && <p className="text-green-500 mt-1">📍 {user.city}</p>}
                {user?.bio && <p className="text-green-700 mt-4">{user.bio}</p>}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-green-700 mb-2">Ваши питомцы</h3>
                <button onClick={() => setIsAddPetDialogOpen(true)} className="mb-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                  + Добавить питомца
                </button>
                <Dialog open={isAddPetDialogOpen} onOpenChange={setIsAddPetDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Добавить нового питомца</DialogTitle>
                      <DialogClose onClick={() => setIsAddPetDialogOpen(false)} />
                    </DialogHeader>
                    <PetForm onSuccess={() => setIsAddPetDialogOpen(false)} />
                  </DialogContent>
                </Dialog>
                {pets.length > 0 ? (
                  pets.map((pet) => <PetCard key={pet.id} pet={pet} />)
                ) : (
                  <p className="text-green-500 text-center">Нет питомцев</p>
                )}
              </div>
            </div>
            <div className="md:w-2/3 space-y-6  ">
              <h3 className="text-2xl font-semibold text-green-700">Ваши посты</h3>
              <div className="border-2 border-green-300 bg-green-50 p-4 rounded-lg">
                <PostForm onPostSubmit={handleUserPostSubmit} />
              </div>
              {userPosts.length > 0 ? (
                userPosts.map(post => <PostCard key={post.id} post={post} onDelete={handleDeletePost} />)
              ) : (
                <p className="text-green-500 text-center">Пока нет постов</p>
              )}
            </div>
          </div>
        );
              default:
        return <div className="text-center">Раздел не найден</div>;
    }
  };

  if (error) {
    return (
      <div className="text-center p-6 bg-white rounded-lg shadow-lg mt-8">
        <p className="text-red-500 mb-4">Произошла ошибка: {error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#f3e6f5] p-6 rounded-xl overflow-hidden">
      {user ? renderSection() : (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-green-600">Загрузка профиля...</p>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
