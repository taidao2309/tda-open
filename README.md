# TDA Open 2026

Landing page tĩnh, responsive, sẵn sàng deploy lên Vercel.

## Chạy local

```bash
python3 -m http.server 4173
```

Mở `http://localhost:4173`.

## Deploy Vercel

Import repository vào Vercel và đặt **Root Directory** là `tda-open-2026`. Không cần build command; output directory là `.`.

## Cập nhật dữ liệu

Toàn bộ dữ liệu giải đấu được quản lý tại **`tournament-data.js`**:

- `settings`: cấu hình chung của giải.
- `players`: danh sách cơ thủ và rank.
- `teams`: 10 đội, mỗi đội gồm hai `playerId`, thuộc bảng A hoặc B.
- `matches`: lịch, bàn thi đấu và tỷ số.

Không đặt dữ liệu giải đấu trong `app.js`; file này chỉ xử lý giao diện. Sau khi sửa
`tournament-data.js`, commit/push để Vercel tự deploy lại.
