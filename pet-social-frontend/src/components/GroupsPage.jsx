import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FiEdit2 } from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const API_BASE_URL = "http://localhost:8000";

const GroupsPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("alphabet");
  const [myGroups, setMyGroups] = useState([]);
  const [subscribedGroups, setSubscribedGroups] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    const token = localStorage.getItem("access");
    try {
      const myRes = await axios.get(`${API_BASE_URL}/api/groups/my/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const subRes = await axios.get(`${API_BASE_URL}/api/groups/subscribed/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyGroups(myRes.data);
      setSubscribedGroups(subRes.data);
    } catch (err) {
      console.error("Ошибка загрузки групп", err);
    }
  };

  const handleDelete = async (groupId) => {
    const confirmed = window.confirm("Вы уверены, что хотите удалить группу?");
    if (!confirmed) return;

    const token = localStorage.getItem("access");
    try {
      await axios.delete(`${API_BASE_URL}/api/groups/${groupId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyGroups(prev => prev.filter(g => g.id !== groupId));
    } catch (error) {
      console.error("Ошибка при удалении группы:", error);
    }
  };

  const handleSubscribe = async (groupId) => {
    const token = localStorage.getItem("access");
    try {
      await axios.post(`${API_BASE_URL}/api/groups/${groupId}/subscribe/`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Вы подписались на группу");
      fetchGroups();
    } catch (error) {
      console.error("Ошибка при подписке:", error);
    }
  };

  const handleUnsubscribe = async (groupId) => {
    const token = localStorage.getItem("access");
    try {
      await axios.delete(`${API_BASE_URL}/api/groups/${groupId}/subscribe/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.info("Вы отписались от группы");
      fetchGroups();
    } catch (error) {
      console.error("Ошибка при отписке:", error);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim() !== "") {
      const token = localStorage.getItem("access");
      try {
        const res = await axios.get(`${API_BASE_URL}/api/groups/?search=${searchQuery}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const filteredResults = res.data.filter(
          (group) => !myGroups.some((my) => my.id === group.id)
        );

        let sortedResults = [...filteredResults];
        if (sortOption === "alphabet") {
          sortedResults.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortOption === "popular") {
          sortedResults.sort((a, b) => b.subscribers.length - a.subscribers.length);
        }

        setSearchResults(sortedResults);
      } catch (err) {
        console.error("Ошибка поиска групп", err);
      }
    } else {
      setSearchResults([]);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      handleSearch();
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, sortOption]);

  return (
    <div className="p-6 bg-[#f3e6f5] rounded-xl">
      <ToastContainer position="top-right" autoClose={3000} />
      <button
        onClick={() => navigate(-1)}
        className="mb-4 px-4 py-2 bg-green-500 text-white rounded-lg"
      >
        ← Назад
      </button>

      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/groups/create")}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg"
        >
          Создать группу
        </button>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск группы"
          className="p-2 border rounded flex-grow"
        />
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="alphabet">По алфавиту</option>
          <option value="popular">По популярности</option>
        </select>
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-green-500 text-white rounded-lg"
        >
          Поиск
        </button>
      </div>

      {searchQuery.trim() !== "" ? (
        <div>
          <h3 className="text-xl font-semibold mb-4">Результаты поиска</h3>
          {searchResults.length === 0 ? (
            <p className="text-gray-500">Ничего не найдено</p>
          ) : (
            searchResults.map((group) => {
              const isSubscribed = subscribedGroups.some(g => g.id === group.id);
              return (
                <div
                  key={group.id}
                  className="flex justify-between items-center border p-4 rounded mb-4"
                >
                  <div
                    onClick={() => navigate(`/groups/${group.id}`)}
                    className="flex items-center gap-4 cursor-pointer"
                  >
                    {group.avatar ? (
                          <img
                            src={`http://localhost:8000${group.avatar}`}
                            alt={group.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-purple-200 text-purple-800 font-bold flex items-center justify-center text-sm">
                            {group.name[0]?.toUpperCase()}
                          </div>
                        )}
                    <div>
                      <h4 className="font-bold">{group.name}</h4>
                      <p>{group.description}</p>
                      <p className="text-sm text-gray-500">
                            Подписчиков: {group.subscribers ? group.subscribers.length : 0}
                      </p>
                      {isSubscribed && (
                        <p className="text-sm text-green-600 mt-1">Вы подписаны</p>
                      )}
                    </div>
                  </div>
                  {isSubscribed ? (
                    <button
                      onClick={() => handleUnsubscribe(group.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg"
                    >
                      Удалить подписку
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(group.id)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      Подписаться
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        <>
          <div>
            <h3 className="text-xl font-semibold mb-4">Мои группы</h3>
            {myGroups.map((group) => (
              <div
                key={group.id}
                className="border p-4 rounded mb-4 flex items-center justify-between"
              >
                <div
                  className="flex items-center gap-4 cursor-pointer"
                  onClick={() => navigate(`/groups/${group.id}`)}
                >
                  {group.avatar ? (
                      <img
                        src={`http://localhost:8000${group.avatar}`}
                        alt={group.name}
                        className="w-16 h-16 rounded-full object-cover border"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-purple-200 text-purple-800 font-bold flex items-center justify-center text-xl border">
                        {group.name[0]?.toUpperCase()}
                      </div>
                    )}

                  <div>
                    <h4 className="font-bold flex items-center gap-2">
                      {group.name}
                      <FiEdit2
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/groups/${group.id}/edit`);
                        }}
                        className="text-gray-500 hover:text-gray-700 cursor-pointer"
                        title="Редактировать группу"
                      />
                    </h4>
                    <p>{group.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(group.id)}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Удалить
                </button>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">
              Группы, на которые я подписана
            </h3>
            {subscribedGroups.map((group) => (
              <div
                key={group.id}
                className="border p-4 rounded mb-4 flex items-center justify-between"
              >
                <div
                  onClick={() => navigate(`/groups/${group.id}`)}
                  className="flex items-center gap-4 cursor-pointer"
                >
                  {group.avatar ? (
              <img
                src={`http://localhost:8000${group.avatar}`}
                alt={group.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-purple-200 text-purple-800 font-bold flex items-center justify-center text-sm">
                {group.name[0]?.toUpperCase()}
              </div>
            )}

                  <div>
                    <h4 className="font-bold">{group.name}</h4>
                    <p>{group.description}</p>
                    <p className="text-sm text-gray-500">
                      Подписчиков: {group.subscribers ? group.subscribers.length : 0}
                    </p>

                  </div>
                </div>
                <button
                  onClick={() => handleUnsubscribe(group.id)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Отменить подписку
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default GroupsPage;
