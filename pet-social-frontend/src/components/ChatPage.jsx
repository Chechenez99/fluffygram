import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Button from "./Button";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isSameOrBefore);
dayjs.locale("ru");

export default function ChatPage({ selectedSection, setSelectedSection }) {
  const { dialogId } = useParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const socketRef = useRef(null);
  const scrollRef = useRef(null);
  const token = localStorage.getItem("access");
  const username = localStorage.getItem("username");
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedSection !== "dialogs") {
      setSelectedSection("dialogs");
    }
  }, [selectedSection, setSelectedSection]);

  const fetchMessages = () => {
    axios
      .get(`http://localhost:8000/api/direct_messages/dialogs/${dialogId}/messages/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setMessages(res.data))
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    fetchMessages();

    socketRef.current = new WebSocket(`ws://localhost:8000/ws/chat/${dialogId}/`);

    socketRef.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setMessages((prev) => [
        ...prev,
        { text: data.message, sender: { username: data.sender }, timestamp: new Date().toISOString() },
      ]);
    };

    return () => {
      socketRef.current.close();
    };
  }, [dialogId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });

    // Обновим статус сообщений на "прочитано"
    axios.post(
      `http://localhost:8000/api/direct_messages/messages/mark_read/`,
      { dialogId },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  }, [dialogId]);

  const sendMessage = () => {
    if (text.trim() && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          message: text,
          sender: username,
        })
      );

      axios.post(
        "http://localhost:8000/api/direct_messages/messages/create/",
        {
          dialog: dialogId,
          text: text,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setText("");
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
          <div className="text-center text-sm text-gray-500 mt-4">{msgDate}</div>
        )}
        <div
          className={`max-w-[75%] p-3 rounded-lg shadow-sm ${
            isOwn
              ? "bg-[#c084cf] text-white self-end ml-auto"
              : "bg-[#f3e6f5] text-[#4b3f4e] mr-auto"
          }`}
        >
          <p className="text-sm font-semibold">{msg.sender.username}</p>
          <p>{msg.text}</p>
          <p className="text-xs text-right mt-1 opacity-60">
            {dayjs(msg.timestamp).format("HH:mm")}
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

      <div className="bg-[#f3e6f5] rounded-2xl shadow-xl p-6 w-full max-w-3xl mx-auto max-h-[800px]">
        <h2 className="text-2xl font-bold text-center text-[#4b3f4e] mb-6">
          Диалог
        </h2>

        <div className="bg-white rounded-xl p-4 max-h-[650px] overflow-y-auto space-y-2 mb-4 shadow-inner flex flex-col">
          {renderMessages()}
          <div ref={scrollRef} />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            placeholder="Сообщение"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="flex-grow px-4 py-2 rounded-xl border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#c084cf]"
          />
          <Button onClick={sendMessage} variant="primary" className="w-full sm:w-auto">
            Отправить
          </Button>
        </div>
      </div>
    </div>
  );
}
