import { AlertTriangle, X } from "lucide-react";
import Button from "./Button";

export default function DeleteConfirmDialog({ isOpen, onClose, onConfirm, isDeleting }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white border-l-4 border-[#c084cf] rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex justify-between items-center border-b border-[#c084cf] pb-3 mb-4">
          <h3 className="text-xl font-semibold text-[#4b3f4e]">
            Подтверждение удаления
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-[#c084cf]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="py-4">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-[#f3e6f5] flex items-center justify-center mr-3">
              <AlertTriangle className="w-5 h-5 text-[#f76b6b]" />
            </div>
            <p className="text-[#4b3f4e] text-lg">
              Вы уверены, что хотите удалить этого питомца?
            </p>
          </div>
          <p className="text-[#c084cf] mb-4 pl-12">
            Это действие нельзя будет отменить.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-end gap-3 border-t border-[#c084cf] pt-4">
          <Button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            variant="secondary"
            className="w-full sm:w-auto"
          >
            Отмена
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            variant="danger"
            className="w-full sm:w-auto"
          >
            {isDeleting ? "Удаляем..." : "Удалить"}
          </Button>
        </div>
      </div>
    </div>
  );
}
