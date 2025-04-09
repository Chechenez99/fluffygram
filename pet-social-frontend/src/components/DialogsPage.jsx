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
  const token = localStorage.getItem("access");
  const currentUsername = localStorage.getItem("username");
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedSection !== "dialogs") {
      setSelectedSection("dialogs");
    }
  }, [selectedSection, setSelectedSection]);

  useEffect(() => {
    fetchDialogs();
  }, []);

  const fetchDialogs = () => {
    axios
      .get("http://localhost:8000/api/direct_messages/dialogs/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const sorted = res.data.sort(
          (a, b) => new Date(b.last_message_time) - new Date(a.last_message_time)
        );
        setDialogs(sorted);
        fetchNewMessages(setNewMessagesCount); // обновим уведомления после загрузки диалогов
      })
      .catch((err) => console.log(err));
  };

  const createDialog = () => {
    if (!username) return;
    if (username.trim().toLowerCase() === currentUsername.toLowerCase()) {
      alert("Нельзя создать чат с самой собой");
      return;
    }

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
      .catch((err) => {
        console.error(err);
        alert("Не удалось создать диалог. Возможно, пользователь не найден.");
      });
  };

  const handleDelete = (dialogId, forAll = false) => {
    const url = forAll
      ? `http://localhost:8000/api/direct_messages/dialogs/${dialogId}/delete_all/`
      : `http://localhost:8000/api/direct_messages/dialogs/${dialogId}/delete/`;

    axios
      .delete(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        fetchDialogs();
        setDialogToDelete(null);
      })
      .catch((err) => console.log(err));
  };

  const filteredDialogs = dialogs.filter((d) => {
    const otherUser = d.user1.username === currentUsername ? d.user2 : d.user1;
    return otherUser.username.toLowerCase().includes(search.toLowerCase());
  });

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (!username.trim()) {
        setSearchResults([]);
        return;
      }

      axios
        .get(`http://localhost:8000/api/users/search/?search=${username}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setSearchResults(res.data))
        .catch((err) => console.log(err));
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [username]);

  return (
    <div className="flex-grow bg-[#f3e6f5] rounded-xl shadow-md p-6 space-y-6">
      <h2 className="text-2xl font-bold text-[#4b3f4e]">Ваши диалоги</h2>

      <div className="flex flex-col sm:flex-row gap-3 justify-end w-full relative">
        <div className="w-full sm:w-[300px] relative">
          <input
            placeholder="Имя пользователя"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#c084cf] bg-white"
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
                  className="p-2 hover:bg-purple-100 cursor-pointer rounded flex items-center gap-2"
                >
                  <img
                    src={user.avatar || "/default-avatar.png"}
                    alt="Аватар"
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <span>{user.username}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <Button onClick={createDialog} variant="lightGreen" className="w-full sm:w-auto">
          Начать чат
        </Button>
      </div>

      <div className="w-full flex justify-end">
        <input
          type="text"
          placeholder="Поиск по имени..."
          className="w-full sm:w-[300px] px-4 py-2 rounded-xl border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#c084cf] bg-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-3 w-full">
        {filteredDialogs.map((d) => {
          const otherUser = d.user1.username === currentUsername ? d.user2 : d.user1;

          return (
            <div
              key={d.id}
              className="bg-white rounded-xl p-4 shadow flex justify-between items-center"
            >
              <div
                className="flex flex-col gap-1 cursor-pointer flex-grow"
                onClick={() => navigate(`/chat/${d.id}`)}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={otherUser.avatar || "/default-avatar.png"}
                    onError={(e) => (e.target.src = "/default-avatar.png")}
                    alt="Аватар"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <p className="text-[#4b3f4e] font-medium hover:underline">
                    {otherUser.username}
                  </p>
                </div>

                <div className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                  {d.last_message_sender === currentUsername ? (
                    <span className="text-[#888]">Вы:</span>
                  ) : (
                    <span className="text-[#4b3f4e]">{d.last_message_sender}:</span>
                  )}
                  <span className="truncate max-w-[220px]">{d.last_message_text}</span>

                  {d.last_message_sender !== currentUsername && !d.last_message_is_read && (
                    <span className="ml-2 w-2 h-2 rounded-full bg-red-500" />
                  )}
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
                >
                  ×
                </button>
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
    </div>
  );
}
