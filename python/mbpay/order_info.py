"""订单信息查询功能"""

from .client import Client
from .types import OrderInfoResponse, Response, MBPayError


def get_order_info(self: Client, order_no: str, merchant_id: int) -> OrderInfoResponse:
    """
    查询订单信息
    
    Args:
        order_no: 商户订单号（必填）
        merchant_id: 商户ID（必填）
        
    Returns:
        OrderInfoResponse: 订单信息响应
        
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
    resp: Response = self._do_request("POST", "/merchant/orderinfo", params)
    
    # 解析 data 字段
    data = resp.data
    order_no_resp = data.get("order_no", "")
    platform_order_no = data.get("platform_order_no", "")
    amount = int(data.get("amount", 0))
    platform_fee = int(data.get("platform_fee", 0))
    status = int(data.get("status", 0))
    status_text = data.get("status_text", "")
    expires_at = data.get("expires_at", "")
    created_at = data.get("created_at", "")
    paid_at = data.get("paid_at", "")
    
    if not order_no_resp:
        raise MBPayError(0, "invalid order_no format in response")
    
    return OrderInfoResponse(
        order_no=order_no_resp,
        platform_order_no=platform_order_no,
        amount=amount,
        platform_fee=platform_fee,
        status=status,
        status_text=status_text,
        expires_at=expires_at,
        created_at=created_at,
        paid_at=paid_at
    )


# 将方法绑定到 Client 类
Client.get_order_info = get_order_info










