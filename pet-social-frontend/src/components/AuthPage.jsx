import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import Button from './Button';

export default function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(null);

  return (
    <div
        className="min-h-screen flex flex-col items-center p-6"
        style={{
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cg fill='white' fill-opacity='0.12'%3E%3Ccircle cx='25' cy='25' r='6'/%3E%3Ccircle cx='55' cy='25' r='6'/%3E%3Ccircle cx='35' cy='20' r='5'/%3E%3Ccircle cx='45' cy='20' r='5'/%3E%3Cellipse cx='40' cy='40' rx='12' ry='10'/%3E%3C/g%3E%3C/svg%3E")`,
  backgroundRepeat: 'repeat',
  backgroundSize: '100px',
  backgroundBlendMode: 'overlay',
  backgroundColor: '#baa6ba',
  backgroundPosition: 'center',
  animation: 'movePaws 60s linear infinite',
}}
      >
      {/* Центральный блок: логотип + карточка */}
      <div className="flex flex-col items-center justify-center flex-grow gap-20 z-10">
        <div className="flex flex-col items-center">
          <img 
            src="/lapka.png" 
            alt="Лапка"
            className="w-16 h-16 mb-2"
          />
          <h1 className="text-4xl font-bold text-purple-900">Flyffugram</h1>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-xl border border-[#d6a5d8] w-full max-w-md space-y-6 text-center mt-4">
          {isLogin === null ? (
            <>
              <h2 className="text-2xl font-bold text-[#7c3aed] mb-4">
                Добро пожаловать!
              </h2>
              <Button 
                onClick={() => setIsLogin(true)} 
                className="w-full"
              >
                Войти
              </Button>
              <Button 
                onClick={() => setIsLogin(false)} 
                className="w-full"
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
      <footer className="mb-6 text-center text-[#4b3f4e] text-sm z-10">
        © 2025 PetSocial. Все права защищены.
      </footer>
    </div>
  );
}
