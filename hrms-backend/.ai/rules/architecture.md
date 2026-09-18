# Architecture

## Fat controllers — no Action/Service layer

Business logic lives directly in controller methods. There are no Action or Service classes. Do not create `app/Actions/` or `app/Services/` directories; keep logic in controllers.

## Direct Eloquent in controllers — no repository/query layer

Controllers query models directly with Eloquent. There are no repository or query object classes. Do not introduce repositories; query Eloquent inline in controllers.
