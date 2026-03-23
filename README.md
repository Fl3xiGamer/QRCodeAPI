# QR Code Generator & Reader API

A fast, production-ready REST API for generating and reading QR codes. Built for [RapidAPI](https://rapidapi.com).

## Features

- Generate QR codes as **PNG**, **SVG**, or **Base64**
- **Read / decode** any QR code image
- **Batch generation** — up to 20 QR codes in one request
- **Validate** images for QR code presence & content type detection
- Custom colors, sizes, error correction levels
- Rate limiting & security headers included

---

## Endpoints

### POST `/generate`
Generate a QR code.

**Request body (JSON):**
| Field        | Type   | Required | Default    | Description                          |
|-------------|--------|----------|------------|--------------------------------------|
| `data`       | string | ✅       | —          | Content to encode (max 2953 chars)   |
| `format`     | string | —        | `"png"`    | `"png"` \| `"svg"` \| `"base64"`    |
| `size`       | number | —        | `300`      | Image size in px (100–2000)          |
| `margin`     | number | —        | `2`        | Quiet zone width (0–10)              |
| `darkColor`  | string | —        | `"#000000"`| Hex color for dark modules           |
| `lightColor` | string | —        | `"#ffffff"`| Hex color for light area             |
| `errorLevel` | string | —        | `"M"`      | `"L"` \| `"M"` \| `"Q"` \| `"H"`   |

**Example:**
```bash
curl -X POST https://YOUR-API.railway.app/generate \
  -H "Content-Type: application/json" \
  -d '{"data": "https://example.com", "format": "base64", "size": 400}'
```

**Response (base64):**
```json
{
  "success": true,
  "format": "base64",
  "mimeType": "image/png",
  "data": "data:image/png;base64,iVBORw...",
  "meta": { "size": 400, "margin": 2, "errorLevel": "M", "chars": 19 }
}
```

---

### POST `/read`
Decode a QR code image.

**Multipart form (file upload):**
```bash
curl -X POST https://YOUR-API.railway.app/read \
  -F "image=@/path/to/qrcode.png"
```

**JSON (base64 string):**
```bash
curl -X POST https://YOUR-API.railway.app/read \
  -H "Content-Type: application/json" \
  -d '{"base64": "data:image/png;base64,iVBORw..."}'
```

**Response:**
```json
{
  "success": true,
  "data": "https://example.com",
  "meta": { "imageWidth": 300, "imageHeight": 300, "location": { ... } }
}
```

---

### POST `/batch`
Generate up to 20 QR codes in one call.

```bash
curl -X POST https://YOUR-API.railway.app/batch \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { "data": "https://example.com" },
      { "data": "Hello World", "format": "svg" },
      { "data": "mailto:hi@example.com", "size": 200, "darkColor": "#1a73e8" }
    ]
  }'
```

---

### POST `/validate`
Check if an image contains a QR code and detect its content type.

**Response:**
```json
{
  "success": true,
  "valid": true,
  "meta": {
    "hasQRCode": true,
    "contentType": "url",
    "dataLength": 22
  }
}
```

Content types detected: `url`, `email`, `phone`, `vcard`, `wifi`, `geo`, `text`

---

## License

MIT
