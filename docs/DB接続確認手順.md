# ① DynamoDB Local 起動

docker-compose を使う場合（推奨）:
```
docker compose up -d
```

docker run を直接使う場合:
```
docker run -p 8000:8000 amazon/dynamodb-local -jar DynamoDBLocal.jar -sharedDb
```

※DynamoDB Localが起動状態になる。以降の手順は別ターミナルにて実行する

---

# ② テーブル作成

※ すでに作成済みの場合はスキップ

```
aws dynamodb create-table \
  --table-name parts_master \
  --attribute-definitions AttributeName=PK,AttributeType=S \
  --key-schema AttributeName=PK,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://localhost:8000

aws dynamodb create-table \
  --table-name exercise_master \
  --attribute-definitions AttributeName=PK,AttributeType=S AttributeName=SK,AttributeType=S \
  --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://localhost:8000

aws dynamodb create-table \
  --table-name muscle_records \
  --attribute-definitions AttributeName=PK,AttributeType=S AttributeName=SK,AttributeType=S \
  --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://localhost:8000
```

テーブル一覧で確認:
```
aws dynamodb list-tables --endpoint-url http://localhost:8000
```

期待値: `parts_master` `exercise_master` `muscle_records` の3テーブルが表示される

---

# ③ テストデータ投入

## parts_master

```
aws dynamodb put-item --table-name parts_master \
  --item '{"PK":{"S":"PART#CHEST"},"part_code":{"S":"CHEST"},"part_name":{"S":"胸"},"created_at":{"S":"2026-01-01T00:00:00.000Z"},"updated_at":{"S":"2026-01-01T00:00:00.000Z"}}' \
  --endpoint-url http://localhost:8000

aws dynamodb put-item --table-name parts_master \
  --item '{"PK":{"S":"PART#BACK"},"part_code":{"S":"BACK"},"part_name":{"S":"背中"},"created_at":{"S":"2026-01-01T00:00:00.000Z"},"updated_at":{"S":"2026-01-01T00:00:00.000Z"}}' \
  --endpoint-url http://localhost:8000

aws dynamodb put-item --table-name parts_master \
  --item '{"PK":{"S":"PART#LEGS"},"part_code":{"S":"LEGS"},"part_name":{"S":"脚"},"created_at":{"S":"2026-01-01T00:00:00.000Z"},"updated_at":{"S":"2026-01-01T00:00:00.000Z"}}' \
  --endpoint-url http://localhost:8000

aws dynamodb put-item --table-name parts_master \
  --item '{"PK":{"S":"PART#SHOULDER"},"part_code":{"S":"SHOULDER"},"part_name":{"S":"肩"},"created_at":{"S":"2026-01-01T00:00:00.000Z"},"updated_at":{"S":"2026-01-01T00:00:00.000Z"}}' \
  --endpoint-url http://localhost:8000

aws dynamodb put-item --table-name parts_master \
  --item '{"PK":{"S":"PART#ARM"},"part_code":{"S":"ARM"},"part_name":{"S":"腕"},"created_at":{"S":"2026-01-01T00:00:00.000Z"},"updated_at":{"S":"2026-01-01T00:00:00.000Z"}}' \
  --endpoint-url http://localhost:8000

aws dynamodb put-item --table-name parts_master \
  --item '{"PK":{"S":"PART#ABS"},"part_code":{"S":"ABS"},"part_name":{"S":"腹"},"created_at":{"S":"2026-01-01T00:00:00.000Z"},"updated_at":{"S":"2026-01-01T00:00:00.000Z"}}' \
  --endpoint-url http://localhost:8000
```

## exercise_master

```
aws dynamodb put-item \
  --table-name exercise_master \
  --item '{"PK":{"S":"PART#CHEST"},"SK":{"S":"EXERCISE#BENCHPRESS"},"exercise_name":{"S":"ベンチプレス"}}' \
  --endpoint-url http://localhost:8000

aws dynamodb put-item \
  --table-name exercise_master \
  --item '{"PK":{"S":"PART#CHEST"},"SK":{"S":"EXERCISE#INCLINE_PRESS"},"exercise_name":{"S":"インクラインプレス"}}' \
  --endpoint-url http://localhost:8000
```

---

# ④ SAM ビルド＆ローカル起動

```
cd backend
sam build
sam local start-api --parameter-overrides IsLocal=true
```

※ `sam local start-api` は起動したままにしておく。以降のAPIテストは別ターミナルで実行する

---

# ⑤ API 動作確認

## GET /parts

```
curl http://127.0.0.1:3000/parts
```

期待値:
```json
{
  "parts": [
    { "part_code": "ABS", "part_name": "腹" },
    { "part_code": "ARM", "part_name": "腕" },
    { "part_code": "BACK", "part_name": "背中" },
    { "part_code": "CHEST", "part_name": "胸" },
    { "part_code": "LEGS", "part_name": "脚" },
    { "part_code": "SHOULDER", "part_name": "肩" }
  ]
}
```

---

## POST /parts

```
curl -X POST http://127.0.0.1:3000/parts \
  -H "Content-Type: application/json" \
  -d '{"part_code": "FOREARM", "part_name": "前腕"}'
```

期待値:
```json
{"status":"success"}
```

重複登録で409が返ること:
```
curl -X POST http://127.0.0.1:3000/parts \
  -H "Content-Type: application/json" \
  -d '{"part_code": "CHEST", "part_name": "胸"}'
```

期待値:
```json
{"error_code":"ALREADY_EXISTS","message":"Part already exists"}
```

---

## PUT /parts/{part_code}

```
curl -X PUT http://127.0.0.1:3000/parts/FOREARM \
  -H "Content-Type: application/json" \
  -d '{"part_name": "前腕（更新）"}'
```

期待値:
```json
{"status":"success"}
```

---

## DELETE /parts/{part_code}

```
curl -X DELETE http://127.0.0.1:3000/parts/FOREARM
```

期待値:
```json
{"status":"success"}
```

---

## GET /exercises

```
curl "http://127.0.0.1:3000/exercises?part=CHEST"
```

期待値:
```json
{
  "exercises": [
    { "exercise_code": "BENCHPRESS", "exercise_name": "ベンチプレス" },
    { "exercise_code": "INCLINE_PRESS", "exercise_name": "インクラインプレス" }
  ]
}
```

---

## POST /exercises

```
curl -X POST http://127.0.0.1:3000/exercises \
  -H "Content-Type: application/json" \
  -d '{"part_code": "CHEST", "exercise_code": "DUMBBELL_FLY", "exercise_name": "ダンベルフライ"}'
```

期待値:
```json
{"status":"success"}
```

重複登録で409が返ること:
```
curl -X POST http://127.0.0.1:3000/exercises \
  -H "Content-Type: application/json" \
  -d '{"part_code": "CHEST", "exercise_code": "BENCHPRESS", "exercise_name": "ベンチプレス"}'
```

期待値:
```json
{"error_code":"ALREADY_EXISTS","message":"Exercise already exists"}
```

---

## PUT /exercises/{part_code}/{exercise_code}

```
curl -X PUT http://127.0.0.1:3000/exercises/CHEST/DUMBBELL_FLY \
  -H "Content-Type: application/json" \
  -d '{"exercise_name": "ダンベルフライ（更新）"}'
```

期待値:
```json
{"status":"success"}
```

---

## DELETE /exercises/{part_code}/{exercise_code}

```
curl -X DELETE http://127.0.0.1:3000/exercises/CHEST/DUMBBELL_FLY
```

期待値:
```json
{"status":"success"}
```

---

## POST /training

```
curl -X POST http://127.0.0.1:3000/training \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "1",
    "date": "20260310",
    "exercise": "BENCHPRESS",
    "sets": [
      { "set_no": 1, "weight": 80, "reps": 5, "memo": "調子良い" },
      { "set_no": 2, "weight": 75, "reps": 8, "memo": "" },
      { "set_no": 3, "weight": 70, "reps": 10, "memo": "" }
    ]
  }'
```

期待値:
```json
{"status":"success"}
```

DynamoDB にデータが書き込まれているか確認:
```
aws dynamodb query \
  --table-name muscle_records \
  --key-condition-expression "PK = :pk" \
  --expression-attribute-values '{":pk":{"S":"USER#1"}}' \
  --endpoint-url http://localhost:8000
```

期待値: 3件のセット（SET#1〜3）が返り、各アイテムに `rm` が計算済みで含まれる

---

## GET /training

```
curl "http://127.0.0.1:3000/training?user_id=1"
```

期待値:
```json
{
  "records": [
    {
      "date": "20260310",
      "exercise": "BENCHPRESS",
      "sets": [
        { "set_no": 1, "weight": 80, "reps": 5, "memo": "調子良い", "rm": 93.3 },
        { "set_no": 2, "weight": 75, "reps": 8, "memo": "", "rm": 95 },
        { "set_no": 3, "weight": 70, "reps": 10, "memo": "", "rm": 93.3 }
      ]
    }
  ]
}
```

---

## GET /training/{date}

```
curl "http://127.0.0.1:3000/training/20260310?user_id=1"
```

期待値:
```json
{
  "date": "20260310",
  "exercises": [
    {
      "exercise": "BENCHPRESS",
      "sets": [
        { "set_no": 1, "weight": 80, "reps": 5, "memo": "調子良い", "rm": 93.3 },
        { "set_no": 2, "weight": 75, "reps": 8, "memo": "", "rm": 95 },
        { "set_no": 3, "weight": 70, "reps": 10, "memo": "", "rm": 93.3 }
      ]
    }
  ]
}
```

---

## PUT /training/{date}/{exercise}/{set_no}

```
curl -X PUT http://127.0.0.1:3000/training/20260310/BENCHPRESS/1 \
  -H "Content-Type: application/json" \
  -d '{"user_id": "1", "weight": 85, "reps": 5, "memo": "更新テスト"}'
```

期待値:
```json
{"status":"success"}
```

---

## DELETE /training/{date}/{exercise}/{set_no}

```
curl -X DELETE "http://127.0.0.1:3000/training/20260310/BENCHPRESS/3?user_id=1"
```

期待値:
```json
{"status":"success"}
```

---

# AWSデプロイ手順

## 前提条件

AWS CLIの認証情報が設定済みであること:
```
aws configure
# AWS Access Key ID、Secret Access Key、リージョン(ap-northeast-1)を入力
```

## デプロイ手順

### 初回

```
cd backend
sam build
sam deploy --guided
```

`--guided` で以下を対話入力する（samconfig.toml に保存される）:

| 項目 | 値 |
| --- | --- |
| Stack Name | muscle-training-app |
| AWS Region | ap-northeast-1 |
| Parameter IsLocal | false |
| Confirm changes before deploy | Y |
| Allow SAM CLI IAM role creation | Y |
| Save arguments to configuration file | Y |

### 2回目以降

```
cd backend
sam build
sam deploy
```

### デプロイ完了後

Outputs に API Gateway のエンドポイントURLが表示される:
```
Outputs
----------------------------------------------------------------------
Key    ApiEndpoint
Value  https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/Prod/
```

このURLをフロントエンドの接続先として使用する（後述）。

## デプロイ後のデータ投入

DynamoDB テーブルはデプロイ時に自動作成される。
初期データは AWS マネジメントコンソールまたは以下のコマンドで投入する
（`--endpoint-url` オプションを外すことで本番DynamoDBに接続）:

```
aws dynamodb put-item --table-name parts_master \
  --item '{"PK":{"S":"PART#CHEST"},"part_code":{"S":"CHEST"},"part_name":{"S":"胸"},"created_at":{"S":"2026-01-01T00:00:00.000Z"},"updated_at":{"S":"2026-01-01T00:00:00.000Z"}}'

aws dynamodb put-item --table-name exercise_master \
  --item '{"PK":{"S":"PART#CHEST"},"SK":{"S":"EXERCISE#BENCHPRESS"},"exercise_name":{"S":"ベンチプレス"}}'
```

## スタック削除

```
sam delete --stack-name muscle-training-app
```

※ DynamoDBテーブルも削除されるためデータが失われる点に注意

---

# バリデーション確認

必須パラメータ欠落で400が返ること:
```
curl -X POST http://127.0.0.1:3000/training \
  -H "Content-Type: application/json" \
  -d '{"user_id": "1"}'
```

期待値:
```json
{"error_code":"INVALID_PARAMETER","message":"user_id, date, exercise, sets are required"}
```
