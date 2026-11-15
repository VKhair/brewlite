import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container inner-page empty-state">
      <div className="empty-icon">☕</div>
      <h1>404 — Lạc đường rồi!</h1>
      <p>
        Trang bạn tìm không tồn tại. Quay về BrewLite để thưởng thức một ly ngon
        nhé.
      </p>
      <Link className="btn" href="/">
        Về trang chủ
      </Link>
    </div>
  );
}
