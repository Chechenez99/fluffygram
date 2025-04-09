import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Button from "./Button";
import Input from "./Input";
import Textarea from "./textarea";
import { Upload } from "lucide-react";

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
          <h2 className="text-2xl font-bold text-[#4b3f4e] mb-4">Создание группы</h2>

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
                placeholder="Расскажите, о чём ваша группа"
                className="w-full min-h-[120px] border-[#baa6ba] focus:ring-[#b46db6]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#4b3f4e] mb-2">Аватар группы</label>
              <div className="relative w-full h-52 bg-white border-2 border-dashed border-[#baa6ba] rounded-2xl flex items-center justify-center cursor-pointer hover:border-[#b46db6] transition">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {avatar ? (
                  <img
                    src={URL.createObjectURL(avatar)}
                    alt="Предпросмотр"
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <div className="flex flex-col items-center text-[#b46db6]">
                    <Upload className="w-10 h-10 mb-2" />
                    <p>Загрузить фото</p>
                    <p className="text-sm text-[#a157a7]">(нажмите, чтобы выбрать файл)</p>
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
              Создать группу
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupCreatePage;
