package mbpay

import "fmt"

// Response API 统一返回结构
type Response struct {
	Code    int                    `json:"code"`    // 0 表示成功，非0为错误码
	Message string                 `json:"message"` // 错误描述信息
	Data    map[string]interface{} `json:"data"`    // 返回数据
}

// BalanceResponse 余额查询响应
type BalanceResponse struct {
	Balance int64 `json:"balance"` // 可用余额（MB）
	Frozen  int64 `json:"frozen"`  // 冻结余额（MB）
}

// PayResponse 付款响应
type PayResponse struct {
	PlatformOrderNo string `json:"platform_order_no"` // 平台订单号
	ActualAmount    int64  `json:"actual_amount"`     // 实际支付金额（MB）
	Fee             int64  `json:"fee"`               // 手续费（MB）
	Balance         int64  `json:"balance"`           // 商户剩余余额（MB）
}

// PaymentLinkRequest 支付链接生成请求参数
type PaymentLinkRequest struct {
	OrderNo   string // 商户订单号（必填）
	Subject   string // 商品描述（必填）
	Amount    int64  // 订单金额（分，必填）
	Expire    int64  // 过期时间（分钟，必填）
	Nonce     string // 随机数（可选，不填会自动生成）
	NotifyURL string // 回调通知地址（可选）
}

// PaymentOrderRequest 生成支付订单请求参数
type PaymentOrderRequest struct {
	MerchantID int64  // 商户ID（必填）
	OrderNo    string // 商户订单号（必填）
	Subject    string // 商品描述（必填）
	Amount     int64  // 订单金额（分，必填）
	NotifyURL  string // 回调通知地址（必填）
}

// PaymentOrderResponse 生成支付订单响应
type PaymentOrderResponse struct {
	PaymentLink string `json:"payment_link"` // 收银台页面链接
}

// OrderInfoResponse 订单信息响应
type OrderInfoResponse struct {
	OrderNo         string `json:"order_no"`          // 商户订单号
	PlatformOrderNo string `json:"platform_order_no"` // 平台订单号
	Amount          int64  `json:"amount"`            // 订单金额
	PlatformFee     int64  `json:"platform_fee"`      // 平台手续费
	Status          int    `json:"status"`            // 订单状态
	StatusText      string `json:"status_text"`       // 订单状态文本
	ExpiresAt       string `json:"expires_at"`        // 过期时间
	CreatedAt       string `json:"created_at"`        // 创建时间
	PaidAt          string `json:"paid_at"`           // 支付时间
}

// ErrorCode 错误码常量
const (
	ErrCodeSuccess                   = 0     // 成功
	ErrCodeAppIDEmpty                = 12000 // app_id 为空
	ErrCodeSignEmpty                 = 12001 // sign 为空
	ErrCodeTimestampEmpty            = 12002 // timestamp 为空
	ErrCodeMerchantNotExists         = 12003 // 商户不存在
	ErrCodeSignError                 = 12005 // 签名错误
	ErrCodeParamError                = 12006 // 参数错误
	ErrCodeMerchantNotExists2        = 12007 // 商户不存在
	ErrCodeMerchantStatusError       = 12008 // 商户状态错误
	ErrCodeMerchantNotExists3        = 12009 // 商户不存在
	ErrCodeInsufficientBalance       = 12010 // 余额不足
	ErrCodeOrderExistsOrAddrNotFound = 12011 // 订单号已存在 / 收款地址不存在
	ErrCodeSystemError               = 12012 // 系统错误
	ErrCodeOrderNoEmpty              = 12013 // 订单号为空
	ErrCodeOrderNotFound             = 12014 // 订单不存在
)

// Error 自定义错误类型
type Error struct {
	Code    int
	Message string
}

func (e *Error) Error() string {
	return fmt.Sprintf("MBPay API Error [%d]: %s", e.Code, e.Message)
}

// NewError 创建新的错误
func NewError(code int, message string) *Error {
	return &Error{
		Code:    code,
		Message: message,
	}
}

// IsSuccess 检查响应是否成功
func (r *Response) IsSuccess() bool {
	return r.Code == ErrCodeSuccess
}

// ToError 将响应转换为错误
func (r *Response) ToError() *Error {
	if r.IsSuccess() {
		return nil
	}
	return NewError(r.Code, r.Message)
}
