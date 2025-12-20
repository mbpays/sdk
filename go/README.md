# MBPay Go SDK

MBPay 商户 API 的 Go 语言 SDK，提供商户余额查询和付款功能。

## 安装

```bash
go get github.com/mbpay/sdk/go/mbpay
```

## 快速开始

### 1. 创建客户端

```go
import "github.com/mbpay/sdk/go/mbpay"

client := mbpay.NewClient(
    "https://www.mbpay.world", // API 基础地址
    "your_app_id",             // 商户的 App ID
    "your_app_secret",         // 商户的 App Secret
)
```

### 2. 查询商户余额

```go
balance, err := client.GetBalance()
if err != nil {
    log.Fatal(err)
}

fmt.Printf("可用余额: %d MB\n", balance.Balance)
fmt.Printf("冻结余额: %d MB\n", balance.Frozen)
```

### 3. 商户付款给用户

```go
payReq := &mbpay.PayRequest{
    Address: "Txxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", // 收款地址
    OrderNo: "PAY202501011200001234567890",        // 商户订单号（唯一）
    Amount:  100,                                   // 付款金额（MB，100 = 1MB）
    Remark:  "商户付款",                              // 备注（可选）
}

payResp, err := client.Pay(payReq)
if err != nil {
    // 检查是否是业务错误
    if mbpayErr, ok := err.(*mbpay.Error); ok {
        log.Printf("付款失败 [错误码: %d]: %s", mbpayErr.Code, mbpayErr.Message)
    } else {
        log.Printf("付款失败: %v", err)
    }
    return
}

fmt.Printf("付款成功！平台订单号: %s\n", payResp.PlatformOrderNo)
fmt.Printf("实际支付金额: %d MB\n", payResp.ActualAmount)
fmt.Printf("手续费: %d MB\n", payResp.Fee)
fmt.Printf("商户剩余余额: %d MB\n", payResp.Balance)
```

### 4. 生成支付链接（用于生成支付二维码）

```go
linkReq := &mbpay.PaymentLinkRequest{
    OrderNo:   "ORD202501011200001234567890",        // 商户订单号（必填）
    Subject:   "购买VIP，1个月",                       // 商品描述（必填）
    Amount:    1000,                                  // 订单金额（分，必填）
    Expire:    15,                                    // 过期时间（分钟，必填）
    Nonce:     "",                                    // 随机数（可选，不填会自动生成）
    NotifyURL: "https://your-domain.com/notify",     // 回调通知地址（可选）
}

paymentLink, err := client.GeneratePaymentLink(linkReq)
if err != nil {
    log.Fatal(err)
}

fmt.Printf("支付链接: %s\n", paymentLink)
// 可以将此链接用于生成二维码
```

### 5. 查询订单信息

```go
orderInfo, err := client.GetOrderInfo("ORD202501011200001234567890", 12345)
if err != nil {
    // 检查是否是业务错误
    if mbpayErr, ok := err.(*mbpay.Error); ok {
        log.Printf("查询失败 [错误码: %d]: %s", mbpayErr.Code, mbpayErr.Message)
    } else {
        log.Printf("查询失败: %v", err)
    }
    return
}

fmt.Printf("订单号: %s\n", orderInfo.OrderNo)
fmt.Printf("平台订单号: %s\n", orderInfo.PlatformOrderNo)
fmt.Printf("订单金额: %d\n", orderInfo.Amount)
fmt.Printf("订单状态: %s\n", orderInfo.StatusText)
```

### 6. 查询支付订单信息

```go
payOrderInfo, err := client.GetPayOrderInfo("PAY202501011200001234567890", 12345)
if err != nil {
    // 检查是否是业务错误
    if mbpayErr, ok := err.(*mbpay.Error); ok {
        log.Printf("查询失败 [错误码: %d]: %s", mbpayErr.Code, mbpayErr.Message)
    } else {
        log.Printf("查询失败: %v", err)
    }
    return
}

fmt.Printf("订单号: %s\n", payOrderInfo.OrderNo)
fmt.Printf("平台订单号: %s\n", payOrderInfo.PlatformOrderNo)
fmt.Printf("订单金额: %d\n", payOrderInfo.Amount)
fmt.Printf("手续费: %d\n", payOrderInfo.Fee)
fmt.Printf("实际支付金额: %d\n", payOrderInfo.ActualAmount)
fmt.Printf("订单状态: %s\n", payOrderInfo.StatusText)
fmt.Printf("收款地址: %s\n", payOrderInfo.PayAddress)
```

## API 文档

### Client

#### NewClient(baseURL, appID, appSecret string) *Client

创建新的 MBPay 客户端。

**参数：**
- `baseURL`: API 基础地址，例如：`https://www.mbpay.world`
- `appID`: 商户的 App ID
- `appSecret`: 商户的 App Secret

**返回：** `*Client` 客户端实例

### 方法

#### GetBalance() (*BalanceResponse, error)

查询商户余额。

**返回：**
- `*BalanceResponse`: 余额信息
  - `Balance`: 可用余额（MB）
  - `Frozen`: 冻结余额（MB）
- `error`: 错误信息

#### Pay(req *PayRequest) (*PayResponse, error)

商户向用户地址付款。

**参数：**
- `req *PayRequest`: 付款请求
  - `Address` (必填): 收款地址
  - `OrderNo` (必填): 商户订单号（必须唯一）
  - `Amount` (必填): 付款金额（MB，最小单位：100 = 1MB）
  - `Remark` (可选): 备注信息

**返回：**
- `*PayResponse`: 付款响应
  - `PlatformOrderNo`: 平台订单号
  - `ActualAmount`: 实际支付金额（MB）
  - `Fee`: 手续费（MB）
  - `Balance`: 商户剩余余额（MB）
- `error`: 错误信息

#### GeneratePaymentLink(req *PaymentLinkRequest) (string, error)

生成支付链接（用于生成支付二维码）。

**参数：**
- `req *PaymentLinkRequest`: 支付链接生成请求
  - `OrderNo` (必填): 商户订单号
  - `Subject` (必填): 商品描述
  - `Amount` (必填): 订单金额（分）
  - `Expire` (必填): 过期时间（分钟）
  - `Nonce` (可选): 随机数（不填会自动生成）
  - `NotifyURL` (可选): 回调通知地址

**返回：**
- `string`: 支付链接，格式：`mbpay://payorder?data={base64_encoded_json}`
- `error`: 错误信息

**说明：**
- 生成的支付链接可以直接用于生成二维码
- 链接中包含订单信息、签名等，用户扫码后可以直接支付
- 过期时间从生成链接时开始计算

#### GetOrderInfo(orderNo string, merchantID int64) (*OrderInfoResponse, error)

查询订单信息。

**参数：**
- `orderNo` (必填): 商户订单号
- `merchantID` (必填): 商户ID

**返回：**
- `*OrderInfoResponse`: 订单信息响应
  - `OrderNo`: 商户订单号
  - `PlatformOrderNo`: 平台订单号
  - `Amount`: 订单金额
  - `PlatformFee`: 平台手续费
  - `Status`: 订单状态
  - `StatusText`: 订单状态文本
  - `ExpiresAt`: 过期时间
  - `CreatedAt`: 创建时间
  - `PaidAt`: 支付时间
- `error`: 错误信息

#### GetPayOrderInfo(orderNo string, merchantID int64) (*PayOrderInfoResponse, error)

查询支付订单信息。

**参数：**
- `orderNo` (必填): 商户订单号
- `merchantID` (必填): 商户ID

**返回：**
- `*PayOrderInfoResponse`: 支付订单信息响应
  - `OrderNo`: 商户订单号
  - `PlatformOrderNo`: 平台订单号
  - `Amount`: 订单金额
  - `Fee`: 手续费
  - `ActualAmount`: 实际支付金额
  - `Status`: 订单状态
  - `StatusText`: 订单状态文本
  - `Remark`: 备注
  - `CreateAt`: 创建时间
  - `UpdateAt`: 更新时间
  - `PayAddress`: 收款地址
- `error`: 错误信息

## 错误处理

SDK 使用自定义错误类型 `mbpay.Error`，包含错误码和错误信息：

```go
payResp, err := client.Pay(payReq)
if err != nil {
    if mbpayErr, ok := err.(*mbpay.Error); ok {
        switch mbpayErr.Code {
        case mbpay.ErrCodeInsufficientBalance:
            log.Println("余额不足")
        case mbpay.ErrCodeOrderExistsOrAddrNotFound:
            log.Println("订单号已存在或收款地址不存在")
        default:
            log.Printf("错误码: %d, 错误信息: %s", mbpayErr.Code, mbpayErr.Message)
        }
    } else {
        log.Printf("网络错误或其他错误: %v", err)
    }
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
| 12013 | 订单号为空 |
| 12014 | 订单不存在 |

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

