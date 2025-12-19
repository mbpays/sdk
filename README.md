# MBPay SDK

MBPay 商户 API 的多语言 SDK 集合，提供商户余额查询、付款和支付链接生成功能。

## 仓库地址

```
git@github.com:mbpay/sdk.git
```

## 支持的编程语言

| 语言 | 版本要求 | 文档 | 示例 |
|------|----------|------|------|
| [Go](#go-sdk) | Go >= 1.16 | [README](./go/README.md) | [example.go](./go/mbpay/example.go) |
| [Python](#python-sdk) | Python >= 3.7 | [README](./python/README.md) | [example.py](./python/mbpay/example.py) |
| [PHP](#php-sdk) | PHP >= 7.4 | [README](./php/README.md) | [example.php](./php/example.php) |
| [Node.js](#nodejs-sdk) | Node.js >= 12.0.0 | [README](./nodejs/README.md) | [example.ts](./nodejs/example.ts) |
| [Java](#java-sdk) | Java >= 1.8 | [README](./java/README.md) | [Example.java](./java/src/main/java/com/mbpay/Example.java) |

## 功能特性

所有 SDK 都提供以下功能：

- ✅ **商户余额查询** - 查询商户可用余额和冻结余额
- ✅ **商户付款** - 商户向用户地址付款
- ✅ **支付链接生成** - 生成支付二维码链接
- ✅ **自动签名** - 自动生成和验证签名
- ✅ **错误处理** - 完整的错误码和异常处理
- ✅ **类型安全** - 完整的类型定义和参数验证

## 详细文档

- 📖 [API 接口文档](./API接口文档.md) - 详细的 API 接口说明，包括接口地址、请求参数、返回结果、错误码等
- 📖 [订单支付成功回调文档](./订单支付成功回调文档.md) - 支付链接编码生成的详细说明，包括编码规则、签名算法、示例代码等

## 快速开始

### Go SDK

```bash
go get github.com/mbpay/sdk/go/mbpay
```

[查看完整文档 →](./go/README.md)

### Python SDK

```bash
# 从 GitHub 安装
pip install git+https://github.com/mbpay/sdk.git#subdirectory=python

# 或本地安装
cd python
pip install -e .
```

[查看完整文档 →](./python/README.md)

### PHP SDK

```bash
# 从 GitHub 安装
composer require mbpay/mbpay-sdk:dev-main

# 或本地安装
cd php
composer install
```

[查看完整文档 →](./php/README.md)

### Node.js SDK

```bash
# 从 GitHub 安装
npm install github:mbpay/sdk#nodejs

# 或本地安装
cd nodejs
npm install
```

[查看完整文档 →](./nodejs/README.md)

### Java SDK

```bash
# 本地安装
cd java
mvn clean install
```

[查看完整文档 →](./java/README.md)

## API 接口说明

### 1. 获取商户余额

**接口：** `POST /merchant/balance`

**必传参数：**
- `app_id` - 商户的 App ID
- `timestamp` - 时间戳（Unix 时间戳，秒级）
- `sign` - 签名值（根据签名规则生成）

**返回：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "balance": 100,
    "frozen": 0
  }
}
```

### 2. 商户向用户付款

**接口：** `POST /merchant/pay`

**必传参数：**
- `address` - 收款地址
- `order_no` - 商户订单号（必须唯一）
- `amount` - 付款金额（MB，最小单位：100 = 1MB）
- `remark` - 备注（可选）
- `app_id` - 商户的 App ID
- `timestamp` - 时间戳
- `sign` - 签名值

**返回：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "platform_order_no": "202501011200001234567890",
    "actual_amount": 100,
    "fee": 1,
    "balance": 99
  }
}
```

### 3. 生成支付链接

**功能：** 生成支付二维码链接，用于用户扫码支付

**返回格式：** `mbpay://payorder?data={base64_encoded_json}`

## 签名规则

所有接口都需要签名验证，SDK 会自动处理签名生成。签名规则如下：

1. **排除 `sign` 字段**，对所有其他参数按 **ASCII 升序**排序
2. 将参数拼接为：`k1=v1&k2=v2&...&key=app_secret`
3. 对拼接后的字符串进行 **SHA256** 哈希计算
4. 将哈希结果转换为 **小写 hex** 字符串，作为 `sign` 值

**示例：**
```
参数：app_id=your_api_key_here, timestamp=1234567890
签名字符串：app_id=your_api_key_here&timestamp=1234567890&key=your_api_key_here
签名结果：SHA256(签名字符串) 的小写 hex
```

## 请求参数编码方式

所有接口使用 `application/x-www-form-urlencoded` 格式（FormData），所有参数以表单形式提交。

## 返回结构

所有接口统一返回 JSON 格式，结构如下：

```json
{
  "code": 0,           // 0 表示成功，非0为错误码
  "message": "success", // 错误描述信息
  "data": {}           // 返回数据（成功时包含，失败时可能为空）
}
```

## 错误码

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 12000 | app_id 为空 |
| 12001 | sign 为空 |
| 12002 | timestamp 为空 |
| 12003 | 商户不存在 |
| 12005 | 签名错误 |
| 12006 | 参数错误 |
| 12007 | 商户不存在 |
| 12008 | 商户状态错误 |
| 12009 | 商户不存在 |
| 12010 | 余额不足 |
| 12011 | 订单号已存在 / 收款地址不存在 |
| 12012 | 系统错误 |

## 金额单位说明

- 金额单位为 MB（最小单位）
- `100` = 1 MB
- `10000` = 100 MB

## 注意事项

1. 所有接口都需要 `app_id`、`sign` 和 `timestamp` 进行认证，SDK 会自动添加
2. 商户订单号（`order_no`）必须唯一，重复的订单号会返回错误
3. 付款金额必须大于 0
4. 收款地址必须是有效的用户地址

## 许可证

MIT License
