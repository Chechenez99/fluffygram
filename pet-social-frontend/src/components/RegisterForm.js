import React, { useState } from 'react';
import axios from 'axios';
import Button from './Button';
import Input from './Input';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:8000';

const RegisterForm = ({ onBack, onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    re_password: '',  // новое поле для подтверждения пароля
    city: '',
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Валидация на фронтенде
    if (formData.password.length < 8) {
      toast.error('Пароль должен содержать минимум 8 символов');
      setLoading(false);
      return;
    }
    if (formData.password !== formData.re_password) {
      toast.error('Пароли не совпадают');
      setLoading(false);
      return;
    }
    if (!formData.email.includes('@')) {
      toast.error('Пожалуйста, введите корректный email');
      setLoading(false);
      return;
    }

    try {
      // Подготовка данных для регистрации
      const registerData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        re_password: formData.re_password, // подтверждение пароля
        city: formData.city,
      };

      console.log('Отправляем данные на сервер:', registerData);

      // Регистрация пользователя
      const registerResponse = await axios.post(`${API_BASE_URL}/api/auth/users/`, registerData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      console.log('Ответ от сервера при регистрации:', registerResponse.data);

      // Автоматический вход после регистрации
      const loginData = {
        username: formData.username,
        password: formData.password
      };

      console.log('Отправляем данные для входа:', loginData);
      const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/jwt/create/`, loginData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      console.log('Ответ от сервера при входе:', loginResponse.data);

      // Сохраняем токены
      localStorage.setItem('access', loginResponse.data.access);
      localStorage.setItem('refresh', loginResponse.data.refresh);
      toast.success('✅ Регистрация и вход успешны!');
      
      onLogin();
      setTimeout(() => {
        navigate('/profile');
      }, 1000);
      
    } catch (error) {
      console.error('Полная информация об ошибке:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });

      if (error.response?.data) {
        const errorData = error.response.data;
        
        if (errorData.username) {
          toast.error(`Имя пользователя: ${errorData.username.join(', ')}`);
        }
        if (errorData.email) {
          toast.error(`Email: ${errorData.email.join(', ')}`);
        }
        if (errorData.password) {
          toast.error(`Пароль: ${errorData.password.join(', ')}`);
        }
        if (errorData.non_field_errors) {
          toast.error(errorData.non_field_errors.join(', '));
        }
        if (errorData.detail) {
          toast.error(errorData.detail);
        }
      } else if (error.request) {
        toast.error('Сервер не отвечает. Проверьте подключение к интернету.');
      } else {
        toast.error('Произошла ошибка при регистрации. Попробуйте позже.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center bg-[#baa6ba]">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm space-y-6">
        <h2 className="text-2xl font-bold text-center text-green-700">Регистрация</h2>
        <Input 
          type="text" 
          name="username" 
          placeholder="Имя пользователя" 
          onChange={handleChange} 
          required 
          minLength={3}
        />
        <Input 
          type="email" 
          name="email" 
          placeholder="Email" 
          onChange={handleChange} 
          required 
        />
        <Input 
          type="password" 
          name="password" 
          placeholder="Пароль (минимум 8 символов)" 
          onChange={handleChange} 
          required 
          minLength={8}
        />
        <Input 
          type="password" 
          name="re_password" 
          placeholder="Подтвердите пароль" 
          onChange={handleChange} 
          required 
          minLength={8}
        />
        <Input 
          type="text" 
          name="city" 
          placeholder="Город" 
          onChange={handleChange} 
        />
        <Button 
          type="submit" 
          className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md" 
          disabled={loading}
        >
          {loading ? 'Загрузка...' : 'Зарегистрироваться'}
        </Button>
        <Button 
          onClick={onBack} 
          className="w-full mt-2 bg-green-100 hover:bg-green-200 text-green-700 py-2 px-4 rounded-md"
        >
          Назад
        </Button>
      </form>
    </div>
  );
};

export default RegisterForm;
