# Gobii Ingest API — Contrato

## Endpoint

```
POST /api/ingest/gobii/listings
```

## Headers

| Header | Obrigatório | Descrição |
|--------|-------------|-----------|
| `X-API-KEY` | Sim | Chave gerada em /settings |
| `Content-Type` | Sim | `application/json` |
| `Idempotency-Key` | Não | String única para evitar duplicados |

## Request Body

```json
{
  "payloadVersion": "1.0",
  "source": "gobii",
  "capturedAt": "2024-01-15T10:30:00Z",
  "items": [
    {
      "payloadVersion": "1.0",
      "capturedAt": "2024-01-15T10:30:00Z",
      "sourceFamily": "portals",
      "sourceName": "idealista",
      "sourceUrl": "https://idealista.pt/imovel/12345",
      "sourceExternalId": "12345",
      "title": "T3 em Lisboa",
      "description": "Apartamento T3...",
      "businessType": "buy",
      "propertyType": "apartment",
      "typology": "T3",
      "priceEur": 350000,
      "areaM2": 90,
      "locationText": "Alfama, Lisboa",
      "geo": { "lat": 38.7139, "lng": -9.1334 },
      "features": { "parking": true, "elevator": false },
      "contacts": {
        "agencyName": "Agência XYZ",
        "phone": "+351 912 345 678",
        "email": null,
        "contactUrl": null
      },
      "images": ["https://example.com/img1.jpg"],
      "confidence": 0.95,
      "hash": "sha256-do-payload",
      "raw": {}
    }
  ]
}
```

## Campos obrigatórios por item

- `sourceUrl` (string) — identificador único do anúncio

## Resposta de sucesso (200)

```json
{
  "ingestRunId": "clx...",
  "received": 10,
  "created": 7,
  "updated": 2,
  "deduped": 1,
  "rejected": 0,
  "errors": []
}
```

## Erros

| Status | Causa |
|--------|-------|
| 401 | API Key inválida ou em falta |
| 422 | Schema inválido |
| 429 | Rate limit excedido |
| 500 | Erro interno |
