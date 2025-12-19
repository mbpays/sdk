# MBPay Python SDK

MBPay 商户 API 的 Python 语言 SDK，提供商户余额查询、付款和支付链接生成功能。

## 安装

### 从 GitHub 安装

```bash
pip install git+https://github.com/mbpay/sdk.git#subdirectory=python
```

### 本地安装

```bash
cd python
pip install -e .
```

或者直接安装依赖：

```bash
pip install requests
```

## 快速开始

### 1. 创建客户端

```python
from mbpay import Client

client = Client(
    base_url="https://www.mbpay.world",  # API 基础地址
    app_id="your_app_id",                # 商户的 App ID
    app_secret="your_app_secret"         # 商户的 App Secret
)
```

### 2. 查询商户余额

```python
balance = client.get_balance()
print(f"可用余额: {balance.balance} MB")
print(f"冻结余额: {balance.frozen} MB")
```

### 3. 商户付款给用户

```python
from mbpay import PayRequest

pay_req = PayRequest(
    address="Txxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",  # 收款地址
    order_no="PAY202501011200001234567890",        # 商户订单号（唯一）
    amount=100,                                     # 付款金额（MB，100 = 1MB）
    remark="商户付款"                                # 备注（可选）
)

pay_resp = client.pay(pay_req)
print(f"付款成功！平台订单号: {pay_resp.platform_order_no}")
print(f"实际支付金额: {pay_resp.actual_amount} MB")
print(f"手续费: {pay_resp.fee} MB")
print(f"商户剩余余额: {pay_resp.balance} MB")
```

### 4. 生成支付链接（用于生成支付二维码）

```python
from mbpay import PaymentLinkRequest

link_req = PaymentLinkRequest(
    order_no="ORD202501011200001234567890",        # 商户订单号（必填）
    subject="购买VIP，1个月",                       # 商品描述（必填）
    amount=1000,                                    # 订单金额（分，必填）
    expire=15,                                      # 过期时间（分钟，必填）
    nonce=None,                                     # 随机数（可选，不填会自动生成）
    notify_url="https://your-domain.com/notify"    # 回调通知地址（可选）
)

payment_link = client.generate_payment_link(link_req)
print(f"支付链接: {payment_link}")
# 可以将此链接用于生成二维码
```

### 5. 查询订单信息

```python
order_info = client.get_order_info("ORD202501011200001234567890", 12345)
print(f"订单号: {order_info.order_no}")
print(f"平台订单号: {order_info.platform_order_no}")
print(f"订单金额: {order_info.amount}")
print(f"订单状态: {order_info.status_text}")
```

## API 文档

### Client

#### `Client(base_url, app_id, app_secret, timeout=30)`

创建新的 MBPay 客户端。

**参数：**
- `base_url` (str): API 基础地址，例如：`https://www.mbpay.world`
- `app_id` (str): 商户的 App ID
- `app_secret` (str): 商户的 App Secret
- `timeout` (int): HTTP 请求超时时间（秒），默认 30 秒

**返回：** `Client` 客户端实例

### 方法

#### `get_balance() -> BalanceResponse`

查询商户余额。

**返回：**
- `BalanceResponse`: 余额信息
  - `balance` (int): 可用余额（MB）
  - `frozen` (int): 冻结余额（MB）

**异常：**
- `MBPayError`: API 业务错误
- `requests.RequestException`: 网络请求错误

#### `pay(req: PayRequest) -> PayResponse`

商户向用户地址付款。

**参数：**
- `req` (PayRequest): 付款请求
  - `address` (str, 必填): 收款地址
  - `order_no` (str, 必填): 商户订单号（必须唯一）
  - `amount` (int, 必填): 付款金额（MB，最小单位：100 = 1MB）
  - `remark` (str, 可选): 备注信息

**返回：**
- `PayResponse`: 付款响应
  - `platform_order_no` (str): 平台订单号
  - `actual_amount` (int): 实际支付金额（MB）
  - `fee` (int): 手续费（MB）
  - `balance` (int): 商户剩余余额（MB）

**异常：**
- `MBPayError`: API 业务错误
- `requests.RequestException`: 网络请求错误

#### `generate_payment_link(req: PaymentLinkRequest) -> str`

生成支付链接（用于生成支付二维码）。

**参数：**
- `req` (PaymentLinkRequest): 支付链接生成请求
  - `order_no` (str, 必填): 商户订单号
  - `subject` (str, 必填): 商品描述
  - `amount` (int, 必填): 订单金额（分）
  - `expire` (int, 必填): 过期时间（分钟）
  - `nonce` (str, 可选): 随机数（不填会自动生成）
  - `notify_url` (str, 可选): 回调通知地址

**返回：**
- `str`: 支付链接，格式：`mbpay://payorder?data={base64_encoded_json}`

**异常：**
- `MBPayError`: 参数错误

**说明：**
- 生成的支付链接可以直接用于生成二维码
- 链接中包含订单信息、签名等，用户扫码后可以直接支付
- 过期时间从生成链接时开始计算

#### `get_order_info(order_no: str, merchant_id: int) -> OrderInfoResponse`

查询订单信息。

**参数：**
- `order_no` (str, 必填): 商户订单号
- `merchant_id` (int, 必填): 商户ID

**返回：**
- `OrderInfoResponse`: 订单信息响应
  - `order_no` (str): 商户订单号
  - `platform_order_no` (str): 平台订单号
  - `amount` (int): 订单金额
  - `platform_fee` (int): 平台手续费
  - `status` (int): 订单状态
  - `status_text` (str): 订单状态文本
  - `expires_at` (str): 过期时间
  - `created_at` (str): 创建时间
  - `paid_at` (str): 支付时间

**异常：**
- `MBPayError`: API 业务错误
- `requests.RequestException`: 网络请求错误

## 错误处理

SDK 使用自定义异常类型 `MBPayError`，包含错误码和错误信息：

```python
from mbpay import MBPayError, ErrorCode

try:
    pay_resp = client.pay(pay_req)
except MBPayError as e:
    if e.code == ErrorCode.INSUFFICIENT_BALANCE:
        print("余额不足")
    elif e.code == ErrorCode.ORDER_EXISTS_OR_ADDR_NOT_FOUND:
        print("订单号已存在或收款地址不存在")
    else:
        print(f"错误码: {e.code}, 错误信息: {e.message}")
except Exception as e:
    print(f"网络错误或其他错误: {e}")
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

## 许可证

MIT License





