import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import PostCard from "./PostCard";

const NewsFeed = () => {
  const [posts, setPosts] = useState([]);
  const [hashtagQuery, setHashtagQuery] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // 👈 состояние загрузки

  useEffect(() => {
    fetchNewsPosts();
  }, []);

  const fetchNewsPosts = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("access");
      const res = await axios.get("http://localhost:8000/api/posts/newsfeed/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sorted = [...res.data].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setPosts(sorted);
      setIsSearchMode(false);
    } catch {
      toast.error("Ошибка загрузки ленты");
    } finally {
      setIsLoading(false);
    }
  };

const handleHashtagSearch = async () => {
  const query = hashtagQuery.trim();
  if (!query) {
    fetchNewsPosts();
    return;
  }

  try {
    const token = localStorage.getItem("access");
    const res = await axios.get(
      `http://localhost:8000/api/posts/?hashtag=${query}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const sorted = [...res.data].sort((a, b) => b.likes_count - a.likes_count);
    setPosts(sorted);
    setIsSearchMode(true);
  } catch {
    toast.error("Ошибка поиска по хэштегам");
  }
};



  const handleHashtagClick = (tag) => {
    setHashtagQuery(tag);
    setTimeout(() => handleHashtagSearch(), 0);
  };

  const clearSearch = () => {
    setHashtagQuery("");
    fetchNewsPosts();
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 bg-[#f3e6f5] border-4 border-white rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold text-green-700 mb-4 text-center">
        {isSearchMode ? `Результаты по хэштегу: #${hashtagQuery}` : "Лента новостей"}
      </h2>

      <div className="flex gap-2 mb-6 items-center">
        <input
          value={hashtagQuery}
          onChange={(e) => setHashtagQuery(e.target.value)}
          placeholder="Поиск по хэштегам"
          className="p-2 border rounded flex-grow"
        />
        <button
          onClick={handleHashtagSearch}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Поиск
        </button>
        {!isSearchMode && (
          <button
            onClick={fetchNewsPosts}
            title="Обновить ленту"
            className={`text-[#7c5e8f] hover:text-[#5e3c70] text-xl px-2 transition ${
              isLoading ? "animate-spin" : ""
            }`}
            disabled={isLoading}
          >
            {isLoading ? "🔃" : "🔄"}
          </button>
        )}
        {isSearchMode && (
          <button
            onClick={clearSearch}
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
          >
            Назад
          </button>
        )}
      </div>

      {posts.length > 0 ? (
        posts.map((post) => (
          <PostCard key={post.id} post={post} onHashtagClick={handleHashtagClick} />
        ))
      ) : (
        <p className="text-green-500 text-center">Нет постов</p>
      )}
    </div>
  );
};

export default NewsFeed;
