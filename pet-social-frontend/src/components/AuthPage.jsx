import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import Button from './Button';

export default function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(null);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#baa6ba] to-[#f3e6f5] p-6 flex flex-col">
      <div className="flex items-center justify-center flex-grow flex flex-col items-center">
        {/* Логотип или иконка вверху */}
        <img 
          src="/lapka.png" 
          alt="Лапка"
          className="w-16 h-16 mb-4"
        />

        {/* Название проекта */}
        <h1 className="text-4xl font-bold text-purple-900 mb-2">Flyffugram</h1>

        {/* Карточка с формами входа/регистрации */}
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md space-y-6 text-center">
          {isLogin === null ? (
            <>
              <h2 className="text-2xl font-bold text-green-700">
                Добро пожаловать!
              </h2>
              <Button 
                onClick={() => setIsLogin(true)}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md"
              >
                Войти
              </Button>
              <Button 
                onClick={() => setIsLogin(false)}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md"
              >
                Зарегистрироваться
              </Button>
            </>
          ) : isLogin ? (
            <LoginForm onLogin={onLogin} onBack={() => setIsLogin(null)} />
          ) : (
            <RegisterForm onLogin={onLogin} onBack={() => setIsLogin(null)} />
          )}
        </div>
      </div>

      {/* Футер */}
      <footer className="mt-10 text-center text-green-700 text-sm">
        © 2025 PetSocial. Все права защищены.
      </footer>
    </div>
  );
}