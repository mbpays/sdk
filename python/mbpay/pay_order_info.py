"""支付订单信息查询功能"""

from .client import Client
from .types import PayOrderInfoResponse, Response, MBPayError


def get_pay_order_info(self: Client, order_no: str, merchant_id: int) -> PayOrderInfoResponse:
    """
    查询支付订单信息
    
    Args:
        order_no: 商户订单号（必填）
        merchant_id: 商户ID（必填）
        
    Returns:
        PayOrderInfoResponse: 支付订单信息响应
        
    Raises:
        MBPayError: API 业务错误
        requests.RequestException: 网络请求错误
    """
    # 参数验证
    if not order_no:
        raise MBPayError(0, "order_no is required")
    if merchant_id <= 0:
        raise MBPayError(0, "merchant_id is required and must be greater than 0")
    
    # 构建请求参数
    params = {
        "order_no": order_no,
        "merchant_id": str(merchant_id),
    }
    
    # 执行请求
    resp: Response = self._do_request("POST", "/merchant/payorderinfo", params)
    
    # 解析 data 字段
    data = resp.data
    order_no_resp = data.get("order_no", "")
    platform_order_no = data.get("platform_order_no", "")
    amount = int(data.get("amount", 0))
    fee = int(data.get("fee", 0))
    actual_amount = int(data.get("actual_amount", 0))
    status = int(data.get("status", 0))
    status_text = data.get("status_text", "")
    remark = data.get("remark", "")
    create_at = data.get("create_at", "")
    update_at = data.get("update_at", "")
    pay_address = data.get("pay_address", "")
    
    if not order_no_resp:
        raise MBPayError(0, "invalid order_no format in response")
    
    return PayOrderInfoResponse(
        order_no=order_no_resp,
        platform_order_no=platform_order_no,
        amount=amount,
        fee=fee,
        actual_amount=actual_amount,
        status=status,
        status_text=status_text,
        remark=remark,
        create_at=create_at,
        update_at=update_at,
        pay_address=pay_address
    )


# 将方法绑定到 Client 类
Client.get_pay_order_info = get_pay_order_info

