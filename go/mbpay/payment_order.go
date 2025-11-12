package mbpay

import (
	"fmt"
	"net/http"
	"strconv"
)

// CreatePaymentOrder 生成支付订单并返回收银台页面链接
func (c *Client) CreatePaymentOrder(req *PaymentOrderRequest) (*PaymentOrderResponse, error) {
	// 参数验证
	if req.MerchantID <= 0 {
		return nil, fmt.Errorf("merchant_id is required and must be greater than 0")
	}
	if req.OrderNo == "" {
		return nil, fmt.Errorf("order_no is required")
	}
	if req.Subject == "" {
		return nil, fmt.Errorf("subject is required")
	}
	if req.Amount <= 0 {
		return nil, fmt.Errorf("amount must be greater than 0")
	}
	if req.NotifyURL == "" {
		return nil, fmt.Errorf("notify_url is required")
	}

	// 构建请求参数
	params := map[string]string{
		"merchant_id": strconv.FormatInt(req.MerchantID, 10),
		"order_no":    req.OrderNo,
		"subject":     req.Subject,
		"amount":      strconv.FormatInt(req.Amount, 10),
		"notify_url":  req.NotifyURL,
	}

	// 执行请求
	resp, err := c.doRequest(http.MethodPost, "/merchant/generatepaylink", params)
	if err != nil {
		return nil, err
	}

	// 检查业务错误
	if !resp.IsSuccess() {
		return nil, resp.ToError()
	}

	// 解析 data 字段
	orderResp := &PaymentOrderResponse{}

	if paymentLink, ok := resp.Data["payment_link"].(string); ok {
		orderResp.PaymentLink = paymentLink
	} else {
		return nil, fmt.Errorf("invalid payment_link format in response")
	}

	return orderResp, nil
}

