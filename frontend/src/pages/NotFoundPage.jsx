import React from 'react';
import { Link } from 'react-router';
import bgLogin from '../assets/bg_login.jpg';
import './NotFoundPage.css';

const NotFound = () => {
    return (
        <div className="not-found-page" style={{ backgroundImage: `url(${bgLogin})` }}>
            <div className="not-found-overlay" />
            <div className="not-found-content">
                <h1 className="not-found-title" data-text="404">
                    404
                </h1>
                <p className="not-found-subtitle">Lạc đường dẫn rồi fen</p>
                <Link to="/" className="not-found-btn">Trở về Đăng nhập</Link>
            </div>
        </div>
    )
}

export default NotFound;
