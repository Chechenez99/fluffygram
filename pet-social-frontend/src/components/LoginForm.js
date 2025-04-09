import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Button from './Button';
import Input from './Input'; // ⬅️ Подключаем Input

const LoginForm = ({ onLogin, onBack }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:8000/api/auth/jwt/create/", {
        username,
        password,
      });

      console.log("Ответ сервера:", response.data);

      const { access, refresh, user_id } = response.data;

      if (access && refresh && user_id) {
        localStorage.setItem("access", access);
        localStorage.setItem("refresh", refresh);
        localStorage.setItem("user_id", user_id);
        console.log("🎯 Токены и user_id сохранены:", access, refresh, user_id);
        onLogin();
        navigate("/profile");
      } else {
        console.error("❌ Не удалось сохранить токены или user_id");
      }
    } catch (error) {
      console.error("Ошибка авторизации:", error);
      alert("Ошибка входа. Проверь данные и попробуй снова.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-xl shadow-md space-y-4 w-80"
    >
      <h2 className="text-2xl font-bold text-[#7c3aed] text-center">Вход</h2>

      <Input
        type="text"
        placeholder="Имя пользователя"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />

      <Input
        type="password"
        placeholder="Пароль"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <Button
        type="submit"
        className="w-full"
      >
        Войти
      </Button>
      <Button
        onClick={onBack} 
        variant="secondary"
        className="w-full"
      >
        Назад
      </Button>
    </form>
  );
};

export default LoginForm;
