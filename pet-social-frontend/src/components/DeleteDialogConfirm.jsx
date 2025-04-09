import React from "react";
import Button from "./Button";

export default function DeleteDialogConfirm({ onClose, onDeleteSelf, onDeleteAll }) {
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white rounded-xl p-6 shadow-xl w-[320px] space-y-4">
        <h3 className="text-xl font-semibold text-[#4b3f4e] text-center">
          Удаление диалога
        </h3>
        <p className="text-sm text-gray-600 text-center">
          Вы действительно хотите удалить диалог?
        </p>
        <div className="flex justify-between gap-2">
          <Button
            variant="danger"
            onClick={onDeleteSelf}
            className="w-full text-sm"
          >
            У себя
          </Button>
          <Button
            variant="danger"
            onClick={onDeleteAll}
            className="w-full text-sm"
          >
            У всех
          </Button>
        </div>
        <Button 
        	variant="secondary"
        	onClick={onClose} 
        	className="w-full mt-2 text-sm">
          Отмена
        </Button>
      </div>
    </div>
  );
}
