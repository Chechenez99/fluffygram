// components/PetCard.js
import React, { useState } from "react";
import axios from "axios";
import PetForm from "./PetForm";
import Button from "./Button";
import { ToastContainer, toast } from "react-toastify";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "./dialog.js";
import DeleteConfirmDialog from "./DeleteConfirmDialog";

const API_BASE_URL = "http://localhost:8000";

// Функция для форматирования возраста
const formatAge = (age) => {
  if (!age && age !== 0) return "возраст неизвестен";

  const ageInMonths = parseInt(age);
  if (isNaN(ageInMonths)) return "возраст неизвестен";

  const years = Math.floor(ageInMonths / 12);
  const months = ageInMonths % 12;

  let result = "";
  if (years > 0) {
    result += `${years} ${getYearText(years)}`;
  }
  if (months > 0) {
    if (result) result += " и ";
    result += `${months} ${getMonthText(months)}`;
  }
  if (!result) {
    result = "менее 1 месяца";
  }

  return result;
};

function getYearText(years) {
  if (years % 10 === 1 && years % 100 !== 11) {
    return "год";
  } else if ([2, 3, 4].includes(years % 10) && ![12, 13, 14].includes(years % 100)) {
    return "года";
  } else {
    return "лет";
  }
}

function getMonthText(months) {
  if (months % 10 === 1 && months % 100 !== 11) {
    return "месяц";
  } else if ([2, 3, 4].includes(months % 10) && ![12, 13, 14].includes(months % 100)) {
    return "месяца";
  } else {
    return "месяцев";
  }
}

export default function PetCard({ pet, onUpdated }) {
  const [open, setOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await axios.delete(`${API_BASE_URL}/api/pets/${pet.id}/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
      });
      toast.success("Питомец успешно удалён");
      onUpdated(); // Обновить список после удаления
    } catch (error) {
      console.error("Ошибка при удалении:", error);
      toast.error("Не удалось удалить питомца. Попробуйте еще раз.");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className="p-4 sm:p-4 md:p-4 border-l-4 border-green-500 rounded-lg shadow-md bg-white flex flex-col w-full max-w-md">
      {/* Проверка наличия аватара питомца */}
      <div className="relative w-full h-56 overflow-hidden rounded-lg mb-4">
        {pet.avatar ? (
          <img
            src={pet.avatar}
            alt={pet.name}
            className="absolute top-0 left-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute top-0 left-0 w-full h-full bg-green-100 flex items-center justify-center">
            <span className="text-green-400 text-lg">Нет фото</span>
          </div>
        )}
      </div>
      
      {/* Имя питомца */}
      <h3 className="text-xl font-semibold mb-2 break-words text-green-700">{pet.name}</h3>
      
      {/* Информация о питомце */}
      <div className="flex-grow mb-4">
        <p className="text-base text-green-600 mb-2">
          <span className="block mb-1">{pet.species} • {pet.breed || "порода неизвестна"}</span>
          <span className="block">{formatAge(pet.age)}</span>
        </p>
        <p className="text-sm text-green-700">{pet.about}</p>
      </div>

      <div className="flex gap-2 mt-auto w-full">
        {/* Диалоговое окно для редактирования питомца */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="flex-1 py-2 px-3 bg-green-500 hover:bg-green-600 text-white rounded transition text-sm font-medium">
              ✏️ Редактировать
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Редактировать питомца</DialogTitle>
            </DialogHeader>
            <PetForm
              petId={pet.id}
              initialData={{
                ...pet,
                age: pet.age ? Math.floor(parseInt(pet.age) / 12) : "",
                ageMonths: pet.age ? parseInt(pet.age) % 12 : ""
              }}
              onSuccess={() => {
                setOpen(false);
                onUpdated?.();
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Кнопка для удаления питомца */}
        <Button 
          className="flex-1 py-2 px-3 bg-green-500 hover:bg-green-600 text-white rounded transition text-sm font-medium" 
          onClick={() => setIsDeleteDialogOpen(true)}
        >
          🗑️ Удалить
        </Button>
      </div>

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />

      <ToastContainer />
    </div>
  );
}
