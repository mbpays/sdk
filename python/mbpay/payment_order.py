"""支付订单生成功能"""

from .client import Client
from .types import PaymentOrderResponse, Response, MBPayError, PaymentOrderRequest


def create_payment_order(self: Client, req: PaymentOrderRequest) -> PaymentOrderResponse:
    """
    生成支付订单并返回收银台页面链接
    
    Args:
        req: 支付订单生成请求
        
    Returns:
        PaymentOrderResponse: 支付订单响应
        
    Raises:
        MBPayError: API 业务错误
        requests.RequestException: 网络请求错误
    """
    # 参数验证
    if req.merchant_id <= 0:
        raise MBPayError(0, "merchant_id is required and must be greater than 0")
    if not req.order_no:
        raise MBPayError(0, "order_no is required")
    if not req.subject:
        raise MBPayError(0, "subject is required")
    if req.amount <= 0:
        raise MBPayError(0, "amount must be greater than 0")
    if not req.notify_url:
        raise MBPayError(0, "notify_url is required")
    
    # 构建请求参数
    params = {
        "merchant_id": str(req.merchant_id),
        "order_no": req.order_no,
        "subject": req.subject,
        "amount": str(req.amount),
        "notify_url": req.notify_url,
    }
    
    # 执行请求
    resp: Response = self._do_request("POST", "/merchant/generatepaylink", params)
    
    # 解析 data 字段
    data = resp.data
    payment_link = data.get("payment_link", "")
    
    if not payment_link:
        raise MBPayError(0, "invalid payment_link format in response")
    
    return PaymentOrderResponse(payment_link=payment_link)


# 将方法绑定到 Client 类
Client.create_payment_order = create_payment_order

