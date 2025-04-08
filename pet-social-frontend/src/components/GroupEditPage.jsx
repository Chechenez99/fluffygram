import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000";

const GroupEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const fetchGroup = async () => {
      const token = localStorage.getItem("access");
      try {
        const res = await axios.get(`${API_BASE_URL}/api/groups/${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setName(res.data.name);
        setDescription(res.data.description);
        setPreview(`${API_BASE_URL}${res.data.avatar}`);
      } catch (error) {
        console.error("Ошибка при загрузке группы:", error);
      }
    };

    fetchGroup();
  }, [id]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setAvatar(file);
      setPreview(URL.createObjectURL(file));
    } else {
      alert("Выберите изображение");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("access");
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    if (avatar) formData.append("avatar", avatar);

    try {
      await axios.put(`${API_BASE_URL}/api/groups/${id}/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      navigate("/groups");
    } catch (error) {
      console.error("Ошибка при сохранении изменений:", error);
    }
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
        <h2 className="text-xl font-bold mb-4 text-green-700">Редактировать группу</h2>

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
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="w-full mb-4"
        />
        {preview && (
          <img
            src={preview}
            alt="Аватарка группы"
            className="w-32 h-32 object-cover rounded-full mb-4"
          />
        )}
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Сохранить изменения
        </button>
      </form>
    </div>
  );
};

export default GroupEditPage;
