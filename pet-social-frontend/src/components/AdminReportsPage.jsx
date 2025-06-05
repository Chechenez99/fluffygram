import React, { useEffect, useState } from "react";
import axios from "axios";
import Button from "./Button";
import { useNavigate } from "react-router-dom";

const AdminReportsPage = () => {
  const [reports, setReports] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access");
    axios.get("http://localhost:8000/api/posts/post-reports/", {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => setReports(res.data));
  }, []);

  const resolveReport = (reportId, deletePost, postId) => {
    const token = localStorage.getItem("access");

    axios.patch(`http://localhost:8000/api/posts/post-reports/${reportId}/`, {
      is_resolved: true,
      is_deleted: deletePost,
    }, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(() => {
      setReports(prev => prev.filter(r => r.id !== reportId));

      window.dispatchEvent(new CustomEvent("reportStatusChanged", {
        detail: { postId: postId }
      }));
    });
  };

  return (
    <div className="min-h-screen bg-[#baa6ba] flex justify-center items-start p-6">
      <div className="bg-[#f3e6f5] border-4 border-white rounded-2xl w-full max-w-4xl p-6 shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center text-purple-800">📋 Жалобы на посты</h1>

        {reports.length === 0 ? (
          <p className="text-center text-gray-700">Нет активных жалоб 🎉</p>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-white p-4 rounded-xl shadow-md space-y-2"
              >
                <div className="text-sm text-gray-600">👤 Пожаловался пользователь: <b>{report.reporter}</b></div>
                <div className="text-gray-800">
                  <p className="text-md font-semibold mb-1">📝 Содержание поста:</p>
                  <p>{report.post?.content || <i className="text-gray-400">Нет текста</i>}</p>

                  {report.post?.images?.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {report.post.images.map((img, i) => (
                        <img
                          key={i}
                          src={img.image.startsWith("http") ? img.image : `http://localhost:8000${img.image}`}
                          alt={`post-img-${i}`}
                          className="w-full h-auto rounded-xl border"
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-dashed border-[#baa6ba]">
                  <Button variant="danger" onClick={() => resolveReport(report.id, true, report.post.id)}>
                    Удалить
                  </Button>
                  <Button variant="lightGreen" onClick={() => resolveReport(report.id, false, report.post.id)}>
                    Не удалять
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReportsPage;
