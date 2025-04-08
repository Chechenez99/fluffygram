import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000";

const GroupCreatePage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatar, setAvatar] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("access");
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    if (avatar) formData.append("avatar", avatar);

    try {
      await axios.post(`${API_BASE_URL}/api/groups/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      navigate("/groups", { state: { refresh: true } });
    } catch (error) {
      console.error("Ошибка при создании группы:", error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setAvatar(file);
  };

  return (
    <div className="p-6 bg-[#f3e6f5] rounded-xl">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 px-4 py-2 bg-green-500 text-white rounded-lg"
      >
        ← Назад
      </button>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow max-w-xl mx-auto"
        encType="multipart/form-data"
      >
        <h2 className="text-xl font-bold mb-4 text-green-700">Создание группы</h2>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Название группы"
          required
          className="w-full mb-4 p-2 border rounded"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Описание группы"
          className="w-full mb-4 p-2 border rounded"
        />
        
        {/* Стилизованное окно для загрузки фото */}
        <div className="relative mb-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="border-2 border-dashed border-gray-400 p-4 rounded-md">
            {avatar ? (
              <img
                src={URL.createObjectURL(avatar)}
                alt="Предпросмотр"
                className="w-full h-full object-cover rounded-md"
              />
            ) : (
              <div className="text-center text-gray-500">
                <p>Загрузить фото</p>
                <p className="text-sm">(Нажмите для выбора файла)</p>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Создать группу
        </button>
      </form>
    </div>
  );
};

export default GroupCreatePage;
