# Hướng dẫn cài đặt Supabase cho TDA Open 2026

## 1. Tạo Supabase project

1. Truy cập [supabase.com](https://supabase.com) và đăng ký tài khoản miễn phí
2. Nhấn **New project**, đặt tên (vd: `tda-open-2026`), chọn region gần nhất (Singapore)
3. Đặt database password và lưu lại
4. Chờ project khởi tạo (~1-2 phút)

## 2. Lấy URL và Anon Key

1. Vào **Project Settings** (icon gear ở sidebar trái)
2. Chọn tab **API**
3. Copy:
   - **Project URL** → dán vào `SUPABASE_URL` trong `supabase-config.js`
   - **anon / public** key → dán vào `SUPABASE_ANON_KEY` trong `supabase-config.js`

## 3. Tạo bảng match_scores

1. Vào **SQL Editor** (icon database ở sidebar trái)
2. Nhấn **New query**
3. Dán và chạy SQL sau:

```sql
-- Tạo bảng lưu điểm trận đấu
CREATE TABLE match_scores (
  phase TEXT NOT NULL,
  match_no INTEGER NOT NULL,
  score_home INTEGER,
  score_away INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (phase, match_no)
);

-- Bật Row Level Security
ALTER TABLE match_scores ENABLE ROW LEVEL SECURITY;

-- Cho phép đọc công khai
CREATE POLICY "public_read" ON match_scores FOR SELECT USING (true);

-- Cho phép ghi (truy cập được kiểm soát bằng mật khẩu ở frontend)
CREATE POLICY "public_write" ON match_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update" ON match_scores FOR UPDATE USING (true);
```

## 4. Bật Realtime

1. Vào **Database** → **Replication** (hoặc **Table Editor** → chọn bảng `match_scores` → **Realtime**)
2. Bật **Realtime** cho bảng `match_scores`
3. Hoặc vào SQL Editor và chạy:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE match_scores;
```

## 5. Cập nhật supabase-config.js

Mở file `supabase-config.js` và điền thông tin:

```js
window.SUPABASE_URL = 'https://xxxxxxxxxx.supabase.co';   // Project URL của bạn
window.SUPABASE_ANON_KEY = 'eyJhbGci...';                 // anon key của bạn
window.REFEREE_PASSWORD = 'mat_khau_cua_ban';             // đổi mật khẩu này!
```

## 6. Deploy

- Nếu dùng **Vercel**: push code lên GitHub, Vercel tự deploy
- Trang trọng tài truy cập qua: `https://your-domain.com/referee`
- Trang công khai tự động cập nhật điểm real-time khi trọng tài lưu

## Lưu ý

- `supabase-config.js` **không** bị gitignore — anon key là public-facing by design (Supabase dùng RLS để bảo vệ data)
- Mật khẩu trọng tài chỉ là client-side check — đủ dùng cho giải phong trào
- Nếu muốn bảo mật hơn, có thể dùng Supabase Auth với email/password riêng cho từng trọng tài
