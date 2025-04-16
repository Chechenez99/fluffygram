import React, { useState } from "react";
import Button from "./Button";

const RepostModal = ({
  isOpen,
  onClose,
  onConfirm,
  chatList,
  onRepostInChat,
  selectedChat,
  setSelectedChat,
}) => {
  const [target, setTarget] = useState("wall");
  const [comment, setComment] = useState(""); // 🆕

  const getChatLabel = (chat) => {
    if (chat.is_group) return chat.title || "Групповой чат";
    return chat.user2?.username || chat.user1?.username || "Личный чат";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
      <div className="bg-[#f3e6f5] border-4 border-white rounded-2xl p-6 w-[90%] max-w-md shadow-2xl space-y-4 text-[#4b3f4e]">
        <h2 className="text-xl font-bold text-center">Куда вы хотите репостнуть этот пост?</h2>

        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="repostTarget"
              value="wall"
              checked={target === "wall"}
              onChange={() => setTarget("wall")}
              className="accent-[#b46db6]"
            />
            <span className="text-base">На свою стену</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="repostTarget"
              value="chat"
              checked={target === "chat"}
              onChange={() => setTarget("chat")}
              className="accent-[#b46db6]"
            />
            <span className="text-base">В чат</span>
          </label>
        </div>

        {target === "chat" && chatList && chatList.length > 0 && (
          <>
            <div className="mt-4">
              <h3 className="text-sm">Выберите чат:</h3>
              <select
                className="w-full p-2 rounded-xl border"
                value={selectedChat || ""}
                onChange={(e) => setSelectedChat(e.target.value)}
              >
                <option value="">Выберите чат...</option>
                {chatList.map((chat) => (
                  <option key={chat.id} value={String(chat.id)}>
                    {getChatLabel(chat)}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4">
              <h3 className="text-sm">Комментарий к репосту:</h3>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-2 rounded-xl border border-gray-300 mt-1"
                placeholder="Введите сообщение..."
              />
            </div>
          </>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Отмена</Button>

          {target === "chat" ? (
            <Button
              variant="purple"
              onClick={() => {
                onRepostInChat(selectedChat, comment); // 🆕
                onClose();
              }}
              disabled={!selectedChat}
            >
              Репостнуть
            </Button>
          ) : (
            <Button variant="lightGreen" onClick={() => onConfirm("wall")}>
              Репостнуть
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RepostModal;
