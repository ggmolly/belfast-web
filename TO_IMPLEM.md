# Unimplemented Endpoints

Based on comparison of swagger spec with `src/services/api.ts`.

## Activities
- `PATCH /api/v1/activities/allowlist`

## Game Data
- `GET /api/v1/attire/battle-ui`
- `GET /api/v1/attire/chat-frames`
- `GET /api/v1/attire/icon-frames`
- `GET /api/v1/livingarea-covers`

## Dorm3d
- `GET /api/v1/dorm3d-apartments` (with pagination)
- `POST /api/v1/dorm3d-apartments`
- `GET /api/v1/dorm3d-apartments/{id}`
- `PUT /api/v1/dorm3d-apartments/{id}`
- `DELETE /api/v1/dorm3d-apartments/{id}`

## Exchange Codes
- `GET /api/v1/exchange-codes` (with pagination)
- `GET /api/v1/exchange-codes/{id}`
- `PUT /api/v1/exchange-codes/{id}`
- `DELETE /api/v1/exchange-codes/{id}`

## Items
- `GET /api/v1/items/{id}`

## Juustagram
- `GET /api/v1/juustagram/language/{key}`
- `GET /api/v1/juustagram/npc-templates` (paginated)
- `GET /api/v1/juustagram/npc-templates/{id}`
- `GET /api/v1/juustagram/ship-groups` (paginated)
- `GET /api/v1/juustagram/ship-groups/{id}`
- `GET /api/v1/juustagram/templates` (paginated)
- `GET /api/v1/juustagram/templates/{id}`

## Notices
- `GET /api/v1/notices/active`

## Players
- `DELETE /api/v1/players/{id}`
- `GET /api/v1/players/{id}/arena-shop`
- `PUT /api/v1/players/{id}/arena-shop`
- `POST /api/v1/players/{id}/arena-shop/refresh`
- `GET /api/v1/players/{id}/attires`
- `POST /api/v1/players/{id}/attires`
- `DELETE /api/v1/players/{id}/attires/{type}/{attire_id}`
- `PATCH /api/v1/players/{id}/attires/selected`
- `GET /api/v1/players/{id}/buffs`
- `POST /api/v1/players/{id}/buffs`
- `DELETE /api/v1/players/{id}/buffs/{buff_id}`
- `GET /api/v1/players/{id}/builds`
- `PATCH /api/v1/players/{id}/builds/counters`
- `GET /api/v1/players/{id}/builds/queue`
- `GET /api/v1/players/{id}/compensations`
- `POST /api/v1/players/{id}/compensations`
- `GET /api/v1/players/{id}/compensations/{compensation_id}`
- `PATCH /api/v1/players/{id}/compensations/{compensation_id}`
- `DELETE /api/v1/players/{id}/compensations/{compensation_id}`
- `POST /api/v1/players/{id}/compensations/push`
- `GET /api/v1/players/{id}/flags`
- `POST /api/v1/players/{id}/flags`
- `DELETE /api/v1/players/{id}/flags/{flag_id}`
- `GET /api/v1/players/{id}/fleets`
- `POST /api/v1/players/{id}/give-skin`
- `GET /api/v1/players/{id}/guide`
- `PATCH /api/v1/players/{id}/guide`
- `GET /api/v1/players/{id}/juustagram/chat-groups/read`
- `POST /api/v1/players/{id}/juustagram/chat-groups/read`
- `GET /api/v1/players/{id}/juustagram/groups` (paginated)
- `POST /api/v1/players/{id}/juustagram/groups`
- `GET /api/v1/players/{id}/juustagram/groups/{group_id}`
- `PATCH /api/v1/players/{id}/juustagram/groups/{group_id}`
- `POST /api/v1/players/{id}/juustagram/groups/{group_id}/chat-groups`
- `POST /api/v1/players/{id}/juustagram/chat-groups/{chat_group_id}/reply`
- `GET /api/v1/players/{id}/juustagram/messages` (paginated)
- `GET /api/v1/players/{id}/juustagram/messages/{message_id}`
- `PATCH /api/v1/players/{id}/juustagram/messages/{message_id}`
- `GET /api/v1/players/{id}/juustagram/messages/{message_id}/discuss`
- `POST /api/v1/players/{id}/juustagram/messages/{message_id}/discuss`
- `GET /api/v1/players/{id}/livingarea-covers`
- `POST /api/v1/players/{id}/livingarea-covers`
- `DELETE /api/v1/players/{id}/livingarea-covers/{cover_id}`
- `PATCH /api/v1/players/{id}/livingarea-covers/selected`
- `GET /api/v1/players/{id}/mails`
- `GET /api/v1/players/{id}/medal-shop`
- `PUT /api/v1/players/{id}/medal-shop`
- `POST /api/v1/players/{id}/medal-shop/refresh`
- `GET /api/v1/players/{id}/remaster`
- `PATCH /api/v1/players/{id}/remaster`
- `GET /api/v1/players/{id}/remaster/progress` (paginated)
- `POST /api/v1/players/{id}/remaster/progress`
- `PATCH /api/v1/players/{id}/remaster/progress/{chapter_id}/{pos}`
- `DELETE /api/v1/players/{id}/remaster/progress/{chapter_id}/{pos}`
- `GET /api/v1/players/{id}/shopping-street`
- `PUT /api/v1/players/{id}/shopping-street`
- `PUT /api/v1/players/{id}/shopping-street/goods`
- `PATCH /api/v1/players/{id}/shopping-street/goods/{goods_id}`
- `DELETE /api/v1/players/{id}/shopping-street/goods/{goods_id}`
- `POST /api/v1/players/{id}/shopping-street/refresh`
- `GET /api/v1/players/{id}/skins`
- `GET /api/v1/players/{id}/stories`
- `POST /api/v1/players/{id}/stories`
- `DELETE /api/v1/players/{id}/stories/{story_id}`
- `GET /api/v1/players/{id}/tb`
- `POST /api/v1/players/{id}/tb`
- `PUT /api/v1/players/{id}/tb`
- `DELETE /api/v1/players/{id}/tb`

## Server
- `GET /api/v1/server/config`
- `PUT /api/v1/server/config`
- `GET /api/v1/server/connections` (different from existing getConnections which returns ConnectionSummary[])
- `GET /api/v1/server/connections/{id}`
- `DELETE /api/v1/server/connections/{id}`
- `GET /api/v1/server/stats`
- `GET /api/v1/server/uptime`
- `POST /api/v1/server/start`
- `POST /api/v1/server/stop`
- `POST /api/v1/server/restart`

## Resources
- `GET /api/v1/resources` (paginated)
- `GET /api/v1/resources/{id}`

## Ships
- `GET /api/v1/ships/{id}`
- `GET /api/v1/ships/{id}/skins`

## Shop
- `GET /api/v1/shop/offers` (paginated)
- `POST /api/v1/shop/offers`
- `PUT /api/v1/shop/offers/{id}`
- `DELETE /api/v1/shop/offers/{id}`

## Skins
- `GET /api/v1/skins/{id}`

## Health
- `GET /health`
