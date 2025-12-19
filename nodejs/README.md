# MBPay Node.js SDK

MBPay 商户 API 的 Node.js/TypeScript 语言 SDK，提供商户余额查询、付款和支付链接生成功能。

## 要求

- Node.js >= 12.0.0
- TypeScript >= 4.9.0 (可选，如果使用 TypeScript)

## 安装

### 从 GitHub 安装

```bash
npm install github:mbpay/sdk#nodejs
```

或者使用 yarn：

```bash
yarn add github:mbpay/sdk#nodejs
```

### 从 npm 安装（发布后）

```bash
npm install @mbpay/sdk
```

## 快速开始

### 1. 创建客户端

```typescript
import { Client } from '@mbpay/sdk';

const client = new Client(
    'https://www.mbpay.world',  // API 基础地址
    'your_app_id',              // 商户的 App ID
    'your_app_secret'           // 商户的 App Secret
);
```

### 2. 查询商户余额

```typescript
import { MBPayError } from '@mbpay/sdk';

try {
    const balance = await client.getBalance();
    console.log(`可用余额: ${balance.getBalance()} MB`);
    console.log(`冻结余额: ${balance.getFrozen()} MB`);
} catch (error) {
    if (error instanceof MBPayError) {
        console.log(`查询失败: ${error.message}`);
    }
}
```

### 3. 商户付款给用户

```typescript
import { PayRequest, MBPayError, ErrorCode } from '@mbpay/sdk';

const payReq = new PayRequest(
    'Txxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',  // 收款地址
    'PAY202501011200001234567890',         // 商户订单号（唯一）
    100,                                    // 付款金额（MB，100 = 1MB）
    '商户付款'                               // 备注（可选）
);

try {
    const payResp = await client.pay(payReq);
    console.log(`付款成功！平台订单号: ${payResp.getPlatformOrderNo()}`);
    console.log(`实际支付金额: ${payResp.getActualAmount()} MB`);
    console.log(`手续费: ${payResp.getFee()} MB`);
    console.log(`商户剩余余额: ${payResp.getBalance()} MB`);
} catch (error) {
    if (error instanceof MBPayError) {
        console.log(`付款失败: ${error.message}`);
    }
}
```

### 4. 生成支付链接（用于生成支付二维码）

```typescript
import { PaymentLinkRequest } from '@mbpay/sdk';

const linkReq = new PaymentLinkRequest(
    'ORD202501011200001234567890',        // 商户订单号（必填）
    '购买VIP，1个月',                       // 商品描述（必填）
    1000,                                  // 订单金额（分，必填）
    15,                                    // 过期时间（分钟，必填）
    undefined,                             // 随机数（可选，不填会自动生成）
    'https://your-domain.com/notify'      // 回调通知地址（可选）
);

try {
    const paymentLink = await client.generatePaymentLink(linkReq);
    console.log(`支付链接: ${paymentLink}`);
    // 可以将此链接用于生成二维码
} catch (error) {
    if (error instanceof MBPayError) {
        console.log(`生成支付链接失败: ${error.message}`);
    }
}
```

### 5. 查询订单信息

```typescript
try {
    const orderInfo = await client.getOrderInfo('ORD202501011200001234567890', 12345);
    console.log(`订单号: ${orderInfo.getOrderNo()}`);
    console.log(`平台订单号: ${orderInfo.getPlatformOrderNo()}`);
    console.log(`订单金额: ${orderInfo.getAmount()}`);
    console.log(`订单状态: ${orderInfo.getStatusText()}`);
} catch (error) {
    if (error instanceof MBPayError) {
        console.log(`查询失败: ${error.message}`);
    }
}
```

## API 文档

### Client

#### `new Client(baseUrl: string, appId: string, appSecret: string, timeout?: number)`

创建新的 MBPay 客户端。

**参数：**
- `baseUrl` (string): API 基础地址，例如：`https://www.mbpay.world`
- `appId` (string): 商户的 App ID
- `appSecret` (string): 商户的 App Secret
- `timeout` (number, 可选): HTTP 请求超时时间（毫秒），默认 30000

**返回：** `Client` 客户端实例

### 方法

#### `getBalance(): Promise<BalanceResponse>`

查询商户余额。

**返回：**
- `Promise<BalanceResponse>`: 余额信息
  - `getBalance()`: 可用余额（MB）
  - `getFrozen()`: 冻结余额（MB）

**异常：**
- `MBPayError`: API 业务错误

#### `pay(req: PayRequest): Promise<PayResponse>`

商户向用户地址付款。

**参数：**
- `req` (PayRequest): 付款请求
  - `getAddress()` (string, 必填): 收款地址
  - `getOrderNo()` (string, 必填): 商户订单号（必须唯一）
  - `getAmount()` (number, 必填): 付款金额（MB，最小单位：100 = 1MB）
  - `getRemark()` (string, 可选): 备注信息

**返回：**
- `Promise<PayResponse>`: 付款响应
  - `getPlatformOrderNo()`: 平台订单号
  - `getActualAmount()`: 实际支付金额（MB）
  - `getFee()`: 手续费（MB）
  - `getBalance()`: 商户剩余余额（MB）

**异常：**
- `MBPayError`: API 业务错误

#### `generatePaymentLink(req: PaymentLinkRequest): Promise<string>`

生成支付链接（用于生成支付二维码）。

**参数：**
- `req` (PaymentLinkRequest): 支付链接生成请求
  - `getOrderNo()` (string, 必填): 商户订单号
  - `getSubject()` (string, 必填): 商品描述
  - `getAmount()` (number, 必填): 订单金额（分）
  - `getExpire()` (number, 必填): 过期时间（分钟）
  - `getNonce()` (string|undefined, 可选): 随机数（不填会自动生成）
  - `getNotifyUrl()` (string|undefined, 可选): 回调通知地址

**返回：**
- `Promise<string>`: 支付链接，格式：`mbpay://payorder?data={base64_encoded_json}`

**异常：**
- `MBPayError`: 参数错误

**说明：**
- 生成的支付链接可以直接用于生成二维码
- 链接中包含订单信息、签名等，用户扫码后可以直接支付
- 过期时间从生成链接时开始计算

#### `getOrderInfo(orderNo: string, merchantId: number): Promise<OrderInfoResponse>`

查询订单信息。

**参数：**
- `orderNo` (string, 必填): 商户订单号
- `merchantId` (number, 必填): 商户ID

**返回：**
- `Promise<OrderInfoResponse>`: 订单信息响应
  - `getOrderNo()`: 商户订单号
  - `getPlatformOrderNo()`: 平台订单号
  - `getAmount()`: 订单金额
  - `getPlatformFee()`: 平台手续费
  - `getStatus()`: 订单状态
  - `getStatusText()`: 订单状态文本
  - `getExpiresAt()`: 过期时间
  - `getCreatedAt()`: 创建时间
  - `getPaidAt()`: 支付时间

**异常：**
- `MBPayError`: API 业务错误

## 错误处理

SDK 使用自定义错误类型 `MBPayError`，包含错误码和错误信息：

```typescript
import { MBPayError, ErrorCode } from '@mbpay/sdk';

try {
    const payResp = await client.pay(payReq);
} catch (error) {
    if (error instanceof MBPayError) {
        switch (error.getErrorCode()) {
            case ErrorCode.INSUFFICIENT_BALANCE:
                console.log('余额不足');
                break;
            case ErrorCode.ORDER_EXISTS_OR_ADDR_NOT_FOUND:
                console.log('订单号已存在或收款地址不存在');
                break;
            default:
                console.log(`错误码: ${error.getErrorCode()}, 错误信息: ${error.message}`);
        }
    } else {
        console.log(`网络错误或其他错误: ${error}`);
    }
}
```

## 错误码

| 错误码 | 常量 | 说明 |
|--------|------|------|
| 0 | `ErrorCode.SUCCESS` | 成功 |
| 12000 | `ErrorCode.APP_ID_EMPTY` | app_id 为空 |
| 12001 | `ErrorCode.SIGN_EMPTY` | sign 为空 |
| 12002 | `ErrorCode.TIMESTAMP_EMPTY` | timestamp 为空 |
| 12003 | `ErrorCode.MERCHANT_NOT_EXISTS` | 商户不存在 |
| 12005 | `ErrorCode.SIGN_ERROR` | 签名错误 |
| 12006 | `ErrorCode.PARAM_ERROR` | 参数错误 |
| 12007 | `ErrorCode.MERCHANT_NOT_EXISTS2` | 商户不存在 |
| 12008 | `ErrorCode.MERCHANT_STATUS_ERROR` | 商户状态错误 |
| 12009 | `ErrorCode.MERCHANT_NOT_EXISTS3` | 商户不存在 |
| 12010 | `ErrorCode.INSUFFICIENT_BALANCE` | 余额不足 |
| 12011 | `ErrorCode.ORDER_EXISTS_OR_ADDR_NOT_FOUND` | 订单号已存在 / 收款地址不存在 |
| 12012 | `ErrorCode.SYSTEM_ERROR` | 系统错误 |
| 12013 | - | 订单号为空 |
| 12014 | - | 订单不存在 |

## 签名说明

SDK 会自动处理签名生成，无需手动计算。签名规则如下：

1. 排除 `sign` 字段，对所有其他参数按 **ASCII 升序**排序
2. 将参数拼接为：`k1=v1&k2=v2&...&key=app_secret`
3. 对拼接后的字符串进行 **SHA256** 哈希计算
4. 将哈希结果转换为 **小写 hex** 字符串，作为 `sign` 值

## 金额单位说明

- 金额单位为 MB（最小单位）
- `100` = 1 MB
- `10000` = 100 MB

## 注意事项

1. 所有接口都需要 `app_id`、`sign` 和 `timestamp` 进行认证，SDK 会自动添加
2. 商户订单号（`order_no`）必须唯一，重复的订单号会返回错误
3. 付款金额必须大于 0
4. 收款地址必须是有效的用户地址

## 开发

### 构建

```bash
npm run build
```

### 运行示例

```bash
npm run example
```

## 许可证

MIT License





