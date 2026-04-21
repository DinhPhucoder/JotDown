import React from 'react';
import { Link } from 'react-router';
import './NotFoundPage.css';

const NotFound = () => {
    return (
        <div className="not-found-page" style={{ backgroundImage: `url(/bg_login.jpg)` }}>
            <div className="not-found-overlay" />
            <div className="not-found-content">
                <h1 className="not-found-title" data-text="404">
                    404
                </h1>
                <p className="not-found-subtitle">Not Found!</p>
                <Link to="/login" className="not-found-btn">Trở về Đăng nhập</Link>
            </div>
        </div>
    )
}

export default NotFound;
