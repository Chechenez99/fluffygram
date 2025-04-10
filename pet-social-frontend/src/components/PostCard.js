import React, { useState } from "react";
import { FaHeart, FaComment, FaRetweet, FaTrash } from "react-icons/fa";
import Button from "./Button";

const PostCard = ({ post, onDelete, onHashtagClick }) => {
  const isGroupPost = !!post.group_name;
  const currentUserId = parseInt(localStorage.getItem("user_id"));
  const isOwner = isGroupPost
    ? post.group_creator_id === currentUserId
    : post.user_id === currentUserId;

  const [liked, setLiked] = useState(post.liked_by_user);
  const [likesCount, setLikesCount] = useState(post.likes_count);

  const toggleLike = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/posts/${post.id}/like/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("access")}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setLiked(data.liked_by_user);
        setLikesCount(data.likes_count);
      } else {
        console.error("Ошибка при переключении лайка");
      }
    } catch (error) {
      console.error("Ошибка сети:", error);
    }
  };

  const getAvatarSrc = () => {
    const avatar = isGroupPost ? post.group_avatar : post.user_avatar;
    if (!avatar) return null;
    return avatar.startsWith("http")
      ? avatar
      : `http://localhost:8000${avatar}`;
  };

  return (
    <div className="bg-[#baa6ba] border-4 border-white rounded-2xl p-3 shadow-inner">
      <div className="bg-[#f3e6f5] rounded-2xl p-4 space-y-3">
        {/* Верхняя часть: автор или группа */}
        <div className="flex items-center gap-3">
          {getAvatarSrc() ? (
            <img
              src={getAvatarSrc()}
              alt={isGroupPost ? post.group_name : post.username}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className={`w-10 h-10 rounded-full font-bold flex items-center justify-center text-sm ${
              isGroupPost
                ? "bg-purple-200 text-purple-800"
                : "bg-blue-200 text-blue-800"
            }`}>
              {(isGroupPost ? post.group_name : post.username)[0]?.toUpperCase()}
            </div>
          )}

          <div>
            <a
              href={isGroupPost ? `/groups/${post.group}` : `/profile/${post.user_id}`}
              className="font-semibold text-gray-800 hover:underline"
            >
              {isGroupPost ? post.group_name : post.username}
            </a>
            <p className="text-xs text-gray-500">
              {new Date(post.created_at).toLocaleString("ru-RU")}
            </p>
          </div>
        </div>

        {/* Контент */}
        {post.content && (
          <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
        )}

        {/* Хэштеги */}
        {Array.isArray(post.hashtags) && post.hashtags.length > 0 && (
          <div className="text-sm text-[#4b3f4e] flex flex-wrap gap-2">
            {post.hashtags.map((tag, i) => (
              <button
                key={i}
                onClick={() => onHashtagClick?.(tag)}
                className="hover:underline hover:text-[#6e4c77] transition"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Картинки */}
        {post.images && post.images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
            {post.images
              .filter((img) => img.image)
              .map((img, index) => (
                <img
                  key={index}
                  src={img.image.startsWith("http") ? img.image : `http://localhost:8000${img.image}`}
                  alt={`post-img-${index}`}
                  className="w-full h-auto rounded-xl border border-[#baa6ba]"
                />
              ))}
          </div>
        )}

        {/* Нижняя панель: кнопки */}
        <div className="flex items-center justify-between mt-4 text-[#4b3f4e] text-sm">
          <div className="flex gap-6 items-center">
            <button
              onClick={toggleLike}
              className={`flex items-center gap-1 transition ${liked ? "text-red-500" : "hover:text-red-500"}`}
            >
              <FaHeart />
              <span>{likesCount}</span>
            </button>
            <button className="flex items-center gap-1 hover:text-blue-500 transition">
              <FaComment />
              <span>{post.comments?.length || 0}</span>
            </button>
            <button className="flex items-center gap-1 hover:text-green-600 transition">
              <FaRetweet />
              <span>{post.repost_count || 0}</span>
            </button>
          </div>

          {onDelete && isOwner && (
            <Button
              onClick={() => onDelete(post.id)}
              variant="danger"
              className="flex items-center gap-1 text-sm"
            >
              Удалить
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostCard;
