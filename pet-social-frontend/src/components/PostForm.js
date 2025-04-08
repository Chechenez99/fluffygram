import React, { useState } from 'react';

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
    <form onSubmit={handleSubmit} className="border-2 border-green-300 bg-green-50 p-4 rounded-xl shadow w-full">
      <div className="space-y-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Ваш пост..."
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          value={hashtags}
          onChange={(e) => setHashtags(e.target.value)}
          placeholder="Хэштеги (обязательно, разделяйте пробелами)"
          className="w-full p-2 border rounded"
        />

        <div className="flex flex-col items-center">
          <label className="cursor-pointer px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition mb-2">
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
                  className="object-cover w-full h-full rounded"
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <button
            type="submit"
            className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
          >
            Опубликовать
          </button>
        </div>
      </div>
    </form>
  );
};

export default PostForm;
