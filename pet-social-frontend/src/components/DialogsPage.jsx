import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Button from "./Button";
import DeleteDialogConfirm from "./DeleteDialogConfirm";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import { fetchNewMessages } from "./Sidebar";

export default function DialogsPage({ selectedSection, setSelectedSection, setNewMessagesCount }) {
  const [dialogs, setDialogs] = useState([]);
  const [search, setSearch] = useState("");
  const [username, setUsername] = useState("");
  const [dialogToDelete, setDialogToDelete] = useState(null);
  const [searchResults, setSearchResults] = useState([]);

  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupTitle, setGroupTitle] = useState("");
  const [groupAvatar, setGroupAvatar] = useState(null);
  const [friendSearch, setFriendSearch] = useState("");
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [friends, setFriends] = useState([]);

  const token = localStorage.getItem("access");
  const currentUsername = localStorage.getItem("username");
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedSection !== "dialogs") setSelectedSection("dialogs");
    fetchDialogs();
    fetchFriends();

    const handleNewGroupChat = () => {
      fetchDialogs();
    };

  window.addEventListener("newGroupChat", handleNewGroupChat);

  return () => window.removeEventListener("newGroupChat", handleNewGroupChat);
}, []);  useEffect(() => {
    if (selectedSection !== "dialogs") setSelectedSection("dialogs");
    fetchDialogs();
    fetchFriends();
  }, []);

  const fetchDialogs = () => {
    axios
      .get("http://localhost:8000/api/direct_messages/dialogs/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const sorted = res.data.sort((a, b) => new Date(b.last_message_time) - new Date(a.last_message_time));
        setDialogs(sorted);
        fetchNewMessages(setNewMessagesCount);
      });
  };

  const fetchFriends = () => {
    axios
      .get("http://localhost:8000/api/users/friends/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setFriends(res.data));
  };

  const createDialog = () => {
    if (!username || username.toLowerCase() === currentUsername.toLowerCase()) return;

    axios
      .post(
        "http://localhost:8000/api/direct_messages/dialogs/create/",
        { username },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => {
        fetchDialogs();
        navigate(`/chat/${res.data.id}`);
      })
      .catch(() => alert("Не удалось создать диалог. Возможно, пользователь не найден."));
  };

  const createGroupChat = () => {
    if (!groupTitle || selectedFriends.length === 0) return;

    const formData = new FormData();
    formData.append("title", groupTitle);
    formData.append("user_ids", JSON.stringify(selectedFriends));
    if (groupAvatar) formData.append("avatar", groupAvatar);

    axios
      .post("http://localhost:8000/api/direct_messages/group_chats/", formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      })
      .then((res) => {
        setShowGroupModal(false);
        setGroupTitle("");
        setSelectedFriends([]);
        setGroupAvatar(null);
        fetchDialogs();
        navigate(`/chat/${res.data.id}`);
      })
      .catch(() => alert("Ошибка при создании группового чата"));
  };

  const handleDelete = (dialogId, forAll = false) => {
    const url = forAll
      ? `http://localhost:8000/api/direct_messages/dialogs/${dialogId}/delete_all/`
      : `http://localhost:8000/api/direct_messages/dialogs/${dialogId}/delete/`;

    axios.delete(url, { headers: { Authorization: `Bearer ${token}` } }).then(() => {
      fetchDialogs();
      setDialogToDelete(null);
    });
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      if (!username.trim()) return setSearchResults([]);
      axios
        .get(`http://localhost:8000/api/users/search/?search=${username}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setSearchResults(res.data));
    }, 300);
    return () => clearTimeout(delay);
  }, [username]);

  const filteredDialogs = dialogs.filter((d) => {
    
const isGroup = d.is_group;
const avatarSrc = isGroup
  ? d.avatar || "/default-group.png"
  : (d.user1.username === currentUsername ? d.user2.avatar : d.user1.avatar) || "/default-avatar.png";

const displayName = isGroup
  ? d.title || "Групповой чат"
  : d.user1.username === currentUsername ? d.user2.username : d.user1.username;

    return displayName.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex-grow bg-[#f3e6f5] rounded-xl shadow-md p-6 space-y-6">
      <h2 className="text-2xl font-bold text-[#4b3f4e] mb-2">Ваши диалоги</h2>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Button onClick={() => setShowGroupModal(true)} variant="purple">Создать групповой чат</Button>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-[300px] relative">
            <input
              placeholder="Имя пользователя"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 bg-white"
            />
            {searchResults.length > 0 && (
              <div className="absolute bg-white rounded-xl shadow mt-1 w-full z-10 max-h-60 overflow-auto">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => {
                      setUsername(user.username);
                      setSearchResults([]);
                    }}
                    className="p-2 hover:bg-purple-100 cursor-pointer flex items-center gap-2"
                  >
                    <img src={user.avatar || "/default-avatar.png"} alt="Аватар" className="w-6 h-6 rounded-full" />
                    <span>{user.username}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button onClick={createDialog} variant="lightGreen">Начать чат</Button>
        </div>
      </div>

      <div className="space-y-3 w-full">
{filteredDialogs.map((d) => {
  const isGroup = d.is_group;
  const avatarSrc = isGroup
    ? d.avatar || "/default-group.png"
    : (d.user1.username === currentUsername ? d.user2.avatar : d.user1.avatar) || "/default-avatar.png";

  const displayName = isGroup
    ? d.title || "Групповой чат"
    : d.user1.username === currentUsername ? d.user2.username : d.user1.username;

  return (
    <div key={d.id} className="bg-white rounded-xl p-4 shadow flex justify-between items-center">
      <div className="flex flex-col gap-1 cursor-pointer flex-grow" onClick={() => navigate(`/chat/${d.id}`)}>
        <div className="flex items-center gap-3">
          <img src={avatarSrc} alt="Аватар" className="w-8 h-8 rounded-full" />
          <div>
            <p className="text-[#4b3f4e] font-medium hover:underline">{displayName}</p>
              <p className="text-sm text-gray-600 truncate max-w-[220px] flex items-center gap-1">
                {d.unread_count > 0 && (
                  <span className="bg-[#f76b6b] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
                    {d.unread_count}
                  </span>
                )}
                {d.last_message_text || "Без сообщений"}
              </p>
   
          </div>
        </div>
      </div>
          <div className="flex items-center gap-4">
            {d.last_message_time && (
              <p className="text-sm text-gray-500 whitespace-nowrap">
                {dayjs(d.last_message_time).format("DD.MM.YYYY HH:mm")}
              </p>
            )}
            <button
              onClick={() => setDialogToDelete(d.id)}
              className="text-[#c084cf] text-xl font-bold hover:text-red-500"
            >×</button>
          </div>
    </div>
  );
})}

      </div>

      {dialogToDelete !== null && (
        <DeleteDialogConfirm
          onClose={() => setDialogToDelete(null)}
          onDeleteSelf={() => handleDelete(dialogToDelete, false)}
          onDeleteAll={() => handleDelete(dialogToDelete, true)}
        />
      )}

      {showGroupModal && (
        <div className="fixed inset-0 bg-[#baa6ba] bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-white border-4 border-white rounded-2xl shadow-inner p-6 w-full max-w-md">
            <div className="bg-[#f3e6f5] p-6 rounded-2xl">
              <h3 className="text-xl font-bold text-[#4b3f4e] mb-4 text-center">Создание группового чата</h3>

              <input
                type="text"
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
                placeholder="Название чата"
                className="w-full mb-4 px-4 py-2 rounded-xl border border-gray-300"
              />

              <label className="block w-full border-2 border-dashed border-[#c084cf] rounded-xl p-6 text-center cursor-pointer hover:bg-purple-50 transition mb-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setGroupAvatar(e.target.files[0])}
                  className="hidden"
                />
                {groupAvatar ? (
                  <img
                    src={URL.createObjectURL(groupAvatar)}
                    alt="Аватарка"
                    className="w-24 h-24 object-cover rounded-full mx-auto"
                  />
                ) : (
                  <div className="text-[#4b3f4e] flex flex-col items-center gap-2">
                    <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" strokeWidth="2"
                      viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M4 16v1a5 2 0 002 2h12a2 2 0 002-2v-1M12 1v15m0-15l-3 3m3-3l3 3m-3-3V3" />
                    </svg>
                    <span className="text-sm">Загрузить фото<br />(нажмите, чтобы выбрать)</span>
                  </div>
                )}
              </label>

              <input
                type="text"
                value={friendSearch}
                onChange={(e) => setFriendSearch(e.target.value)}
                placeholder="Поиск по друзьям"
                className="w-full mb-2 px-4 py-2 rounded-xl border border-gray-300"
              />

              <div className="max-h-60 overflow-y-auto mb-4 space-y-2">
                {friends
                  .filter((f) => f.username.toLowerCase().includes(friendSearch.toLowerCase()))
                  .map((f) => (
                    <label key={f.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedFriends.includes(f.id)}
                        onChange={() =>
                          setSelectedFriends((prev) =>
                            prev.includes(f.id) ? prev.filter((id) => id !== f.id) : [...prev, f.id]
                          )
                        }
                      />
                      <span>{f.username}</span>
                    </label>
                  ))}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setShowGroupModal(false)}>Отмена</Button>
                <Button variant="lightGreen" onClick={createGroupChat}>Создать</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
