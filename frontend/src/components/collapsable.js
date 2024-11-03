import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const CollapsibleTool = ({ title, additionalText }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-gray-100 rounded-lg mb-2 overflow-hidden">
            <button
                className="w-full text-left p-4 flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="text-md text-gray-800 font-semibold">{title}</span>
                {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {isOpen && (
                <div className="p-4 pt-0">
                    <p className="text-sm text-gray-600">{additionalText}</p>
                </div>
            )}
        </div>
    );
};

export default CollapsibleTool;