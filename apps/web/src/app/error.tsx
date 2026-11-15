'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <div className="container inner-page empty-state"><div className="empty-icon">☕</div><h1>Có chút trục trặc!</h1><p>Xin lỗi, hệ thống đang gặp lỗi. Hãy thử tải lại trang.</p><button className="btn" onClick={reset}>Thử lại</button></div>}
