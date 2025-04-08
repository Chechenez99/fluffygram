// components/Dashboard.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './Sidebar';
import NewsFeed from './NewsFeed';
// Здесь можно импортировать компоненты для друзей, групп, сообщений и карты

const Dashboard = () => {
  return (
    <div className="flex min-h-screen bg-[#baa6ba] p-6">
      <Sidebar />
      <main className="flex-grow p-6 bg-[#f3e6f5] rounded-xl shadow-md ml-4">
        <Routes>
          <Route path="/news" element={<NewsFeed />} />
          {/* Добавьте остальные маршруты */}
          <Route path="/friends" element={<div>Друзья</div>} />
          <Route path="/groups" element={<div>Группы</div>} />
          <Route path="/messages" element={<div>Личные сообщения</div>} />
          <Route path="/vets" element={<div>Карта ветсервисов</div>} />
          <Route path="*" element={<NewsFeed />} />
        </Routes>
      </main>
    </div>
  );
};

export default Dashboard;
