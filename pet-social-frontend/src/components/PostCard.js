import React, { useEffect, useState } from "react";
import { FaHeart, FaComment, FaRetweet } from "react-icons/fa";
import Button from "./Button";
import RepostModal from "./RepostModal";

const PostCard = ({ post, onDelete, onHashtagClick }) => {
  const currentUserId = parseInt(localStorage.getItem("user_id"));
  const currentUsername = localStorage.getItem("username");

  const isOwner = post.group_name
    ? post.group_creator_id === currentUserId
    : post.user_id === currentUserId;

  const [liked, setLiked] = useState(post.liked_by_user);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [repostCount, setRepostCount] = useState(post.repost_count || 0);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [rawComments, setRawComments] = useState(post.comments || []);
  const [comments, setComments] = useState([]);
  const [commentLikes, setCommentLikes] = useState({});
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatList, setChatList] = useState([]);

  useEffect(() => {
    const likeInfo = {};
    post.comments?.forEach((c) => {
      likeInfo[c.id] = {
        count: c.likes_count || 0,
        liked: c.liked_by_user || false,
      };
    });
    setCommentLikes(likeInfo);
  }, [post.comments]);

  useEffect(() => {
    const topLevel = rawComments.filter((c) => !c.parent);
    const replies = rawComments.filter((c) => c.parent);
    const withReplies = topLevel.map((comment) => ({
      ...comment,
      replies: replies.filter((r) => r.parent === comment.id),
    }));
    setComments(withReplies);
  }, [rawComments]);

  const toggleLike = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/posts/${post.id}/like/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
      });
      if (response.ok) {
        const data = await response.json();
        setLiked(data.liked_by_user);
        setLikesCount(data.likes_count);
      }
    } catch (error) {
      console.error("Ошибка сети:", error);
    }
  };

  const handleRepost = async (groupId = null) => {
    try {
      const requestData = {};
      if (groupId) {
        requestData.group_id = groupId;
      }

      const res = await fetch(`http://localhost:8000/api/posts/${post.id}/repost/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
        body: JSON.stringify(requestData),
      });

      if (res.ok) {
        alert("Пост успешно репостнут!");

        // Обновляем счетчик репостов
        const updatedRes = await fetch(`http://localhost:8000/api/posts/${post.id}/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
        });
        if (updatedRes.ok) {
          const updated = await updatedRes.json();
          setRepostCount(updated.repost_count || 0);
        }
      } else {
        alert("Ошибка при репосте");
      }
    } catch (e) {
      console.error("Ошибка при репосте:", e);
    }
  };

  const handleToggleCommentLike = async (id) => {
    try {
      const res = await fetch(`http://localhost:8000/api/posts/comments/${id}/like/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCommentLikes((prev) => ({
          ...prev,
          [id]: {
            liked: data.liked_by_user,
            count: data.likes_count,
          },
        }));
      }
    } catch (e) {
      console.error("Ошибка при лайке комментария:", e);
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;
    try {
      const res = await fetch(`http://localhost:8000/api/posts/comments/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
        body: JSON.stringify({ post: post.id, content: commentText }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setCommentText("");
        setRawComments((prev) => [...prev, newComment]);
      }
    } catch (e) {
      console.error("Ошибка при добавлении комментария:", e);
    }
  };

  const handleReplySubmit = async (parentId) => {
    if (!replyText.trim()) return;
    try {
      const res = await fetch(`http://localhost:8000/api/posts/comments/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
        body: JSON.stringify({ post: post.id, parent: parentId, content: replyText }),
      });
      if (res.ok) {
        const newReply = await res.json();
        setRawComments((prev) => [...prev, newReply]);
        setReplyText("");
        setReplyTo(null);
      }
    } catch (e) {
      console.error("Ошибка при ответе на комментарий:", e);
    }
  };

  const handleDeleteComment = async (id) => {
    try {
      const res = await fetch(`http://localhost:8000/api/posts/comments/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
      });
      if (res.ok) {
        setRawComments((prev) => prev.filter((c) => c.id !== id && c.parent !== id));
      }
    } catch (e) {
      console.error("Ошибка при удалении комментария:", e);
    }
  };

  const renderContent = (p) => {
    const isGroupPost = !!(p.group_name || p.group);
    const avatar = isGroupPost ? p.group_avatar : p.user_avatar;
    const name = isGroupPost ? p.group_name : p.username;
    const profileUrl = isGroupPost ? `/groups/${p.group}` : `/profile/${p.user_id}`;

    return (
      <>
        <div className="flex items-center gap-3">
          {avatar ? (
            <img src={avatar.startsWith("http") ? avatar : `http://localhost:8000${avatar}`} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className={`w-10 h-10 rounded-full font-bold flex items-center justify-center text-sm ${isGroupPost ? "bg-purple-200 text-purple-800" : "bg-blue-200 text-blue-800"}`}>
              {name[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <a href={profileUrl} className="font-semibold text-gray-800 hover:underline">{name}</a>
            <p className="text-xs text-gray-500">{new Date(p.created_at).toLocaleString("ru-RU")}</p>
          </div>
        </div>
        {p.content && <p className="text-gray-800 whitespace-pre-wrap">{p.content}</p>}
        {Array.isArray(p.hashtags) && p.hashtags.length > 0 && (
          <div className="text-sm text-[#4b3f4e] flex flex-wrap gap-2">
            {p.hashtags.map((tag, i) => (
              <button key={i} onClick={() => onHashtagClick?.(tag)} className="hover:underline hover:text-[#6e4c77] transition">#{tag}</button>
            ))}
          </div>
        )}
        {p.images?.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
            {p.images.filter((img) => img.image).map((img, i) => (
              <img key={i} src={img.image.startsWith("http") ? img.image : `http://localhost:8000${img.image}`} className="w-full h-auto rounded-xl border border-[#baa6ba]" alt="post" />
            ))}
          </div>
        )}
      </>
    );
  };

  const renderReplies = (replies) =>
    replies.map((reply) => {
      const isReplyAuthor = reply.user === currentUsername;
      const isReplyRecent = new Date() - new Date(reply.created_at) <= 5 * 60 * 1000;
      const isReplyPostAuthor = post.user_id === currentUserId;

      return (
        <div key={reply.id} className="bg-gray-100 p-2 rounded-xl text-sm shadow-sm ml-4 mt-2">
          <div className="flex justify-between items-center">
            <div className="font-semibold">{reply.user}</div>
            {(isReplyAuthor && isReplyRecent) || isReplyPostAuthor ? (
              <button onClick={() => handleDeleteComment(reply.id)} className="text-xs text-red-500 hover:underline">Удалить</button>
            ) : null}
          </div>
          <div className="text-gray-700 whitespace-pre-wrap">{reply.content}</div>
          <div className="text-[10px] text-gray-400">{new Date(reply.created_at).toLocaleString("ru-RU")}</div>
          <button onClick={() => handleToggleCommentLike(reply.id)} className={`flex items-center gap-1 transition ${commentLikes[reply.id]?.liked ? "text-red-500" : "hover:text-red-500"}`}>
            <FaHeart />
            <span>{commentLikes[reply.id]?.count || 0}</span>
          </button>
        </div>
      );
    });

// Добавьте эту функцию в компонент PostCard перед return
const handleRepostInChat = async (chatId, comment = "") => {
  if (!chatId) return;

  try {
    const res = await fetch(`http://localhost:8000/api/posts/chats/${chatId}/share/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("access")}`,
      },
      body: JSON.stringify({ post_id: Number(post.id), comment }),
    });

    if (res.ok) {
      alert("Пост успешно отправлен в чат!");

      const updated = await fetch(`http://localhost:8000/api/posts/${post.id}/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
      });
      if (updated.ok) {
        const data = await updated.json();
        setRepostCount(data.repost_count || 0);
      }
    } else {
      alert("Ошибка при отправке в чат");
    }
  } catch (e) {
    console.error("Ошибка при репосте в чат:", e);
  }
};

// Также в useEffect добавьте загрузку списка чатов
useEffect(() => {
  const fetchChats = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/direct_messages/dialogs/", {
        headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
      });
      if (res.ok) {
        const data = await res.json();
        setChatList(data);
      }
    } catch (e) {
      console.error("Ошибка при загрузке чатов:", e);
    }
  };
  
  fetchChats();
}, []);

  return (
    <div className="bg-[#baa6ba] border-4 border-white rounded-2xl p-3 shadow-inner">
      <div className="bg-[#f3e6f5] rounded-2xl p-4 space-y-3">
        {renderContent(post)}
        {post.original_post && (
          <div className="mt-4 border-t pt-4 border-dashed border-[#baa6ba]">
            <p className="text-xs text-gray-500 mb-2">Репост:</p>
            <div className="bg-white p-3 rounded-xl shadow-inner">{renderContent(post.original_post)}</div>
          </div>
        )}

        <div className="flex items-center justify-between mt-4 text-[#4b3f4e] text-sm">
          <div className="flex gap-6 items-center">
            <button onClick={toggleLike} className={`flex items-center gap-1 transition ${liked ? "text-red-500" : "hover:text-red-500"}`}>
              <FaHeart />
              <span>{likesCount}</span>
            </button>
            <button className="flex items-center gap-1 hover:text-blue-500 transition">
              <FaComment />
              <span>{rawComments.length}</span>
            </button>
            <button onClick={() => setShowRepostModal(true)} className="flex items-center gap-1 hover:text-green-600 transition">
              <FaRetweet />
              <span>{repostCount}</span>
            </button>
          </div>
          {onDelete && isOwner && (
            <Button
              onClick={() => {
                onDelete(post.id);

                // если это репост, обновим счетчик у оригинального поста
                if (post.original_post_id) {
                  fetch(`http://localhost:8000/api/posts/${post.original_post_id}/`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
                  })
                    .then((res) => res.json())
                    .then((data) => setRepostCount(data.repost_count || 0))
                    .catch((err) => console.error("Ошибка при обновлении счётчика репостов:", err));
                }
              }}
              variant="danger"
              className="text-sm"
            >
              Удалить
            </Button>
          )}
        </div>

        <div className="mt-4 space-y-2">
          {comments.map((comment) => {
            const isCommentAuthor = comment.user === currentUsername;
            const isPostAuthor = post.user_id === currentUserId;
            const created = new Date(comment.created_at);
            const now = new Date();
            const isRecent = now - created <= 5 * 60 * 1000;

            return (
              <div key={comment.id} className="bg-white p-2 rounded-xl shadow text-sm">
                <div className="flex justify-between items-center">
                  <div className="font-semibold">{comment.user}</div>
                  {(isCommentAuthor && isRecent) || isPostAuthor ? (
                    <button onClick={() => handleDeleteComment(comment.id)} className="text-xs text-red-500 hover:underline">Удалить</button>
                  ) : null}
                </div>
                <div className="text-gray-800 whitespace-pre-wrap">{comment.content}</div>
                <div className="text-[10px] text-gray-400">{created.toLocaleString("ru-RU")}</div>
                <button onClick={() => handleToggleCommentLike(comment.id)} className={`flex items-center gap-1 transition ${commentLikes[comment.id]?.liked ? "text-red-500" : "hover:text-red-500"}`}>
                  <FaHeart />
                  <span>{commentLikes[comment.id]?.count || 0}</span>
                </button>
                <button onClick={() => setReplyTo(comment.id)} className="text-xs text-blue-500 hover:underline ml-2">Ответить</button>
                {replyTo === comment.id && (
                  <div className="mt-2 ml-2">
                    <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Ваш ответ..." className="w-full p-2 rounded-xl border border-[#baa6ba] text-sm" />
                    <Button onClick={() => handleReplySubmit(comment.id)} variant="secondary" className="mt-1">Ответить</Button>
                  </div>
                )}
                {comment.replies && renderReplies(comment.replies)}
              </div>
            );
          })}
        </div>

        <div className="mt-2">
          <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Оставить комментарий..." className="w-full p-2 rounded-xl border border-[#baa6ba] text-sm" />
          <Button onClick={handleCommentSubmit} variant="secondary" className="mt-1">Отправить</Button>
        </div>
      </div>

      <RepostModal
  isOpen={showRepostModal}
  onClose={() => setShowRepostModal(false)}
  onConfirm={(target) => {
    setShowRepostModal(false);
    if (target === "wall") handleRepost();
  }}
  chatList={chatList}
  selectedChat={selectedChat} // 🆕
  setSelectedChat={setSelectedChat} // 🆕
  onRepostInChat={(chatId, comment) => {
    handleRepostInChat(chatId, comment);
    setShowRepostModal(false);
  }}
/>

    </div>
  );
};

export default PostCard;
