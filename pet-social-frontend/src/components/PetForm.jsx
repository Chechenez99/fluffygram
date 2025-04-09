import { useState } from "react";
import axios from "axios";
import Button from './Button';
import Input from './Input';
import Textarea from "./textarea";
import { Loader2, Upload, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import DeleteConfirmDialog from "./DeleteConfirmDialog";

const API_BASE_URL = "http://localhost:8000";

export default function PetForm({ onSuccess, petId, initialData = {} }) {
  const [data, setData] = useState({
    name: initialData.name || "",
    species: initialData.species || "",
    breed: initialData.breed || "",
    age: initialData.age || "",
    ageMonths: initialData.ageMonths || "",
    about: initialData.about || "",
    avatar: null,
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(initialData.avatar || null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!data.name.trim()) newErrors.name = "Имя обязательно для заполнения";
    if (!data.species.trim()) newErrors.species = "Вид животного обязателен";
    if (data.avatar && data.avatar.size > 5 * 1024 * 1024) {
      newErrors.avatar = "Размер файла не должен превышать 5MB";
    }
    if (data.avatar && !data.avatar.type.startsWith('image/')) {
      newErrors.avatar = "Файл должен быть изображением";
    }
    if (data.age && parseInt(data.age) < 0) {
      newErrors.age = "Возраст не может быть отрицательным";
    }
    if (data.ageMonths && (parseInt(data.ageMonths) < 0 || parseInt(data.ageMonths) > 11)) {
      newErrors.ageMonths = "Месяцы должны быть от 0 до 11";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));

    if (name === 'avatar' && files?.[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(files[0]);
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("species", data.species);
      if (data.breed) formData.append("breed", data.breed);
      if (data.about) formData.append("about", data.about);

      const ageInYears = data.age ? parseFloat(data.age) : 0;
      const ageInMonths = data.ageMonths ? parseFloat(data.ageMonths) : 0;
      const totalAgeInMonths = Math.round(ageInYears * 12 + ageInMonths);
      formData.append("age", totalAgeInMonths.toString());

      if (data.avatar && data.avatar instanceof File) {
        formData.append("avatar", data.avatar);
      }

      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
      };

      let response;
      if (petId) {
        response = await axios.put(`${API_BASE_URL}/api/pets/${petId}/`, formData, config);
        toast.success("Питомец успешно обновлён! 🎉");
      } else {
        response = await axios.post(`${API_BASE_URL}/api/pets/`, formData, config);
        toast.success("Питомец успешно создан! 🎉");
      }

      onSuccess?.();
    } catch (error) {
      console.error("Ошибка при отправке формы:", error);
      if (error.response?.data) {
        const serverErrors = error.response.data;
        if (typeof serverErrors === 'object') {
          Object.entries(serverErrors).forEach(([field, messages]) => {
            const text = Array.isArray(messages) ? messages.join(', ') : JSON.stringify(messages);
            toast.error(`${field}: ${text}`);
          });
        } else {
          toast.error(typeof serverErrors === 'string' ? serverErrors : JSON.stringify(serverErrors));
        }
      } else {
        toast.error("Ошибка соединения или запроса");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await axios.delete(`${API_BASE_URL}/api/pets/${petId}/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
      });
      toast.success("Питомец успешно удалён");
      onSuccess?.();
    } catch (error) {
      toast.error("Не удалось удалить питомца. Попробуйте еще раз.");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8 max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-12">
          <div className="flex-shrink-0">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative w-48 h-48 rounded-full overflow-hidden bg-white border-2 border-dashed border-[#baa6ba] hover:border-[#b46db6] transition-colors">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[#b46db6]">
                    <Upload className="w-16 h-16 mb-2" />
                    <span className="text-sm">Загрузить фото</span>
                  </div>
                )}
                <label className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black bg-opacity-0 hover:bg-opacity-50 transition-opacity">
                  <input
                    type="file"
                    name="avatar"
                    onChange={handleChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <Upload className="w-8 h-8 text-white" />
                </label>
              </div>
              {errors.avatar && (
                <p className="text-red-500 text-sm">{errors.avatar}</p>
              )}
            </div>
          </div>

          <div className="flex-grow space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-[#4b3f4e] mb-2">Имя питомца</label>
                <Input
                  name="name"
                  value={data.name}
                  onChange={handleChange}
                  placeholder="Введите имя"
                  className={errors.name ? "border-red-500" : "border-[#baa6ba] focus:ring-[#b46db6]"}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4b3f4e] mb-2">Вид животного</label>
                <Input
                  name="species"
                  value={data.species}
                  onChange={handleChange}
                  placeholder="Например: кошка, собака"
                  className={errors.species ? "border-red-500" : "border-[#baa6ba] focus:ring-[#b46db6]"}
                />
                {errors.species && <p className="text-red-500 text-sm mt-1">{errors.species}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4b3f4e] mb-2">Порода</label>
                <Input
                  name="breed"
                  value={data.breed}
                  onChange={handleChange}
                  placeholder="Укажите породу"
                  className="border-[#baa6ba] focus:ring-[#b46db6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#4b3f4e] mb-2">Возраст (лет)</label>
                  <Input
                    name="age"
                    type="number"
                    value={data.age}
                    onChange={handleChange}
                    placeholder="Годы"
                    min="0"
                    className={errors.age ? "border-red-500" : "border-[#baa6ba] focus:ring-[#b46db6]"}
                  />
                  {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#4b3f4e] mb-2">Месяцев</label>
                  <Input
                    name="ageMonths"
                    type="number"
                    value={data.ageMonths}
                    onChange={handleChange}
                    placeholder="0-11"
                    min="0"
                    max="11"
                    className={errors.ageMonths ? "border-red-500" : "border-[#baa6ba] focus:ring-[#b46db6]"}
                  />
                  {errors.ageMonths && <p className="text-red-500 text-sm mt-1">{errors.ageMonths}</p>}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#4b3f4e] mb-2">Описание</label>
              <Textarea
                name="about"
                value={data.about}
                onChange={handleChange}
                placeholder="Расскажите о характере и привычках вашего питомца"
                className="min-h-[150px] border-[#baa6ba] focus:ring-[#b46db6]"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 text-lg py-4 justify-center"
                variant="purple"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 w-6 h-6" />
                    Сохраняем...
                  </>
                ) : petId ? (
                  "Сохранить изменения"
                ) : (
                  "Создать питомца"
                )}
              </Button>

              {petId && (
                <Button
                  type="button"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isDeleting}
                  className="px-6 py-4 text-lg"
                  variant="dangerOutline"
                >
                  <Trash2 className="w-6 h-6" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </form>

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}
