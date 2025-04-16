import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Button from "./Button";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import PostCard from "./PostCard";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isSameOrBefore);
dayjs.locale("ru");

export default function ChatPage({ selectedSection, setSelectedSection }) {
  const { dialogId } = useParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [showEditMessageModal, setShowEditMessageModal] = useState(false);
  const [editMessageId, setEditMessageId] = useState(null);
  const [editText, setEditText] = useState("");
  const [isGroup, setIsGroup] = useState(false);
  const [dialogData, setDialogData] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAvatar, setNewAvatar] = useState(null);
  const [friendSearch, setFriendSearch] = useState("");
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const socketRef = useRef(null);
  const scrollRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojis = ["😊", "😂", "❤️", "🥺", "👍", "🔥", "🎉", "😎", "🙌", "😭", "😍","💩","😺","😸","😹","😻","😼","😽","🙀","😿","😾","🙈","🙉","🙊"];
  const token = localStorage.getItem("access");
  const username = localStorage.getItem("username");
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedSection !== "dialogs") {
      setSelectedSection("dialogs");
    }
  }, [selectedSection, setSelectedSection]);

  const fetchFriends = () => {
    axios
      .get("http://localhost:8000/api/users/friends/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setFriends(res.data))
      .catch((err) => console.error("Error fetching friends:", err));
  };

  const openEditModal = () => {
    setShowEditModal(true);
    fetchFriends();
    // Initialize selectedFriends with current participants
    if (dialogData.participants) {
      setSelectedFriends(dialogData.participants.map(p => p.id));
    }
  };

  const fetchMessages = () => {
    axios
      .get(`http://localhost:8000/api/direct_messages/dialogs/${dialogId}/messages/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setMessages(res.data))
      .catch((err) => console.error("Error fetching messages:", err));
  };

  const fetchDialogData = () => {
    axios
      .get(`http://localhost:8000/api/direct_messages/dialogs/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const current = res.data.find(d => d.id === parseInt(dialogId));
        if (current) {
          setDialogData(current);
          setIsGroup(current.is_group);
          setNewTitle(current.title || "");

          const members = [];
          if (current.user1 && current.user1.id) members.push(current.user1.id);
          if (current.user2 && current.user2.id) members.push(current.user2.id);
          if (current.other_members && Array.isArray(current.other_members)) {
            current.other_members.forEach(u => members.push(u.id));
          }
          setSelectedFriends(members);
        } else {
          console.warn("Чат не найден:", dialogId);
        }
      })
      .catch((err) => console.error("Error fetching dialog data:", err));
  };

  const initializeWebSocket = () => {
    // Close existing connection if it exists
    if (socketRef.current) {
      socketRef.current.close();
    }

    socketRef.current = new WebSocket(`ws://localhost:8000/ws/chat/${dialogId}/`);

    socketRef.current.onopen = () => {
      console.log(`WebSocket connected for dialog ${dialogId}`);
    };

    socketRef.current.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.type === "group_update" && String(data.dialog_id) === dialogId) {
        fetchDialogData();
        fetchMessages();
        return;
      }

      if (data.message || data.shared_post) {
        setMessages((prev) => {
          const newMsg = {
            text: data.message || "Пост",
            sender: { username: data.sender },
            timestamp: new Date().toISOString(),
            is_read: false,
            shared_post: data.shared_post || null,
          };
          return [...prev, newMsg].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        });
      }
    };

    socketRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socketRef.current.onclose = (e) => {
      console.log(`WebSocket closed for dialog ${dialogId}:`, e.code, e.reason);
      // Attempt to reconnect after a delay if not intentionally closed
      if (e.code !== 1000) {
        setTimeout(() => {
          console.log("Attempting to reconnect WebSocket...");
          initializeWebSocket();
        }, 3000);
      }
    };
  };

  useEffect(() => {
    fetchMessages();
    fetchFriends();
    fetchDialogData();
    initializeWebSocket();

    // Mark messages as read when entering chat
    axios.post(
      `http://localhost:8000/api/direct_messages/messages/mark_read/`,
      { dialogId },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    ).catch(err => console.error("Error marking messages as read:", err));

    return () => {
      if (socketRef.current) {
        socketRef.current.close(1000, "Component unmounted");
      }
    };
  }, [dialogId, token]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim() && !mediaFile) return;

    const formData = new FormData();
    formData.append("dialog", dialogId);
    if (text.trim()) formData.append("text", text);
    if (mediaFile) formData.append("media", mediaFile);

    axios.post("http://localhost:8000/api/direct_messages/messages/create/", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    })
      .then(() => {
        setText("");
        setMediaFile(null);
        fetchMessages();

        // Send WebSocket message if connected
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(
            JSON.stringify({
              message: text,
              sender: username,
            })
          );
        }
      })
      .catch(err => console.error("Error sending message:", err));
  };

  
  const editSelectedMessage = () => {
    if (!editText.trim()) return;

    axios.patch(`http://localhost:8000/api/direct_messages/messages/${editMessageId}/edit/`, {
      text: editText,
    }, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(() => {
        setShowEditMessageModal(false);
        setEditMessageId(null);
        setEditText("");
        fetchMessages();
      })
      .catch((err) => {
        alert("Ошибка при редактировании");
        console.error(err);
      });
  };



  const deleteMessageById = (id) => {
    axios.delete(`http://localhost:8000/api/direct_messages/messages/${id}/delete/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(() => {
        fetchMessages();
      })
      .catch((err) => {
        alert("Ошибка при удалении");
        console.error(err);
      });
  };


const saveGroupChat = async () => {
    const formData = new FormData();
    formData.append("title", newTitle);
    if (newAvatar) formData.append("avatar", newAvatar);
    formData.append("new_members", JSON.stringify(selectedFriends));

    try {
      await axios.patch(
        `http://localhost:8000/api/direct_messages/group_chats/${dialogId}/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setShowEditModal(false);
      fetchDialogData();
      fetchMessages();
      
      // Notify other clients about the update
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: "group_update",
            dialog_id: dialogId
          })
        );
      }
    } catch (err) {
      console.error("Error saving group chat:", err);
      alert("Ошибка при сохранении");
    }
  };

  const renderMessages = () => {
    let lastDate = null;

    return messages.map((msg, index) => {
      const msgDate = dayjs(msg.timestamp).format("D MMMM YYYY");
      const showDate = msgDate !== lastDate;
      lastDate = msgDate;

      const isOwn = msg.sender.username === username;

return (
  <div key={index} className="space-y-1">
    {showDate && (
      <div className="text-center text-sm text-gray-500 mt-4 mb-2">{msgDate}</div>
    )}
    <div
      className={`relative max-w-[60%] p-3 rounded-lg shadow-sm ${
        isOwn
          ? "bg-[#c084cf] text-white self-end ml-auto"
          : "bg-[#f3e6f5] text-[#4b3f4e] mr-auto"
      }`}
    >
      {/* Кнопки ✏ и 🗑 */}
      {msg.sender.username === username && dayjs().diff(dayjs(msg.timestamp), "minute") < 10 && (
        <div className="absolute top-2 right-2 flex gap-2 z-10">
          <button
            onClick={() => {
              setEditMessageId(msg.id);
              setEditText(msg.text);
              setShowEditMessageModal(true);
            }}
            className="p-1 bg-white rounded-full border border-[#c084cf] hover:bg-[#f3e6f5] shadow transition"
            title="Редактировать сообщение"
          >
            <svg className="w-4 h-4 text-[#c084cf]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M4 20h4.586a1 1 0 00.707-.293l10.914-10.914a1 1 0 000-1.414l-3.536-3.536a1 1 0 00-1.414 0L4 15.586V20z" />
            </svg>
          </button>
          <button
            onClick={() => deleteMessageById(msg.id)}
            className="p-1 bg-white rounded-full border border-red-300 hover:bg-red-100 shadow transition"
            title="Удалить сообщение"
          >
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <p className="text-sm font-semibold">{msg.sender.username}</p>
      <p className="whitespace-pre-wrap break-words">{msg.text}</p>

      {msg.media && (
        msg.media.endsWith(".mp4") ? (
          <video controls className="mt-2 max-w-full rounded">
            <source src={msg.media} type="video/mp4" />
            Ваш браузер не поддерживает видео.
          </video>
        ) : (
          <img src={msg.media} alt="Медиа" className="mt-2 max-w-xs rounded shadow" />
        )
      )}

      {msg.shared_post && (
        <div className="mt-3">
          <PostCard post={msg.shared_post} />
        </div>
      )}

      <p className="text-xs text-right mt-1 opacity-60">
        {dayjs(msg.timestamp).format("HH:mm")}{msg.edited ? " (изменено)" : ""}
        {msg.is_read ? (
          <span className="text-light-blue-500 ml-2">✓✓</span>
        ) : (
          <span className="text-light-blue-500 ml-2">✓</span>
        )}
      </p>
    </div>
  </div>
);

    });
  };

  return (
    <div className="bg-[#baa6ba] min-h-screen p-6 flex flex-col items-start">
      <button
        onClick={() => navigate("/dialogs")}
        className="bg-white text-[#4b3f4e] px-4 py-2 rounded-xl shadow mb-4 hover:bg-gray-100"
      >
        ← Назад
      </button>

      <div className="bg-[#f3e6f5] rounded-2xl shadow-xl p-6 w-full  mx-auto flex flex-col" style={{ height: "90vh" }}>
        <h2 className="text-2xl font-bold text-center text-[#4b3f4e] mb-4">
          {isGroup ? dialogData.title || "Групповой чат" : "Диалог"}
        </h2>

        {isGroup && dialogData.user1?.id === parseInt(localStorage.getItem("user_id")) && (
          <div className="flex justify-end mb-4">
            <Button variant="secondary" onClick={openEditModal}>
              ✏️ Редактировать чат
            </Button>
          </div>
        )}

        <div ref={messagesContainerRef} className="bg-white rounded-xl p-4 overflow-y-auto space-y-2 mb-4 shadow-inner flex flex-col flex-grow">
          {renderMessages()}
          <div ref={scrollRef} />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 mt-auto">
          <input
            placeholder="Сообщение"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            className="flex-grow px-4 py-2 rounded-xl border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#c084cf]"
          />
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className="px-2 py-1 rounded-xl bg-white shadow border text-xl"
              title="Эмодзи"
            >
              😊
            </button>
              {showEmojiPicker && (
                <div className="absolute bottom-14 right-0 bg-white p-3 rounded-xl shadow-lg z-50 w-60">
                  <div className="grid grid-cols-5 gap-2">
                    {emojis.map((emoji) => (
                      <button
                        key={emoji}
                        className="text-2xl hover:scale-125 transition"
                        onClick={() => {
                          setText((prev) => prev + emoji);
                          setShowEmojiPicker(false);
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
          </div>

          <label className="cursor-pointer rounded-xl border border-gray-300 px-4 py-2 bg-white text-[#4b3f4e] hover:bg-gray-100 transition flex items-center gap-2 shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 9.4L7.91 18a2.12 2.12 0 01-3 0 2.12 2.12 0 010-3L14 6.91a3 3 0 014.24 4.24L10.5 18.91" />
            </svg>
            <span className="text-sm">Прикрепить</span>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setMediaFile(e.target.files[0])}
              className="hidden"
            />
          </label>
          {mediaFile && (
            <div className="flex items-center gap-3 mt-2 bg-white border border-gray-300 rounded-xl px-4 py-2 shadow-sm">
              {mediaFile.type.startsWith("image/") && (
                <img
                  src={URL.createObjectURL(mediaFile)}
                  alt="Превью"
                  className="w-12 h-12 object-cover rounded"
                />
              )}
              <div className="flex-1 text-sm text-[#4b3f4e] truncate">{mediaFile.name}</div>
              <button
                onClick={() => setMediaFile(null)}
                className="text-red-500 hover:text-red-700 font-bold text-lg"
                title="Удалить файл"
              >
                ×
              </button>
            </div>
          )}
          <Button onClick={sendMessage} variant="primary" className="w-full sm:w-auto">
            Отправить
          </Button>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-[#baa6ba] bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-white border-4 border-white rounded-2xl shadow-inner p-6 w-full max-w-md">
            <div className="bg-[#f3e6f5] p-6 rounded-2xl">
              <h3 className="text-xl font-bold text-[#4b3f4e] mb-4 text-center">Редактировать чат</h3>

              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Новое название"
                className="w-full mb-4 px-4 py-2 rounded-xl border border-gray-300"
              />

              <label className="block w-full border-2 border-dashed border-[#c084cf] rounded-xl p-6 text-center cursor-pointer hover:bg-purple-50 transition mb-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewAvatar(e.target.files[0])}
                  className="hidden"
                />
                {newAvatar ? (
                  <img
                    src={URL.createObjectURL(newAvatar)}
                    alt="Аватар"
                    className="w-24 h-24 object-cover rounded-full mx-auto"
                  />
                ) : dialogData.avatar ? (
                  <img
                    src={dialogData.avatar}
                    alt="Текущий аватар"
                    className="w-24 h-24 object-cover rounded-full mx-auto"
                  /> 
                ) : (
                  <div className="text-[#4b3f4e] flex flex-col items-center gap-2">
                    <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" strokeWidth="2"
                      viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12v6m0-15l-3 3m3-3l3 3m-3-3V3" />
                    </svg>
                    <span className="text-sm">Загрузить фото<br />(нажмите, чтобы выбрать)</span>
                  </div>
                )}
              </label>

              <div className="my-4">
                <h4 className="font-medium mb-2">Участники:</h4>
                <input
                  type="text"
                  placeholder="Поиск по друзьям"
                  value={friendSearch}
                  onChange={(e) => setFriendSearch(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 mb-2"
                />
                <div className="max-h-40 overflow-y-auto space-y-1 border border-gray-200 rounded-lg p-2">
                  {friends
                    .filter(f => f.username.toLowerCase().includes(friendSearch.toLowerCase()))
                    .map(f => (
                      <label key={f.id} className="flex items-center gap-2 p-1 hover:bg-purple-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedFriends.includes(f.id)}
                          onChange={() => {
                            setSelectedFriends(prev => 
                              prev.includes(f.id) 
                                ? prev.filter(id => id !== f.id) 
                                : [...prev, f.id]
                            );
                          }}
                          className="rounded"
                        />
                        <img 
                          src={f.avatar || "/default-avatar.png"} 
                          alt="Avatar" 
                          className="w-6 h-6 rounded-full"
                        />
                        <span>{f.username}</span>
                      </label>
                    ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                  Отмена
                </Button>
                <Button
                  variant="lightGreen"
                  onClick={saveGroupChat}
                >
                  Сохранить
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
        {showEditMessageModal && (
          <div className="fixed inset-0 bg-[#baa6ba] bg-opacity-80 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md border-4 border-white">
              <div className="bg-[#f3e6f5] p-6 rounded-2xl">
                <h2 className="text-xl font-bold mb-4 text-[#4b3f4e] text-center">Редактировать сообщение</h2>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-3 mb-4 text-[#4b3f4e] focus:ring-2 focus:ring-[#c084cf] focus:outline-none"
                  rows="4"
                  placeholder="Введите новый текст сообщения..."
                />
                <div className="flex justify-end gap-3">
                  <Button variant="secondary" onClick={() => setShowEditMessageModal(false)}>Отмена</Button>
                  <Button variant="lightGreen" onClick={editSelectedMessage}>Сохранить</Button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}