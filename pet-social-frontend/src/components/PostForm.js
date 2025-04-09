import React, { useState } from 'react';
import Button from "./Button";

const PostForm = ({ onPostSubmit, groupId }) => {
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!hashtags.trim()) {
      alert('Пожалуйста, добавьте хотя бы один хэштег');
      return;
    }
    const hashtagsArray = hashtags.trim().split(/\s+/);

    const formData = new FormData();
    formData.append('content', content);
    formData.append('hashtags', JSON.stringify(hashtagsArray));

    if (groupId) {
      formData.append('group', groupId);
    }

    images.slice(0, 10).forEach((img) => {
      formData.append("images", img);
    });

    onPostSubmit(formData);
    setContent('');
    setHashtags('');
    setImages([]);
    setPreviewUrls([]);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 10);
    setImages(files);
    const previews = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(previews);
  };

  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
    const newPreviews = [...previewUrls];
    newPreviews.splice(index, 1);
    setPreviewUrls(newPreviews);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#baa6ba] p-4 rounded-2xl shadow-inner border-4 border-white w-full"
    >
      <div className="bg-[#f3e6f5] rounded-2xl p-4 space-y-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Ваш пост..."
          className="w-full p-3 rounded-2xl border border-[#baa6ba] resize-none focus:outline-none focus:ring-2 focus:ring-[#b46db6]"
          rows={4}
        />
        <input
          type="text"
          value={hashtags}
          onChange={(e) => setHashtags(e.target.value)}
          placeholder="Хэштеги (обязательно, разделяйте пробелами)"
          className="w-full p-3 rounded-2xl border border-[#baa6ba] focus:outline-none focus:ring-2 focus:ring-[#b46db6]"
        />

        <div className="flex flex-col items-center">
          <label className="cursor-pointer px-6 py-2 bg-[#c4e1c1] text-[#2f4f28] rounded-2xl hover:bg-[#a4d0a0]  transition mb-2">
            Выбрать фото (до 10)
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <div className="flex flex-wrap gap-2 justify-center">
            {previewUrls.map((url, idx) => (
              <div key={idx} className="relative w-20 h-20">
                <img
                  src={url}
                  alt="preview"
                  className="object-cover w-full h-full rounded-2xl border-2 border-[#baa6ba]"
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-[-8px] right-[-8px] bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            type="submit"
            variant="lightGreen"
            className="px-12"
          >
            Опубликовать
          </Button>
        </div>
      </div>
    </form>
  );
};

export default PostForm;
