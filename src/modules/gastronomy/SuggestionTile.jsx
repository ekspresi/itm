import React from 'react';

export default function SuggestionTile({ suggestion, onAdd, onEditAndAdd, onPreview, onReject, isAdding, isRejecting }) {
    return (
        <div className="bg-white p-4 rounded-lg shadow-md border flex flex-col gap-3">
            <div>
                <h4 className="font-bold text-blue-800">{suggestion.name}</h4>
                <p className="text-xs text-gray-500 mt-1">{suggestion.address}</p>
            </div>
            <div className="flex items-center justify-between mt-auto pt-2 border-t">
                <div className="flex items-center gap-1 text-sm font-bold text-yellow-500">
                    <i className="fa-solid fa-star"></i>
                    <span>{suggestion.rating || '-'}</span>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={onPreview} className="text-gray-500 hover:text-blue-600 w-7 h-7 flex items-center justify-center rounded-lg" title="Podgląd"><i className="fa-solid fa-eye"></i></button>
                    <button onClick={onReject} disabled={isAdding || isRejecting} className="bg-red-100 hover:bg-red-200 text-red-700 w-7 h-7 flex items-center justify-center rounded-lg" title="Odrzuć">
                         {isRejecting ? <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div> : <i className="fa-solid fa-trash-can"></i>}
                    </button>
                    <button onClick={onAdd} disabled={isAdding || isRejecting} className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs py-1 px-3 rounded-lg flex items-center justify-center w-14">
                        {isAdding ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Dodaj'}
                    </button>
                </div>
            </div>
        </div>
    );
}