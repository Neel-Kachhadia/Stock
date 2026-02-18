import React from 'react';
import { FaChartLine } from 'react-icons/fa';

export default function Header() {
    return (
        <header className="header">
            <div className="logo">
                <FaChartLine />
                <div>Trade<span>X</span> India</div>
            </div>
            {/* Search and User controls will go here */}
        </header>
    );
}
