# MBPay PHP SDK

MBPay 商户 API 的 PHP 语言 SDK，提供商户余额查询、付款和支付链接生成功能。

## 要求

- PHP >= 7.4
- cURL 扩展

## 安装

### 使用 Composer（从 GitHub）

在项目的 `composer.json` 文件中添加：

```json
{
    "repositories": [
        {
            "type": "vcs",
            "url": "git@github.com:mbpay/sdk.git"
        }
    ],
    "require": {
        "mbpay/mbpay-sdk": "dev-main"
    }
}
```

然后运行：

```bash
composer require mbpay/mbpay-sdk:dev-main
```

### 手动安装

1. 克隆或下载 SDK 文件：
   ```bash
   git clone git@github.com:mbpay/sdk.git
   cd sdk/php
   ```
2. 在项目中引入 `src/MBPay/` 目录
3. 使用 PSR-4 自动加载或手动引入文件

## 快速开始

### 1. 创建客户端

```php
<?php
require_once 'vendor/autoload.php';

use MBPay\Client;

$client = new Client(
    'https://www.mbpay.world',  // API 基础地址
    'your_app_id',              // 商户的 App ID
    'your_app_secret'           // 商户的 App Secret
);
```

### 2. 查询商户余额

```php
use MBPay\Exception\MBPayException;

try {
    $balance = $client->getBalance();
    echo "可用余额: {$balance->getBalance()} MB\n";
    echo "冻结余额: {$balance->getFrozen()} MB\n";
} catch (MBPayException $e) {
    echo "查询失败: {$e->getMessage()}\n";
}
```

### 3. 商户付款给用户

```php
use MBPay\Types\PayRequest;
use MBPay\Exception\MBPayException;

$payReq = new PayRequest(
    'Txxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',  // 收款地址
    'PAY202501011200001234567890',         // 商户订单号（唯一）
    100,                                    // 付款金额（MB，100 = 1MB）
    '商户付款'                               // 备注（可选）
);

try {
    $payResp = $client->pay($payReq);
    echo "付款成功！平台订单号: {$payResp->getPlatformOrderNo()}\n";
    echo "实际支付金额: {$payResp->getActualAmount()} MB\n";
    echo "手续费: {$payResp->getFee()} MB\n";
    echo "商户剩余余额: {$payResp->getBalance()} MB\n";
} catch (MBPayException $e) {
    echo "付款失败: {$e->getMessage()}\n";
}
```

### 4. 生成支付链接（用于生成支付二维码）

```php
use MBPay\Types\PaymentLinkRequest;
use MBPay\Exception\MBPayException;

$linkReq = new PaymentLinkRequest(
    'ORD202501011200001234567890',        // 商户订单号（必填）
    '购买VIP，1个月',                       // 商品描述（必填）
    1000,                                  // 订单金额（分，必填）
    15,                                    // 过期时间（分钟，必填）
    null,                                  // 随机数（可选，不填会自动生成）
    'https://your-domain.com/notify'      // 回调通知地址（可选）
);

try {
    $paymentLink = $client->generatePaymentLink($linkReq);
    echo "支付链接: {$paymentLink}\n";
    // 可以将此链接用于生成二维码
} catch (MBPayException $e) {
    echo "生成支付链接失败: {$e->getMessage()}\n";
}
```

### 5. 查询订单信息

```php
use MBPay\Exception\MBPayException;

try {
    $orderInfo = $client->getOrderInfo('ORD202501011200001234567890', 12345);
    echo "订单号: {$orderInfo->getOrderNo()}\n";
    echo "平台订单号: {$orderInfo->getPlatformOrderNo()}\n";
    echo "订单金额: {$orderInfo->getAmount()}\n";
    echo "订单状态: {$orderInfo->getStatusText()}\n";
} catch (MBPayException $e) {
    echo "查询失败: {$e->getMessage()}\n";
}
```

## API 文档

### Client

#### `Client::__construct(string $baseUrl, string $appId, string $appSecret, int $timeout = 30)`

创建新的 MBPay 客户端。

**参数：**
- `$baseUrl` (string): API 基础地址，例如：`https://www.mbpay.world`
- `$appId` (string): 商户的 App ID
- `$appSecret` (string): 商户的 App Secret
- `$timeout` (int): HTTP 请求超时时间（秒），默认 30 秒

**返回：** `Client` 客户端实例

### 方法

#### `getBalance(): BalanceResponse`

查询商户余额。

**返回：**
- `BalanceResponse`: 余额信息
  - `getBalance()`: 可用余额（MB）
  - `getFrozen()`: 冻结余额（MB）

**异常：**
- `MBPayException`: API 业务错误

#### `pay(PayRequest $req): PayResponse`

商户向用户地址付款。

**参数：**
- `$req` (PayRequest): 付款请求
  - `getAddress()` (string, 必填): 收款地址
  - `getOrderNo()` (string, 必填): 商户订单号（必须唯一）
  - `getAmount()` (int, 必填): 付款金额（MB，最小单位：100 = 1MB）
  - `getRemark()` (string, 可选): 备注信息

**返回：**
- `PayResponse`: 付款响应
  - `getPlatformOrderNo()`: 平台订单号
  - `getActualAmount()`: 实际支付金额（MB）
  - `getFee()`: 手续费（MB）
  - `getBalance()`: 商户剩余余额（MB）

**异常：**
- `MBPayException`: API 业务错误

#### `generatePaymentLink(PaymentLinkRequest $req): string`

生成支付链接（用于生成支付二维码）。

**参数：**
- `$req` (PaymentLinkRequest): 支付链接生成请求
  - `getOrderNo()` (string, 必填): 商户订单号
  - `getSubject()` (string, 必填): 商品描述
  - `getAmount()` (int, 必填): 订单金额（分）
  - `getExpire()` (int, 必填): 过期时间（分钟）
  - `getNonce()` (string|null, 可选): 随机数（不填会自动生成）
  - `getNotifyUrl()` (string|null, 可选): 回调通知地址

**返回：**
- `string`: 支付链接，格式：`mbpay://payorder?data={base64_encoded_json}`

**异常：**
- `MBPayException`: 参数错误

**说明：**
- 生成的支付链接可以直接用于生成二维码
- 链接中包含订单信息、签名等，用户扫码后可以直接支付
- 过期时间从生成链接时开始计算

#### `getOrderInfo(string $orderNo, int $merchantId): OrderInfoResponse`

查询订单信息。

**参数：**
- `$orderNo` (string, 必填): 商户订单号
- `$merchantId` (int, 必填): 商户ID

**返回：**
- `OrderInfoResponse`: 订单信息响应
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
- `MBPayException`: API 业务错误

## 错误处理

SDK 使用自定义异常类型 `MBPayException`，包含错误码和错误信息：

```php
use MBPay\Exception\MBPayException;
use MBPay\Exception\ErrorCode;

try {
    $payResp = $client->pay($payReq);
} catch (MBPayException $e) {
    if ($e->getErrorCode() === ErrorCode::INSUFFICIENT_BALANCE) {
        echo "余额不足\n";
    } elseif ($e->getErrorCode() === ErrorCode::ORDER_EXISTS_OR_ADDR_NOT_FOUND) {
        echo "订单号已存在或收款地址不存在\n";
    } else {
        echo "错误码: {$e->getErrorCode()}, 错误信息: {$e->getMessage()}\n";
    }
}
```

## 错误码

| 错误码 | 常量 | 说明 |
|--------|------|------|
| 0 | `ErrorCode::SUCCESS` | 成功 |
| 12000 | `ErrorCode::APP_ID_EMPTY` | app_id 为空 |
| 12001 | `ErrorCode::SIGN_EMPTY` | sign 为空 |
| 12002 | `ErrorCode::TIMESTAMP_EMPTY` | timestamp 为空 |
| 12003 | `ErrorCode::MERCHANT_NOT_EXISTS` | 商户不存在 |
| 12005 | `ErrorCode::SIGN_ERROR` | 签名错误 |
| 12006 | `ErrorCode::PARAM_ERROR` | 参数错误 |
| 12007 | `ErrorCode::MERCHANT_NOT_EXISTS2` | 商户不存在 |
| 12008 | `ErrorCode::MERCHANT_STATUS_ERROR` | 商户状态错误 |
| 12009 | `ErrorCode::MERCHANT_NOT_EXISTS3` | 商户不存在 |
| 12010 | `ErrorCode::INSUFFICIENT_BALANCE` | 余额不足 |
| 12011 | `ErrorCode::ORDER_EXISTS_OR_ADDR_NOT_FOUND` | 订单号已存在 / 收款地址不存在 |
| 12012 | `ErrorCode::SYSTEM_ERROR` | 系统错误 |
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

## 许可证

MIT License





