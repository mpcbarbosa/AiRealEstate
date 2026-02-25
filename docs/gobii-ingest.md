# Gobii Ingest API — Contrato

## Endpoint

```
POST /api/ingest/gobii/listings
```

## Headers

| Header | Obrigatório | Descrição |
|--------|-------------|-----------|
| `X-API-KEY` | Sim | Chave gerada em /settings ou GOBII_API_KEY env var |
| `Content-Type` | Sim | `application/json` |
| `Idempotency-Key` | Não | String única para evitar reprocessamento |

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
      "images": [
        "https://img4.idealista.pt/blur/WEB_LISTING/0/id.pro/123.jpg",
        "https://img4.idealista.pt/blur/WEB_LISTING/0/id.pro/456.jpg"
      ],
      "confidence": 0.95,
      "hash": "sha256-do-payload",
      "raw": {}
    }
  ]
}
```

## Campos obrigatórios por item

- `sourceUrl` (string, URL válida) — identificador único do anúncio

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

## Lógica de deduplicação

1. **Exacta por sourceUrl** — se já existe, atualiza o imóvel (preço, imagens, etc.)
2. **Hash fuzzy** — combina sourceName + tipologia + área (±5m²) + preço (±1000€) + localização
3. Se hash fuzzy coincide, adiciona nova fonte ao master existente

## Exemplo com curl

```bash
curl -X POST https://imoradar.onrender.com/api/ingest/gobii/listings \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: <tua-chave>" \
  -d '{
    "source": "gobii",
    "items": [{
      "sourceUrl": "https://idealista.pt/imovel/99999",
      "sourceName": "idealista",
      "sourceFamily": "portals",
      "title": "T2 no Chiado",
      "businessType": "buy",
      "propertyType": "apartment",
      "typology": "T2",
      "priceEur": 420000,
      "areaM2": 75,
      "locationText": "Chiado, Lisboa",
      "images": ["https://example.com/foto1.jpg"],
      "confidence": 0.9
    }]
  }'
```

## Erros

| Status | Causa |
|--------|-------|
| 401 | API Key inválida ou em falta |
| 422 | Schema inválido |
| 429 | Rate limit (30 req/min por IP) |
| 500 | Erro interno |
