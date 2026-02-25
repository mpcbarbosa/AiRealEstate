# Heurísticas de Deduplicação

## Nível 1 — Deduplicação exata (sourceUrl)

Se já existe um `ListingSource` com o mesmo `sourceUrl`, o item é considerado duplicado do mesmo master. O master é atualizado se o preço ou status mudou.

## Nível 2 — Deduplicação por hash

Se o `hash` do payload coincidir com um ingest anterior, o item é ignorado (sem alterações).

## Nível 3 — Deduplicação fuzzy (Fase 2)

Combina:
- Localização (texto) com similaridade > 80%
- Tipologia igual
- Área com variação < 5%
- Preço com variação < 3%

Se score combinado > 0.85, considera duplicado.

## Thresholds

| Campo | Threshold |
|-------|-----------|
| Location similarity | 0.80 |
| Area variation | 5% |
| Price variation | 3% |
| Combined score | 0.85 |
