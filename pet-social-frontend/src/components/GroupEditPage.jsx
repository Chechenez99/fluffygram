import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Button from "./Button";
import Input from "./Input";
import Textarea from "./textarea";
import { Upload } from "lucide-react";

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
    <div className="bg-[#baa6ba] border-4 border-white rounded-2xl shadow-inner p-6 max-w-4xl mx-auto">
      <div className="bg-[#f3e6f5] p-6 rounded-2xl">
        <Button
          onClick={() => navigate(-1)}
          variant="secondary"
          className="mb-6"
        >
          ← Назад
        </Button>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
          encType="multipart/form-data"
        >
          <h2 className="text-2xl font-bold text-[#4b3f4e] mb-4">Редактировать группу</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#4b3f4e] mb-2">Название группы</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Введите название"
                required
                className="border-[#baa6ba] focus:ring-[#b46db6]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#4b3f4e] mb-2">Описание</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Опишите вашу группу"
                className="w-full min-h-[120px] border-[#baa6ba] focus:ring-[#b46db6]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#4b3f4e] mb-2">Аватар группы</label>
                <div className="relative w-48 h-48 mx-auto bg-white border-2 border-dashed border-[#baa6ba] rounded-full flex items-center justify-center cursor-pointer hover:border-[#b46db6] transition">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {preview ? (
                    <img
                      src={preview}
                      alt="Аватар группы"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-[#b46db6] text-center px-2">
                      <Upload className="w-8 h-8 mb-2" />
                      <p>Загрузить фото</p>
                    </div>
                  )}
                </div>

            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="purple"
              className="w-full justify-center text-lg py-3"
            >
              Сохранить изменения
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupEditPage;
