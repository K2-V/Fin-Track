import React from 'react';

const Modal = ({ open, onClose, children, hideCloseButton = false }) => {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl p-6 shadow-lg max-w-2xl w-full relative"
                onClick={(e) => e.stopPropagation()}
            >
                {!hideCloseButton && (
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-4 text-xl text-gray-400 hover:text-black"
                    >
                        &times;
                    </button>
                )}
                {children}
            </div>
        </div>
    );
};

export default Modal;