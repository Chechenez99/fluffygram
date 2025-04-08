import { AlertTriangle, X } from "lucide-react";
import Button from "./Button";

export default function DeleteConfirmDialog({ isOpen, onClose, onConfirm, isDeleting }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white border-l-4 border-green-500 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex justify-between items-center border-b border-green-200 pb-3 mb-4">
          <h3 className="text-xl font-semibold text-[#E6E6FA]-900">
            Подтверждение удаления
          </h3>
          <button 
            onClick={onClose} 
            className="text-green-500 hover:text-green-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="py-4">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
              <AlertTriangle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-[#E6E6FA]-700 text-lg">
              Вы уверены, что хотите удалить этого питомца?
            </p>
          </div>
          <p className="text-[#E6E6FA]-500 mb-4 pl-12">
            Это действие нельзя будет отменить.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-end gap-3 border-t border-green-200 pt-4">
          <Button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="w-full sm:w-auto px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
          >
            Отмена
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-full sm:w-auto px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            {isDeleting ? "Удаляем..." : "Удалить"}
          </Button>
        </div>
      </div>
    </div>
  );
}
