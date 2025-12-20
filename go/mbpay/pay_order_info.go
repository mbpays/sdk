package mbpay

import (
	"fmt"
	"net/http"
	"strconv"
)

// GetPayOrderInfo 查询支付订单信息
func (c *Client) GetPayOrderInfo(orderNo string, merchantID int64) (*PayOrderInfoResponse, error) {
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
	resp, err := c.doRequest(http.MethodPost, "/merchant/payorderinfo", params)
	if err != nil {
		return nil, err
	}

	// 检查业务错误
	if !resp.IsSuccess() {
		return nil, resp.ToError()
	}

	// 解析 data 字段
	payOrderResp := &PayOrderInfoResponse{}

	if orderNo, ok := resp.Data["order_no"].(string); ok {
		payOrderResp.OrderNo = orderNo
	} else {
		return nil, fmt.Errorf("invalid order_no format in response")
	}

	if platformOrderNo, ok := resp.Data["platform_order_no"].(string); ok {
		payOrderResp.PlatformOrderNo = platformOrderNo
	} else {
		payOrderResp.PlatformOrderNo = "" // 可能为空
	}

	if amount, ok := resp.Data["amount"].(float64); ok {
		payOrderResp.Amount = int64(amount)
	} else if amount, ok := resp.Data["amount"].(int64); ok {
		payOrderResp.Amount = amount
	} else if amount, ok := resp.Data["amount"].(int); ok {
		payOrderResp.Amount = int64(amount)
	} else {
		return nil, fmt.Errorf("invalid amount format in response")
	}

	if fee, ok := resp.Data["fee"].(float64); ok {
		payOrderResp.Fee = int64(fee)
	} else if fee, ok := resp.Data["fee"].(int64); ok {
		payOrderResp.Fee = fee
	} else if fee, ok := resp.Data["fee"].(int); ok {
		payOrderResp.Fee = int64(fee)
	} else {
		payOrderResp.Fee = 0 // 默认为 0
	}

	if actualAmount, ok := resp.Data["actual_amount"].(float64); ok {
		payOrderResp.ActualAmount = int64(actualAmount)
	} else if actualAmount, ok := resp.Data["actual_amount"].(int64); ok {
		payOrderResp.ActualAmount = actualAmount
	} else if actualAmount, ok := resp.Data["actual_amount"].(int); ok {
		payOrderResp.ActualAmount = int64(actualAmount)
	} else {
		payOrderResp.ActualAmount = 0 // 默认为 0
	}

	if status, ok := resp.Data["status"].(float64); ok {
		payOrderResp.Status = int(status)
	} else if status, ok := resp.Data["status"].(int); ok {
		payOrderResp.Status = status
	} else {
		return nil, fmt.Errorf("invalid status format in response")
	}

	if statusText, ok := resp.Data["status_text"].(string); ok {
		payOrderResp.StatusText = statusText
	} else {
		payOrderResp.StatusText = "" // 可能为空
	}

	if remark, ok := resp.Data["remark"].(string); ok {
		payOrderResp.Remark = remark
	} else {
		payOrderResp.Remark = "" // 可能为空
	}

	if createAt, ok := resp.Data["create_at"].(string); ok {
		payOrderResp.CreateAt = createAt
	} else {
		payOrderResp.CreateAt = "" // 可能为空
	}

	if updateAt, ok := resp.Data["update_at"].(string); ok {
		payOrderResp.UpdateAt = updateAt
	} else {
		payOrderResp.UpdateAt = "" // 可能为空
	}

	if payAddress, ok := resp.Data["pay_address"].(string); ok {
		payOrderResp.PayAddress = payAddress
	} else {
		payOrderResp.PayAddress = "" // 可能为空
	}

	return payOrderResp, nil
}

