# MBPay API 接口文档

本文档详细说明 MBPay 商户 API 的所有接口，包括接口地址、请求参数、返回结果、错误码等信息。

## 目录

- [基础信息](#基础信息)
- [认证方式](#认证方式)
- [签名规则](#签名规则)
- [接口列表](#接口列表)
  - [1. 获取商户余额](#1-获取商户余额)
  - [2. 商户付款](#2-商户付款)
- [回调通知](./订单支付成功回调文档.md)
- [错误码说明](#错误码说明)
- [金额单位说明](#金额单位说明)
- [注意事项](#注意事项)

---

## 基础信息

### API 基础地址

```
https://www.mbpay.world
```

**注意：** 请根据实际部署环境替换为正确的 API 地址。

### 请求格式

- **Content-Type**: `application/x-www-form-urlencoded`
- **请求方法**: `POST`
- **字符编码**: `UTF-8`

### 响应格式

所有接口统一返回 JSON 格式，结构如下：

```json
{
  "code": 0,           // 0 表示成功，非0为错误码
  "message": "success", // 错误描述信息
  "data": {}           // 返回数据（成功时包含，失败时可能为空）
}
```

---

## 认证方式

所有接口都需要进行签名认证，认证信息通过以下参数传递：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| app_id | string | 是 | 商户的 App ID（由平台分配） |
| timestamp | int64 | 是 | Unix 时间戳（秒级） |
| sign | string | 是 | 签名值（根据签名规则生成） |

**注意：** SDK 会自动添加这些参数，无需手动处理。

---

## 签名规则

所有接口都需要签名验证，签名规则如下：

### 签名步骤

1. **排除 `sign` 字段**，获取所有其他参数
2. 将所有参数按 **ASCII 升序**排序（键名排序）
3. 将参数拼接为字符串：`k1=v1&k2=v2&...&key=app_secret`
   - 格式：`参数名=参数值&参数名=参数值&...&key=app_secret`
   - 注意：最后追加 `&key=app_secret`，其中 `app_secret` 为商户的 App Secret
4. 对拼接后的字符串进行 **SHA256** 哈希计算
5. 将哈希结果转换为 **小写 hex** 字符串，作为 `sign` 值

### 签名示例

假设有以下参数：

```
app_id = "your_app_id_123"
timestamp = 1704067200
amount = 100
address = "Txxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

App Secret 为：`your_app_secret_456`

**步骤 1：** 排除 `sign` 字段，获取参数列表

```
app_id, timestamp, amount, address
```

**步骤 2：** 按 ASCII 升序排序

```
address, amount, app_id, timestamp
```

**步骤 3：** 拼接签名字符串

```
address=Txxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx&amount=100&app_id=your_app_id_123&timestamp=1704067200&key=your_app_secret_456
```

**步骤 4：** SHA256 哈希

```
SHA256(签名字符串) = 5f4dcc3b5aa765d61d8327deb882cf99...
```

**步骤 5：** 转换为小写 hex 字符串

```
sign = "5f4dcc3b5aa765d61d8327deb882cf99..."
```

### 签名注意事项

1. 参数值必须使用原始值，不要进行 URL 编码
2. 空字符串也要参与签名
3. 布尔值转换为字符串（true/false）
4. 数字转换为字符串
5. 时间戳使用秒级 Unix 时间戳

---

## 接口列表

### 1. 获取商户余额

查询商户的可用余额和冻结余额。

#### 接口地址

```
POST /merchant/balance
```

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| app_id | string | 是 | 商户的 App ID（SDK 自动添加） |
| timestamp | int64 | 是 | Unix 时间戳（SDK 自动添加） |
| sign | string | 是 | 签名值（SDK 自动生成） |

**注意：** 此接口只需要认证参数，无需其他业务参数。

#### 请求示例

```bash
curl -X POST "https://www.mbpay.world/merchant/balance" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "app_id=your_app_id_123" \
  -d "timestamp=1704067200" \
  -d "sign=5f4dcc3b5aa765d61d8327deb882cf99..."
```

#### 返回结果

**成功响应：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "balance": 10000,  // 可用余额（MB，单位：最小单位，100 = 1MB）
    "frozen": 0        // 冻结余额（MB，单位：最小单位，100 = 1MB）
  }
}
```

**失败响应：**

```json
{
  "code": 12003,
  "message": "merchant_not_exists",
  "data": null
}
```

#### 返回字段说明

| 字段名 | 类型 | 说明 |
|--------|------|------|
| balance | int64 | 可用余额（MB，最小单位：100 = 1MB） |
| frozen | int64 | 冻结余额（MB，最小单位：100 = 1MB） |

#### 错误码

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 12000 | app_id 为空 |
| 12001 | sign 为空 |
| 12002 | timestamp 为空 |
| 12003 | 商户不存在 |
| 12005 | 签名错误 |
| 12012 | 系统错误 |

---

### 2. 生成支付订单

生成支付订单并返回收银台页面链接。

#### 接口地址

```
POST /merchant/generatepaylink
```

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| order_no | string | 是 | 商户订单号（必须唯一，建议使用时间戳+随机数） |
| subject | string | 是 | 商品描述 |
| amount | int64 | 是 | 订单金额（分，必须大于 0） |
| notify_url | string | 是 | 支付成功后的回调通知地址 |
| app_id | string | 是 | 商户的 App ID |
| timestamp | int64 | 是 | Unix 时间戳 |
| sign | string | 是 | 签名值 |

#### 请求示例

```bash
curl -X POST "https://www.mbpay.world/merchant/generatepaylink" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "merchant_id=1" \
  -d "order_no=ORD202501011200001234567890" \
  -d "subject=购买VIP会员" \
  -d "amount=10000" \
  -d "notify_url=https://example.com/notify" \
  -d "app_id=your_app_id_123" \
  -d "timestamp=1704067200" \
  -d "sign=5f4dcc3b5aa765d61d8327deb882cf99..."
```

#### 返回结果

**成功响应：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "payment_link": "https://pay.mbpay.world/payorder?id=e3c070b9-cef9-4ff3-83ea-d9d330d25195"
  }
}
```

**失败响应：**

```json
{
  "code": 12011,
  "message": "order_no_already_exists",
  "data": null
}
```

#### 返回字段说明

| 字段名 | 类型 | 说明 |
|--------|------|------|
| payment_link | string | 收银台页面链接，用户访问此链接进行支付 |

#### 错误码

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 12000 | app_id 为空 |
| 12001 | sign 为空 |
| 12002 | timestamp 为空 |
| 12003 | 商户不存在 |
| 12005 | 签名错误 |
| 12010 | notify_url 为空 |
| 12011 | 订单号已存在 / 商户不存在 |
| 12012 | amount 为空或无效 |

#### 业务说明

1. **订单号唯一性**：`order_no` 必须在商户维度内唯一，重复的订单号会返回错误
2. **过期时间**：订单过期时间由系统自动设置为创建时间后10分钟
3. **回调通知**：支付成功后，系统会向 `notify_url` 发送回调通知- [文档](./订单支付成功回调文档.md)
4. **收银台链接**：返回的 `payment_link` 是收银台页面链接，用户访问此链接进行支付

---

### 3. 商户付款

商户向用户地址付款。

#### 接口地址

```
POST /merchant/pay
```

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| address | string | 是 | 收款地址（用户地址） |
| order_no | string | 是 | 商户订单号（必须唯一，建议使用时间戳+随机数） |
| amount | int64 | 是 | 付款金额（MB，最小单位：100 = 1MB，必须大于 0） |
| remark | string | 否 | 备注信息（可选） |
| app_id | string | 是 | 商户的 App ID |
| timestamp | int64 | 是 | Unix 时间戳 |
| sign | string | 是 | 签名值 |

#### 请求示例

```bash
curl -X POST "https://www.mbpay.world/merchant/pay" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "address=Txxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  -d "order_no=PAY202501011200001234567890" \
  -d "amount=100" \
  -d "remark=商户付款" \
  -d "app_id=your_app_id_123" \
  -d "timestamp=1704067200" \
  -d "sign=5f4dcc3b5aa765d61d8327deb882cf99..."
```

#### 返回结果

**成功响应：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "platform_order_no": "202501011200001234567890",  // 平台订单号
    "actual_amount": 100,                             // 实际支付金额（MB，最小单位）
    "fee": 1,                                         // 手续费（MB，最小单位）
    "balance": 9899                                   // 商户剩余余额（MB，最小单位）
  }
}
```

**失败响应：**

```json
{
  "code": 12010,
  "message": "insufficient_balance",
  "data": null
}
```

#### 返回字段说明

| 字段名 | 类型 | 说明 |
|--------|------|------|
| platform_order_no | string | 平台生成的订单号 |
| actual_amount | int64 | 实际支付金额（MB，最小单位：100 = 1MB） |
| fee | int64 | 手续费（MB，最小单位：100 = 1MB） |
| balance | int64 | 商户剩余余额（MB，最小单位：100 = 1MB） |

#### 错误码

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 12000 | app_id 为空 |
| 12001 | sign 为空 |
| 12002 | timestamp 为空 |
| 12003 | 商户不存在 |
| 12005 | 签名错误 |
| 12006 | 参数错误（address、order_no、amount 为空或无效） |
| 12007 | 商户不存在 |
| 12008 | 商户状态错误（商户被禁用） |
| 12009 | 商户不存在 |
| 12010 | 余额不足 |
| 12011 | 订单号已存在 / 收款地址不存在 |
| 12012 | 系统错误 |

#### 业务说明

1. **订单号唯一性**：`order_no` 必须在商户维度内唯一，重复的订单号会返回错误
2. **手续费计算**：手续费根据商户配置的费率计算，从商户余额中扣除
3. **实际扣款金额**：实际扣款金额 = 付款金额 + 手续费
4. **地址验证**：收款地址必须是系统中已存在的用户地址

---

## 错误码说明

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 0 | 成功 | - |
| 12000 | app_id 为空 | 检查请求参数，确保 app_id 已传递 |
| 12001 | sign 为空 | 检查请求参数，确保 sign 已传递 |
| 12002 | timestamp 为空 | 检查请求参数，确保 timestamp 已传递 |
| 12003 | 商户不存在 | 检查 app_id 是否正确，或联系平台管理员 |
| 12005 | 签名错误 | 检查签名算法和 App Secret 是否正确 |
| 12006 | 参数错误 | 检查必填参数是否传递，参数格式是否正确 |
| 12007 | 商户不存在 | 检查 app_id 是否正确，或联系平台管理员 |
| 12008 | 商户状态错误 | 商户可能被禁用，联系平台管理员 |
| 12009 | 商户不存在 | 检查 app_id 是否正确，或联系平台管理员 |
| 12010 | 余额不足 | 商户余额不足以支付订单金额和手续费 |
| 12011 | 订单号已存在 / 收款地址不存在 | 检查订单号是否重复，或收款地址是否正确 |
| 12012 | 系统错误 | 系统内部错误，稍后重试或联系技术支持 |

---

## 金额单位说明

### 金额单位

- **金额单位**：MB（最小单位）
- **换算关系**：
  - `100` = 1 MB
  - `1000` = 10 MB
  - `10000` = 100 MB

### 示例

| 实际金额 | 接口参数值 |
|----------|-----------|
| 1 MB | 100 |
| 10 MB | 1000 |
| 100 MB | 10000 |
| 0.5 MB | 50 |

**注意：** 所有金额相关参数和返回值都使用最小单位，即 100 = 1 MB。

---

## 注意事项

### 1. 时间戳

- 使用 Unix 时间戳（秒级）
- 时间戳有效期建议在 5 分钟内
- 服务器时间与客户端时间差不应超过 5 分钟

### 2. 订单号

- `order_no` 必须在商户维度内唯一
- 建议使用时间戳 + 随机数的方式生成
- 格式建议：`PAY{YYYYMMDDHHmmss}{随机数}`

### 3. 重试机制

- 对于网络错误，建议实现重试机制
- 对于业务错误（如余额不足），不应重试
- 对于签名错误，检查签名算法后重试

### 4. 并发控制

- 同一订单号不要并发请求
- 建议在业务层实现订单号去重机制

### 5. 安全建议

1. **App Secret 保密**：不要将 App Secret 暴露在客户端代码中
2. **HTTPS 传输**：确保使用 HTTPS 协议传输数据
3. **参数验证**：在调用接口前验证参数的有效性
4. **错误处理**：妥善处理各种错误情况，记录错误日志


---

## 联系支持

如有问题，请联系技术支持或查看各语言 SDK 的详细文档。

---

**文档版本**: v1.1  
**最后更新**: 2025-11-11

