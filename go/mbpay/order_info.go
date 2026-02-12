package mbpay

import (
	"fmt"
	"net/http"
	"strconv"
)

// GetOrderInfo 查询订单信息
func (c *Client) GetOrderInfo(orderNo string, merchantID int64) (*OrderInfoResponse, error) {
	// 参数验证
	if orderNo == "" {
		return nil, fmt.Errorf("order_no is required")
	}
	if merchantID <= 0 {
		return nil, fmt.Errorf("merchant_id is required and must be greater than 0")
	}

	// 构建请求参数
	params := map[string]string{
		"order_no":    orderNo,
		"merchant_id": strconv.FormatInt(merchantID, 10),
	}

	// 执行请求
	resp, err := c.doRequest(http.MethodPost, "/merchant/orderinfo", params)
	if err != nil {
		return nil, err
	}

	// 检查业务错误
	if !resp.IsSuccess() {
		return nil, resp.ToError()
	}

	// 解析 data 字段
	orderResp := &OrderInfoResponse{}

	if orderNo, ok := resp.Data["order_no"].(string); ok {
		orderResp.OrderNo = orderNo
	} else {
		return nil, fmt.Errorf("invalid order_no format in response")
	}

	if platformOrderNo, ok := resp.Data["platform_order_no"].(string); ok {
		orderResp.PlatformOrderNo = platformOrderNo
	} else {
		orderResp.PlatformOrderNo = "" // 可能为空
	}

	if amount, ok := resp.Data["amount"].(float64); ok {
		orderResp.Amount = int64(amount)
	} else if amount, ok := resp.Data["amount"].(int64); ok {
		orderResp.Amount = amount
	} else if amount, ok := resp.Data["amount"].(int); ok {
		orderResp.Amount = int64(amount)
	} else {
		return nil, fmt.Errorf("invalid amount format in response")
	}

	if platformFee, ok := resp.Data["platform_fee"].(float64); ok {
		orderResp.PlatformFee = int64(platformFee)
	} else if platformFee, ok := resp.Data["platform_fee"].(int64); ok {
		orderResp.PlatformFee = platformFee
	} else if platformFee, ok := resp.Data["platform_fee"].(int); ok {
		orderResp.PlatformFee = int64(platformFee)
	} else {
		orderResp.PlatformFee = 0 // 默认为 0
	}

	if status, ok := resp.Data["status"].(float64); ok {
		orderResp.Status = int(status)
	} else if status, ok := resp.Data["status"].(int); ok {
		orderResp.Status = status
	} else {
		return nil, fmt.Errorf("invalid status format in response")
	}

	if statusText, ok := resp.Data["status_text"].(string); ok {
		orderResp.StatusText = statusText
	} else {
		orderResp.StatusText = "" // 可能为空
	}

	if expiresAt, ok := resp.Data["expires_at"].(string); ok {
		orderResp.ExpiresAt = expiresAt
	} else {
		orderResp.ExpiresAt = "" // 可能为空
	}

	if createdAt, ok := resp.Data["created_at"].(string); ok {
		orderResp.CreatedAt = createdAt
	} else {
		orderResp.CreatedAt = "" // 可能为空
	}

	if paidAt, ok := resp.Data["paid_at"].(string); ok {
		orderResp.PaidAt = paidAt
	} else {
		orderResp.PaidAt = "" // 可能为空
	}

	return orderResp, nil
}










